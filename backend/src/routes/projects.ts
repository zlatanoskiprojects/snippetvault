import { Router, Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { and, desc, eq, exists, inArray } from 'drizzle-orm';
import db from '../lib/db';
import { project, workspaceMember } from '../db/schema';
import authMiddleware from '../middleware/authMiddleware';
import requireProjectPermission from '../middleware/requireProjectPermission';
import requireWorkspacePermission from '../middleware/requireWorkspacePermission';
import { asyncHandler } from '../middleware/errorHandler';
import validateRequest from '../middleware/validateRequest';
import {
    projectIdValidation,
    createProjectValidation,
    updateProjectValidation,
    listProjectsValidation,
} from '../validators/projects';
import { projectRolesWithPermission } from '../permissions/projectPermissions';

const router = Router();

interface ProjectUpdateFields {
    name?: string;
    description?: string | null;
}

router.get('/workspaces/:workspaceId/projects', authMiddleware, listProjectsValidation, validateRequest, requireWorkspacePermission('read'), asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const workspaceId = Number(req.params.workspaceId);
    const role = res.locals.workspaceMembership.role;
    const projects = await db
        .select({
            id: project.id,
            workspaceId: project.workspaceId,
            name: project.name,
            description: project.description,
        })
        .from(project)
        .where(eq(project.workspaceId, workspaceId))
        .orderBy(desc(project.createdAt));

    return res.status(200).json(projects.map((item) => ({
        id: item.id,
        workspace_id: item.workspaceId,
        name: item.name,
        description: item.description,
        role,
    })));
}));

router.post('/workspaces/:workspaceId/projects', authMiddleware, listProjectsValidation, createProjectValidation, validateRequest, requireWorkspacePermission('createProject'), asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const workspaceId = Number(req.params.workspaceId);
    const [created] = await db
        .insert(project)
        .values({
            workspaceId,
            userId: req.userId as number,
            name: req.body.name,
            description: req.body.description ?? null,
        })
        .returning();

    return res.status(201).json({
        id: created.id,
        workspace_id: created.workspaceId,
        name: created.name,
        description: created.description,
        role: res.locals.workspaceMembership.role,
    });
}));

router.patch('/projects/:projectId', authMiddleware, updateProjectValidation, validateRequest, requireProjectPermission('update'), asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const projectId = Number(req.params.projectId);
    const workspaceId = res.locals.projectAuthorization.workspaceId as number;
    const roles = projectRolesWithPermission('update');
    const updates: ProjectUpdateFields = {};
    if (req.body.name !== undefined) updates.name = req.body.name;
    if (req.body.description !== undefined) updates.description = req.body.description;

    const [updated] = await db
        .update(project)
        .set(updates)
        .where(and(
            eq(project.id, projectId),
            eq(project.workspaceId, workspaceId),
            exists(db
                .select({ userId: workspaceMember.userId })
                .from(workspaceMember)
                .where(and(
                    eq(workspaceMember.workspaceId, project.workspaceId),
                    eq(workspaceMember.userId, req.userId as number),
                    inArray(workspaceMember.role, roles),
                ))),
        ))
        .returning();
    if (!updated) return res.status(404).json({ error: 'Project not found' });

    return res.status(200).json({
        id: updated.id,
        workspace_id: updated.workspaceId,
        name: updated.name,
        description: updated.description,
        role: res.locals.projectAuthorization.membership.role,
    });
}));

router.delete('/projects/:projectId', authMiddleware, projectIdValidation, validateRequest, requireProjectPermission('delete'), asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const projectId = Number(req.params.projectId);
    const workspaceId = res.locals.projectAuthorization.workspaceId as number;
    const roles = projectRolesWithPermission('delete');
    const [deleted] = await db
        .delete(project)
        .where(and(
            eq(project.id, projectId),
            eq(project.workspaceId, workspaceId),
            exists(db
                .select({ userId: workspaceMember.userId })
                .from(workspaceMember)
                .where(and(
                    eq(workspaceMember.workspaceId, project.workspaceId),
                    eq(workspaceMember.userId, req.userId as number),
                    inArray(workspaceMember.role, roles),
                ))),
        ))
        .returning({ id: project.id });
    if (!deleted) return res.status(404).json({ error: 'Project not found' });

    return res.status(200).json({ message: 'Project deleted successfully' });
}));

export default router;
