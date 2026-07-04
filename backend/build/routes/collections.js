"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = __importDefault(require("../lib/db"));
const schema_1 = require("../db/schema");
const authMiddleware_1 = __importDefault(require("../middleware/authMiddleware"));
const collections_1 = require("../validators/collections");
const router = (0, express_1.Router)();
router.get('/', authMiddleware_1.default, async (req, res) => {
    try {
        const collections = await db_1.default
            .select({
            id: schema_1.collection.id,
            name: schema_1.collection.name,
            description: schema_1.collection.description,
            createdAt: schema_1.collection.createdAt,
            snippetCount: (0, drizzle_orm_1.sql) `count(${schema_1.snippet.id})`,
        })
            .from(schema_1.collection)
            .leftJoin(schema_1.snippet, (0, drizzle_orm_1.eq)(schema_1.snippet.collectionId, schema_1.collection.id))
            .where((0, drizzle_orm_1.eq)(schema_1.collection.userId, req.userId))
            .groupBy(schema_1.collection.id)
            .orderBy((0, drizzle_orm_1.desc)(schema_1.collection.createdAt));
        return res.status(200).json(collections.map((c) => ({
            id: c.id,
            name: c.name,
            description: c.description,
            created_at: c.createdAt,
            snippet_count: Number(c.snippetCount),
        })));
    }
    catch (error) {
        console.error('Error fetching collections:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/', authMiddleware_1.default, collections_1.createCollectionValidation, async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { name, description } = req.body;
    try {
        const [created] = await db_1.default.insert(schema_1.collection).values({
            userId: req.userId,
            name,
            description: description ?? null,
        }).returning({ id: schema_1.collection.id });
        return res.status(201).json({
            id: created.id,
            name,
            description: description ?? null,
            message: 'Collection created successfully',
        });
    }
    catch (error) {
        console.error('Error creating collection:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
router.patch('/:id', authMiddleware_1.default, collections_1.updateCollectionValidation, async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const allowedFields = ['name', 'description'];
    const updates = {};
    for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
            updates[field] = req.body[field];
        }
    }
    if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No valid fields provided' });
    }
    try {
        const collectionId = parseInt(req.params.id);
        const result = await db_1.default
            .update(schema_1.collection)
            .set(updates)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.collection.id, collectionId), (0, drizzle_orm_1.eq)(schema_1.collection.userId, req.userId)))
            .returning({ id: schema_1.collection.id });
        if (result.length === 0) {
            return res.status(404).json({ error: 'Collection not found' });
        }
        return res.status(200).json({ message: 'Collection updated successfully' });
    }
    catch (error) {
        console.error('Error updating collection:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
router.delete('/:id', authMiddleware_1.default, collections_1.collectionIdValidation, async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const collectionId = parseInt(req.params.id);
        const result = await db_1.default
            .delete(schema_1.collection)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.collection.id, collectionId), (0, drizzle_orm_1.eq)(schema_1.collection.userId, req.userId)))
            .returning({ id: schema_1.collection.id });
        if (result.length === 0) {
            return res.status(404).json({ error: 'Collection not found' });
        }
        return res.status(200).json({ message: 'Collection deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting collection:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
router.patch('/:id/snippets/:snippetId', authMiddleware_1.default, collections_1.assignSnippetValidation, async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const collectionId = parseInt(req.params.id);
    const snippetId = parseInt(req.params.snippetId);
    try {
        const [foundCollection] = await db_1.default
            .select({ id: schema_1.collection.id })
            .from(schema_1.collection)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.collection.id, collectionId), (0, drizzle_orm_1.eq)(schema_1.collection.userId, req.userId)));
        if (!foundCollection) {
            return res.status(404).json({ error: 'Collection not found' });
        }
        const [foundSnippet] = await db_1.default
            .select({ id: schema_1.snippet.id })
            .from(schema_1.snippet)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.snippet.id, snippetId), (0, drizzle_orm_1.eq)(schema_1.snippet.userId, req.userId)));
        if (!foundSnippet) {
            return res.status(404).json({ error: 'Snippet not found' });
        }
        await db_1.default.update(schema_1.snippet).set({ collectionId }).where((0, drizzle_orm_1.eq)(schema_1.snippet.id, snippetId));
        return res.status(200).json({ message: 'Snippet assigned to collection' });
    }
    catch (error) {
        console.error('Error assigning snippet to collection:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
