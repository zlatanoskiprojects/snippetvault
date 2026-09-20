import { RequestHandler } from 'express';
import { eq } from 'drizzle-orm';
import { project } from '../db/schema';
import db from '../lib/db';
import getWorkspaceMembership from '../lib/workspaceMembership';
import {
    hasProjectPermission,
    ProjectPermission,
} from '../permissions/projectPermissions';
import { asyncHandler } from './errorHandler';

const requireProjectPermission = (permission: ProjectPermission): RequestHandler => asyncHandler(
    async (req, res, next) => {
        const userId = req.userId;
        if (userId === undefined) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const projectId = Number(req.params.projectId);
        if (!Number.isInteger(projectId) || projectId < 1) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const [storedProject] = await db
            .select({ workspaceId: project.workspaceId })
            .from(project)
            .where(eq(project.id, projectId))
            .limit(1);
        if (!storedProject) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const membership = await getWorkspaceMembership(storedProject.workspaceId, userId);
        if (!membership) {
            return res.status(404).json({ error: 'Project not found' });
        }
        if (!hasProjectPermission(membership.role, permission)) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        res.locals.projectAuthorization = {
            workspaceId: storedProject.workspaceId,
            membership,
        };
        next();
    },
);

export default requireProjectPermission;
