import { Request, Response, NextFunction } from 'express';
import { ALLOWED_ORIGINS } from '../constants/origins';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function requireTrustedOrigin(req: Request, res: Response, next: NextFunction): void {
    if (SAFE_METHODS.has(req.method)) {
        next();
        return;
    }

    const origin = req.headers.origin;

    if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
        res.status(403).json({
            error: 'Origin not allowed',
            code: 'ORIGIN_NOT_TRUSTED',
        });
        return;
    }

    next();
}
