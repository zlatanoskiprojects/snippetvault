import { Router ,type Request, type Response} from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import authMiddleware from '../middleware/authMiddleware';
import validateRequest from '../middleware/validateRequest';
import { invitationIdValidation, invitationTokenValidation } from '../validators/invitations';
import { users,workspace,workspaceInvitation, workspaceMember } from '../db/schema';
import { and, desc, eq, gt, } from 'drizzle-orm';
import db from '../lib/db';
import {  hashInvitationToken } from '../lib/invitationToken';
const router = Router();






//get all invitations for the current user , they are personal invitations, not workspace invitations
router.get('/', authMiddleware, asyncHandler(async (req: Request, res: Response) => {

    const userId = req.userId;
    if (userId === undefined) return res.status(401).json({ error: 'Unauthorized' });


    const [user] = await db.select({ email: users.email }).from(users).where(eq(users.id, userId)).limit(1);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const invitations = await db.select({
        id: workspaceInvitation.id,
        workspace_id: workspaceInvitation.workspaceId,
        workspace_name: workspace.name,
        inviter_name: users.displayName,
        role: workspaceInvitation.role,
        created_at: workspaceInvitation.createdAt,
            expires_at: workspaceInvitation.expiresAt,}).from(workspaceInvitation)
        .innerJoin(workspace, eq(workspace.id, workspaceInvitation.workspaceId))
        .innerJoin(users, eq(users.id, workspaceInvitation.invitedByUserId))
        .where(and(
            eq(workspaceInvitation.email, user.email.trim().toLowerCase()),
            eq(workspaceInvitation.status, 'pending'),
            gt(workspaceInvitation.expiresAt, new Date()),
        ))
        .orderBy(desc(workspaceInvitation.createdAt))
        .limit(50);

    return res.status(200).json(invitations);
}));

//accept an invitation

router.post('/:invitationId/accept', authMiddleware, invitationIdValidation, validateRequest, asyncHandler(async (req: Request, res: Response) => {

    const userId = req.userId;
    if (userId === undefined) return res.status(401).json({ error: 'Unauthorized' });

    const invitationId = Number(req.params.invitationId);

    const [user] = await db.select({ email: users.email }).from(users).where(eq(users.id, userId)).limit(1);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const result = await db.transaction(async (tx) => {
        const [invitation] = await tx
            .select()
            .from(workspaceInvitation)
            .where(and(
                eq(workspaceInvitation.id, invitationId),
                eq(workspaceInvitation.email, user.email.trim().toLowerCase()),
                eq(workspaceInvitation.status, 'pending'),
                gt(workspaceInvitation.expiresAt, new Date()),
            ))
            .limit(1)
            .for('update');

        if (!invitation || !['editor', 'viewer'].includes(invitation.role)) {
            return { status: 404, body: { error: 'Invitation not found' } };
        }

        const [member] = await tx
            .insert(workspaceMember)
            .values({ workspaceId: invitation.workspaceId, userId, role: invitation.role })
            .onConflictDoNothing({ target: [workspaceMember.workspaceId, workspaceMember.userId] })
            .returning({ userId: workspaceMember.userId });

        if (!member) {
            return { status: 409, body: { error: 'You are already a member of this workspace' } };
        }

        await tx
            .update(workspaceInvitation)
            .set({ status: 'accepted', acceptedAt: new Date() })
            .where(eq(workspaceInvitation.id, invitation.id));

        return { status: 200, body: { message: 'Invitation accepted' } };
    });

    return res.status(result.status).json(result.body);
}));



//decline an invitation

router.post('/:invitationId/decline', authMiddleware, invitationIdValidation, validateRequest, asyncHandler(async (req: Request, res: Response) => {

const userId = req.userId;
    if (userId === undefined) return res.status(401).json({ error: 'Unauthorized' });

    const invitationId = Number(req.params.invitationId);

    const [user] = await db.select({ email: users.email }).from(users).where(eq(users.id, userId)).limit(1);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const result = await db.transaction(async (tx) => {
        const [invitation] = await tx
            .select()
            .from(workspaceInvitation)
            .where(and(
                eq(workspaceInvitation.id, invitationId),
                eq(workspaceInvitation.email, user.email.trim().toLowerCase()),
                eq(workspaceInvitation.status, 'pending'),
                gt(workspaceInvitation.expiresAt, new Date()),
            ))
            .limit(1)
            .for('update');

        if (!invitation || !['editor', 'viewer'].includes(invitation.role)) {
            return { status: 404, body: { error: 'Invitation not found' } };
        }

    

        await tx
            .update(workspaceInvitation)
            .set({ status: 'rejected'})
            .where(eq(workspaceInvitation.id, invitation.id));

        return { status: 200, body: { message: 'Invitation rejected' } };
    });

    return res.status(result.status).json(result.body);
}));


//get invitation by token.

router.get('/token/:token', invitationTokenValidation, validateRequest, asyncHandler(async (req: Request, res: Response) => {


    const token = req.params.token;

    if (typeof token !== 'string') {
    return res.status(400).json({ error: 'Invalid invitation token' });
}

    const tokenHash = hashInvitationToken(token);

    const [invitation] = await db.select({
        id: workspaceInvitation.id,
        email: workspaceInvitation.email,
        workspace_id: workspaceInvitation.workspaceId,
        workspace_name: workspace.name,
        inviter_name: users.displayName,
        role: workspaceInvitation.role,
        created_at: workspaceInvitation.createdAt,
            expires_at: workspaceInvitation.expiresAt,}).from(workspaceInvitation)
        .innerJoin(workspace, eq(workspace.id, workspaceInvitation.workspaceId))
        .innerJoin(users, eq(users.id, workspaceInvitation.invitedByUserId))
        .where(and(
            eq(workspaceInvitation.tokenHash, tokenHash),
            eq(workspaceInvitation.status, 'pending'),
            gt(workspaceInvitation.expiresAt, new Date()),
        ))
        .limit(1);

    if (!invitation) {
        return res.status(404).json({ error: 'Invitation not found or expired' });
    }


    return res.status(200).json(invitation);

}));

export default router;
