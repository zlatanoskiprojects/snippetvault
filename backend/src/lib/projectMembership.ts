import { and, eq } from 'drizzle-orm';
import { projectMember } from '../db/schema';
import db from './db';

const getProjectMembership = async (projectId: number, userId: number) => {
    const [membership] = await db
        .select({ role: projectMember.role })
        .from(projectMember)
        .where(and(
            eq(projectMember.projectId, projectId),
            eq(projectMember.userId, userId),
        ))
        .limit(1);

    return membership ?? null;
};

export default getProjectMembership;
