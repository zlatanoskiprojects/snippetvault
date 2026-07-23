import { Router, Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { and, desc, eq, sql } from 'drizzle-orm';
import db from '../lib/db';
import { collection, snippet } from '../db/schema';
import authMiddleware from '../middleware/authMiddleware';
import { asyncHandler } from '../middleware/errorHandler';
import {
    collectionIdValidation,
    createCollectionValidation,
    updateCollectionValidation,
    assignSnippetValidation,
} from '../validators/collections';

const router = Router();

interface CollectionUpdateFields {
    name?: string;
    description?: string | null;
}

router.get('/', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
    try {
        const collections = await db
            .select({
                id: collection.id,
                name: collection.name,
                description: collection.description,
                createdAt: collection.createdAt,
                snippetCount: sql<number>`count(${snippet.id})`,
            })
            .from(collection)
            .leftJoin(snippet, eq(snippet.collectionId, collection.id))
            .where(eq(collection.userId, req.userId as number))
            .groupBy(collection.id)
            .orderBy(desc(collection.createdAt));

        return res.status(200).json(collections.map((c) => ({
            id: c.id,
            name: c.name,
            description: c.description,
            created_at: c.createdAt,
            snippet_count: Number(c.snippetCount),
        })));
    } catch (error) {
        console.error('Error fetching collections:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}));

router.post('/', authMiddleware, createCollectionValidation, asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { name, description } = req.body;

    try {
        const [created] = await db.insert(collection).values({
            userId: req.userId as number,
            name,
            description: description ?? null,
        }).returning({ id: collection.id });

        return res.status(201).json({
            id: created.id,
            name,
            description: description ?? null,
            message: 'Collection created successfully',
        });
    } catch (error) {
        console.error('Error creating collection:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}));

router.patch('/:id', authMiddleware, updateCollectionValidation, asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const allowedFields: (keyof CollectionUpdateFields)[] = ['name', 'description'];
    const updates: CollectionUpdateFields = {};
    for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
            (updates as Record<string, unknown>)[field] = req.body[field];
        }
    }

    if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No valid fields provided' });
    }

    try {
        const collectionId = parseInt(req.params.id as string);
        const result = await db
            .update(collection)
            .set(updates)
            .where(and(eq(collection.id, collectionId), eq(collection.userId, req.userId as number)))
            .returning({ id: collection.id });

        if (result.length === 0) {
            return res.status(404).json({ error: 'Collection not found' });
        }
        return res.status(200).json({ message: 'Collection updated successfully' });
    } catch (error) {
        console.error('Error updating collection:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}));

router.delete('/:id', authMiddleware, collectionIdValidation, asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const collectionId = parseInt(req.params.id as string);
        const result = await db
            .delete(collection)
            .where(and(eq(collection.id, collectionId), eq(collection.userId, req.userId as number)))
            .returning({ id: collection.id });
        if (result.length === 0) {
            return res.status(404).json({ error: 'Collection not found' });
        }
        return res.status(200).json({ message: 'Collection deleted successfully' });
    } catch (error) {
        console.error('Error deleting collection:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}));

router.patch('/:id/snippets/:snippetId', authMiddleware, assignSnippetValidation, asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const collectionId = parseInt(req.params.id as string);
    const snippetId = parseInt(req.params.snippetId as string);
    try {
        const [foundCollection] = await db
            .select({ id: collection.id })
            .from(collection)
            .where(and(eq(collection.id, collectionId), eq(collection.userId, req.userId as number)));
        if (!foundCollection) {
            return res.status(404).json({ error: 'Collection not found' });
        }

        const [foundSnippet] = await db
            .select({ id: snippet.id })
            .from(snippet)
            .where(and(eq(snippet.id, snippetId), eq(snippet.userId, req.userId as number)));
        if (!foundSnippet) {
            return res.status(404).json({ error: 'Snippet not found' });
        }

        await db.update(snippet).set({ collectionId }).where(eq(snippet.id, snippetId));
        return res.status(200).json({ message: 'Snippet assigned to collection' });
    } catch (error) {
        console.error('Error assigning snippet to collection:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}));

export default router;
