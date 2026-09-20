import { RequestHandler } from 'express';
import { eq } from 'drizzle-orm';
import { snippet } from '../db/schema';
import db from '../lib/db';
import getWorkspaceMembership from '../lib/workspaceMembership';
import {
    hasWorkspacePermission,
    WorkspacePermission,
} from '../permissions/workspacePermissions';
import { asyncHandler } from './errorHandler';

export type SnippetPermission = Extract<
    WorkspacePermission,
    | 'read'
    | 'updateSnippet'
    | 'deleteSnippet'
    | 'assignSnippetToProject'
    | 'manageSnippetVersions'
    | 'manageSnippetTags'
    | 'createComment'
>;

const requireSnippetPermission = (permission: SnippetPermission): RequestHandler => asyncHandler(
    async (req, res, next) => {
        const userId = req.userId;
        if (userId === undefined) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const snippetId = Number(req.params.snippetId);
        if (!Number.isInteger(snippetId) || snippetId < 1) {
            return res.status(404).json({ error: 'Snippet not found' });
        }

        const [storedSnippet] = await db
            .select({
                id: snippet.id,
                workspaceId: snippet.workspaceId,
            })
            .from(snippet)
            .where(eq(snippet.id, snippetId))
            .limit(1);
        if (!storedSnippet) {
            return res.status(404).json({ error: 'Snippet not found' });
        }

        const membership = await getWorkspaceMembership(storedSnippet.workspaceId, userId);
        if (!membership) {
            return res.status(404).json({ error: 'Snippet not found' });
        }
        if (!hasWorkspacePermission(membership.role, permission)) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        res.locals.snippetAuthorization = { snippet: storedSnippet, membership };
        next();
    },
);

export default requireSnippetPermission;
