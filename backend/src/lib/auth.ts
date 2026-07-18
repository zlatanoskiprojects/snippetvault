import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import db from './db';
import { authAccount, authSession, authVerification, users } from '../db/schema';

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
    trustedOrigins: [
        process.env.CLIENT_URL || 'http://localhost:5173',
        'http://localhost:5173',
        'http://127.0.0.1:5173',
    ],
    database: drizzleAdapter(db, {
        provider: 'pg',
        schema: {
            user: users,
            session: authSession,
            account: authAccount,
            verification: authVerification,
        },
    }),
    advanced: {
        database: {
            generateId: 'serial',
        },
    },
    emailAndPassword: {
        enabled: true,
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
