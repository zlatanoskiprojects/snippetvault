const { Router } = require('express');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const pool = require('../lib/db.js');
const authMiddleware = require('../middleware/authMiddleware.js');
const { updateProfileValidation, changePasswordValidation } = require('../validators/profile.js');

const router = Router();

const USER_SELECT = 'SELECT id, username, email, role, display_name, bio, avatar_url, registered_at FROM users WHERE id = ?';

router.get('/', authMiddleware, async (req, res) => {
    try {
        const [[user]] = await pool.query(USER_SELECT, [req.userId]);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        return res.status(200).json({ user });
    } catch (error) {
        console.error('Error fetching profile:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

router.patch('/password', authMiddleware, changePasswordValidation, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;

    try {
        const [[user]] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [req.userId]);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const valid = await bcrypt.compare(currentPassword, user.password_hash);
        if (!valid) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        const hash = await bcrypt.hash(newPassword.trim(), 10);
        await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.userId]);

        return res.status(200).json({ message: 'Password updated' });
    } catch (error) {
        console.error('Error changing password:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

router.patch('/', authMiddleware, updateProfileValidation, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const allowedFields = ['username', 'display_name', 'bio', 'email'];
    const updates = {};
    for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
            updates[field] = req.body[field];
        }
    }

    if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No valid fields provided' });
    }

    if (updates.username) {
        updates.username = updates.username.trim();
        try {
            const [existing] = await pool.query(
                'SELECT id FROM users WHERE username = ? AND id != ?',
                [updates.username, req.userId]
            );
            if (existing.length > 0) {
                return res.status(409).json({ error: 'Username already taken' });
            }
        } catch (error) {
            console.error('Error checking username uniqueness:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    if (updates.email) {
        updates.email = updates.email.trim().toLowerCase();
        try {
            const [existing] = await pool.query(
                'SELECT id FROM users WHERE email = ? AND id != ?',
                [updates.email, req.userId]
            );
            if (existing.length > 0) {
                return res.status(409).json({ error: 'Email already in use' });
            }
        } catch (error) {
            console.error('Error checking email uniqueness:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    const keys = Object.keys(updates);
    const setClauses = keys.map(field => `${field} = ?`).join(', ');
    const values = [...keys.map(k => updates[k]), req.userId];

    try {
        await pool.query(`UPDATE users SET ${setClauses} WHERE id = ?`, values);
        const [[user]] = await pool.query(USER_SELECT, [req.userId]);
        return res.status(200).json({ user });
    } catch (error) {
        console.error('Error updating profile:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete('/', authMiddleware, async (req, res) => {
    try {
        await pool.query('DELETE FROM users WHERE id = ?', [req.userId]);
        req.session.destroy((err) => {
            if (err) {
                console.error('Session destroy error:', err);
            }
            res.clearCookie('connect.sid');
            return res.status(200).json({ message: 'Account deleted' });
        });
    } catch (error) {
        console.error('Error deleting account:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
