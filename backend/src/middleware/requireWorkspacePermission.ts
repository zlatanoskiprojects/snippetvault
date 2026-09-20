import { RequestHandler } from 'express';
import getWorkspaceMembership from '../lib/workspaceMembership';
import {
    hasWorkspacePermission,
    WorkspacePermission,
} from '../permissions/workspacePermissions';
import { asyncHandler } from './errorHandler';

const requireWorkspacePermission = (permission: WorkspacePermission): RequestHandler => asyncHandler(
    async (req, res, next) => {
        const userId = req.userId;
        if (userId === undefined) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const workspaceId = Number(req.params.workspaceId);
        if (!Number.isInteger(workspaceId) || workspaceId < 1) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const membership = await getWorkspaceMembership(workspaceId, userId);
        if (!membership) {
            return res.status(404).json({ error: 'Workspace not found' });
        }
        if (!hasWorkspacePermission(membership.role, permission)) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        res.locals.workspaceMembership = membership;
        next();
    },
);

export default requireWorkspacePermission;
