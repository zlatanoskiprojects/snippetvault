import {eq,or,and} from 'drizzle-orm';
import { workspaceMember } from '../db/schema';
import db from './db';

const getWorkspaceMembership = async (workspaceId: number, userId: number) => {

    const [membership] = await db.select({role: workspaceMember.role}).from(workspaceMember).where(and(
        eq(workspaceMember.workspaceId, workspaceId),
        eq(workspaceMember.userId, userId)
    )).limit(1);

    return membership ?? null;
};

export default getWorkspaceMembership;