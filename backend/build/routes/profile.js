"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = __importDefault(require("../lib/db"));
const authMiddleware_1 = __importDefault(require("../middleware/authMiddleware"));
const profile_1 = require("../validators/profile");
const router = (0, express_1.Router)();
const USER_SELECT = 'SELECT id, username, email, role, display_name, bio, avatar_url, registered_at FROM users WHERE id = ?';
router.get('/', authMiddleware_1.default, async (req, res) => {
    try {
        const [[user]] = await db_1.default.query(USER_SELECT, [req.userId]);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        return res.status(200).json({ user });
    }
    catch (error) {
        console.error('Error fetching profile:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
router.patch('/password', authMiddleware_1.default, profile_1.changePasswordValidation, async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { currentPassword, newPassword } = req.body;
    try {
        const [[user]] = await db_1.default.query('SELECT password_hash FROM users WHERE id = ?', [req.userId]);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const valid = await bcryptjs_1.default.compare(currentPassword, user.password_hash);
        if (!valid) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }
        const hash = await bcryptjs_1.default.hash(newPassword.trim(), 10);
        await db_1.default.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.userId]);
        return res.status(200).json({ message: 'Password updated' });
    }
    catch (error) {
        console.error('Error changing password:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
router.patch('/', authMiddleware_1.default, profile_1.updateProfileValidation, async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
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
            const [existing] = await db_1.default.query('SELECT id FROM users WHERE username = ? AND id != ?', [updates.username, req.userId]);
            if (existing.length > 0) {
                return res.status(409).json({ error: 'Username already taken' });
            }
        }
        catch (error) {
            console.error('Error checking username uniqueness:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
    if (updates.email) {
        updates.email = updates.email.trim().toLowerCase();
        try {
            const [existing] = await db_1.default.query('SELECT id FROM users WHERE email = ? AND id != ?', [updates.email, req.userId]);
            if (existing.length > 0) {
                return res.status(409).json({ error: 'Email already in use' });
            }
        }
        catch (error) {
            console.error('Error checking email uniqueness:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
    const keys = Object.keys(updates);
    const setClauses = keys.map(field => `${field} = ?`).join(', ');
    const values = [...keys.map(k => updates[k]), req.userId];
    try {
        await db_1.default.query(`UPDATE users SET ${setClauses} WHERE id = ?`, values);
        const [[user]] = await db_1.default.query(USER_SELECT, [req.userId]);
        return res.status(200).json({ user });
    }
    catch (error) {
        console.error('Error updating profile:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
router.delete('/', authMiddleware_1.default, async (req, res) => {
    try {
        await db_1.default.query('DELETE FROM users WHERE id = ?', [req.userId]);
        req.session.destroy((err) => {
            if (err) {
                console.error('Session destroy error:', err);
            }
            res.clearCookie('connect.sid');
            return res.status(200).json({ message: 'Account deleted' });
        });
    }
    catch (error) {
        console.error('Error deleting account:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
