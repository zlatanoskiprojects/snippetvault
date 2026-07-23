import { Request, Response, NextFunction } from 'express';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '../lib/auth';
import { asyncHandler } from './errorHandler';


const authMiddleware = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const session = await auth.api.getSession({
            headers: fromNodeHeaders(req.headers),
        });

        if (!session?.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        req.userId = Number(session.user.id);
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(401).json({ error: 'Not authenticated' });
    }
});

export default authMiddleware;
