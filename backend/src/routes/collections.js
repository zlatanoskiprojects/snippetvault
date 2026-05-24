import { Router } from 'express';
import { validationResult } from 'express-validator';
import pool from '../lib/db.js';
import authMiddleware from '../middleware/authMiddleware.js';
import {
    collectionIdValidation,
    createCollectionValidation,
    updateCollectionValidation,
    assignSnippetValidation,
} from '../validators/collections.js';

const router = Router();

router.get('/', authMiddleware, async (req, res) => {
    try {
        const [collections] = await pool.query(
            `SELECT c.id,c.name,c.description,c.created_at,COUNT(s.id) AS snippet_count FROM collection c LEFT JOIN snippet s ON s.collection_id = c.id WHERE c.user_id = ? GROUP BY c.id ORDER BY c.created_at DESC`,
            [req.userId]
        );
        return res.status(200).json(collections);
    } catch (error) {
        console.error('Error fetching collections:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/collections create a collection
router.post('/', authMiddleware, createCollectionValidation, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { name, description } = req.body;

    try {
        const [result] = await pool.query(
            'INSERT INTO collection (user_id, name, description) VALUES (?, ?, ?)',
            [req.userId, name, description ?? null]
        );
        return res.status(201).json({
            id: result.insertId,
            name,
            description: description ?? null,
            message: 'Collection created successfully',
        });
    } catch (error) {
        console.error('Error creating collection:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

router.patch('/:id', authMiddleware, updateCollectionValidation, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const allowedFields = ['name', 'description'];
    const updates = {};
    for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
            updates[field] = req.body[field];
        }
    }

    if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No valid fields provided' });
    }

    const keys = Object.keys(updates);
    const setClauses = keys.map(field => `${field} = ?`).join(', ');
    const values = [...keys.map(k => updates[k]), req.params.id, req.userId];

    try {
        const [result] = await pool.query(
            `UPDATE collection SET ${setClauses} WHERE id = ? AND user_id = ?`,
            values
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Collection not found' });
        }
        return res.status(200).json({ message: 'Collection updated successfully' });
    } catch (error) {
        console.error('Error updating collection:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
router.delete('/:id', authMiddleware, collectionIdValidation, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const [result] = await pool.query(
            'DELETE FROM collection WHERE id = ? AND user_id = ?',
            [req.params.id, req.userId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Collection not found' });
        }
        return res.status(200).json({ message: 'Collection deleted successfully' });
    } catch (error) {
        console.error('Error deleting collection:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

router.patch('/:id/snippets/:snippetId', authMiddleware, assignSnippetValidation, async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { id, snippetId } = req.params;
    try {
        const [[collection]] = await pool.query(
            'SELECT id FROM collection WHERE id = ? AND user_id = ?',
            [id, req.userId]
        );
        if (!collection) {
            return res.status(404).json({ error: 'Collection not found' });
        }

        const [[snippet]] = await pool.query(
            'SELECT id FROM snippet WHERE id = ? AND user_id = ?',
            [snippetId, req.userId]
        );
        if (!snippet) {
            return res.status(404).json({ error: 'Snippet not found' });
        }

        await pool.query(
            'UPDATE snippet SET collection_id = ? WHERE id = ?',
            [id, snippetId]
        );
            return res.status(200).json({ message: 'Snippet assigned to collection' });
    } catch (error) {
             console.error('Error assigning snippet to collection:', error);
            return res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;