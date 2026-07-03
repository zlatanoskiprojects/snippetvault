"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../lib/db"));
const authMiddleware_1 = __importDefault(require("../middleware/authMiddleware"));
const express_validator_1 = require("express-validator");
const comments_1 = require("../validators/comments");
const router = (0, express_1.Router)();
router.get('/snippets/:snippetId/comments', authMiddleware_1.default, async (req, res) => {
    try {
        const snippetId = parseInt(req.params.snippetId);
        const [comments] = await db_1.default.query('SELECT * FROM comment WHERE snippet_id = ? ORDER BY created_at ASC', [snippetId]);
        return res.status(200).json(comments);
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
        const [snippets] = await db_1.default.query('SELECT id FROM snippet WHERE id = ?', [snippetId]);
        if (snippets.length === 0) {
            return res.status(404).json({ error: 'Snippet not found' });
        }
        const [result] = await db_1.default.query('INSERT INTO comment (user_id, snippet_id, content) VALUES (?, ?, ?)', [req.userId, snippetId, content]);
        const [rows] = await db_1.default.query('SELECT * FROM comment WHERE id = ?', [result.insertId]);
        return res.status(201).json(rows[0]);
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
        const [result] = await db_1.default.query('UPDATE comment SET content = ? WHERE id = ? AND user_id = ?', [content, commentId, req.userId]);
        if (result.affectedRows === 0) {
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
        const [result] = await db_1.default.query('DELETE FROM comment WHERE id = ? AND user_id = ?', [parseInt(req.params.id), req.userId]);
        if (result.affectedRows === 0) {
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
