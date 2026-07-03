import { Router, Request, Response } from 'express';
import { ResultSetHeader } from 'mysql2';
import pool from '../lib/db';
import authMiddleware from '../middleware/authMiddleware';
import { validationResult } from 'express-validator';
import { commentIdValidation, createCommentValidation, updateCommentValidation } from '../validators/comments';
import { CommentRow, IdRow } from '../types/db';

const router = Router();

router.get('/snippets/:snippetId/comments', authMiddleware, async (req: Request, res: Response) => {
    try {
        const snippetId = parseInt(req.params.snippetId as string);
        const [comments] = await pool.query<CommentRow[]>(
            'SELECT * FROM comment WHERE snippet_id = ? ORDER BY created_at ASC',
            [snippetId]
        );
        return res.status(200).json(comments);
    } catch (error) {
        console.error('Error fetching comments:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/snippets/:snippetId/comments', authMiddleware, createCommentValidation, async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const snippetId = parseInt(req.params.snippetId as string);
    const { content } = req.body;

    try {
        const [snippets] = await pool.query<IdRow[]>('SELECT id FROM snippet WHERE id = ?', [snippetId]);
        if (snippets.length === 0) {
            return res.status(404).json({ error: 'Snippet not found' });
        }

        const [result] = await pool.query<ResultSetHeader>(
            'INSERT INTO comment (user_id, snippet_id, content) VALUES (?, ?, ?)',
            [req.userId, snippetId, content]
        );

        const [rows] = await pool.query<CommentRow[]>('SELECT * FROM comment WHERE id = ?', [result.insertId]);
        return res.status(201).json(rows[0]);
    } catch (error) {
        console.error('Error creating comment:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

router.patch('/comments/:id', authMiddleware, updateCommentValidation, async (req: Request, res: Response) => {
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
        const [result] = await pool.query<ResultSetHeader>(
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

router.delete('/comments/:id', authMiddleware, commentIdValidation, async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const [result] = await pool.query<ResultSetHeader>(
            'DELETE FROM comment WHERE id = ? AND user_id = ?',
            [parseInt(req.params.id as string), req.userId]
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

export default router;
