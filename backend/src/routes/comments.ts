import { Router, Request, Response } from 'express';
import { and, asc, eq } from 'drizzle-orm';
import db from '../lib/db';
import { comment, snippet } from '../db/schema';
import authMiddleware from '../middleware/authMiddleware';
import { asyncHandler } from '../middleware/errorHandler';
import { validationResult } from 'express-validator';
import { commentIdValidation, createCommentValidation, updateCommentValidation } from '../validators/comments';

const router = Router();

const mapComment = (c: typeof comment.$inferSelect) => ({
    id: c.id,
    user_id: c.userId,
    snippet_id: c.snippetId,
    content: c.content,
    created_at: c.createdAt,
    updated_at: c.updatedAt,
});

router.get('/snippets/:snippetId/comments', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
    try {
        const snippetId = parseInt(req.params.snippetId as string);

        const [checkSnippet] = await db.select().from(snippet).where(eq(snippet.id, snippetId));
        if(!checkSnippet || checkSnippet.userId !== req.userId){
            return res.status(404).json({ error: 'Snippet not found' });
        }

        const comments = await db
            .select()
            .from(comment)
            .where(eq(comment.snippetId, snippetId))
            .orderBy(asc(comment.createdAt));
        return res.status(200).json(comments.map(mapComment));
    } catch (error) {
        console.error('Error fetching comments:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}));

router.post('/snippets/:snippetId/comments', authMiddleware, createCommentValidation, asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const snippetId = parseInt(req.params.snippetId as string);
    const { content } = req.body;

    try {
        const [checkSnippet] = await db.select().from(snippet).where(eq(snippet.id, snippetId));
        if(!checkSnippet || checkSnippet.userId !== req.userId){
            return res.status(404).json({ error: 'Snippet not found' });
        }

        const [created] = await db.insert(comment).values({
            userId: req.userId as number,
            snippetId,
            content,
        }).returning();

        return res.status(201).json(mapComment(created));
    } catch (error) {
        console.error('Error creating comment:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}));

router.patch('/comments/:id', authMiddleware, updateCommentValidation, asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const commentId = parseInt(req.params.id as string);
    const { content } = req.body;

    if (!content) {
        return res.status(400).json({ error: 'No valid fields provided' });
    }

    try {

        const result = await db
            .update(comment)
            .set({ content })
            .where(and(eq(comment.id, commentId), eq(comment.userId, req.userId as number)))
            .returning({ id: comment.id });
        if (result.length === 0) {
            return res.status(404).json({ error: 'Comment not found' });
        }
        return res.status(200).json({ message: 'Comment updated successfully' });
    } catch (error) {
        console.error('Error updating comment:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}));

router.delete('/comments/:id', authMiddleware, commentIdValidation, asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const result = await db
            .delete(comment)
            .where(and(eq(comment.id, parseInt(req.params.id as string)), eq(comment.userId, req.userId as number)))
            .returning({ id: comment.id });
        if (result.length === 0) {
            return res.status(404).json({ error: 'Comment not found' });
        }
        return res.status(200).json({ message: 'Comment deleted successfully' });
    } catch (error) {
        console.error('Error deleting comment:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}));

export default router;
