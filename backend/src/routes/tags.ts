import { Router, Request, Response } from 'express';
import { and, eq, exists, isNull, or } from 'drizzle-orm';
import db from '../lib/db';
import { tag, snippet, snippetTag, projectMember } from '../db/schema';
import getProjectMembership from '../lib/projectMembership';
import authMiddleware from '../middleware/authMiddleware';
import { asyncHandler } from '../middleware/errorHandler';
import { validationResult } from 'express-validator';
import { tagIdValidation, createTagValidation, tagSnippetValidation } from '../validators/tags';

const router = Router();

router.get('/', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
    try {
        const tags = await db.select().from(tag);
        return res.status(200).json(tags);
    } catch (error) {
        console.log('Error fetching tags:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}));

router.get('/:id', authMiddleware, tagIdValidation, asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const tagId = parseInt(req.params.id as string);
        const rows = await db.select().from(tag).where(eq(tag.id, tagId));
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Tag not found' });
        }
        return res.status(200).json(rows[0]);
    } catch (error) {
        console.log('Error fetching tag:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}));

router.get('/:id/snippets', authMiddleware, tagIdValidation, asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const tagId = parseInt(req.params.id as string);
        const rows = await db
            .select({
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
            })
            .from(snippet)
            .innerJoin(snippetTag, eq(snippetTag.snippetId, snippet.id))
            .where(and(
                eq(snippetTag.tagId, tagId),
                or(
                    and(
                        isNull(snippet.projectId),
                        eq(snippet.userId, req.userId as number),
                    ),
                    exists(
                        db
                            .select({ userId: projectMember.userId })
                            .from(projectMember)
                            .where(and(
                                eq(projectMember.projectId, snippet.projectId),
                                eq(projectMember.userId, req.userId as number),
                            )),
                    ),
                ),
            ));

        return res.status(200).json(rows.map((s) => ({
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
        })));
    } catch (err) {
        console.log('Error fetching snippets by tag:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}));

router.post('/', authMiddleware, createTagValidation, asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name } = req.body;

    try {
        const existing = await db.select({ id: tag.id }).from(tag).where(eq(tag.name, name));
        if (existing.length > 0) {
            return res.status(409).json({ error: 'Tag name already exists' });
        }

        const [created] = await db.insert(tag).values({ name }).returning({ id: tag.id });
        return res.status(201).json({ id: created.id, name, message: 'Tag created successfully' });
    } catch (error) {
        console.log('Error creating tag:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}));

router.post('/:id/snippets/:snippetId', authMiddleware, tagSnippetValidation, asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const tagId = parseInt(req.params.id as string);
        const snippetId = parseInt(req.params.snippetId as string);

        const [currentSnippet] = await db
            .select({ id: snippet.id, userId: snippet.userId, projectId: snippet.projectId })
            .from(snippet)
            .where(eq(snippet.id, snippetId))
            .limit(1);
        if (!currentSnippet) {
            return res.status(404).json({ error: 'Snippet not found' });
        }

        if (currentSnippet.projectId === null) {
            if (currentSnippet.userId !== req.userId) {
                return res.status(404).json({ error: 'Snippet not found' });
            }
        } else {
            const membership = await getProjectMembership(currentSnippet.projectId, req.userId as number);
            if (!membership) {
                return res.status(404).json({ error: 'Snippet not found' });
            }
            if (membership.role === 'viewer') {
                return res.status(403).json({ error: 'You do not have permission to modify this snippet\'s tags' });
            }
        }

        const existing = await db
            .select()
            .from(snippetTag)
            .where(and(eq(snippetTag.snippetId, snippetId), eq(snippetTag.tagId, tagId)));
        if (existing.length > 0) {
            return res.status(409).json({ error: 'Tag already assigned to this snippet' });
        }

        await db.insert(snippetTag).values({ snippetId, tagId });

        return res.status(201).json({ message: 'Tag assigned to snippet successfully' });
    } catch (error) {
        console.log('Error assigning tag to snippet:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}));

router.delete('/:id/snippets/:snippetId', authMiddleware, tagSnippetValidation, asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const tagId = parseInt(req.params.id as string);
        const snippetId = parseInt(req.params.snippetId as string);

        const [currentSnippet] = await db
            .select({ id: snippet.id, userId: snippet.userId, projectId: snippet.projectId })
            .from(snippet)
            .where(eq(snippet.id, snippetId))
            .limit(1);
        if (!currentSnippet) {
            return res.status(404).json({ error: 'Snippet not found' });
        }

        if (currentSnippet.projectId === null) {
            if (currentSnippet.userId !== req.userId) {
                return res.status(404).json({ error: 'Snippet not found' });
            }
        } else {
            const membership = await getProjectMembership(currentSnippet.projectId, req.userId as number);
            if (!membership) {
                return res.status(404).json({ error: 'Snippet not found' });
            }
            if (membership.role === 'viewer') {
                return res.status(403).json({ error: 'You do not have permission to modify this snippet\'s tags' });
            }
        }

        const result = await db
            .delete(snippetTag)
            .where(and(eq(snippetTag.snippetId, snippetId), eq(snippetTag.tagId, tagId)))
            .returning({ snippetId: snippetTag.snippetId });
        if (result.length === 0) {
            return res.status(404).json({ error: 'Tag not assigned to this snippet' });
        }

        return res.status(200).json({ message: 'Tag removed from snippet successfully' });
    } catch (error) {
        console.log('Error removing tag from snippet:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}));

export default router;
