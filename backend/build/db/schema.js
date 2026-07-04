"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userAiSettings = exports.comment = exports.snippetVersion = exports.snippetTag = exports.tag = exports.snippet = exports.collection = exports.users = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
exports.users = (0, pg_core_1.pgTable)('users', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    username: (0, pg_core_1.varchar)('username', { length: 32 }).notNull(),
    email: (0, pg_core_1.varchar)('email', { length: 255 }).notNull().unique(),
    passwordHash: (0, pg_core_1.varchar)('password_hash', { length: 255 }).notNull(),
    role: (0, pg_core_1.varchar)('role', { length: 20 }).notNull().default('user'),
    displayName: (0, pg_core_1.varchar)('display_name', { length: 64 }),
    bio: (0, pg_core_1.text)('bio'),
    avatarUrl: (0, pg_core_1.varchar)('avatar_url', { length: 512 }),
    registeredAt: (0, pg_core_1.timestamp)('registered_at', { withTimezone: true }).notNull().defaultNow(),
});
exports.collection = (0, pg_core_1.pgTable)('collection', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    userId: (0, pg_core_1.integer)('user_id').notNull().references(() => exports.users.id, { onDelete: 'cascade' }),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    description: (0, pg_core_1.text)('description'),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
});
exports.snippet = (0, pg_core_1.pgTable)('snippet', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    userId: (0, pg_core_1.integer)('user_id').notNull().references(() => exports.users.id, { onDelete: 'cascade' }),
    collectionId: (0, pg_core_1.integer)('collection_id').references(() => exports.collection.id, { onDelete: 'set null' }),
    title: (0, pg_core_1.varchar)('title', { length: 200 }).notNull(),
    description: (0, pg_core_1.text)('description'),
    code: (0, pg_core_1.text)('code').notNull(),
    language: (0, pg_core_1.varchar)('language', { length: 50 }).notNull(),
    visibility: (0, pg_core_1.varchar)('visibility', { length: 10 }).notNull().default('private'),
    shareToken: (0, pg_core_1.varchar)('share_token', { length: 255 }),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});
exports.tag = (0, pg_core_1.pgTable)('tag', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    name: (0, pg_core_1.varchar)('name', { length: 50 }).notNull().unique(),
});
exports.snippetTag = (0, pg_core_1.pgTable)('snippet_tag', {
    snippetId: (0, pg_core_1.integer)('snippet_id').notNull().references(() => exports.snippet.id, { onDelete: 'cascade' }),
    tagId: (0, pg_core_1.integer)('tag_id').notNull().references(() => exports.tag.id, { onDelete: 'cascade' }),
}, (table) => [
    (0, pg_core_1.primaryKey)({ columns: [table.snippetId, table.tagId] }),
]);
exports.snippetVersion = (0, pg_core_1.pgTable)('snippet_version', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    snippetId: (0, pg_core_1.integer)('snippet_id').notNull().references(() => exports.snippet.id, { onDelete: 'cascade' }),
    code: (0, pg_core_1.text)('code').notNull(),
    versionNumber: (0, pg_core_1.integer)('version_number').notNull(),
    changeNote: (0, pg_core_1.text)('change_note'),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
});
exports.comment = (0, pg_core_1.pgTable)('comment', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    userId: (0, pg_core_1.integer)('user_id').notNull().references(() => exports.users.id, { onDelete: 'cascade' }),
    snippetId: (0, pg_core_1.integer)('snippet_id').notNull().references(() => exports.snippet.id, { onDelete: 'cascade' }),
    content: (0, pg_core_1.text)('content').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});
exports.userAiSettings = (0, pg_core_1.pgTable)('user_ai_settings', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    userId: (0, pg_core_1.integer)('user_id').notNull().references(() => exports.users.id, { onDelete: 'cascade' }),
    providerType: (0, pg_core_1.varchar)('provider_type', { length: 50 }).notNull(),
    apiKeyEnc: (0, pg_core_1.text)('api_key_enc').notNull(),
    modelName: (0, pg_core_1.varchar)('model_name', { length: 100 }),
    baseUrl: (0, pg_core_1.varchar)('base_url', { length: 255 }),
    isConfigured: (0, pg_core_1.boolean)('is_configured').notNull().default(false),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
    (0, pg_core_1.unique)('user_ai_settings_user_id_unique').on(table.userId),
]);
