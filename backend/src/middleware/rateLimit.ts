import rateLimit from 'express-rate-limit';

export const shareLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 60,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later' },
});

export const invitationLookupLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    skipSuccessfulRequests: true,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later' },
});

export const invitationSendLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 15,
    skipFailedRequests: true,
    keyGenerator: (req) => String(req.userId),
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Too many invitations sent, please try again later' },
});

export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later' },
});

export const passwordSetupLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Too many password attempts, please try again later' },
});

export const avatarUploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Too many avatar uploads, please try again later' },
});
