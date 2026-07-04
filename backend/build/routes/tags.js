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
const tags_1 = require("../validators/tags");
const router = (0, express_1.Router)();
router.get('/', authMiddleware_1.default, async (req, res) => {
    try {
        const tags = await db_1.default.select().from(schema_1.tag);
        return res.status(200).json(tags);
    }
    catch (error) {
        console.log('Error fetching tags:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/:id', authMiddleware_1.default, tags_1.tagIdValidation, async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const tagId = parseInt(req.params.id);
        const rows = await db_1.default.select().from(schema_1.tag).where((0, drizzle_orm_1.eq)(schema_1.tag.id, tagId));
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Tag not found' });
        }
        return res.status(200).json(rows[0]);
    }
    catch (error) {
        console.log('Error fetching tag:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/:id/snippets', authMiddleware_1.default, tags_1.tagIdValidation, async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const tagId = parseInt(req.params.id);
        const rows = await db_1.default
            .select({
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
        })
            .from(schema_1.snippet)
            .innerJoin(schema_1.snippetTag, (0, drizzle_orm_1.eq)(schema_1.snippetTag.snippetId, schema_1.snippet.id))
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.snippetTag.tagId, tagId), (0, drizzle_orm_1.eq)(schema_1.snippet.userId, req.userId)));
        return res.status(200).json(rows.map((s) => ({
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
        })));
    }
    catch (err) {
        console.log('Error fetching snippets by tag:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/', authMiddleware_1.default, tags_1.createTagValidation, async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { name } = req.body;
    try {
        const existing = await db_1.default.select({ id: schema_1.tag.id }).from(schema_1.tag).where((0, drizzle_orm_1.eq)(schema_1.tag.name, name));
        if (existing.length > 0) {
            return res.status(409).json({ error: 'Tag name already exists' });
        }
        const [created] = await db_1.default.insert(schema_1.tag).values({ name }).returning({ id: schema_1.tag.id });
        return res.status(201).json({ id: created.id, name, message: 'Tag created successfully' });
    }
    catch (error) {
        console.log('Error creating tag:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/:id/snippets/:snippetId', authMiddleware_1.default, tags_1.tagSnippetValidation, async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const tagId = parseInt(req.params.id);
        const snippetId = parseInt(req.params.snippetId);
        const foundSnippet = await db_1.default
            .select({ id: schema_1.snippet.id })
            .from(schema_1.snippet)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.snippet.id, snippetId), (0, drizzle_orm_1.eq)(schema_1.snippet.userId, req.userId)));
        if (foundSnippet.length === 0) {
            return res.status(404).json({ error: 'Snippet not found or not yours' });
        }
        const existing = await db_1.default
            .select()
            .from(schema_1.snippetTag)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.snippetTag.snippetId, snippetId), (0, drizzle_orm_1.eq)(schema_1.snippetTag.tagId, tagId)));
        if (existing.length > 0) {
            return res.status(409).json({ error: 'Tag already assigned to this snippet' });
        }
        await db_1.default.insert(schema_1.snippetTag).values({ snippetId, tagId });
        return res.status(201).json({ message: 'Tag assigned to snippet successfully' });
    }
    catch (error) {
        console.log('Error assigning tag to snippet:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
router.delete('/:id/snippets/:snippetId', authMiddleware_1.default, tags_1.tagSnippetValidation, async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const tagId = parseInt(req.params.id);
        const snippetId = parseInt(req.params.snippetId);
        const foundSnippet = await db_1.default
            .select({ id: schema_1.snippet.id })
            .from(schema_1.snippet)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.snippet.id, snippetId), (0, drizzle_orm_1.eq)(schema_1.snippet.userId, req.userId)));
        if (foundSnippet.length === 0) {
            return res.status(404).json({ error: 'Snippet not found or not yours' });
        }
        const result = await db_1.default
            .delete(schema_1.snippetTag)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.snippetTag.snippetId, snippetId), (0, drizzle_orm_1.eq)(schema_1.snippetTag.tagId, tagId)))
            .returning({ snippetId: schema_1.snippetTag.snippetId });
        if (result.length === 0) {
            return res.status(404).json({ error: 'Tag not assigned to this snippet' });
        }
        await db_1.default.delete(schema_1.tag).where((0, drizzle_orm_1.sql) `${schema_1.tag.id} NOT IN (SELECT ${schema_1.snippetTag.tagId} FROM ${schema_1.snippetTag})`);
        return res.status(200).json({ message: 'Tag removed from snippet successfully' });
    }
    catch (error) {
        console.log('Error removing tag from snippet:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
