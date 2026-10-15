import { Router, Request, Response } from 'express';
import { and, asc, eq, SQL } from 'drizzle-orm';
import { validationResult } from 'express-validator';
import { comment, users } from '../db/schema';
import db from '../lib/db';
import authMiddleware from '../middleware/authMiddleware';
import { asyncHandler } from '../middleware/errorHandler';
import requireSnippetPermission from '../middleware/requireSnippetPermission';
import validateRequest from '../middleware/validateRequest';
import { commentIdValidation, createCommentValidation, snippetIdValidation, updateCommentValidation } from '../validators/comments';

const router = Router();

const findComments = (where: SQL | undefined) => db.select({
    comment,
    authorDisplayName: users.displayName,
    authorUsername: users.username,
    authorAvatarUrl: users.avatarUrl,
}).from(comment)
    .innerJoin(users, eq(users.id, comment.userId))
    .where(where)
    .orderBy(asc(comment.createdAt));

const mapComment = (row: Awaited<ReturnType<typeof findComments>>[number]) => ({
    id: row.comment.id,
    user_id: row.comment.userId,
    snippet_id: row.comment.snippetId,
    content: row.comment.content,
    created_at: row.comment.createdAt,
    updated_at: row.comment.updatedAt,
    author_name: row.authorDisplayName ?? row.authorUsername,
    author_avatar_url: row.authorAvatarUrl,
});

const findComment = async (id: number) => (await findComments(eq(comment.id, id)))[0];

router.get('/snippets/:snippetId/comments', authMiddleware, snippetIdValidation, validateRequest, requireSnippetPermission('read'), asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const comments = await findComments(eq(comment.snippetId, Number(req.params.snippetId)));
    return res.status(200).json(comments.map(mapComment));
}));

router.post('/snippets/:snippetId/comments', authMiddleware, createCommentValidation, validateRequest, requireSnippetPermission('createComment'), asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const [created] = await db.insert(comment).values({
        userId: req.userId as number,
        snippetId: Number(req.params.snippetId),
        content: req.body.content,
    }).returning({ id: comment.id });
    return res.status(201).json(mapComment(await findComment(created.id)));
}));

router.patch('/snippets/:snippetId/comments/:commentId', authMiddleware, [...snippetIdValidation, ...updateCommentValidation], validateRequest, requireSnippetPermission('createComment'), asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    if (req.body.content === undefined) return res.status(400).json({ error: 'No valid fields provided' });
    const [updated] = await db.update(comment).set({ content: req.body.content }).where(and(
        eq(comment.id, Number(req.params.commentId)),
        eq(comment.snippetId, Number(req.params.snippetId)),
        eq(comment.userId, req.userId as number),
    )).returning({ id: comment.id });
    if (!updated) return res.status(404).json({ error: 'Comment not found' });
    return res.status(200).json(mapComment(await findComment(updated.id)));
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
