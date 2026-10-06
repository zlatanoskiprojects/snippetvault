import { Router, Request, Response } from 'express';
import { and, eq } from 'drizzle-orm';
import { validationResult } from 'express-validator';
import { snippet, snippetProject, snippetTag, tag } from '../db/schema';
import db from '../lib/db';
import authMiddleware from '../middleware/authMiddleware';
import { asyncHandler } from '../middleware/errorHandler';
import requireSnippetPermission from '../middleware/requireSnippetPermission';
import requireWorkspacePermission from '../middleware/requireWorkspacePermission';
import validateRequest from '../middleware/validateRequest';
import { createTagValidation, tagIdValidation, tagSnippetValidation } from '../validators/tags';
import { workspaceIdValidation } from '../validators/workspace';

const router = Router();

const selection = {
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
};

const mapSnippet = (value: typeof selection extends Record<string, infer T> ? Record<string, T> : never) => ({
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
});

router.get('/tags', authMiddleware, asyncHandler(async (_req: Request, res: Response) => {
    return res.status(200).json(await db.select().from(tag));
}));

router.post('/tags', authMiddleware, createTagValidation, asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const [existing] = await db.select({ id: tag.id }).from(tag).where(eq(tag.name, req.body.name)).limit(1);
    if (existing) return res.status(409).json({ error: 'Tag name already exists' });
    const [created] = await db.insert(tag).values({ name: req.body.name }).returning();
    return res.status(201).json({ id: created.id, name: created.name, message: 'Tag created successfully' });
}));

router.get('/tags/:tagId', authMiddleware, tagIdValidation, asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const [found] = await db.select().from(tag).where(eq(tag.id, Number(req.params.tagId))).limit(1);
    if (!found) return res.status(404).json({ error: 'Tag not found' });
    return res.status(200).json(found);
}));

router.get('/workspaces/:workspaceId/tags/:tagId/snippets', authMiddleware, [...workspaceIdValidation, ...tagIdValidation], validateRequest, requireWorkspacePermission('read'), asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const rows = await db.select(selection).from(snippet)
        .innerJoin(snippetTag, eq(snippetTag.snippetId, snippet.id))
        .leftJoin(snippetProject, eq(snippetProject.snippetId, snippet.id))
        .where(and(
            eq(snippetTag.tagId, Number(req.params.tagId)),
            eq(snippet.workspaceId, Number(req.params.workspaceId)),
        ));
    return res.status(200).json(rows.map((value) => mapSnippet(value as never)));
}));

router.post('/tags/:tagId/snippets/:snippetId', authMiddleware, tagSnippetValidation, validateRequest, requireSnippetPermission('manageSnippetTags'), asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const tagId = Number(req.params.tagId);
    const snippetId = Number(req.params.snippetId);
    const [existingTag] = await db.select({ id: tag.id }).from(tag).where(eq(tag.id, tagId)).limit(1);
    if (!existingTag) return res.status(404).json({ error: 'Tag not found' });
    const [existing] = await db.select({ snippetId: snippetTag.snippetId }).from(snippetTag)
        .where(and(eq(snippetTag.snippetId, snippetId), eq(snippetTag.tagId, tagId))).limit(1);
    if (existing) return res.status(409).json({ error: 'Tag already assigned to this snippet' });
    await db.insert(snippetTag).values({ snippetId, tagId });
    return res.status(201).json({ message: 'Tag assigned to snippet successfully' });
}));

router.delete('/tags/:tagId/snippets/:snippetId', authMiddleware, tagSnippetValidation, validateRequest, requireSnippetPermission('manageSnippetTags'), asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const [deleted] = await db.delete(snippetTag).where(and(
        eq(snippetTag.snippetId, Number(req.params.snippetId)),
        eq(snippetTag.tagId, Number(req.params.tagId)),
    )).returning({ snippetId: snippetTag.snippetId });
    if (!deleted) return res.status(404).json({ error: 'Tag not assigned to this snippet' });
    return res.status(200).json({ message: 'Tag removed from snippet successfully' });
}));

export default router;
