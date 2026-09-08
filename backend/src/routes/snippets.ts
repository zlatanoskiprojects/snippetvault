import { Router, Request, Response } from 'express';
import { and, desc, eq, ilike, or, sql } from 'drizzle-orm';
import db from '../lib/db';
import { snippet, snippetTag, tag, snippetVersion, project } from '../db/schema';
import authMiddleware from '../middleware/authMiddleware';
import { asyncHandler } from '../middleware/errorHandler';
import { validationResult } from 'express-validator';
import { snippetIdValidation, createSnippetValidation, updateSnippetValidation, versionIdValidation } from '../validators/snippets';
import crypto from 'crypto';

const router = Router();

const snippetWithTagsSelection = {
    id: snippet.id,
    userId: snippet.userId,
    projectId: snippet.projectId,
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

type SnippetWithTagsResult = {
    id: number;
    userId: number;
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

const mapSnippetWithTags = (s: SnippetWithTagsResult) => ({
    id: s.id,
    user_id: s.userId,
    project_id: s.projectId,
    title: s.title,
    description: s.description,
    code: s.code,
    language: s.language,
    visibility: s.visibility,
    share_token: s.shareToken,
    created_at: s.createdAt,
    updated_at: s.updatedAt,
    tags: s.tags ? s.tags.split(',') : [],
});

const mapSnippet = (s: typeof snippet.$inferSelect) => ({
    id: s.id,
    user_id: s.userId,
    project_id: s.projectId,
    title: s.title,
    description: s.description,
    code: s.code,
    language: s.language,
    visibility: s.visibility,
    share_token: s.shareToken,
    created_at: s.createdAt,
    updated_at: s.updatedAt,
});

const mapVersion = (v: typeof snippetVersion.$inferSelect) => ({
    id: v.id,
    snippet_id: v.snippetId,
    code: v.code,
    version_number: v.versionNumber,
    change_note: v.changeNote,
    created_at: v.createdAt,
});

router.get('/', authMiddleware, asyncHandler(async (req: Request, res: Response) => {

    try {
        const userId = req.userId as number;
        const q = req.query.q as string | undefined;

        const whereClause = q
            ? and(
                eq(snippet.userId, userId),
                or(
                    ilike(snippet.title, `%${q}%`),
                    ilike(snippet.language, `%${q}%`),
                    ilike(snippet.description, `%${q}%`),
                    ilike(tag.name, `%${q}%`),
                    ilike(snippet.code, `%${q}%`),
                ),
            )
            : eq(snippet.userId, userId);

        const snippets = await db
            .select(snippetWithTagsSelection)
            .from(snippet)
            .leftJoin(snippetTag, eq(snippetTag.snippetId, snippet.id))
            .leftJoin(tag, eq(tag.id, snippetTag.tagId))
            .where(whereClause)
            .groupBy(snippet.id)
            .orderBy(desc(snippet.createdAt));

        const result = snippets.map(mapSnippetWithTags);

        return res.status(200).json(result);
    } catch (error) {
        console.log("Error fetching snippets:", error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}));

router.get('/:id', authMiddleware, snippetIdValidation, asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const snippetId = parseInt(req.params.id as string);
        const rows = await db
            .select(snippetWithTagsSelection)
            .from(snippet)
            .leftJoin(snippetTag, eq(snippetTag.snippetId, snippet.id))
            .leftJoin(tag, eq(tag.id, snippetTag.tagId))
            .where(and(eq(snippet.id, snippetId), eq(snippet.userId, req.userId as number)))
            .groupBy(snippet.id);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Snippet not found' });
        }
        return res.status(200).json(mapSnippetWithTags(rows[0]));
    } catch (error) {
        console.log("Error fetching snippet", error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}));

router.post('/', authMiddleware, createSnippetValidation, asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, code, language, visibility, project_id } = req.body;

    try {
        if(project_id !== undefined && project_id !== null){
            const projects = await db.select({id: project.id}).from(project).where(and(eq(project.id,project_id),eq(project.userId,req.userId as number)))
            if(projects.length === 0 ){
                return res.status(403).json({error: 'Project not found or not yours'})
            }
        }

        const isPublic = visibility === 'public';
        const shareToken = isPublic ? crypto.randomBytes(24).toString('base64url') : null;
        const [created] = await db.insert(snippet).values({
            userId: req.userId as number,
            title,
            description: description || null,
            code,
            language,
            visibility: isPublic ? 'public' : 'private',
            projectId: project_id ?? null,
            shareToken: shareToken,
        }).returning();
        return res.status(201).json(mapSnippet(created));
    } catch (error) {
        console.log("Error creating snippet", error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}));

router.delete('/:id', authMiddleware, snippetIdValidation, asyncHandler(async (req: Request, res: Response) => {
    const err = validationResult(req);
    if (!err.isEmpty()) {
        return res.status(400).json({ errors: err.array() });
    }
    try {
        const snippetId = parseInt(req.params.id as string);
        const deleted = await db
            .delete(snippet)
            .where(and(eq(snippet.id, snippetId), eq(snippet.userId, req.userId as number)))
            .returning({ id: snippet.id });

        if (deleted.length === 0) {
            return res.status(404).json({ error: 'Snippet not found' });
        }

        return res.status(200).json({ message: 'Snippet deleted successfully' });
    } catch (error) {
        console.log("Error deleting snippet", error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}));

interface SnippetUpdateFields {
    title?: string;
    description?: string | null;
    code?: string;
    language?: string;
    visibility?: string;
    projectId?: number | null;
    shareToken?: string | null;
}

router.patch('/:id', authMiddleware, updateSnippetValidation, asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const snippetId = parseInt(req.params.id as string);

    const fieldMap: Record<string, keyof SnippetUpdateFields> = {
        title: 'title',
        description: 'description',
        code: 'code',
        language: 'language',
        visibility: 'visibility',
        project_id: 'projectId',
    };
    const updates: SnippetUpdateFields = {};
    for (const bodyField of Object.keys(fieldMap)) {
        if (req.body[bodyField] !== undefined) {
            (updates as Record<string, unknown>)[fieldMap[bodyField]] = req.body[bodyField];
        }
    }

    if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No valid fields provided' });
    }

    try {
        if (updates.projectId !== undefined && updates.projectId !== null) {
            const projects = await db
                .select({ id: project.id })
                .from(project)
                .where(and(eq(project.id, updates.projectId), eq(project.userId, req.userId as number)));
            if (projects.length === 0) {
                return res.status(403).json({ error: 'Project not found or not yours' });
            }
        }

        let shouldSaveVersion = false;
        let oldCode: string | null = null;
        if (updates.code !== undefined || updates.visibility !== undefined) {
            const current = await db
                .select({ code: snippet.code, shareToken: snippet.shareToken })
                .from(snippet)
                .where(and(eq(snippet.id, snippetId), eq(snippet.userId, req.userId as number)));

            if (current.length === 0) {
                return res.status(404).json({ error: 'Snippet not found' });
            }

            if (updates.code !== undefined && current[0].code !== updates.code) {
                shouldSaveVersion = true;
                oldCode = current[0].code;
            }

            if (updates.visibility !== undefined) {
                const isPublic = updates.visibility === 'public';
                updates.visibility = isPublic ? 'public' : 'private';
                updates.shareToken = isPublic
                    ? (current[0].shareToken ?? crypto.randomBytes(24).toString('base64url'))
                    : null;
            }
        }



        const result = await db
            .update(snippet)
            .set(updates)
            .where(and(eq(snippet.id, snippetId), eq(snippet.userId, req.userId as number)))
            .returning();

        if (result.length === 0) {
            return res.status(404).json({ error: 'Snippet not found' });
        }

        if (shouldSaveVersion && oldCode !== null) {
            const existing = await db
                .select({ id: snippetVersion.id })
                .from(snippetVersion)
                .where(and(eq(snippetVersion.snippetId, snippetId), eq(snippetVersion.code, oldCode)));
            if (existing.length === 0) {
                const [{ maxVer }] = await db
                    .select({ maxVer: sql<number | null>`max(${snippetVersion.versionNumber})` })
                    .from(snippetVersion)
                    .where(eq(snippetVersion.snippetId, snippetId));
                const nextVersion = (maxVer || 0) + 1;
                await db.insert(snippetVersion).values({
                    snippetId,
                    code: oldCode,
                    versionNumber: nextVersion,
                    changeNote: req.body.change_note || null,
                });
            }
        }

        return res.status(200).json(mapSnippet(result[0]));

    } catch (error) {
        console.error('Error updating snippet:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}));

router.get('/:id/versions', authMiddleware, snippetIdValidation, asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
        const snippetId = parseInt(req.params.id as string);
        const snippets = await db
            .select({ id: snippet.id })
            .from(snippet)
            .where(and(eq(snippet.id, snippetId), eq(snippet.userId, req.userId as number)));
        if (snippets.length === 0) return res.status(404).json({ error: 'Snippet not found' });

        const versions = await db
            .select({
                id: snippetVersion.id,
                versionNumber: snippetVersion.versionNumber,
                changeNote: snippetVersion.changeNote,
                createdAt: snippetVersion.createdAt,
            })
            .from(snippetVersion)
            .where(eq(snippetVersion.snippetId, snippetId))
            .orderBy(desc(snippetVersion.versionNumber));

        return res.status(200).json(versions.map((v) => ({
            id: v.id,
            version_number: v.versionNumber,
            change_note: v.changeNote,
            created_at: v.createdAt,
        })));
    } catch (error) {
        console.error('Error fetching versions:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}));

router.get('/:id/versions/:versionId', authMiddleware, [...snippetIdValidation, ...versionIdValidation], asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
        const snippetId = parseInt(req.params.id as string);
        const versionId = parseInt(req.params.versionId as string);

        const snippets = await db
            .select({ id: snippet.id })
            .from(snippet)
            .where(and(eq(snippet.id, snippetId), eq(snippet.userId, req.userId as number)));
        if (snippets.length === 0) return res.status(404).json({ error: 'Snippet not found' });

        const versions = await db
            .select()
            .from(snippetVersion)
            .where(and(eq(snippetVersion.id, versionId), eq(snippetVersion.snippetId, snippetId)));
        if (versions.length === 0) return res.status(404).json({ error: 'Version not found' });

        return res.status(200).json(mapVersion(versions[0]));
    } catch (error) {
        console.error('Error fetching version:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}));

router.delete('/:id/versions/:versionId', authMiddleware, [...snippetIdValidation, ...versionIdValidation], asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const snippetId = parseInt(req.params.id as string);
    const versionId = parseInt(req.params.versionId as string);

    try {
        const snippets = await db
            .select({ id: snippet.id })
            .from(snippet)
            .where(and(eq(snippet.id, snippetId), eq(snippet.userId, req.userId as number)));
        if (snippets.length === 0) return res.status(404).json({ error: 'Snippet not found' });

        const result = await db
            .delete(snippetVersion)
            .where(and(eq(snippetVersion.id, versionId), eq(snippetVersion.snippetId, snippetId)))
            .returning({ id: snippetVersion.id });
        if (result.length === 0) return res.status(404).json({ error: 'Version not found' });

        return res.status(204).send();
    } catch (error) {
        console.error('Error deleting version:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}));

router.post('/:id/versions/:versionId/restore', authMiddleware, [...snippetIdValidation, ...versionIdValidation], asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const snippetId = parseInt(req.params.id as string);
    const versionId = parseInt(req.params.versionId as string);

    try {
        const snippets = await db
            .select()
            .from(snippet)
            .where(and(eq(snippet.id, snippetId), eq(snippet.userId, req.userId as number)));
        if (snippets.length === 0) return res.status(404).json({ error: 'Snippet not found' });

        const currentSnippet = snippets[0];

        const versions = await db
            .select()
            .from(snippetVersion)
            .where(and(eq(snippetVersion.id, versionId), eq(snippetVersion.snippetId, snippetId)));
        if (versions.length === 0) return res.status(404).json({ error: 'Version not found' });

        const targetVersion = versions[0];

        if (currentSnippet.code !== targetVersion.code) {
            const existing = await db
                .select({ id: snippetVersion.id })
                .from(snippetVersion)
                .where(and(eq(snippetVersion.snippetId, snippetId), eq(snippetVersion.code, currentSnippet.code)));
            if (existing.length === 0) {
                const [{ maxVer }] = await db
                    .select({ maxVer: sql<number | null>`max(${snippetVersion.versionNumber})` })
                    .from(snippetVersion)
                    .where(eq(snippetVersion.snippetId, snippetId));
                const nextVersion = (maxVer || 0) + 1;
                await db.insert(snippetVersion).values({
                    snippetId,
                    code: currentSnippet.code,
                    versionNumber: nextVersion,
                    changeNote: `Auto-save before restore to v${targetVersion.versionNumber}`,
                });
            }

            await db.update(snippet).set({ code: targetVersion.code }).where(eq(snippet.id, snippetId));
        }

        const updated = await db
            .select(snippetWithTagsSelection)
            .from(snippet)
            .leftJoin(snippetTag, eq(snippetTag.snippetId, snippet.id))
            .leftJoin(tag, eq(tag.id, snippetTag.tagId))
            .where(eq(snippet.id, snippetId))
            .groupBy(snippet.id);

        return res.status(200).json(mapSnippetWithTags(updated[0]));
    } catch (error) {
        console.error('Error restoring version:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}));

export default router;
