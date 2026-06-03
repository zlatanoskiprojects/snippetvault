import { Router } from 'express';
import pool from '../lib/db.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { validationResult } from 'express-validator';
import { tagIdValidation, createTagValidation, tagSnippetValidation } from '../validators/tags.js';

const router = Router();

router.get('/', authMiddleware, async (req, res) => {
    try {
        const [tags] = await pool.query('SELECT * FROM tag');
        return res.status(200).json(tags);
    } catch (error) {
        console.log('Error fetching tags:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/:id', authMiddleware, tagIdValidation, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const [rows] = await pool.query('SELECT * FROM tag WHERE id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Tag not found' });
        }
        return res.status(200).json(rows[0]);
    } catch (error) {
        console.log('Error fetching tag:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});


router.get('/:id/snippets', authMiddleware, tagIdValidation, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const [rows] = await pool.query(
            `SELECT s.* FROM snippet s
             JOIN snippet_tag st ON st.snippet_id = s.id
             WHERE st.tag_id = ? AND s.user_id = ?`,
            [req.params.id, req.userId]
        );
        return res.status(200).json(rows);
    } catch (err) {
        console.log('Error fetching snippets by tag:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});


router.post('/', authMiddleware, createTagValidation, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name } = req.body;

    try {
        const [existing] = await pool.query('SELECT id FROM tag WHERE name = ?', [name]);
        if (existing.length > 0) {
            return res.status(409).json({ error: 'Tag name already exists' });
        }

        const [result] = await pool.query('INSERT INTO tag (name) VALUES (?)', [name]);
        return res.status(201).json({ id: result.insertId, message: 'Tag created successfully' });
    } catch (error) {
        console.log('Error creating tag:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete('/:id', authMiddleware, tagIdValidation, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const [result] = await pool.query('DELETE FROM tag WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Tag not found' });
        }
        return res.status(200).json({ message: 'Tag deleted successfully' });
    } catch (error) {
        console.log('Error deleting tag:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/:id/snippets/:snippetId', authMiddleware, tagSnippetValidation, async (req, res) => {
    const errors = validationResult(req);


    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { id, snippetId } = req.params;

        const [snippet] = await pool.query(
            'SELECT id FROM snippet WHERE id = ? AND user_id = ?', [snippetId, req.userId]
        );
        if (snippet.length === 0) {
            return res.status(404).json({ error: 'Snippet not found or not yours' });
        }

        const [existing] = await pool.query(
            'SELECT * FROM snippet_tag WHERE snippet_id = ? AND tag_id = ?', [snippetId, id]
        );
        if (existing.length > 0) {
            return res.status(409).json({ error: 'Tag already assigned to this snippet' });
        }

        await pool.query(
            'INSERT INTO snippet_tag (snippet_id, tag_id) VALUES (?, ?)', [snippetId, id]
        );


        return res.status(201).json({ message: 'Tag assigned to snippet successfully' });
    } catch (error) {
        console.log('Error assigning tag to snippet:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE remove a tag from a snippet
router.delete('/:id/snippets/:snippetId', authMiddleware, tagSnippetValidation, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const { id, snippetId } = req.params;

        const [snippet] = await pool.query(
            'SELECT id FROM snippet WHERE id = ? AND user_id = ?',
            [snippetId, req.userId]
        );
        if (snippet.length === 0) {
            return res.status(404).json({ error: 'Snippet not found or not yours' });
        }

        const [result] = await pool.query(
            'DELETE FROM snippet_tag WHERE snippet_id = ? AND tag_id = ?',
            [snippetId, id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Tag not assigned to this snippet' });
        }
        await pool.query('DELETE FROM tag WHERE id NOT IN (SELECT tag_id FROM snippet_tag)');
        return res.status(200).json({ message: 'Tag removed from snippet successfully' });
    } catch (error) {
        console.log('Error removing tag from snippet:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;