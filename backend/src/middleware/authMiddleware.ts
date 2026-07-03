import { Request, Response, NextFunction } from 'express';

const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    if (!req.session?.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    req.userId = req.session.userId;
    next();
};

export default authMiddleware;
