import { Request, Response, Router } from 'express';
import { validationResult } from 'express-validator';
import { and, asc, eq, ne } from 'drizzle-orm';
import { projectMember, users } from '../db/schema';
import db from '../lib/db';
import authMiddleware from '../middleware/authMiddleware';
import { asyncHandler } from '../middleware/errorHandler';
import {
    projectMemberParamsValidation,
    projectMemberProjectIdValidation,
    updateProjectMemberRoleValidation,
} from '../validators/projectMembers';

const router = Router();

router.get('/:projectId/members', authMiddleware, projectMemberProjectIdValidation, asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const projectId = Number(req.params.projectId);

    try {
        const [membership] = await db
            .select({ projectId: projectMember.projectId })
            .from(projectMember)
            .where(and(
                eq(projectMember.projectId, projectId),
                eq(projectMember.userId, req.userId as number),
            ))
            .limit(1);

        if (!membership) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const members = await db
            .select({
                userId: users.id,
                username: users.username,
                displayName: users.displayName,
                avatarUrl: users.avatarUrl,
                role: projectMember.role,
                joinedAt: projectMember.joinedAt,
            })
            .from(projectMember)
            .innerJoin(users, eq(users.id, projectMember.userId))
            .where(eq(projectMember.projectId, projectId))
            .orderBy(asc(projectMember.joinedAt));

        return res.status(200).json(members.map((member) => ({
            user_id: member.userId,
            username: member.username,
            display_name: member.displayName,
            avatar_url: member.avatarUrl,
            role: member.role,
            joined_at: member.joinedAt,
        })));
    } catch (error) {
        console.error('Error fetching project members:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}));

router.patch('/:projectId/members/:userId', authMiddleware, updateProjectMemberRoleValidation, asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const projectId = Number(req.params.projectId);
    const userId = Number(req.params.userId);

    try {
        const [membership] = await db
            .select({ role: projectMember.role })
            .from(projectMember)
            .where(and(
                eq(projectMember.projectId, projectId),
                eq(projectMember.userId, req.userId as number),
            ))
            .limit(1);

        if (!membership) {
            return res.status(404).json({ error: 'Project not found' });
        }

        if (membership.role !== 'owner') {
            return res.status(403).json({ error: 'Only the project owner can change member roles' });
        }

        if (userId === req.userId) {
            return res.status(400).json({ error: 'Project owner role cannot be changed' });
        }

        const [updatedMember] = await db
            .update(projectMember)
            .set({ role: req.body.role })
            .where(and(
                eq(projectMember.projectId, projectId),
                eq(projectMember.userId, userId),
            ))
            .returning({ userId: projectMember.userId, role: projectMember.role });

        if (!updatedMember) {
            return res.status(404).json({ error: 'Project member not found' });
        }

        return res.status(200).json({
            user_id: updatedMember.userId,
            role: updatedMember.role,
        });
    } catch (error) {
        console.error('Error updating project member role:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}));

router.delete('/:projectId/members/:userId', authMiddleware, projectMemberParamsValidation, asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const projectId = Number(req.params.projectId);
    const userId = Number(req.params.userId);

    try {
        const [membership] = await db
            .select({ role: projectMember.role })
            .from(projectMember)
            .where(and(
                eq(projectMember.projectId, projectId),
                eq(projectMember.userId, req.userId as number),
            ))
            .limit(1);

        if (!membership) {
            return res.status(404).json({ error: 'Project not found' });
        }

        if (membership.role !== 'owner') {
            return res.status(403).json({ error: 'Only the project owner can remove members' });
        }

        const [targetMember] = await db
            .select({ role: projectMember.role })
            .from(projectMember)
            .where(and(
                eq(projectMember.projectId, projectId),
                eq(projectMember.userId, userId),
            ))
            .limit(1);

        if (!targetMember) {
            return res.status(404).json({ error: 'Project member not found' });
        }

        if (targetMember.role === 'owner') {
            return res.status(400).json({ error: 'Project owner cannot be removed' });
        }

        const [removedMember] = await db
            .delete(projectMember)
            .where(and(
                eq(projectMember.projectId, projectId),
                eq(projectMember.userId, userId),
                ne(projectMember.role, 'owner'),
            ))
            .returning({ userId: projectMember.userId });

        if (!removedMember) {
            return res.status(409).json({ error: 'Project membership changed; try again' });
        }

        return res.status(200).json({ message: 'Project member removed successfully' });
    } catch (error) {
        console.error('Error removing project member:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}));

export default router;
