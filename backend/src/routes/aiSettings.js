const { Router } = require('express');
const pool = require('../lib/db.js');
const authMiddleware = require('../middleware/authMiddleware.js');
const { validationResult } = require('express-validator');
const { createAiSettingsValidation, updateAiSettingsValidation, deleteAiSettingsValidation } = require('../validators/aiSettings.js');

const router = Router();

router.get('/', authMiddleware, async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT id, user_id, provider_type, model_name, base_url, is_configured, created_at, updated_at FROM user_ai_settings WHERE user_id = ?',
            [req.userId]
        );
        if (rows.length === 0) {
            return res.status(404).json({ error: 'AI settings not found' });
        }
        return res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Error fetching AI settings:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/', authMiddleware, createAiSettingsValidation, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { api_key, provider_type, model_name, base_url, is_configured } = req.body;

    const api_key_enc = api_key;

    try {
        await pool.query(
            `INSERT INTO user_ai_settings (user_id, provider_type, api_key_enc, model_name, base_url, is_configured)
             VALUES (?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
                 provider_type = VALUES(provider_type),
                 api_key_enc   = VALUES(api_key_enc),
                 model_name    = VALUES(model_name),
                 base_url      = VALUES(base_url),
                 is_configured = VALUES(is_configured)`,
            [req.userId, provider_type, api_key_enc, model_name || null, base_url || null, is_configured ?? false]
        );

        const [rows] = await pool.query(
            'SELECT id, user_id, provider_type, model_name, base_url, is_configured, created_at, updated_at FROM user_ai_settings WHERE user_id = ?',
            [req.userId]
        );
        return res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Error saving AI settings:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete('/', authMiddleware, deleteAiSettingsValidation, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const [result] = await pool.query(
            'DELETE FROM user_ai_settings WHERE user_id = ?',
            [req.userId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'AI settings not found' });
        }
        return res.status(200).json({ message: 'AI settings deleted successfully' });
    } catch (error) {
        console.error('Error deleting AI settings:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;