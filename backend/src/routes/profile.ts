import { Router, Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { and, eq, ne } from 'drizzle-orm';
import db from '../lib/db';
import { users } from '../db/schema';
import authMiddleware from '../middleware/authMiddleware';
import { updateProfileValidation } from '../validators/profile';

interface ProfileUpdateFields {
    username?: string;
    displayName?: string | null;
    bio?: string | null;
    email?: string;
}

const router = Router();

const PROFILE_SELECTION = {
    id: users.id,
    username: users.username,
    email: users.email,
    role: users.role,
    displayName: users.displayName,
    bio: users.bio,
    avatarUrl: users.avatarUrl,
    registeredAt: users.registeredAt,
};

const mapUser = (u: {
    id: number;
    username: string;
    email: string;
    role: string;
    displayName: string | null;
    bio: string | null;
    avatarUrl: string | null;
    registeredAt: Date;
}) => ({
    id: u.id,
    username: u.username,
    email: u.email,
    role: u.role,
    display_name: u.displayName,
    bio: u.bio,
    avatar_url: u.avatarUrl,
    registered_at: u.registeredAt,
});

router.get('/', authMiddleware, async (req: Request, res: Response) => {
    try {
        const rows = await db.select(PROFILE_SELECTION).from(users).where(eq(users.id, req.userId as number));
        const user = rows[0];
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        return res.status(200).json({ user: mapUser(user) });
    } catch (error) {
        console.error('Error fetching profile:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

router.patch('/', authMiddleware, updateProfileValidation, async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const fieldMap: Record<string, keyof ProfileUpdateFields> = {
        username: 'username',
        display_name: 'displayName',
        bio: 'bio',
        email: 'email',
    };
    const updates: ProfileUpdateFields = {};
    for (const bodyField of Object.keys(fieldMap)) {
        if (req.body[bodyField] !== undefined) {
            (updates as Record<string, unknown>)[fieldMap[bodyField]] = req.body[bodyField];
        }
    }

    if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No valid fields provided' });
    }

    if (updates.username) {
        updates.username = updates.username.trim();
        try {
            const existing = await db
                .select({ id: users.id })
                .from(users)
                .where(and(eq(users.username, updates.username), ne(users.id, req.userId as number)));
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
            const existing = await db
                .select({ id: users.id })
                .from(users)
                .where(and(eq(users.email, updates.email), ne(users.id, req.userId as number)));
            if (existing.length > 0) {
                return res.status(409).json({ error: 'Email already in use' });
            }
        } catch (error) {
            console.error('Error checking email uniqueness:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    try {
        await db.update(users).set(updates).where(eq(users.id, req.userId as number));
        const rows = await db.select(PROFILE_SELECTION).from(users).where(eq(users.id, req.userId as number));
        return res.status(200).json({ user: mapUser(rows[0]) });
    } catch (error) {
        console.error('Error updating profile:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete('/', authMiddleware, async (req: Request, res: Response) => {
    try {
        await db.delete(users).where(eq(users.id, req.userId as number));
        return res.status(200).json({ message: 'App profile deleted' });
    } catch (error) {
        console.error('Error deleting account:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
