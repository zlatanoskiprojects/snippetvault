"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = __importDefault(require("../lib/db"));
const schema_1 = require("../db/schema");
const authMiddleware_1 = __importDefault(require("../middleware/authMiddleware"));
const profile_1 = require("../validators/profile");
const router = (0, express_1.Router)();
const PROFILE_SELECTION = {
    id: schema_1.users.id,
    username: schema_1.users.username,
    email: schema_1.users.email,
    role: schema_1.users.role,
    displayName: schema_1.users.displayName,
    bio: schema_1.users.bio,
    avatarUrl: schema_1.users.avatarUrl,
    registeredAt: schema_1.users.registeredAt,
};
const mapUser = (u) => ({
    id: u.id,
    username: u.username,
    email: u.email,
    role: u.role,
    display_name: u.displayName,
    bio: u.bio,
    avatar_url: u.avatarUrl,
    registered_at: u.registeredAt,
});
router.get('/', authMiddleware_1.default, async (req, res) => {
    try {
        const rows = await db_1.default.select(PROFILE_SELECTION).from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, req.userId));
        const user = rows[0];
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        return res.status(200).json({ user: mapUser(user) });
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
        const rows = await db_1.default.select({ passwordHash: schema_1.users.passwordHash }).from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, req.userId));
        const user = rows[0];
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const valid = await bcryptjs_1.default.compare(currentPassword, user.passwordHash);
        if (!valid) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }
        const hash = await bcryptjs_1.default.hash(newPassword.trim(), 10);
        await db_1.default.update(schema_1.users).set({ passwordHash: hash }).where((0, drizzle_orm_1.eq)(schema_1.users.id, req.userId));
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
    const fieldMap = {
        username: 'username',
        display_name: 'displayName',
        bio: 'bio',
        email: 'email',
    };
    const updates = {};
    for (const bodyField of Object.keys(fieldMap)) {
        if (req.body[bodyField] !== undefined) {
            updates[fieldMap[bodyField]] = req.body[bodyField];
        }
    }
    if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No valid fields provided' });
    }
    if (updates.username) {
        updates.username = updates.username.trim();
        try {
            const existing = await db_1.default
                .select({ id: schema_1.users.id })
                .from(schema_1.users)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.users.username, updates.username), (0, drizzle_orm_1.ne)(schema_1.users.id, req.userId)));
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
            const existing = await db_1.default
                .select({ id: schema_1.users.id })
                .from(schema_1.users)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.users.email, updates.email), (0, drizzle_orm_1.ne)(schema_1.users.id, req.userId)));
            if (existing.length > 0) {
                return res.status(409).json({ error: 'Email already in use' });
            }
        }
        catch (error) {
            console.error('Error checking email uniqueness:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
    try {
        await db_1.default.update(schema_1.users).set(updates).where((0, drizzle_orm_1.eq)(schema_1.users.id, req.userId));
        const rows = await db_1.default.select(PROFILE_SELECTION).from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, req.userId));
        return res.status(200).json({ user: mapUser(rows[0]) });
    }
    catch (error) {
        console.error('Error updating profile:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
router.delete('/', authMiddleware_1.default, async (req, res) => {
    try {
        await db_1.default.delete(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, req.userId));
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
