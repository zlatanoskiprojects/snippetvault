const { Router } = require('express');
const pool = require('../lib/db.js');
const authMiddleware = require('../middleware/authMiddleware.js');
const { validationResult } = require('express-validator');
const { commentIdValidation, createCommentValidation, updateCommentValidation } = require('../validators/comments.js');

const router = Router();

router.get('/snippets/:snippetId/comments', authMiddleware, async (req, res) => {
    try {
        const snippetId = parseInt(req.params.snippetId);
        const [comments] = await pool.query(
            'SELECT * FROM comment WHERE snippet_id = ? ORDER BY created_at ASC',
            [snippetId]
        );
        return res.status(200).json(comments);
    } catch (error) {
        console.error('Error fetching comments:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/snippets/:snippetId/comments', authMiddleware, createCommentValidation, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const snippetId = parseInt(req.params.snippetId);
    const { content } = req.body;

    try {
        const [snippets] = await pool.query('SELECT id FROM snippet WHERE id = ?', [snippetId]);
        if (snippets.length === 0) {
            return res.status(404).json({ error: 'Snippet not found' });
        }

        const [result] = await pool.query(
            'INSERT INTO comment (user_id, snippet_id, content) VALUES (?, ?, ?)',
            [req.userId, snippetId, content]
        );

        const [rows] = await pool.query('SELECT * FROM comment WHERE id = ?', [result.insertId]);
        return res.status(201).json(rows[0]);
    } catch (error) {
        console.error('Error creating comment:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

router.patch('/comments/:id', authMiddleware, updateCommentValidation, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const commentId = parseInt(req.params.id);
    const { content } = req.body;

    if (!content) {
        return res.status(400).json({ error: 'No valid fields provided' });
    }

    try {
        const [result] = await pool.query(
            'UPDATE comment SET content = ? WHERE id = ? AND user_id = ?',
            [content, commentId, req.userId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Comment not found' });
        }
        return res.status(200).json({ message: 'Comment updated successfully' });
    } catch (error) {
        console.error('Error updating comment:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete('/comments/:id', authMiddleware, commentIdValidation, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const [result] = await pool.query(
            'DELETE FROM comment WHERE id = ? AND user_id = ?',
            [parseInt(req.params.id), req.userId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Comment not found' });
        }
        return res.status(200).json({ message: 'Comment deleted successfully' });
    } catch (error) {
        console.error('Error deleting comment:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;