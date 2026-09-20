import crypto from 'crypto';
import { Router, Request, Response } from 'express';
import { and, desc, eq, exists, ilike, inArray, or, sql } from 'drizzle-orm';
import { validationResult } from 'express-validator';
import { project, snippet, snippetProject, snippetTag, snippetVersion, tag, workspaceMember } from '../db/schema';
import db from '../lib/db';
import authMiddleware from '../middleware/authMiddleware';
import { asyncHandler } from '../middleware/errorHandler';
import requireSnippetPermission from '../middleware/requireSnippetPermission';
import requireWorkspacePermission from '../middleware/requireWorkspacePermission';
import validateRequest from '../middleware/validateRequest';
import { hasWorkspacePermission, WorkspacePermission, workspaceRolesWithPermission } from '../permissions/workspacePermissions';
import { workspaceIdValidation } from '../validators/workspace';
import { createSnippetValidation, listSnippetsValidation, snippetIdValidation, updateSnippetValidation, versionIdValidation } from '../validators/snippets';

const router = Router();

const snippetSelection = {
    id: snippet.id,
    userId: snippet.userId,
    workspaceId: snippet.workspaceId,
    projectId: snippetProject.projectId,
    title: snippet.title,
    description: snippet.description,
    code: snippet.code,
    language: snippet.language,
    visibility: snippet.visibility,
    shareToken: snippet.shareToken,
    createdAt: snippet.createdAt,
    updatedAt: snippet.updatedAt,
    tags: sql<string | null>`string_agg(${tag.name}, ',')`,
};

type SnippetResult = {
    id: number;
    userId: number;
    workspaceId: number;
    projectId: number | null;
    title: string;
    description: string | null;
    code: string;
    language: string;
    visibility: string;
    shareToken: string | null;
    createdAt: Date;
    updatedAt: Date;
    tags: string | null;
};

const mapSnippet = (value: Omit<SnippetResult, 'tags'> & { tags?: string | null }) => ({
    id: value.id,
    user_id: value.userId,
    workspace_id: value.workspaceId,
    project_id: value.projectId,
    title: value.title,
    description: value.description,
    code: value.code,
    language: value.language,
    visibility: value.visibility,
    share_token: value.shareToken,
    created_at: value.createdAt,
    updated_at: value.updatedAt,
    ...(value.tags === undefined ? {} : { tags: value.tags ? value.tags.split(',') : [] }),
});

const mapVersion = (value: typeof snippetVersion.$inferSelect) => ({
    id: value.id,
    snippet_id: value.snippetId,
    code: value.code,
    version_number: value.versionNumber,
    change_note: value.changeNote,
    created_at: value.createdAt,
});

const mutationAccess = (userId: number, permission: WorkspacePermission) => exists(
    db.select({ userId: workspaceMember.userId }).from(workspaceMember).where(and(
        eq(workspaceMember.workspaceId, snippet.workspaceId),
        eq(workspaceMember.userId, userId),
        inArray(workspaceMember.role, workspaceRolesWithPermission(permission)),
    )),
);

const selectSnippets = (condition: ReturnType<typeof and>) => db
    .select(snippetSelection)
    .from(snippet)
    .leftJoin(snippetProject, eq(snippetProject.snippetId, snippet.id))
    .leftJoin(snippetTag, eq(snippetTag.snippetId, snippet.id))
    .leftJoin(tag, eq(tag.id, snippetTag.tagId))
    .where(condition)
    .groupBy(snippet.id, snippetProject.projectId)
    .orderBy(desc(snippet.createdAt));

router.get('/workspaces/:workspaceId/snippets', authMiddleware, [...workspaceIdValidation, ...listSnippetsValidation], validateRequest, requireWorkspacePermission('read'), asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const workspaceId = Number(req.params.workspaceId);
    const q = req.query.q as string | undefined;
    const scope = eq(snippet.workspaceId, workspaceId);
    const condition = q ? and(scope, or(
        ilike(snippet.title, `%${q}%`),
        ilike(snippet.language, `%${q}%`),
        ilike(snippet.description, `%${q}%`),
        ilike(tag.name, `%${q}%`),
        ilike(snippet.code, `%${q}%`),
    )) : and(scope);
    const rows = await selectSnippets(condition);
    return res.status(200).json(rows.map(mapSnippet));
}));

router.post('/workspaces/:workspaceId/snippets', authMiddleware, [...workspaceIdValidation, ...createSnippetValidation], validateRequest, requireWorkspacePermission('createSnippet'), asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const workspaceId = Number(req.params.workspaceId);
    const projectId = req.body.project_id ?? null;
    if (projectId !== null) {
        const [destination] = await db.select({ id: project.id }).from(project)
            .where(and(eq(project.id, projectId), eq(project.workspaceId, workspaceId))).limit(1);
        if (!destination) return res.status(400).json({ error: 'Project must belong to the snippet workspace' });
    }
    const isPublic = req.body.visibility === 'public';
    const created = await db.transaction(async (tx) => {
        const [newSnippet] = await tx.insert(snippet).values({
            userId: req.userId as number,
            workspaceId,
            title: req.body.title,
            description: req.body.description ?? null,
            code: req.body.code,
            language: req.body.language,
            visibility: isPublic ? 'public' : 'private',
            shareToken: isPublic ? crypto.randomBytes(24).toString('base64url') : null,
        }).returning();
        if (projectId !== null) await tx.insert(snippetProject).values({ snippetId: newSnippet.id, projectId });
        return newSnippet;
    });
    return res.status(201).json(mapSnippet({ ...created, projectId }));
}));

router.get('/snippets/:snippetId', authMiddleware, snippetIdValidation, validateRequest, requireSnippetPermission('read'), asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const rows = await selectSnippets(and(eq(snippet.id, Number(req.params.snippetId))));
    if (!rows[0]) return res.status(404).json({ error: 'Snippet not found' });
    return res.status(200).json(mapSnippet(rows[0]));
}));

router.patch('/snippets/:snippetId', authMiddleware, updateSnippetValidation, validateRequest, requireSnippetPermission('updateSnippet'), asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const snippetId = Number(req.params.snippetId);
    const userId = req.userId as number;
    const [current] = await db.select({
        id: snippet.id,
        workspaceId: snippet.workspaceId,
        code: snippet.code,
        shareToken: snippet.shareToken,
        projectId: snippetProject.projectId,
    }).from(snippet).leftJoin(snippetProject, eq(snippetProject.snippetId, snippet.id))
        .where(eq(snippet.id, snippetId)).limit(1);
    if (!current) return res.status(404).json({ error: 'Snippet not found' });

    const assignmentProvided = Object.prototype.hasOwnProperty.call(req.body, 'project_id');
    const nextProjectId = assignmentProvided ? req.body.project_id ?? null : current.projectId;
    const assignmentChanged = assignmentProvided && nextProjectId !== current.projectId;
    if (assignmentChanged) {
        const membership = res.locals.snippetAuthorization.membership;
        if (!membership || !hasWorkspacePermission(membership.role, 'assignSnippetToProject')) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        if (nextProjectId !== null) {
            const [destination] = await db.select({ id: project.id }).from(project)
                .where(and(eq(project.id, nextProjectId), eq(project.workspaceId, current.workspaceId))).limit(1);
            if (!destination) return res.status(400).json({ error: 'Project must belong to the snippet workspace' });
        }
    }

    const updates: Partial<typeof snippet.$inferInsert> = {};
    for (const field of ['title', 'description', 'code', 'language'] as const) {
        if (req.body[field] !== undefined) updates[field] = req.body[field];
    }
    if (req.body.visibility !== undefined) {
        updates.visibility = req.body.visibility;
        updates.shareToken = req.body.visibility === 'public'
            ? current.shareToken ?? crypto.randomBytes(24).toString('base64url')
            : null;
    }
    if (Object.keys(updates).length === 0 && !assignmentChanged) return res.status(400).json({ error: 'No valid fields provided' });

    const updated = await db.transaction(async (tx) => {
        let updatedSnippet = await tx.select().from(snippet).where(eq(snippet.id, snippetId)).limit(1).then((rows) => rows[0]);
        if (Object.keys(updates).length > 0) {
            [updatedSnippet] = await tx.update(snippet).set(updates).where(and(
                eq(snippet.id, snippetId),
                mutationAccess(userId, 'updateSnippet'),
            )).returning();
            if (!updatedSnippet) return null;
        }
        if (req.body.code !== undefined && req.body.code !== current.code) {
            const [existing] = await tx.select({ id: snippetVersion.id }).from(snippetVersion)
                .where(and(eq(snippetVersion.snippetId, snippetId), eq(snippetVersion.code, current.code))).limit(1);
            if (!existing) {
                const [{ maxVer }] = await tx.select({ maxVer: sql<number | null>`max(${snippetVersion.versionNumber})` })
                    .from(snippetVersion).where(eq(snippetVersion.snippetId, snippetId));
                await tx.insert(snippetVersion).values({ snippetId, code: current.code, versionNumber: (maxVer ?? 0) + 1, changeNote: req.body.change_note ?? null });
            }
        }
        if (assignmentChanged) {
            if (nextProjectId === null) {
                await tx.delete(snippetProject).where(eq(snippetProject.snippetId, snippetId));
            } else {
                await tx.insert(snippetProject).values({ snippetId, projectId: nextProjectId })
                    .onConflictDoUpdate({ target: snippetProject.snippetId, set: { projectId: nextProjectId } });
            }
        }
        return updatedSnippet;
    });
    if (!updated) return res.status(404).json({ error: 'Snippet not found' });
    return res.status(200).json(mapSnippet({ ...updated, projectId: nextProjectId }));
}));

router.delete('/snippets/:snippetId', authMiddleware, snippetIdValidation, validateRequest, requireSnippetPermission('deleteSnippet'), asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const [deleted] = await db.delete(snippet).where(and(
        eq(snippet.id, Number(req.params.snippetId)),
        mutationAccess(req.userId as number, 'deleteSnippet'),
    )).returning({ id: snippet.id });
    if (!deleted) return res.status(404).json({ error: 'Snippet not found' });
    return res.status(200).json({ message: 'Snippet deleted successfully' });
}));

router.get('/snippets/:snippetId/versions', authMiddleware, snippetIdValidation, validateRequest, requireSnippetPermission('read'), asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const versions = await db.select({ id: snippetVersion.id, versionNumber: snippetVersion.versionNumber, changeNote: snippetVersion.changeNote, createdAt: snippetVersion.createdAt })
        .from(snippetVersion).where(eq(snippetVersion.snippetId, Number(req.params.snippetId))).orderBy(desc(snippetVersion.versionNumber));
    return res.status(200).json(versions.map((value) => ({ id: value.id, version_number: value.versionNumber, change_note: value.changeNote, created_at: value.createdAt })));
}));

router.get('/snippets/:snippetId/versions/:versionId', authMiddleware, [...snippetIdValidation, ...versionIdValidation], validateRequest, requireSnippetPermission('read'), asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const [version] = await db.select().from(snippetVersion).where(and(
        eq(snippetVersion.id, Number(req.params.versionId)),
        eq(snippetVersion.snippetId, Number(req.params.snippetId)),
    )).limit(1);
    if (!version) return res.status(404).json({ error: 'Version not found' });
    return res.status(200).json(mapVersion(version));
}));

router.delete('/snippets/:snippetId/versions/:versionId', authMiddleware, [...snippetIdValidation, ...versionIdValidation], validateRequest, requireSnippetPermission('manageSnippetVersions'), asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const [deleted] = await db.delete(snippetVersion).where(and(
        eq(snippetVersion.id, Number(req.params.versionId)),
        eq(snippetVersion.snippetId, Number(req.params.snippetId)),
        exists(db.select({ id: snippet.id }).from(snippet).where(and(
            eq(snippet.id, snippetVersion.snippetId),
            mutationAccess(req.userId as number, 'manageSnippetVersions'),
        ))),
    )).returning({ id: snippetVersion.id });
    if (!deleted) return res.status(404).json({ error: 'Version not found' });
    return res.status(204).send();
}));

router.post('/snippets/:snippetId/versions/:versionId/restore', authMiddleware, [...snippetIdValidation, ...versionIdValidation], validateRequest, requireSnippetPermission('manageSnippetVersions'), asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const snippetId = Number(req.params.snippetId);
    const [targetVersion] = await db.select().from(snippetVersion).where(and(
        eq(snippetVersion.id, Number(req.params.versionId)),
        eq(snippetVersion.snippetId, snippetId),
    )).limit(1);
    if (!targetVersion) return res.status(404).json({ error: 'Version not found' });

    const restored = await db.transaction(async (tx) => {
        const [current] = await tx.select().from(snippet).where(eq(snippet.id, snippetId)).limit(1);
        if (!current) return null;
        if (current.code !== targetVersion.code) {
            const [existing] = await tx.select({ id: snippetVersion.id }).from(snippetVersion)
                .where(and(eq(snippetVersion.snippetId, snippetId), eq(snippetVersion.code, current.code))).limit(1);
            if (!existing) {
                const [{ maxVer }] = await tx.select({ maxVer: sql<number | null>`max(${snippetVersion.versionNumber})` })
                    .from(snippetVersion).where(eq(snippetVersion.snippetId, snippetId));
                await tx.insert(snippetVersion).values({ snippetId, code: current.code, versionNumber: (maxVer ?? 0) + 1, changeNote: `Auto-save before restore to v${targetVersion.versionNumber}` });
            }
            const [updated] = await tx.update(snippet).set({ code: targetVersion.code }).where(and(
                eq(snippet.id, snippetId),
                mutationAccess(req.userId as number, 'manageSnippetVersions'),
            )).returning();
            return updated ?? null;
        }
        return current;
    });
    if (!restored) return res.status(404).json({ error: 'Snippet not found' });
    const [assignment] = await db.select({ projectId: snippetProject.projectId }).from(snippetProject).where(eq(snippetProject.snippetId, snippetId)).limit(1);
    return res.status(200).json(mapSnippet({ ...restored, projectId: assignment?.projectId ?? null }));
}));

export default router;
