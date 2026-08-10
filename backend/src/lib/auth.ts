import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { captcha } from 'better-auth/plugins';
import db from './db';
import { authAccount, authSession, authVerification, users } from '../db/schema';
import { ALLOWED_ORIGINS } from '../constants/origins';
import { sendEmail } from './email';

const captchaPlugins = process.env.TURNSTILE_SECRET_KEY
    ? [
          captcha({
              provider: 'cloudflare-turnstile',
              secretKey: process.env.TURNSTILE_SECRET_KEY,
              endpoints: ['/sign-in/email', '/sign-up/email'],
          }),
      ]
    : [];

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
    plugins: captchaPlugins,
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
        },
    },
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: true,
    },
    emailVerification: {
        sendOnSignUp: true,
        autoSignInAfterVerification: true,
        expiresIn: 3600,
        sendVerificationEmail: async ({ user, url, token }, request) => {
            const emailRequest = sendEmail({
                to: user.email,
                subject: 'Verify your SnippetVault email',
                text: `Click the link to verify your email: ${url}`,
            });

            const isEmailChange = request
                ? new URL(request.url).pathname.endsWith('/change-email')
                : false;

            if (isEmailChange) {
                await emailRequest;
            } else {
                void emailRequest.catch(() => undefined);
            }
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
});
