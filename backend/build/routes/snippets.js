"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = __importDefault(require("../lib/db"));
const schema_1 = require("../db/schema");
const authMiddleware_1 = __importDefault(require("../middleware/authMiddleware"));
const express_validator_1 = require("express-validator");
const snippets_1 = require("../validators/snippets");
const router = (0, express_1.Router)();
const snippetWithTagsSelection = {
    id: schema_1.snippet.id,
    userId: schema_1.snippet.userId,
    collectionId: schema_1.snippet.collectionId,
    title: schema_1.snippet.title,
    description: schema_1.snippet.description,
    code: schema_1.snippet.code,
    language: schema_1.snippet.language,
    visibility: schema_1.snippet.visibility,
    shareToken: schema_1.snippet.shareToken,
    createdAt: schema_1.snippet.createdAt,
    updatedAt: schema_1.snippet.updatedAt,
    tags: (0, drizzle_orm_1.sql) `string_agg(${schema_1.tag.name}, ',')`,
};
const mapSnippetWithTags = (s) => ({
    id: s.id,
    user_id: s.userId,
    collection_id: s.collectionId,
    title: s.title,
    description: s.description,
    code: s.code,
    language: s.language,
    visibility: s.visibility,
    share_token: s.shareToken,
    created_at: s.createdAt,
    updated_at: s.updatedAt,
    tags: s.tags ? s.tags.split(',') : [],
});
const mapSnippet = (s) => ({
    id: s.id,
    user_id: s.userId,
    collection_id: s.collectionId,
    title: s.title,
    description: s.description,
    code: s.code,
    language: s.language,
    visibility: s.visibility,
    share_token: s.shareToken,
    created_at: s.createdAt,
    updated_at: s.updatedAt,
});
const mapVersion = (v) => ({
    id: v.id,
    snippet_id: v.snippetId,
    code: v.code,
    version_number: v.versionNumber,
    change_note: v.changeNote,
    created_at: v.createdAt,
});
router.get('/', authMiddleware_1.default, async (req, res) => {
    try {
        const userId = req.userId;
        const q = req.query.q;
        const whereClause = q
            ? (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.snippet.userId, userId), (0, drizzle_orm_1.or)((0, drizzle_orm_1.ilike)(schema_1.snippet.title, `%${q}%`), (0, drizzle_orm_1.ilike)(schema_1.snippet.language, `%${q}%`), (0, drizzle_orm_1.ilike)(schema_1.snippet.description, `%${q}%`), (0, drizzle_orm_1.ilike)(schema_1.tag.name, `%${q}%`), (0, drizzle_orm_1.ilike)(schema_1.snippet.code, `%${q}%`)))
            : (0, drizzle_orm_1.eq)(schema_1.snippet.userId, userId);
        const snippets = await db_1.default
            .select(snippetWithTagsSelection)
            .from(schema_1.snippet)
            .leftJoin(schema_1.snippetTag, (0, drizzle_orm_1.eq)(schema_1.snippetTag.snippetId, schema_1.snippet.id))
            .leftJoin(schema_1.tag, (0, drizzle_orm_1.eq)(schema_1.tag.id, schema_1.snippetTag.tagId))
            .where(whereClause)
            .groupBy(schema_1.snippet.id)
            .orderBy((0, drizzle_orm_1.desc)(schema_1.snippet.createdAt));
        const result = snippets.map(mapSnippetWithTags);
        return res.status(200).json(result);
    }
    catch (error) {
        console.log("Error fetching snippets:", error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/:id', authMiddleware_1.default, snippets_1.snippetIdValidation, async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const snippetId = parseInt(req.params.id);
        const rows = await db_1.default
            .select(snippetWithTagsSelection)
            .from(schema_1.snippet)
            .leftJoin(schema_1.snippetTag, (0, drizzle_orm_1.eq)(schema_1.snippetTag.snippetId, schema_1.snippet.id))
            .leftJoin(schema_1.tag, (0, drizzle_orm_1.eq)(schema_1.tag.id, schema_1.snippetTag.tagId))
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.snippet.id, snippetId), (0, drizzle_orm_1.eq)(schema_1.snippet.userId, req.userId)))
            .groupBy(schema_1.snippet.id);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Snippet not found' });
        }
        return res.status(200).json(mapSnippetWithTags(rows[0]));
    }
    catch (error) {
        console.log("Error fetching snippet", error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/', authMiddleware_1.default, snippets_1.createSnippetValidation, async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { title, description, code, language, visibility, collection_id } = req.body;
    try {
        const [created] = await db_1.default.insert(schema_1.snippet).values({
            userId: req.userId,
            title,
            description: description || null,
            code,
            language,
            visibility: visibility || 'private',
            collectionId: collection_id || null,
        }).returning();
        return res.status(201).json(mapSnippet(created));
    }
    catch (error) {
        console.log("Error creating snippet", error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
router.delete('/:id', authMiddleware_1.default, snippets_1.snippetIdValidation, async (req, res) => {
    const err = (0, express_validator_1.validationResult)(req);
    if (!err.isEmpty()) {
        return res.status(400).json({ errors: err.array() });
    }
    try {
        const snippetId = parseInt(req.params.id);
        const deleted = await db_1.default
            .delete(schema_1.snippet)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.snippet.id, snippetId), (0, drizzle_orm_1.eq)(schema_1.snippet.userId, req.userId)))
            .returning({ id: schema_1.snippet.id });
        if (deleted.length === 0) {
            return res.status(404).json({ error: 'Snippet not found' });
        }
        await db_1.default.delete(schema_1.tag).where((0, drizzle_orm_1.sql) `${schema_1.tag.id} NOT IN (SELECT ${schema_1.snippetTag.tagId} FROM ${schema_1.snippetTag})`);
        return res.status(200).json({ message: 'Snippet deleted successfully' });
    }
    catch (error) {
        console.log("Error deleting snippet", error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
router.patch('/:id', authMiddleware_1.default, snippets_1.updateSnippetValidation, async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const snippetId = parseInt(req.params.id);
    const fieldMap = {
        title: 'title',
        description: 'description',
        code: 'code',
        language: 'language',
        visibility: 'visibility',
        collection_id: 'collectionId',
    };
    const updates = {};
    for (const bodyField of Object.keys(fieldMap)) {
        if (req.body[bodyField] !== undefined) {
            updates[fieldMap[bodyField]] = req.body[bodyField];
        }
    }
    if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No valid fields provided' });
    }
    try {
        if (updates.collectionId !== undefined && updates.collectionId !== null) {
            const cols = await db_1.default
                .select({ id: schema_1.collection.id })
                .from(schema_1.collection)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.collection.id, updates.collectionId), (0, drizzle_orm_1.eq)(schema_1.collection.userId, req.userId)));
            if (cols.length === 0) {
                return res.status(403).json({ error: 'Collection not found or not yours' });
            }
        }
        let shouldSaveVersion = false;
        let oldCode = null;
        if (updates.code !== undefined) {
            const current = await db_1.default
                .select({ code: schema_1.snippet.code })
                .from(schema_1.snippet)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.snippet.id, snippetId), (0, drizzle_orm_1.eq)(schema_1.snippet.userId, req.userId)));
            if (current.length > 0 && current[0].code !== updates.code) {
                shouldSaveVersion = true;
                oldCode = current[0].code;
            }
        }
        const result = await db_1.default
            .update(schema_1.snippet)
            .set(updates)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.snippet.id, snippetId), (0, drizzle_orm_1.eq)(schema_1.snippet.userId, req.userId)))
            .returning({ id: schema_1.snippet.id });
        if (result.length === 0) {
            return res.status(404).json({ error: 'Snippet not found' });
        }
        if (shouldSaveVersion && oldCode !== null) {
            const existing = await db_1.default
                .select({ id: schema_1.snippetVersion.id })
                .from(schema_1.snippetVersion)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.snippetVersion.snippetId, snippetId), (0, drizzle_orm_1.eq)(schema_1.snippetVersion.code, oldCode)));
            if (existing.length === 0) {
                const [{ maxVer }] = await db_1.default
                    .select({ maxVer: (0, drizzle_orm_1.sql) `max(${schema_1.snippetVersion.versionNumber})` })
                    .from(schema_1.snippetVersion)
                    .where((0, drizzle_orm_1.eq)(schema_1.snippetVersion.snippetId, snippetId));
                const nextVersion = (maxVer || 0) + 1;
                await db_1.default.insert(schema_1.snippetVersion).values({
                    snippetId,
                    code: oldCode,
                    versionNumber: nextVersion,
                    changeNote: req.body.change_note || null,
                });
            }
        }
        return res.status(200).json({ message: 'Snippet updated successfully' });
    }
    catch (error) {
        console.error('Error updating snippet:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/:id/versions', authMiddleware_1.default, snippets_1.snippetIdValidation, async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty())
        return res.status(400).json({ errors: errors.array() });
    try {
        const snippetId = parseInt(req.params.id);
        const snippets = await db_1.default
            .select({ id: schema_1.snippet.id })
            .from(schema_1.snippet)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.snippet.id, snippetId), (0, drizzle_orm_1.eq)(schema_1.snippet.userId, req.userId)));
        if (snippets.length === 0)
            return res.status(404).json({ error: 'Snippet not found' });
        const versions = await db_1.default
            .select({
            id: schema_1.snippetVersion.id,
            versionNumber: schema_1.snippetVersion.versionNumber,
            changeNote: schema_1.snippetVersion.changeNote,
            createdAt: schema_1.snippetVersion.createdAt,
        })
            .from(schema_1.snippetVersion)
            .where((0, drizzle_orm_1.eq)(schema_1.snippetVersion.snippetId, snippetId))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.snippetVersion.versionNumber));
        return res.status(200).json(versions.map((v) => ({
            id: v.id,
            version_number: v.versionNumber,
            change_note: v.changeNote,
            created_at: v.createdAt,
        })));
    }
    catch (error) {
        console.error('Error fetching versions:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/:id/versions/:versionId', authMiddleware_1.default, [...snippets_1.snippetIdValidation, ...snippets_1.versionIdValidation], async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty())
        return res.status(400).json({ errors: errors.array() });
    try {
        const snippetId = parseInt(req.params.id);
        const versionId = parseInt(req.params.versionId);
        const snippets = await db_1.default
            .select({ id: schema_1.snippet.id })
            .from(schema_1.snippet)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.snippet.id, snippetId), (0, drizzle_orm_1.eq)(schema_1.snippet.userId, req.userId)));
        if (snippets.length === 0)
            return res.status(404).json({ error: 'Snippet not found' });
        const versions = await db_1.default
            .select()
            .from(schema_1.snippetVersion)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.snippetVersion.id, versionId), (0, drizzle_orm_1.eq)(schema_1.snippetVersion.snippetId, snippetId)));
        if (versions.length === 0)
            return res.status(404).json({ error: 'Version not found' });
        return res.status(200).json(mapVersion(versions[0]));
    }
    catch (error) {
        console.error('Error fetching version:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
router.delete('/:id/versions/:versionId', authMiddleware_1.default, [...snippets_1.snippetIdValidation, ...snippets_1.versionIdValidation], async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty())
        return res.status(400).json({ errors: errors.array() });
    const snippetId = parseInt(req.params.id);
    const versionId = parseInt(req.params.versionId);
    try {
        const snippets = await db_1.default
            .select({ id: schema_1.snippet.id })
            .from(schema_1.snippet)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.snippet.id, snippetId), (0, drizzle_orm_1.eq)(schema_1.snippet.userId, req.userId)));
        if (snippets.length === 0)
            return res.status(404).json({ error: 'Snippet not found' });
        const result = await db_1.default
            .delete(schema_1.snippetVersion)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.snippetVersion.id, versionId), (0, drizzle_orm_1.eq)(schema_1.snippetVersion.snippetId, snippetId)))
            .returning({ id: schema_1.snippetVersion.id });
        if (result.length === 0)
            return res.status(404).json({ error: 'Version not found' });
        return res.status(204).send();
    }
    catch (error) {
        console.error('Error deleting version:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/:id/versions/:versionId/restore', authMiddleware_1.default, [...snippets_1.snippetIdValidation, ...snippets_1.versionIdValidation], async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty())
        return res.status(400).json({ errors: errors.array() });
    const snippetId = parseInt(req.params.id);
    const versionId = parseInt(req.params.versionId);
    try {
        const snippets = await db_1.default
            .select()
            .from(schema_1.snippet)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.snippet.id, snippetId), (0, drizzle_orm_1.eq)(schema_1.snippet.userId, req.userId)));
        if (snippets.length === 0)
            return res.status(404).json({ error: 'Snippet not found' });
        const currentSnippet = snippets[0];
        const versions = await db_1.default
            .select()
            .from(schema_1.snippetVersion)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.snippetVersion.id, versionId), (0, drizzle_orm_1.eq)(schema_1.snippetVersion.snippetId, snippetId)));
        if (versions.length === 0)
            return res.status(404).json({ error: 'Version not found' });
        const targetVersion = versions[0];
        if (currentSnippet.code !== targetVersion.code) {
            const existing = await db_1.default
                .select({ id: schema_1.snippetVersion.id })
                .from(schema_1.snippetVersion)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.snippetVersion.snippetId, snippetId), (0, drizzle_orm_1.eq)(schema_1.snippetVersion.code, currentSnippet.code)));
            if (existing.length === 0) {
                const [{ maxVer }] = await db_1.default
                    .select({ maxVer: (0, drizzle_orm_1.sql) `max(${schema_1.snippetVersion.versionNumber})` })
                    .from(schema_1.snippetVersion)
                    .where((0, drizzle_orm_1.eq)(schema_1.snippetVersion.snippetId, snippetId));
                const nextVersion = (maxVer || 0) + 1;
                await db_1.default.insert(schema_1.snippetVersion).values({
                    snippetId,
                    code: currentSnippet.code,
                    versionNumber: nextVersion,
                    changeNote: `Auto-save before restore to v${targetVersion.versionNumber}`,
                });
            }
            await db_1.default.update(schema_1.snippet).set({ code: targetVersion.code }).where((0, drizzle_orm_1.eq)(schema_1.snippet.id, snippetId));
        }
        const updated = await db_1.default
            .select(snippetWithTagsSelection)
            .from(schema_1.snippet)
            .leftJoin(schema_1.snippetTag, (0, drizzle_orm_1.eq)(schema_1.snippetTag.snippetId, schema_1.snippet.id))
            .leftJoin(schema_1.tag, (0, drizzle_orm_1.eq)(schema_1.tag.id, schema_1.snippetTag.tagId))
            .where((0, drizzle_orm_1.eq)(schema_1.snippet.id, snippetId))
            .groupBy(schema_1.snippet.id);
        return res.status(200).json(mapSnippetWithTags(updated[0]));
    }
    catch (error) {
        console.error('Error restoring version:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
