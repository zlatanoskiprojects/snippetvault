import {
    APIError,
    createAuthMiddleware,
    getAuthoritativeSessionFromCtx,
} from 'better-auth/api';
import {
    AUTH_FRESH_SESSION_SECONDS,
    isSessionFresh,
} from './sessionFreshness';

export const EMAIL_CHANGE_VERIFICATION_SECONDS = 3600;
export const EMAIL_CHANGE_FRESH_SESSION_SECONDS = AUTH_FRESH_SESSION_SECONDS;
export const EMAIL_CHANGE_RATE_LIMIT_MAX = 3;
export const EMAIL_CHANGE_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

export type EmailChangeReauthMethod = 'password' | 'oauth';

export interface PendingEmailChangeRecord {
    id: number;
    userId: number;
    oldEmail: string;
    newEmail: string;
    expiresAt: Date;
    createdAt: Date;
}

export interface EmailChangeRateLimitResult {
    allowed: boolean;
    requestCount: number;
    retryAfterSeconds: number;
}

export interface EmailChangeSecurityStore {
    findPending(userId: number, newEmail: string): Promise<PendingEmailChangeRecord | null>;
    findPendingByAddresses(
        oldEmail: string,
        newEmail: string,
    ): Promise<PendingEmailChangeRecord | null>;
    replacePending(input: Omit<PendingEmailChangeRecord, 'id' | 'createdAt'>): Promise<void>;
    deletePending(userId: number, newEmail: string): Promise<void>;
    deletePendingById(id: number): Promise<void>;
    consumeRateLimit(userId: number, now?: Date): Promise<EmailChangeRateLimitResult>;
}

interface EmailChangeTokenPayload {
    email: string;
    updateTo: string;
    requestType: 'change-email-confirmation' | 'change-email-verification';
}

interface EmailChangeBeforeHookOptions {
    store: EmailChangeSecurityStore;
    verifyPassword: (password: string, headers: Headers) => Promise<boolean>;
}

export interface EmailChangeReauthInput {
    hasCredential: boolean;
    currentPassword?: unknown;
    verifyPassword: (password: string) => Promise<boolean>;
    sessionCreatedAt: Date | string;
    now?: number;
}

export async function checkEmailChangeReauthentication({
    hasCredential,
    currentPassword,
    verifyPassword,
    sessionCreatedAt,
    now = Date.now(),
}: EmailChangeReauthInput): Promise<EmailChangeReauthMethod | null> {
    if (hasCredential) {
        if (typeof currentPassword !== 'string' || currentPassword.length === 0) {
            return 'password';
        }

        return await verifyPassword(currentPassword) ? null : 'password';
    }

    return isSessionFresh(sessionCreatedAt, now) ? null : 'oauth';
}

export function decodeEmailChangeTokenPayload(token: unknown): EmailChangeTokenPayload | null {
    if (typeof token !== 'string') return null;

    const payload = token.split('.')[1];
    if (!payload) return null;

    try {
        const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
            email?: unknown;
            updateTo?: unknown;
            requestType?: unknown;
        };
        if (
            typeof decoded.email !== 'string' ||
            typeof decoded.updateTo !== 'string' ||
            (
                decoded.requestType !== 'change-email-confirmation' &&
                decoded.requestType !== 'change-email-verification'
            )
        ) return null;

        return {
            email: decoded.email.toLowerCase(),
            updateTo: decoded.updateTo.toLowerCase(),
            requestType: decoded.requestType,
        };
    } catch {
        return null;
    }
}

export function createEmailChangeBeforeHook({
    store,
    verifyPassword,
}: EmailChangeBeforeHookOptions) {
    return createAuthMiddleware(async (ctx) => {
        if (ctx.path === '/verify-email') {
            const token = (ctx.query as { token?: unknown } | undefined)?.token;
            const payload = decodeEmailChangeTokenPayload(token);
            if (!payload) return;

            const pendingChange = await store.findPendingByAddresses(
                payload.email,
                payload.updateTo,
            );
            if (!pendingChange) {
                throw new APIError('BAD_REQUEST', {
                    error: 'EMAIL_CHANGE_SUPERSEDED',
                    code: 'EMAIL_CHANGE_SUPERSEDED',
                    message: 'This email change request is no longer active',
                });
            }
            return;
        }

        if (ctx.path !== '/change-email') return;

        const session = await getAuthoritativeSessionFromCtx(ctx);
        if (!session?.user) {
            throw new APIError('UNAUTHORIZED', {
                error: 'UNAUTHORIZED',
                code: 'UNAUTHORIZED',
                message: 'Unauthorized',
            });
        }

        const accounts = await ctx.context.internalAdapter.findAccounts(session.user.id);
        const hasCredential = accounts.some((account) => (
            account.providerId === 'credential' && Boolean(account.password)
        ));
        const currentPassword = (
            ctx.body as { currentPassword?: unknown } | undefined
        )?.currentPassword;
        const requiredMethod = await checkEmailChangeReauthentication({
            hasCredential,
            currentPassword,
            verifyPassword: (password) => verifyPassword(password, new Headers(ctx.headers)),
            sessionCreatedAt: session.session.createdAt,
        });

        if (requiredMethod) {
            throw new APIError('FORBIDDEN', {
                error: 'REAUTH_REQUIRED',
                code: 'REAUTH_REQUIRED',
                method: requiredMethod,
                message: 'Re-authentication is required before changing your email',
            });
        }

        const rateLimit = await store.consumeRateLimit(Number(session.user.id));
        if (!rateLimit.allowed) {
            throw new APIError('TOO_MANY_REQUESTS', {
                error: 'EMAIL_CHANGE_RATE_LIMITED',
                code: 'EMAIL_CHANGE_RATE_LIMITED',
                message: 'Too many email change requests. Try again later.',
            }, {
                'Retry-After': String(rateLimit.retryAfterSeconds),
            });
        }
    });
}

export function withEmailChangeCompletionCallback(url: string): string {
    const verificationUrl = new URL(url);
    const callbackURL = verificationUrl.searchParams.get('callbackURL');

    if (!callbackURL) return url;

    const callback = new URL(callbackURL, verificationUrl.origin);
    callback.pathname = '/login';
    callback.search = '?emailChange=complete';
    callback.hash = '';
    verificationUrl.searchParams.set('callbackURL', callback.toString());
    return verificationUrl.toString();
}
