import { Router, Request, Response } from 'express';
import { and, asc, eq, exists, inArray } from 'drizzle-orm';
import { validationResult } from 'express-validator';
import { users, workspace, workspaceMember } from '../db/schema';
import db from '../lib/db';
import authMiddleware from '../middleware/authMiddleware';
import { asyncHandler } from '../middleware/errorHandler';
import validateRequest from '../middleware/validateRequest';
import requireWorkspacePermission from '../middleware/requireWorkspacePermission';
import { workspaceRolesWithPermission } from '../permissions/workspacePermissions';
import {
    createWorkspaceValidation,
    updateWorkspaceMemberRoleValidation,
    updateWorkspaceValidation,
    workspaceIdValidation,
    workspaceMemberParamsValidation,
} from '../validators/workspace';

const router = Router();

router.get('/', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId;
    if (userId === undefined) return res.status(401).json({ error: 'Unauthorized' });

    const workspaces = await db
        .select({ id: workspace.id, name: workspace.name, created_at: workspace.createdAt, role: workspaceMember.role })
        .from(workspace)
        .innerJoin(workspaceMember, eq(workspaceMember.workspaceId, workspace.id))
        .where(eq(workspaceMember.userId, userId));
    return res.status(200).json(workspaces);
}));

router.post('/', authMiddleware, createWorkspaceValidation, asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const userId = req.userId;
    if (userId === undefined) return res.status(401).json({ error: 'Unauthorized' });

    const created = await db.transaction(async (tx) => {
        const [newWorkspace] = await tx.insert(workspace).values({ name: req.body.name }).returning();
        await tx.insert(workspaceMember).values({ workspaceId: newWorkspace.id, userId, role: 'owner' });
        return newWorkspace;
    });
    return res.status(201).json({ id: created.id, name: created.name, created_at: created.createdAt, role: 'owner' });
}));

router.patch('/:workspaceId', authMiddleware, updateWorkspaceValidation, validateRequest, requireWorkspacePermission('update'), asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const userId = req.userId as number;
    const workspaceId = Number(req.params.workspaceId);
    const [updatedWorkspace] = await db.update(workspace).set({ name: req.body.name }).where(and(
        eq(workspace.id, workspaceId),
        exists(db.select({ userId: workspaceMember.userId }).from(workspaceMember).where(and(
            eq(workspaceMember.workspaceId, workspace.id),
            eq(workspaceMember.userId, userId),
            inArray(workspaceMember.role, workspaceRolesWithPermission('update')),
        ))),
    )).returning();
    if (!updatedWorkspace) return res.status(404).json({ error: 'Workspace not found' });
    return res.status(200).json({ id: updatedWorkspace.id, name: updatedWorkspace.name, created_at: updatedWorkspace.createdAt, role: res.locals.workspaceMembership.role });
}));

router.delete('/:workspaceId', authMiddleware, workspaceIdValidation, validateRequest, requireWorkspacePermission('delete'), asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const userId = req.userId as number;
    const workspaceId = Number(req.params.workspaceId);
    const [deletedWorkspace] = await db.delete(workspace).where(and(
        eq(workspace.id, workspaceId),
        exists(db.select({ userId: workspaceMember.userId }).from(workspaceMember).where(and(
            eq(workspaceMember.workspaceId, workspace.id),
            eq(workspaceMember.userId, userId),
            inArray(workspaceMember.role, workspaceRolesWithPermission('delete')),
        ))),
    )).returning({ id: workspace.id });
    if (!deletedWorkspace) return res.status(404).json({ error: 'Workspace not found' });
    return res.status(200).json({ message: 'Workspace deleted successfully' });
}));

router.get('/:workspaceId/members', authMiddleware, workspaceIdValidation, validateRequest, requireWorkspacePermission('read'), asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const members = await db.select({
        user_id: workspaceMember.userId,
        username: users.username,
        display_name: users.displayName,
        avatar_url: users.avatarUrl,
        role: workspaceMember.role,
        joined_at: workspaceMember.joinedAt,
    }).from(workspaceMember).innerJoin(users, eq(users.id, workspaceMember.userId))
        .where(eq(workspaceMember.workspaceId, Number(req.params.workspaceId)))
        .orderBy(asc(workspaceMember.joinedAt));
    return res.status(200).json(members);
}));

router.patch('/:workspaceId/members/:userId', authMiddleware, updateWorkspaceMemberRoleValidation, validateRequest, requireWorkspacePermission('manageMembers'), asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const workspaceId = Number(req.params.workspaceId);
    const targetUserId = Number(req.params.userId);
    const [target] = await db.select({ role: workspaceMember.role }).from(workspaceMember)
        .where(and(eq(workspaceMember.workspaceId, workspaceId), eq(workspaceMember.userId, targetUserId))).limit(1);
    if (!target) return res.status(404).json({ error: 'Workspace member not found' });
    if (target.role === 'owner') return res.status(409).json({ error: 'Workspace owner role cannot be changed' });
    const [updated] = await db.update(workspaceMember).set({ role: req.body.role }).where(and(
        eq(workspaceMember.workspaceId, workspaceId),
        eq(workspaceMember.userId, targetUserId),
        inArray(workspaceMember.role, ['editor', 'viewer']),
    )).returning();
    if (!updated) return res.status(409).json({ error: 'Workspace member role changed concurrently' });
    return res.status(200).json({ workspace_id: updated.workspaceId, user_id: updated.userId, role: updated.role, joined_at: updated.joinedAt });
}));

router.delete('/:workspaceId/members/:userId', authMiddleware, workspaceMemberParamsValidation, validateRequest, requireWorkspacePermission('manageMembers'), asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const workspaceId = Number(req.params.workspaceId);
    const targetUserId = Number(req.params.userId);
    const [target] = await db.select({ role: workspaceMember.role }).from(workspaceMember)
        .where(and(eq(workspaceMember.workspaceId, workspaceId), eq(workspaceMember.userId, targetUserId))).limit(1);
    if (!target) return res.status(404).json({ error: 'Workspace member not found' });
    if (target.role === 'owner') return res.status(409).json({ error: 'Workspace owner cannot be removed' });
    const [deleted] = await db.delete(workspaceMember).where(and(
        eq(workspaceMember.workspaceId, workspaceId),
        eq(workspaceMember.userId, targetUserId),
        inArray(workspaceMember.role, ['editor', 'viewer']),
    )).returning({ userId: workspaceMember.userId });
    if (!deleted) return res.status(409).json({ error: 'Workspace member changed concurrently' });
    return res.status(200).json({ message: 'Workspace member removed successfully' });
}));

export default router;
