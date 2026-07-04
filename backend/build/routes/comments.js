"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = __importDefault(require("../lib/db"));
const schema_1 = require("../db/schema");
const authMiddleware_1 = __importDefault(require("../middleware/authMiddleware"));
const express_validator_1 = require("express-validator");
const comments_1 = require("../validators/comments");
const router = (0, express_1.Router)();
const mapComment = (c) => ({
    id: c.id,
    user_id: c.userId,
    snippet_id: c.snippetId,
    content: c.content,
    created_at: c.createdAt,
    updated_at: c.updatedAt,
});
router.get('/snippets/:snippetId/comments', authMiddleware_1.default, async (req, res) => {
    try {
        const snippetId = parseInt(req.params.snippetId);
        const comments = await db_1.default
            .select()
            .from(schema_1.comment)
            .where((0, drizzle_orm_1.eq)(schema_1.comment.snippetId, snippetId))
            .orderBy((0, drizzle_orm_1.asc)(schema_1.comment.createdAt));
        return res.status(200).json(comments.map(mapComment));
    }
    catch (error) {
        console.error('Error fetching comments:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/snippets/:snippetId/comments', authMiddleware_1.default, comments_1.createCommentValidation, async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const snippetId = parseInt(req.params.snippetId);
    const { content } = req.body;
    try {
        const snippets = await db_1.default.select({ id: schema_1.snippet.id }).from(schema_1.snippet).where((0, drizzle_orm_1.eq)(schema_1.snippet.id, snippetId));
        if (snippets.length === 0) {
            return res.status(404).json({ error: 'Snippet not found' });
        }
        const [created] = await db_1.default.insert(schema_1.comment).values({
            userId: req.userId,
            snippetId,
            content,
        }).returning();
        return res.status(201).json(mapComment(created));
    }
    catch (error) {
        console.error('Error creating comment:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
router.patch('/comments/:id', authMiddleware_1.default, comments_1.updateCommentValidation, async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const commentId = parseInt(req.params.id);
    const { content } = req.body;
    if (!content) {
        return res.status(400).json({ error: 'No valid fields provided' });
    }
    try {
        const result = await db_1.default
            .update(schema_1.comment)
            .set({ content })
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.comment.id, commentId), (0, drizzle_orm_1.eq)(schema_1.comment.userId, req.userId)))
            .returning({ id: schema_1.comment.id });
        if (result.length === 0) {
            return res.status(404).json({ error: 'Comment not found' });
        }
        return res.status(200).json({ message: 'Comment updated successfully' });
    }
    catch (error) {
        console.error('Error updating comment:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
router.delete('/comments/:id', authMiddleware_1.default, comments_1.commentIdValidation, async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const result = await db_1.default
            .delete(schema_1.comment)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.comment.id, parseInt(req.params.id)), (0, drizzle_orm_1.eq)(schema_1.comment.userId, req.userId)))
            .returning({ id: schema_1.comment.id });
        if (result.length === 0) {
            return res.status(404).json({ error: 'Comment not found' });
        }
        return res.status(200).json({ message: 'Comment deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting comment:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
