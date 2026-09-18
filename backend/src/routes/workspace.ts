import { Router, Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler';
import  authMiddleware from '../middleware/authMiddleware';
import  db  from '../lib/db';
import { workspace, workspaceMember } from '../db/schema';
import { and, eq, exists } from 'drizzle-orm';
import {
    workspaceIdValidation,
    workspaceMemberParamsValidation,
    createWorkspaceValidation,
    updateWorkspaceValidation,
    updateWorkspaceMemberRoleValidation,
} from '../validators/workspace';
import getWorkspaceMembership from '../lib/workspaceMembership';

const router = Router();

router.get('/', authMiddleware, asyncHandler(async (req: Request, res: Response) => {

    const userId = req.userId;
    if(userId === undefined) {
        return res.status(401).json({ error: 'Unauthorized' }); 
    }

    const workspaces = await db.select(  { 
            id: workspace.id,
            name: workspace.name,
            created_at: workspace.createdAt,
            role: workspaceMember.role,
        }).from(workspace).innerJoin(workspaceMember,  eq(workspaceMember.workspaceId, workspace.id),)
        .where(eq(workspaceMember.userId, userId));
        
        
        return res.status(200).json(workspaces);

    }));

   
router.post('/', authMiddleware, createWorkspaceValidation, asyncHandler(async (req: Request, res: Response) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.userId;
    if(userId === undefined) {
        return res.status(401).json({ error: 'Unauthorized' }); 
    }

    const { name } = req.body;
    
    const created = await db.transaction(async (tx) => {
        const [newWorkspace] = await tx.insert(workspace).values({ name }).returning();
        await tx.insert(workspaceMember).values({
            workspaceId: newWorkspace.id,
            userId,
            role: 'owner',
        });
        return newWorkspace;
    });

    return res.status(201).json({
        id: created.id,
        name: created.name,
        created_at: created.createdAt,
        role: 'owner',
    });
}));



router.patch('/:workspaceId', authMiddleware, updateWorkspaceValidation, asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.userId;
    if (userId === undefined) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const workspaceId = Number(req.params.workspaceId);
    const membership = await getWorkspaceMembership(workspaceId, userId);
    if (!membership) {
        return res.status(404).json({ error: 'Workspace not found' });
    }
    if (membership.role !== 'owner') {
        return res.status(403).json({ error: 'Forbidden' });
    }

    const [updatedWorkspace] = await db
        .update(workspace)
        .set({ name: req.body.name })
        .where(and(
            eq(workspace.id, workspaceId),
            exists(db.select({ userId: workspaceMember.userId })
                .from(workspaceMember)
                .where(and(
                    eq(workspaceMember.workspaceId, workspace.id),
                    eq(workspaceMember.userId, userId),
                    eq(workspaceMember.role, 'owner'),
                ))),
        ))
        .returning();

    if (!updatedWorkspace) {
        return res.status(404).json({ error: 'Workspace not found' });
    }

    return res.status(200).json({
        id: updatedWorkspace.id,
        name: updatedWorkspace.name,
        created_at: updatedWorkspace.createdAt,
        role: membership.role,
    });
}));



router.delete('/:workspaceId', authMiddleware, workspaceIdValidation, asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.userId;
    if(userId === undefined) {
        return res.status(401).json({ error: 'Unauthorized' }); 
    }

    const workspaceId = Number(req.params.workspaceId);
    const membership = await getWorkspaceMembership(workspaceId, userId);
    if(!membership) {
        return res.status(404).json({ error: 'Workspace not found' });
    }
    if(membership.role !== 'owner') {
        return res.status(403).json({ error: 'Forbidden' });
    }

    const [deletedWorkspace] = await db
        .delete(workspace)
        .where(and(
            eq(workspace.id, workspaceId),
            exists(db.select({ userId: workspaceMember.userId })
                .from(workspaceMember)
                .where(and(
                    eq(workspaceMember.workspaceId, workspace.id),
                    eq(workspaceMember.userId, userId),
                    eq(workspaceMember.role, 'owner'),
                ))),
        ))
        .returning();

    if (!deletedWorkspace) {
        return res.status(404).json({ error: 'Workspace not found' });
    }

    return res.status(200).json({
        message: 'Workspace deleted successfully',
    });
}));

export default router;
