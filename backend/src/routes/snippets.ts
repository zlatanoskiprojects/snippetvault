import { Router, Request, Response } from 'express';
import { and, desc, eq, ilike, or, sql } from 'drizzle-orm';
import db from '../lib/db';
import { snippet, snippetTag, tag, snippetVersion, collection } from '../db/schema';
import authMiddleware from '../middleware/authMiddleware';
import { validationResult } from 'express-validator';
import { snippetIdValidation, createSnippetValidation, updateSnippetValidation, versionIdValidation } from '../validators/snippets';

const router = Router();

const snippetWithTagsSelection = {
    id: snippet.id,
    userId: snippet.userId,
    collectionId: snippet.collectionId,
    title: snippet.title,
    description: snippet.description,
    code: snippet.code,
    language: snippet.language,
    visibility: snippet.visibility,
    shareToken: snippet.shareToken,
    createdAt: snippet.createdAt,
    updatedAt: snippet.updatedAt,
    tags: sql<string | null>`string_agg(${tag.name}, ',')`,
};

type SnippetWithTagsResult = {
    id: number;
    userId: number;
    collectionId: number | null;
    title: string;
    description: string | null;
    code: string;
    language: string;
    visibility: string;
    shareToken: string | null;
    createdAt: Date;
    updatedAt: Date;
    tags: string | null;
};

const mapSnippetWithTags = (s: SnippetWithTagsResult) => ({
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

const mapSnippet = (s: typeof snippet.$inferSelect) => ({
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

const mapVersion = (v: typeof snippetVersion.$inferSelect) => ({
    id: v.id,
    snippet_id: v.snippetId,
    code: v.code,
    version_number: v.versionNumber,
    change_note: v.changeNote,
    created_at: v.createdAt,
});

router.get('/', authMiddleware, async (req: Request, res: Response) => {

    try {
        const userId = req.userId as number;
        const q = req.query.q as string | undefined;

        const whereClause = q
            ? and(
                eq(snippet.userId, userId),
                or(
                    ilike(snippet.title, `%${q}%`),
                    ilike(snippet.language, `%${q}%`),
                    ilike(snippet.description, `%${q}%`),
                    ilike(tag.name, `%${q}%`),
                    ilike(snippet.code, `%${q}%`),
                ),
            )
            : eq(snippet.userId, userId);

        const snippets = await db
            .select(snippetWithTagsSelection)
            .from(snippet)
            .leftJoin(snippetTag, eq(snippetTag.snippetId, snippet.id))
            .leftJoin(tag, eq(tag.id, snippetTag.tagId))
            .where(whereClause)
            .groupBy(snippet.id)
            .orderBy(desc(snippet.createdAt));

        const result = snippets.map(mapSnippetWithTags);

        return res.status(200).json(result);
    } catch (error) {
        console.log("Error fetching snippets:", error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/:id', authMiddleware, snippetIdValidation, async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const snippetId = parseInt(req.params.id as string);
        const rows = await db
            .select(snippetWithTagsSelection)
            .from(snippet)
            .leftJoin(snippetTag, eq(snippetTag.snippetId, snippet.id))
            .leftJoin(tag, eq(tag.id, snippetTag.tagId))
            .where(and(eq(snippet.id, snippetId), eq(snippet.userId, req.userId as number)))
            .groupBy(snippet.id);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Snippet not found' });
        }
        return res.status(200).json(mapSnippetWithTags(rows[0]));
    } catch (error) {
        console.log("Error fetching snippet", error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/', authMiddleware, createSnippetValidation, async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, code, language, visibility, collection_id } = req.body;

    try {
        if(collection_id !== undefined && collection_id !== null){
            const cols = await db.select({id: collection.id}).from(collection).where(and(eq(collection.id,collection_id),eq(collection.userId,req.userId as number)))
            if(cols.length === 0 ){
                return res.status(403).json({error: 'Collection not found or not yours'})
            }
        }



        const [created] = await db.insert(snippet).values({
            userId: req.userId as number,
            title,
            description: description || null,
            code,
            language,
            visibility: visibility || 'private',
            collectionId: collection_id ?? null,
        }).returning();
        return res.status(201).json(mapSnippet(created));
    } catch (error) {
        console.log("Error creating snippet", error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete('/:id', authMiddleware, snippetIdValidation, async (req: Request, res: Response) => {
    const err = validationResult(req);
    if (!err.isEmpty()) {
        return res.status(400).json({ errors: err.array() });
    }
    try {
        const snippetId = parseInt(req.params.id as string);
        const deleted = await db
            .delete(snippet)
            .where(and(eq(snippet.id, snippetId), eq(snippet.userId, req.userId as number)))
            .returning({ id: snippet.id });

        if (deleted.length === 0) {
            return res.status(404).json({ error: 'Snippet not found' });
        }

        return res.status(200).json({ message: 'Snippet deleted successfully' });
    } catch (error) {
        console.log("Error deleting snippet", error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

interface SnippetUpdateFields {
    title?: string;
    description?: string | null;
    code?: string;
    language?: string;
    visibility?: string;
    collectionId?: number | null;
}

router.patch('/:id', authMiddleware, updateSnippetValidation, async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const snippetId = parseInt(req.params.id as string);

    const fieldMap: Record<string, keyof SnippetUpdateFields> = {
        title: 'title',
        description: 'description',
        code: 'code',
        language: 'language',
        visibility: 'visibility',
        collection_id: 'collectionId',
    };
    const updates: SnippetUpdateFields = {};
    for (const bodyField of Object.keys(fieldMap)) {
        if (req.body[bodyField] !== undefined) {
            (updates as Record<string, unknown>)[fieldMap[bodyField]] = req.body[bodyField];
        }
    }

    if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No valid fields provided' });
    }

    try {
        if (updates.collectionId !== undefined && updates.collectionId !== null) {
            const cols = await db
                .select({ id: collection.id })
                .from(collection)
                .where(and(eq(collection.id, updates.collectionId), eq(collection.userId, req.userId as number)));
            if (cols.length === 0) {
                return res.status(403).json({ error: 'Collection not found or not yours' });
            }
        }

        let shouldSaveVersion = false;
        let oldCode: string | null = null;
        if (updates.code !== undefined) {
            const current = await db
                .select({ code: snippet.code })
                .from(snippet)
                .where(and(eq(snippet.id, snippetId), eq(snippet.userId, req.userId as number)));
            if (current.length > 0 && current[0].code !== updates.code) {
                shouldSaveVersion = true;
                oldCode = current[0].code;
            }
        }

        const result = await db
            .update(snippet)
            .set(updates)
            .where(and(eq(snippet.id, snippetId), eq(snippet.userId, req.userId as number)))
            .returning({ id: snippet.id });

        if (result.length === 0) {
            return res.status(404).json({ error: 'Snippet not found' });
        }

        if (shouldSaveVersion && oldCode !== null) {
            const existing = await db
                .select({ id: snippetVersion.id })
                .from(snippetVersion)
                .where(and(eq(snippetVersion.snippetId, snippetId), eq(snippetVersion.code, oldCode)));
            if (existing.length === 0) {
                const [{ maxVer }] = await db
                    .select({ maxVer: sql<number | null>`max(${snippetVersion.versionNumber})` })
                    .from(snippetVersion)
                    .where(eq(snippetVersion.snippetId, snippetId));
                const nextVersion = (maxVer || 0) + 1;
                await db.insert(snippetVersion).values({
                    snippetId,
                    code: oldCode,
                    versionNumber: nextVersion,
                    changeNote: req.body.change_note || null,
                });
            }
        }

        return res.status(200).json({ message: 'Snippet updated successfully' });

    } catch (error) {
        console.error('Error updating snippet:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/:id/versions', authMiddleware, snippetIdValidation, async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
        const snippetId = parseInt(req.params.id as string);
        const snippets = await db
            .select({ id: snippet.id })
            .from(snippet)
            .where(and(eq(snippet.id, snippetId), eq(snippet.userId, req.userId as number)));
        if (snippets.length === 0) return res.status(404).json({ error: 'Snippet not found' });

        const versions = await db
            .select({
                id: snippetVersion.id,
                versionNumber: snippetVersion.versionNumber,
                changeNote: snippetVersion.changeNote,
                createdAt: snippetVersion.createdAt,
            })
            .from(snippetVersion)
            .where(eq(snippetVersion.snippetId, snippetId))
            .orderBy(desc(snippetVersion.versionNumber));

        return res.status(200).json(versions.map((v) => ({
            id: v.id,
            version_number: v.versionNumber,
            change_note: v.changeNote,
            created_at: v.createdAt,
        })));
    } catch (error) {
        console.error('Error fetching versions:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/:id/versions/:versionId', authMiddleware, [...snippetIdValidation, ...versionIdValidation], async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
        const snippetId = parseInt(req.params.id as string);
        const versionId = parseInt(req.params.versionId as string);

        const snippets = await db
            .select({ id: snippet.id })
            .from(snippet)
            .where(and(eq(snippet.id, snippetId), eq(snippet.userId, req.userId as number)));
        if (snippets.length === 0) return res.status(404).json({ error: 'Snippet not found' });

        const versions = await db
            .select()
            .from(snippetVersion)
            .where(and(eq(snippetVersion.id, versionId), eq(snippetVersion.snippetId, snippetId)));
        if (versions.length === 0) return res.status(404).json({ error: 'Version not found' });

        return res.status(200).json(mapVersion(versions[0]));
    } catch (error) {
        console.error('Error fetching version:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete('/:id/versions/:versionId', authMiddleware, [...snippetIdValidation, ...versionIdValidation], async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const snippetId = parseInt(req.params.id as string);
    const versionId = parseInt(req.params.versionId as string);

    try {
        const snippets = await db
            .select({ id: snippet.id })
            .from(snippet)
            .where(and(eq(snippet.id, snippetId), eq(snippet.userId, req.userId as number)));
        if (snippets.length === 0) return res.status(404).json({ error: 'Snippet not found' });

        const result = await db
            .delete(snippetVersion)
            .where(and(eq(snippetVersion.id, versionId), eq(snippetVersion.snippetId, snippetId)))
            .returning({ id: snippetVersion.id });
        if (result.length === 0) return res.status(404).json({ error: 'Version not found' });

        return res.status(204).send();
    } catch (error) {
        console.error('Error deleting version:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/:id/versions/:versionId/restore', authMiddleware, [...snippetIdValidation, ...versionIdValidation], async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const snippetId = parseInt(req.params.id as string);
    const versionId = parseInt(req.params.versionId as string);

    try {
        const snippets = await db
            .select()
            .from(snippet)
            .where(and(eq(snippet.id, snippetId), eq(snippet.userId, req.userId as number)));
        if (snippets.length === 0) return res.status(404).json({ error: 'Snippet not found' });

        const currentSnippet = snippets[0];

        const versions = await db
            .select()
            .from(snippetVersion)
            .where(and(eq(snippetVersion.id, versionId), eq(snippetVersion.snippetId, snippetId)));
        if (versions.length === 0) return res.status(404).json({ error: 'Version not found' });

        const targetVersion = versions[0];

        if (currentSnippet.code !== targetVersion.code) {
            const existing = await db
                .select({ id: snippetVersion.id })
                .from(snippetVersion)
                .where(and(eq(snippetVersion.snippetId, snippetId), eq(snippetVersion.code, currentSnippet.code)));
            if (existing.length === 0) {
                const [{ maxVer }] = await db
                    .select({ maxVer: sql<number | null>`max(${snippetVersion.versionNumber})` })
                    .from(snippetVersion)
                    .where(eq(snippetVersion.snippetId, snippetId));
                const nextVersion = (maxVer || 0) + 1;
                await db.insert(snippetVersion).values({
                    snippetId,
                    code: currentSnippet.code,
                    versionNumber: nextVersion,
                    changeNote: `Auto-save before restore to v${targetVersion.versionNumber}`,
                });
            }

            await db.update(snippet).set({ code: targetVersion.code }).where(eq(snippet.id, snippetId));
        }

        const updated = await db
            .select(snippetWithTagsSelection)
            .from(snippet)
            .leftJoin(snippetTag, eq(snippetTag.snippetId, snippet.id))
            .leftJoin(tag, eq(tag.id, snippetTag.tagId))
            .where(eq(snippet.id, snippetId))
            .groupBy(snippet.id);

        return res.status(200).json(mapSnippetWithTags(updated[0]));
    } catch (error) {
        console.error('Error restoring version:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
