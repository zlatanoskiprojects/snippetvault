"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../lib/db"));
const authMiddleware_1 = __importDefault(require("../middleware/authMiddleware"));
const express_validator_1 = require("express-validator");
const snippets_1 = require("../validators/snippets");
const router = (0, express_1.Router)();
router.get('/', authMiddleware_1.default, async (req, res) => {
    try {
        const userId = req.userId;
        const q = req.query.q;
        let snippets;
        const baseQuery = `
            SELECT s.*, GROUP_CONCAT(t.name) AS tags
            FROM snippet s
            LEFT JOIN snippet_tag st ON st.snippet_id = s.id
            LEFT JOIN tag t ON t.id = st.tag_id
            WHERE s.user_id = ?
        `;
        if (q) {
            const searchTerm = `%${q}%`;
            [snippets] = await db_1.default.query(baseQuery + ' AND (s.title LIKE ? OR s.language LIKE ? OR s.description LIKE ? OR t.name LIKE ? OR s.code LIKE ?) GROUP BY s.id ORDER BY s.created_at DESC', [userId, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm]);
        }
        else {
            [snippets] = await db_1.default.query(baseQuery + ' GROUP BY s.id ORDER BY s.created_at DESC', [userId]);
        }
        const result = snippets.map((s) => ({ ...s, tags: s.tags ? s.tags.split(',') : [] }));
        return res.status(200).json(result);
    }
    catch (error) {
        console.log("Error fetching snippets:", error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/:id', authMiddleware_1.default, snippets_1.snippetIdValidation, async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const [rows] = await db_1.default.query(`SELECT s.*, GROUP_CONCAT(t.name) AS tags
             FROM snippet s
             LEFT JOIN snippet_tag st ON st.snippet_id = s.id
             LEFT JOIN tag t ON t.id = st.tag_id
             WHERE s.id = ? AND s.user_id = ?
             GROUP BY s.id`, [req.params.id, req.userId]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Snippet not found' });
        }
        const snippet = { ...rows[0], tags: rows[0].tags ? rows[0].tags.split(',') : [] };
        return res.status(200).json(snippet);
    }
    catch (error) {
        console.log("Error fetching snippet", error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/', authMiddleware_1.default, snippets_1.createSnippetValidation, async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { title, description, code, language, visibility, collection_id } = req.body;
    try {
        const [result] = await db_1.default.query('INSERT INTO snippet (user_id,title,description,code,language,visibility,collection_id) VALUES (?,?,?,?,?,?,?)', [
            req.userId,
            title,
            description || null,
            code,
            language,
            visibility || "private",
            collection_id || null,
        ]);
        const [rows] = await db_1.default.query('SELECT * FROM snippet WHERE id = ?', [result.insertId]);
        return res.status(201).json(rows[0]);
    }
    catch (error) {
        console.log("Error creating snippet", error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
router.delete('/:id', authMiddleware_1.default, snippets_1.snippetIdValidation, async (req, res) => {
    const err = (0, express_validator_1.validationResult)(req);
    if (!err.isEmpty()) {
        return res.status(400).json({ errors: err.array() });
    }
    try {
        const [result] = await db_1.default.query('DELETE FROM snippet WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Snippet not found' });
        }
        await db_1.default.query('DELETE FROM tag WHERE id NOT IN (SELECT tag_id FROM snippet_tag)');
        return res.status(200).json({ message: 'Snippet deleted successfully' });
    }
    catch (error) {
        console.log("Error deleting snippet", error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
router.patch('/:id', authMiddleware_1.default, snippets_1.updateSnippetValidation, async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const snippetId = parseInt(req.params.id);
    const allowedFields = ['title', 'description', 'code', 'language', 'visibility', 'collection_id'];
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
    const values = [...keys.map(k => updates[k]), snippetId, req.userId];
    try {
        if (updates.collection_id !== undefined && updates.collection_id !== null) {
            const [cols] = await db_1.default.query('SELECT id FROM collection WHERE id = ? AND user_id = ?', [updates.collection_id, req.userId]);
            if (cols.length === 0) {
                return res.status(403).json({ error: 'Collection not found or not yours' });
            }
        }
        let shouldSaveVersion = false;
        let oldCode = null;
        if (updates.code !== undefined) {
            const [current] = await db_1.default.query('SELECT code FROM snippet WHERE id = ? AND user_id = ?', [snippetId, req.userId]);
            if (current.length > 0 && current[0].code !== updates.code) {
                shouldSaveVersion = true;
                oldCode = current[0].code;
            }
        }
        const [result] = await db_1.default.query(`UPDATE snippet SET ${setClauses} WHERE id = ? AND user_id = ?`, values);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Snippet not found' });
        }
        if (shouldSaveVersion) {
            const [existing] = await db_1.default.query('SELECT id FROM snippet_version WHERE snippet_id = ? AND code = ?', [snippetId, oldCode]);
            if (existing.length === 0) {
                const [[{ maxVer }]] = await db_1.default.query('SELECT MAX(version_number) AS maxVer FROM snippet_version WHERE snippet_id = ?', [snippetId]);
                const nextVersion = (maxVer || 0) + 1;
                await db_1.default.query('INSERT INTO snippet_version (snippet_id, code, version_number, change_note) VALUES (?, ?, ?, ?)', [snippetId, oldCode, nextVersion, req.body.change_note || null]);
            }
        }
        return res.status(200).json({ message: 'Snippet updated successfully' });
    }
    catch (error) {
        console.error('Error updating snippet:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/:id/versions', authMiddleware_1.default, snippets_1.snippetIdValidation, async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty())
        return res.status(400).json({ errors: errors.array() });
    try {
        const [snippets] = await db_1.default.query('SELECT id FROM snippet WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
        if (snippets.length === 0)
            return res.status(404).json({ error: 'Snippet not found' });
        const [versions] = await db_1.default.query('SELECT id, version_number, change_note, created_at FROM snippet_version WHERE snippet_id = ? ORDER BY version_number DESC', [req.params.id]);
        return res.status(200).json(versions);
    }
    catch (error) {
        console.error('Error fetching versions:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/:id/versions/:versionId', authMiddleware_1.default, [...snippets_1.snippetIdValidation, ...snippets_1.versionIdValidation], async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty())
        return res.status(400).json({ errors: errors.array() });
    try {
        const [snippets] = await db_1.default.query('SELECT id FROM snippet WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
        if (snippets.length === 0)
            return res.status(404).json({ error: 'Snippet not found' });
        const [versions] = await db_1.default.query('SELECT * FROM snippet_version WHERE id = ? AND snippet_id = ?', [req.params.versionId, req.params.id]);
        if (versions.length === 0)
            return res.status(404).json({ error: 'Version not found' });
        return res.status(200).json(versions[0]);
    }
    catch (error) {
        console.error('Error fetching version:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
router.delete('/:id/versions/:versionId', authMiddleware_1.default, [...snippets_1.snippetIdValidation, ...snippets_1.versionIdValidation], async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty())
        return res.status(400).json({ errors: errors.array() });
    const snippetId = parseInt(req.params.id);
    const versionId = parseInt(req.params.versionId);
    try {
        const [snippets] = await db_1.default.query('SELECT id FROM snippet WHERE id = ? AND user_id = ?', [snippetId, req.userId]);
        if (snippets.length === 0)
            return res.status(404).json({ error: 'Snippet not found' });
        const [result] = await db_1.default.query('DELETE FROM snippet_version WHERE id = ? AND snippet_id = ?', [versionId, snippetId]);
        if (result.affectedRows === 0)
            return res.status(404).json({ error: 'Version not found' });
        return res.status(204).send();
    }
    catch (error) {
        console.error('Error deleting version:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/:id/versions/:versionId/restore', authMiddleware_1.default, [...snippets_1.snippetIdValidation, ...snippets_1.versionIdValidation], async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty())
        return res.status(400).json({ errors: errors.array() });
    const snippetId = parseInt(req.params.id);
    const versionId = parseInt(req.params.versionId);
    try {
        const [snippets] = await db_1.default.query('SELECT * FROM snippet WHERE id = ? AND user_id = ?', [snippetId, req.userId]);
        if (snippets.length === 0)
            return res.status(404).json({ error: 'Snippet not found' });
        const currentSnippet = snippets[0];
        const [versions] = await db_1.default.query('SELECT * FROM snippet_version WHERE id = ? AND snippet_id = ?', [versionId, snippetId]);
        if (versions.length === 0)
            return res.status(404).json({ error: 'Version not found' });
        const targetVersion = versions[0];
        if (currentSnippet.code !== targetVersion.code) {
            const [existing] = await db_1.default.query('SELECT id FROM snippet_version WHERE snippet_id = ? AND code = ?', [snippetId, currentSnippet.code]);
            if (existing.length === 0) {
                const [[{ maxVer }]] = await db_1.default.query('SELECT MAX(version_number) AS maxVer FROM snippet_version WHERE snippet_id = ?', [snippetId]);
                const nextVersion = (maxVer || 0) + 1;
                await db_1.default.query('INSERT INTO snippet_version (snippet_id, code, version_number, change_note) VALUES (?, ?, ?, ?)', [snippetId, currentSnippet.code, nextVersion, `Auto-save before restore to v${targetVersion.version_number}`]);
            }
            await db_1.default.query('UPDATE snippet SET code = ? WHERE id = ?', [targetVersion.code, snippetId]);
        }
        const [updated] = await db_1.default.query(`SELECT s.*, GROUP_CONCAT(t.name) AS tags
             FROM snippet s
             LEFT JOIN snippet_tag st ON st.snippet_id = s.id
             LEFT JOIN tag t ON t.id = st.tag_id
             WHERE s.id = ?
             GROUP BY s.id`, [snippetId]);
        const snippet = { ...updated[0], tags: updated[0].tags ? updated[0].tags.split(',') : [] };
        return res.status(200).json(snippet);
    }
    catch (error) {
        console.error('Error restoring version:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
