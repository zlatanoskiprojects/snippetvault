import { randomBytes } from 'crypto';
import { betterAuth, type BetterAuthPlugin } from 'better-auth';
import { createAuthMiddleware, isAPIError } from 'better-auth/api';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { captcha } from 'better-auth/plugins';
import { and, eq } from 'drizzle-orm';
import db from './db';
import {
    authAccount,
    authSession,
    authVerification,
    users,
} from '../db/schema';
import { ALLOWED_ORIGINS } from '../constants/origins';
import { sendEmail } from './email';
import {
    createEmailChangeBeforeHook,
    EMAIL_CHANGE_VERIFICATION_SECONDS,
    withEmailChangeCompletionCallback,
} from './emailChangeSecurity';
import { emailChangeStore } from './emailChangeStore';
import { AUTH_FRESH_SESSION_SECONDS } from './sessionFreshness';

const captchaPlugins = process.env.TURNSTILE_SECRET_KEY
    ? [
          captcha({
              provider: 'cloudflare-turnstile',
              secretKey: process.env.TURNSTILE_SECRET_KEY,
              endpoints: ['/sign-in/email', '/sign-up/email'],
          }),
      ]
    : [];

const signupPasswordPlugin = {
    id: 'signup-password',
    hooks: {
        before: [{
            matcher: (context) => context.path === '/sign-up/email',
            handler: createAuthMiddleware(async (context) => {
                const body = context.body as { password: string };
                body.password = randomBytes(32).toString('hex');
            }),
        }],
    },
} satisfies BetterAuthPlugin;

type VerifyPasswordWithAuth = (password: string, headers: Headers) => Promise<boolean>;

let verifyPasswordWithAuth: VerifyPasswordWithAuth = async () => {
    throw new Error('Password verification is not initialized');
};

function deriveUsername(name: string): string {
    const trimmed = name.trim().slice(0, 32);
    return trimmed || `user${Date.now()}`;
}

const googleCredentials =
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_CLIENT_ID !== 'placeholder' &&
    process.env.GOOGLE_CLIENT_SECRET !== 'placeholder'
        ? {
              google: {
                  clientId: process.env.GOOGLE_CLIENT_ID,
                  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
              },
          }
        : {};

const githubCredentials =
    process.env.GITHUB_CLIENT_ID &&
    process.env.GITHUB_CLIENT_SECRET &&
    process.env.GITHUB_CLIENT_ID !== 'placeholder' &&
    process.env.GITHUB_CLIENT_SECRET !== 'placeholder'
        ? {
              github: {
                  clientId: process.env.GITHUB_CLIENT_ID,
                  clientSecret: process.env.GITHUB_CLIENT_SECRET,
              },
          }
        : {};

export const auth = betterAuth({
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
    trustedOrigins: ALLOWED_ORIGINS,
    database: drizzleAdapter(db, {
        provider: 'pg',
        schema: {
            user: users,
            session: authSession,
            account: authAccount,
            verification: authVerification,
        },
    }),
    plugins: [...captchaPlugins, signupPasswordPlugin],
    session: {
        freshAge: AUTH_FRESH_SESSION_SECONDS,
    },
    advanced: {
        database: {
            generateId: 'serial',
        },
        defaultCookieAttributes: {
            sameSite: 'none',
            secure: true,
            httpOnly: true,
        },
    },
    rateLimit: {
        enabled: true,
        window: 60,
        max: 100,
        storage: 'memory',
        customRules: {
            '/sign-in/email': { window: 60, max: 5 },
            '/sign-up/email': { window: 60, max: 5 },
            '/delete-user': { window: 60, max: 3 },
            '/change-password': { window: 60, max: 5 },
            '/change-email': { window: 60, max: 5 },
        },
    },
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: true,
    },
    emailVerification: {
        sendOnSignUp: true,
        autoSignInAfterVerification: true,
        expiresIn: EMAIL_CHANGE_VERIFICATION_SECONDS,
        beforeEmailVerification: async (user) => {
            const userId = Number(user.id);
            await db.transaction(async (tx) => {
                await tx
                    .delete(authAccount)
                    .where(
                        and(
                            eq(authAccount.userId, userId),
                            eq(authAccount.providerId, 'credential'),
                        ),
                    );
                await tx.delete(authSession).where(eq(authSession.userId, userId));
            });
        },
        sendVerificationEmail: async ({ user, url, token }, request) => {
            const pendingChange = await emailChangeStore.findPending(
                Number(user.id),
                user.email,
            );
            const emailUrl = pendingChange
                ? withEmailChangeCompletionCallback(url)
                : url;
            const emailRequest = sendEmail({
                to: user.email,
                subject: pendingChange
                    ? 'Verify your new SnippetVault email'
                    : 'Verify your SnippetVault email',
                text: pendingChange
                    ? `Click the link to verify your new email address: ${emailUrl}`
                    : `Click the link to verify your email: ${emailUrl}`,
            });

            const isEmailChange = request
                ? new URL(request.url).pathname.endsWith('/change-email')
                : false;

            if (isEmailChange || pendingChange) {
                await emailRequest;
            } else {
                void emailRequest.catch(() => undefined);
            }
        },
        afterEmailVerification: async (user) => {
            const userId = Number(user.id);
            const pendingChange = await emailChangeStore.findPending(userId, user.email);

            if (!pendingChange) return;

            await db.delete(authSession).where(eq(authSession.userId, userId));
            await emailChangeStore.deletePendingById(pendingChange.id);

            void sendEmail({
                to: pendingChange.oldEmail,
                subject: 'Your SnippetVault email was changed',
                text: `Your account email was changed to ${pendingChange.newEmail}. If this wasn't you, contact support or reset your account immediately.`,
            }).catch((error) => {
                console.error('Failed to send email-change security notification:', error);
            });
        },
    },
    socialProviders: {
        ...googleCredentials,
        ...githubCredentials,
    },
    user: {
        fields: {
            name: 'displayName',
            image: 'avatarUrl',
            emailVerified: 'emailVerified',
            createdAt: 'registeredAt',
            updatedAt: 'updatedAt',
        },
        changeEmail: {
            enabled: true,
            sendChangeEmailConfirmation: async ({ user, newEmail, url }) => {
                const userId = Number(user.id);
                const expiresAt = new Date(
                    Date.now() + EMAIL_CHANGE_VERIFICATION_SECONDS * 1000,
                );

                await emailChangeStore.replacePending({
                    userId,
                    oldEmail: user.email,
                    newEmail,
                    expiresAt,
                });

                try {
                    await sendEmail({
                        to: user.email,
                        subject: 'Confirm your SnippetVault email change',
                        text: `A change from ${user.email} to ${newEmail} was requested. Confirm it here: ${url}. If this wasn't you, do not open the link and secure your account immediately.`,
                    });
                } catch (error) {
                    await emailChangeStore.deletePending(userId, newEmail);
                    throw error;
                }
            },
        },
        additionalFields: {
            username: {
                type: 'string',
                required: false,
                input: false,
            },
        },
        deleteUser: {
            enabled: true,
        },
    },
    databaseHooks: {
        user: {
            create: {
                before: async (user) => {
                    const name = (user as { name?: string }).name ?? '';
                    return { data: { ...user, username: deriveUsername(name) } };
                },
            },
        },
    },
    hooks: {
        before: createEmailChangeBeforeHook({
            store: emailChangeStore,
            verifyPassword: (password, headers) => verifyPasswordWithAuth(
                password,
                headers,
            ),
        }),
    },
});

verifyPasswordWithAuth = async (password, headers) => {
    try {
        await auth.api.verifyPassword({
            body: { password },
            headers,
        });
        return true;
    } catch (error) {
        if (isAPIError(error) && error.body?.code === 'INVALID_PASSWORD') return false;
        throw error;
    }
};
