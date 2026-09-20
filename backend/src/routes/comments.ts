import { Router, Request, Response } from 'express';
import { and, asc, eq } from 'drizzle-orm';
import { validationResult } from 'express-validator';
import { comment } from '../db/schema';
import db from '../lib/db';
import authMiddleware from '../middleware/authMiddleware';
import { asyncHandler } from '../middleware/errorHandler';
import requireSnippetPermission from '../middleware/requireSnippetPermission';
import validateRequest from '../middleware/validateRequest';
import { commentIdValidation, createCommentValidation, snippetIdValidation, updateCommentValidation } from '../validators/comments';

const router = Router();

const mapComment = (value: typeof comment.$inferSelect) => ({
    id: value.id,
    user_id: value.userId,
    snippet_id: value.snippetId,
    content: value.content,
    created_at: value.createdAt,
    updated_at: value.updatedAt,
});

router.get('/snippets/:snippetId/comments', authMiddleware, snippetIdValidation, validateRequest, requireSnippetPermission('read'), asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const comments = await db.select().from(comment)
        .where(eq(comment.snippetId, Number(req.params.snippetId)))
        .orderBy(asc(comment.createdAt));
    return res.status(200).json(comments.map(mapComment));
}));

router.post('/snippets/:snippetId/comments', authMiddleware, createCommentValidation, validateRequest, requireSnippetPermission('createComment'), asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const [created] = await db.insert(comment).values({
        userId: req.userId as number,
        snippetId: Number(req.params.snippetId),
        content: req.body.content,
    }).returning();
    return res.status(201).json(mapComment(created));
}));

router.patch('/snippets/:snippetId/comments/:commentId', authMiddleware, [...snippetIdValidation, ...updateCommentValidation], validateRequest, requireSnippetPermission('createComment'), asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    if (req.body.content === undefined) return res.status(400).json({ error: 'No valid fields provided' });
    const [updated] = await db.update(comment).set({ content: req.body.content }).where(and(
        eq(comment.id, Number(req.params.commentId)),
        eq(comment.snippetId, Number(req.params.snippetId)),
        eq(comment.userId, req.userId as number),
    )).returning();
    if (!updated) return res.status(404).json({ error: 'Comment not found' });
    return res.status(200).json(mapComment(updated));
}));

router.delete('/snippets/:snippetId/comments/:commentId', authMiddleware, [...snippetIdValidation, ...commentIdValidation], validateRequest, requireSnippetPermission('createComment'), asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const [deleted] = await db.delete(comment).where(and(
        eq(comment.id, Number(req.params.commentId)),
        eq(comment.snippetId, Number(req.params.snippetId)),
        eq(comment.userId, req.userId as number),
    )).returning({ id: comment.id });
    if (!deleted) return res.status(404).json({ error: 'Comment not found' });
    return res.status(200).json({ message: 'Comment deleted successfully' });
}));

export default router;
