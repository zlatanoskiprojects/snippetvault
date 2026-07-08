import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import db from '../lib/db';
import { users } from '../db/schema';
import { registerValidation, loginValidation, handleValidation } from '../validators/auth';

const router = Router();

router.post('/register', registerValidation, handleValidation, async (req: Request, res: Response) => {
    const { username, email, password } = req.body;
    const cleanEmail = email.toLowerCase();

    try {
        const existingUser = await db.select({ id: users.id }).from(users).where(eq(users.email, cleanEmail));
        if (existingUser.length > 0) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.insert(users).values({
            username,
            email,
            passwordHash: hashedPassword,
        });
        return res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Error registering user:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/login', loginValidation, handleValidation, async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const cleanEmail = email.toLowerCase();

    try {
        const rows = await db.select().from(users).where(eq(users.email, cleanEmail));
        if (rows.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        const validPassword = await bcrypt.compare(password, rows[0].passwordHash);
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
                    display_name: rows[0].displayName,
                    avatar_url: rows[0].avatarUrl,
                },
            });
        });
    } catch (error) {
        console.error('Error logging in:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/logout', (req: Request, res: Response) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Session destroy error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        res.clearCookie('connect.sid');
        return res.status(200).json({ message: 'Logged out successfully' });
    });
});

export default router;
