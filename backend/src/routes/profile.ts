import { Router, Request, Response } from 'express';
import { validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import pool from '../lib/db';
import authMiddleware from '../middleware/authMiddleware';
import { updateProfileValidation, changePasswordValidation } from '../validators/profile';
import { PublicUserRow, IdRow } from '../types/db';

interface PasswordHashRow extends IdRow {
    password_hash: string;
}

interface ProfileUpdateFields {
    username?: string;
    display_name?: string | null;
    bio?: string | null;
    email?: string;
}

const router = Router();

const USER_SELECT = 'SELECT id, username, email, role, display_name, bio, avatar_url, registered_at FROM users WHERE id = ?';

router.get('/', authMiddleware, async (req: Request, res: Response) => {
    try {
        const [[user]] = await pool.query<PublicUserRow[]>(USER_SELECT, [req.userId]);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        return res.status(200).json({ user });
    } catch (error) {
        console.error('Error fetching profile:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

router.patch('/password', authMiddleware, changePasswordValidation, async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;

    try {
        const [[user]] = await pool.query<PasswordHashRow[]>('SELECT password_hash FROM users WHERE id = ?', [req.userId]);
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

router.patch('/', authMiddleware, updateProfileValidation, async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const allowedFields: (keyof ProfileUpdateFields)[] = ['username', 'display_name', 'bio', 'email'];
    const updates: ProfileUpdateFields = {};
    for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
            (updates as Record<string, unknown>)[field] = req.body[field];
        }
    }

    if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No valid fields provided' });
    }

    if (updates.username) {
        updates.username = updates.username.trim();
        try {
            const [existing] = await pool.query<IdRow[]>(
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
            const [existing] = await pool.query<IdRow[]>(
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

    const keys = Object.keys(updates) as (keyof ProfileUpdateFields)[];
    const setClauses = keys.map(field => `${field} = ?`).join(', ');
    const values = [...keys.map(k => updates[k]), req.userId];

    try {
        await pool.query(`UPDATE users SET ${setClauses} WHERE id = ?`, values);
        const [[user]] = await pool.query<PublicUserRow[]>(USER_SELECT, [req.userId]);
        return res.status(200).json({ user });
    } catch (error) {
        console.error('Error updating profile:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete('/', authMiddleware, async (req: Request, res: Response) => {
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

export default router;
