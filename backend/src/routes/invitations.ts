import { Router ,type Request, type Response} from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import authMiddleware from '../middleware/authMiddleware';
import { users,workspace,workspaceInvitation } from '../db/schema';
import { and, desc, eq, gt } from 'drizzle-orm';
import db from '../lib/db';
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


export default router;
