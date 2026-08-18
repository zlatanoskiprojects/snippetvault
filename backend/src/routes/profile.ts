import { Router, Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { and, eq, isNotNull, ne } from 'drizzle-orm';
import { fromNodeHeaders } from 'better-auth/node';
import db from '../lib/db';
import { authAccount, users } from '../db/schema';
import { auth } from '../lib/auth';
import authMiddleware from '../middleware/authMiddleware';
import { asyncHandler } from '../middleware/errorHandler';
import { requireTrustedOrigin } from '../middleware/originCheck';
import { passwordSetupLimiter } from '../middleware/rateLimit';
import { setPasswordValidation, updateProfileValidation } from '../validators/profile';
import { isSessionFresh } from '../lib/sessionFreshness';

interface ProfileUpdateFields {
    username?: string;
    displayName?: string | null;
    bio?: string | null;
}

type OAuthProvider = 'google' | 'github';

type ProfileAuth = Pick<typeof auth, 'api'>;

export interface SessionFreshnessTrace {
    path: '/api/profile/set-password';
    sessionCreatedAt: Date | string;
    checkedAt: number;
    isFresh: boolean;
}

interface ProfileRouterOptions {
    authClient?: ProfileAuth;
    checkSessionFreshness?: typeof isSessionFresh;
    onSessionFreshnessChecked?: (trace: SessionFreshnessTrace) => void;
}

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

const hasCredentialPassword = async (userId: number): Promise<boolean> => {
    const rows = await db
        .select({ id: authAccount.id })
        .from(authAccount)
        .where(and(
            eq(authAccount.userId, userId),
            eq(authAccount.providerId, 'credential'),
            isNotNull(authAccount.password),
        ))
        .limit(1);

    return rows.length > 0;
};

const getOAuthProviders = async (userId: number): Promise<OAuthProvider[]> => {
    const rows = await db
        .select({ providerId: authAccount.providerId })
        .from(authAccount)
        .where(eq(authAccount.userId, userId));

    return [...new Set(rows
        .map((row) => row.providerId)
        .filter((providerId): providerId is OAuthProvider => (
            providerId === 'google' || providerId === 'github'
        )))];
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
}, hasPassword: boolean, oauthProviders: OAuthProvider[]) => ({
    id: u.id,
    username: u.username,
    email: u.email,
    role: u.role,
    display_name: u.displayName,
    bio: u.bio,
    avatar_url: u.avatarUrl,
    registered_at: u.registeredAt,
    has_password: hasPassword,
    oauth_providers: oauthProviders,
});

export function createProfileRouter({
    authClient = auth,
    checkSessionFreshness = isSessionFresh,
    onSessionFreshnessChecked,
}: ProfileRouterOptions = {}) {
const router = Router();

router.get('/', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
    try {
        const rows = await db.select(PROFILE_SELECTION).from(users).where(eq(users.id, req.userId as number));
        const user = rows[0];
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const [hasPassword, oauthProviders] = await Promise.all([
            hasCredentialPassword(user.id),
            getOAuthProviders(user.id),
        ]);
        return res.status(200).json({ user: mapUser(user, hasPassword, oauthProviders) });
    } catch (error) {
        console.error('Error fetching profile:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}));

router.patch('/', authMiddleware, updateProfileValidation, asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    if (req.body.email !== undefined) {
        return res.status(400).json({ error: 'Email changes require verification' });
    }

    const fieldMap: Record<string, keyof ProfileUpdateFields> = {
        username: 'username',
        display_name: 'displayName',
        bio: 'bio',
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

    try {
        await db.update(users).set(updates).where(eq(users.id, req.userId as number));
        const rows = await db.select(PROFILE_SELECTION).from(users).where(eq(users.id, req.userId as number));
        const [hasPassword, oauthProviders] = await Promise.all([
            hasCredentialPassword(req.userId as number),
            getOAuthProviders(req.userId as number),
        ]);
        return res.status(200).json({ user: mapUser(rows[0], hasPassword, oauthProviders) });
    } catch (error) {
        console.error('Error updating profile:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}));

router.post(
    '/set-password',
    requireTrustedOrigin,
    passwordSetupLimiter,
    setPasswordValidation,
    asyncHandler(async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const session = await authClient.api.getSession({
            headers: fromNodeHeaders(req.headers),
            query: {
                disableCookieCache: true,
                disableRefresh: true,
            },
        });

        if (!session?.user) {
            return res.status(401).json({
                error: 'Not authenticated',
                code: 'UNAUTHORIZED',
            });
        }

        if (!session.user.emailVerified) {
            return res.status(403).json({
                error: 'Verify your email before setting a password',
            });
        }

        const checkedAt = Date.now();
        const fresh = checkSessionFreshness(session.session.createdAt, checkedAt);
        onSessionFreshnessChecked?.({
            path: '/api/profile/set-password',
            sessionCreatedAt: session.session.createdAt,
            checkedAt,
            isFresh: fresh,
        });

        if (!fresh) {
            return res.status(403).json({
                error: 'REAUTH_REQUIRED',
                code: 'REAUTH_REQUIRED',
                method: 'oauth',
                message: 'Re-authentication is required before setting a password',
            });
        }

        const result = await authClient.api.setPassword({
            body: { newPassword: req.body.newPassword },
            headers: fromNodeHeaders(req.headers),
        });

        return res.status(200).json(result);
    }),
);

router.delete('/', requireTrustedOrigin, authMiddleware, asyncHandler(async (req: Request, res: Response) => {
    try {
        await db.delete(users).where(eq(users.id, req.userId as number));
        return res.status(200).json({ message: 'App profile deleted' });
    } catch (error) {
        console.error('Error deleting account:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}));

return router;
}

export default createProfileRouter();
