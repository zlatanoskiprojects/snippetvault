import { NextFunction, Request, RequestHandler, Response } from 'express';

export const asyncHandler = (fn: RequestHandler): RequestHandler => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

export const notFoundHandler: RequestHandler = (_req, res) => {
    res.status(404).json({ error: 'Not found', code: 'NOT_FOUND' });
};

const resolve = (err: unknown): { status: number; error: string; code: string } => {
    if (err instanceof SyntaxError && 'body' in err) {
        return { status: 400, error: 'Malformed JSON body', code: 'INVALID_JSON' };
    }

    if (err instanceof Error && err.message === 'Not allowed by CORS') {
        return { status: 403, error: 'Origin not allowed', code: 'CORS_DENIED' };
    }

    const candidate = err as { status?: unknown; statusCode?: unknown; code?: unknown };
    const status = typeof candidate.status === 'number' ? candidate.status
        : typeof candidate.statusCode === 'number' ? candidate.statusCode
        : undefined;

    if (status && status >= 400 && status < 500) {
        return {
            status,
            error: status === 401 ? 'Not authenticated' : status === 403 ? 'Forbidden' : 'Bad request',
            code: typeof candidate.code === 'string' ? candidate.code : 'CLIENT_ERROR',
        };
    }

    return { status: 500, error: 'Internal server error', code: 'INTERNAL_ERROR' };
};

export const errorHandler = (err: unknown, req: Request, res: Response, next: NextFunction) => {
    console.error(JSON.stringify({
        timestamp: new Date().toISOString(),
        method: req.method,
        path: req.originalUrl,
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
    }));

    if (res.headersSent) {
        return next(err);
    }

    const { status, error, code } = resolve(err);
    res.status(status).json({ error, code });
};
