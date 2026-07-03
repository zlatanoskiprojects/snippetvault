"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = __importDefault(require("../lib/db"));
const router = (0, express_1.Router)();
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    const cleanUsername = username?.trim();
    const cleanEmail = email?.trim();
    const cleanPassword = password?.trim();
    if (!cleanUsername || !cleanEmail || !cleanPassword) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    try {
        const [existingUser] = await db_1.default.query('SELECT id FROM users WHERE email = ?', [cleanEmail]);
        if (existingUser.length > 0) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }
        const hashedPassword = await bcryptjs_1.default.hash(cleanPassword, 10);
        await db_1.default.query('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)', [cleanUsername, cleanEmail, hashedPassword]);
        return res.status(201).json({ message: 'User registered successfully' });
    }
    catch (error) {
        console.error('Error registering user:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const cleanEmail = email?.trim().toLowerCase();
    const cleanPassword = password?.trim();
    if (!cleanEmail || !cleanPassword) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    try {
        const [rows] = await db_1.default.query('SELECT * FROM users WHERE email = ?', [cleanEmail]);
        if (rows.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        const validPassword = await bcryptjs_1.default.compare(cleanPassword, rows[0].password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        req.session.regenerate((err) => {
            if (err) {
                console.error('Session regeneration error:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            req.session.userId = rows[0].id;
            return res.status(200).json({
                user: {
                    id: rows[0].id,
                    username: rows[0].username,
                    email: rows[0].email,
                    role: rows[0].role,
                    display_name: rows[0].display_name,
                    avatar_url: rows[0].avatar_url,
                },
            });
        });
    }
    catch (error) {
        console.error('Error logging in:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Session destroy error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        res.clearCookie('connect.sid');
        return res.status(200).json({ message: 'Logged out successfully' });
    });
});
exports.default = router;
