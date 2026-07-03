"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const db_1 = __importDefault(require("../lib/db"));
const authMiddleware_1 = __importDefault(require("../middleware/authMiddleware"));
const collections_1 = require("../validators/collections");
const router = (0, express_1.Router)();
router.get('/', authMiddleware_1.default, async (req, res) => {
    try {
        const [collections] = await db_1.default.query(`SELECT c.id,c.name,c.description,c.created_at,COUNT(s.id) AS snippet_count FROM collection c LEFT JOIN snippet s ON s.collection_id = c.id WHERE c.user_id = ? GROUP BY c.id ORDER BY c.created_at DESC`, [req.userId]);
        return res.status(200).json(collections);
    }
    catch (error) {
        console.error('Error fetching collections:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/', authMiddleware_1.default, collections_1.createCollectionValidation, async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { name, description } = req.body;
    try {
        const [result] = await db_1.default.query('INSERT INTO collection (user_id, name, description) VALUES (?, ?, ?)', [req.userId, name, description ?? null]);
        return res.status(201).json({
            id: result.insertId,
            name,
            description: description ?? null,
            message: 'Collection created successfully',
        });
    }
    catch (error) {
        console.error('Error creating collection:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
router.patch('/:id', authMiddleware_1.default, collections_1.updateCollectionValidation, async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
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
        const [result] = await db_1.default.query(`UPDATE collection SET ${setClauses} WHERE id = ? AND user_id = ?`, values);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Collection not found' });
        }
        return res.status(200).json({ message: 'Collection updated successfully' });
    }
    catch (error) {
        console.error('Error updating collection:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
router.delete('/:id', authMiddleware_1.default, collections_1.collectionIdValidation, async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const [result] = await db_1.default.query('DELETE FROM collection WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Collection not found' });
        }
        return res.status(200).json({ message: 'Collection deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting collection:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
router.patch('/:id/snippets/:snippetId', authMiddleware_1.default, collections_1.assignSnippetValidation, async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { id, snippetId } = req.params;
    try {
        const [[collection]] = await db_1.default.query('SELECT id FROM collection WHERE id = ? AND user_id = ?', [id, req.userId]);
        if (!collection) {
            return res.status(404).json({ error: 'Collection not found' });
        }
        const [[snippet]] = await db_1.default.query('SELECT id FROM snippet WHERE id = ? AND user_id = ?', [snippetId, req.userId]);
        if (!snippet) {
            return res.status(404).json({ error: 'Snippet not found' });
        }
        await db_1.default.query('UPDATE snippet SET collection_id = ? WHERE id = ?', [id, snippetId]);
        return res.status(200).json({ message: 'Snippet assigned to collection' });
    }
    catch (error) {
        console.error('Error assigning snippet to collection:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
