import { and, eq, gt, sql } from 'drizzle-orm';
import { emailChangeRateLimit, pendingEmailChange } from '../db/schema';
import db from './db';
import {
    EMAIL_CHANGE_RATE_LIMIT_MAX,
    EMAIL_CHANGE_RATE_LIMIT_WINDOW_MS,
    type EmailChangeSecurityStore,
} from './emailChangeSecurity';

export const emailChangeStore: EmailChangeSecurityStore = {
    async findPending(userId, newEmail) {
        const rows = await db
            .select()
            .from(pendingEmailChange)
            .where(and(
                eq(pendingEmailChange.userId, userId),
                eq(pendingEmailChange.newEmail, newEmail.toLowerCase()),
                gt(pendingEmailChange.expiresAt, new Date()),
            ))
            .limit(1);

        return rows[0] ?? null;
    },

    async findPendingByAddresses(oldEmail, newEmail) {
        const rows = await db
            .select()
            .from(pendingEmailChange)
            .where(and(
                eq(pendingEmailChange.oldEmail, oldEmail.toLowerCase()),
                eq(pendingEmailChange.newEmail, newEmail.toLowerCase()),
                gt(pendingEmailChange.expiresAt, new Date()),
            ))
            .limit(1);

        return rows[0] ?? null;
    },

    async replacePending(input) {
        await db
            .insert(pendingEmailChange)
            .values({
                ...input,
                oldEmail: input.oldEmail.toLowerCase(),
                newEmail: input.newEmail.toLowerCase(),
            })
            .onConflictDoUpdate({
                target: pendingEmailChange.userId,
                set: {
                    oldEmail: input.oldEmail.toLowerCase(),
                    newEmail: input.newEmail.toLowerCase(),
                    expiresAt: input.expiresAt,
                    createdAt: new Date(),
                },
            });
    },

    async deletePending(userId, newEmail) {
        await db
            .delete(pendingEmailChange)
            .where(and(
                eq(pendingEmailChange.userId, userId),
                eq(pendingEmailChange.newEmail, newEmail.toLowerCase()),
            ));
    },

    async deletePendingById(id) {
        await db.delete(pendingEmailChange).where(eq(pendingEmailChange.id, id));
    },

    async consumeRateLimit(userId, now = new Date()) {
        const windowCutoff = new Date(now.getTime() - EMAIL_CHANGE_RATE_LIMIT_WINDOW_MS);
        const rows = await db
            .insert(emailChangeRateLimit)
            .values({
                userId,
                windowStartedAt: now,
                requestCount: 1,
                updatedAt: now,
            })
            .onConflictDoUpdate({
                target: emailChangeRateLimit.userId,
                set: {
                    requestCount: sql<number>`case
                        when ${emailChangeRateLimit.windowStartedAt} <= ${windowCutoff}
                        then 1
                        else ${emailChangeRateLimit.requestCount} + 1
                    end`,
                    windowStartedAt: sql<Date>`case
                        when ${emailChangeRateLimit.windowStartedAt} <= ${windowCutoff}
                        then ${now}
                        else ${emailChangeRateLimit.windowStartedAt}
                    end`,
                    updatedAt: now,
                },
            })
            .returning({
                requestCount: emailChangeRateLimit.requestCount,
                windowStartedAt: emailChangeRateLimit.windowStartedAt,
            });

        const row = rows[0];
        const retryAfterSeconds = Math.max(1, Math.ceil(
            (row.windowStartedAt.getTime() + EMAIL_CHANGE_RATE_LIMIT_WINDOW_MS - now.getTime()) /
                1000,
        ));

        return {
            allowed: row.requestCount <= EMAIL_CHANGE_RATE_LIMIT_MAX,
            requestCount: row.requestCount,
            retryAfterSeconds,
        };
    },
};
