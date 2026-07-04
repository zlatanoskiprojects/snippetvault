import {
    pgTable,
    serial,
    integer,
    varchar,
    text,
    boolean,
    timestamp,
    primaryKey,
    unique,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
    id: serial('id').primaryKey(),
    username: varchar('username', { length: 32 }).notNull(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    role: varchar('role', { length: 20 }).notNull().default('user'),
    displayName: varchar('display_name', { length: 64 }),
    bio: text('bio'),
    avatarUrl: varchar('avatar_url', { length: 512 }),
    registeredAt: timestamp('registered_at', { withTimezone: true }).notNull().defaultNow(),
});

export const collection = pgTable('collection', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const snippet = pgTable('snippet', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    collectionId: integer('collection_id').references(() => collection.id, { onDelete: 'set null' }),
    title: varchar('title', { length: 200 }).notNull(),
    description: text('description'),
    code: text('code').notNull(),
    language: varchar('language', { length: 50 }).notNull(),
    visibility: varchar('visibility', { length: 10 }).notNull().default('private'),
    shareToken: varchar('share_token', { length: 255 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const tag = pgTable('tag', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 50 }).notNull().unique(),
});

export const snippetTag = pgTable('snippet_tag', {
    snippetId: integer('snippet_id').notNull().references(() => snippet.id, { onDelete: 'cascade' }),
    tagId: integer('tag_id').notNull().references(() => tag.id, { onDelete: 'cascade' }),
}, (table) => [
    primaryKey({ columns: [table.snippetId, table.tagId] }),
]);

export const snippetVersion = pgTable('snippet_version', {
    id: serial('id').primaryKey(),
    snippetId: integer('snippet_id').notNull().references(() => snippet.id, { onDelete: 'cascade' }),
    code: text('code').notNull(),
    versionNumber: integer('version_number').notNull(),
    changeNote: text('change_note'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const comment = pgTable('comment', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    snippetId: integer('snippet_id').notNull().references(() => snippet.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const userAiSettings = pgTable('user_ai_settings', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    providerType: varchar('provider_type', { length: 50 }).notNull(),
    apiKeyEnc: text('api_key_enc').notNull(),
    modelName: varchar('model_name', { length: 100 }),
    baseUrl: varchar('base_url', { length: 255 }),
    isConfigured: boolean('is_configured').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
    unique('user_ai_settings_user_id_unique').on(table.userId),
]);