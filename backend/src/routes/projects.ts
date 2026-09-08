import { Router, Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { and, desc, eq, sql } from 'drizzle-orm';
import db from '../lib/db';
import { project, projectMember, snippet } from '../db/schema';
import authMiddleware from '../middleware/authMiddleware';
import { asyncHandler } from '../middleware/errorHandler';
import {
    projectIdValidation,
    createProjectValidation,
    updateProjectValidation,
    assignSnippetValidation,
} from '../validators/projects';

const router = Router();

interface ProjectUpdateFields {
    name?: string;
    description?: string | null;
}

router.get('/', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
    try {
        const projects = await db
            .select({
                id: project.id,
                name: project.name,
                description: project.description,
                createdAt: project.createdAt,
                snippetCount: sql<number>`count(${snippet.id})`,
            })
            .from(project)
            .leftJoin(snippet, eq(snippet.projectId, project.id))
            .where(eq(project.userId, req.userId as number))
            .groupBy(project.id)
            .orderBy(desc(project.createdAt));

        return res.status(200).json(projects.map((p) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            created_at: p.createdAt,
            snippet_count: Number(p.snippetCount),
        })));
    } catch (error) {
        console.error('Error fetching projects:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}));

router.post('/', authMiddleware, createProjectValidation, asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { name, description } = req.body;

    try {
        const created = await db.transaction(async (tx) => {
            const [newProject] = await tx.insert(project).values({
                userId: req.userId as number,
                name,
                description: description ?? null,
            }).returning({ id: project.id });
            await tx.insert(projectMember).values({
                projectId: newProject.id,
                userId: req.userId as number,
                role: 'owner',
            });
            return newProject;
        });

        return res.status(201).json({
            id: created.id,
            name,
            description: description ?? null,
            message: 'Project created successfully',
        });
    } catch (error) {
        console.error('Error creating project:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}));

router.patch('/:id', authMiddleware, updateProjectValidation, asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const allowedFields: (keyof ProjectUpdateFields)[] = ['name', 'description'];
    const updates: ProjectUpdateFields = {};
    for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
            (updates as Record<string, unknown>)[field] = req.body[field];
        }
    }

    if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No valid fields provided' });
    }

    try {
        const projectId = parseInt(req.params.id as string);
        const result = await db
            .update(project)
            .set(updates)
            .where(and(eq(project.id, projectId), eq(project.userId, req.userId as number)))
            .returning({ id: project.id });

        if (result.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }
        return res.status(200).json({ message: 'Project updated successfully' });
    } catch (error) {
        console.error('Error updating project:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}));

router.delete('/:id', authMiddleware, projectIdValidation, asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const projectId = parseInt(req.params.id as string);
        const result = await db
            .delete(project)
            .where(and(eq(project.id, projectId), eq(project.userId, req.userId as number)))
            .returning({ id: project.id });
        if (result.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }
        return res.status(200).json({ message: 'Project deleted successfully' });
    } catch (error) {
        console.error('Error deleting project:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}));

router.patch('/:id/snippets/:snippetId', authMiddleware, assignSnippetValidation, asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const projectId = parseInt(req.params.id as string);
    const snippetId = parseInt(req.params.snippetId as string);
    try {
        const [foundProject] = await db
            .select({ id: project.id })
            .from(project)
            .where(and(eq(project.id, projectId), eq(project.userId, req.userId as number)));
        if (!foundProject) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const [foundSnippet] = await db
            .select({ id: snippet.id })
            .from(snippet)
            .where(and(eq(snippet.id, snippetId), eq(snippet.userId, req.userId as number)));
        if (!foundSnippet) {
            return res.status(404).json({ error: 'Snippet not found' });
        }

        await db.update(snippet).set({ projectId }).where(eq(snippet.id, snippetId));
        return res.status(200).json({ message: 'Snippet assigned to project' });
    } catch (error) {
        console.error('Error assigning snippet to project:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}));

export default router;
