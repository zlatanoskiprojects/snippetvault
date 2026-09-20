import { workspaceRole } from '../db/schema';

export type WorkspaceRole = (typeof workspaceRole.enumValues)[number];

export type WorkspacePermission =
    | 'read'
    | 'update'
    | 'delete'
    | 'createProject'
    | 'manageMembers'
    | 'inviteMembers'
    | 'createSnippet'
    | 'updateSnippet'
    | 'deleteSnippet'
    | 'assignSnippetToProject'
    | 'manageSnippetVersions'
    | 'manageSnippetTags'
    | 'createComment';

export const workspacePermissions = {
    owner: [
        'read',
        'update',
        'delete',
        'createProject',
        'manageMembers',
        'inviteMembers',
        'createSnippet',
        'updateSnippet',
        'deleteSnippet',
        'assignSnippetToProject',
        'manageSnippetVersions',
        'manageSnippetTags',
        'createComment',
    ],
    editor: [
        'read',
        'createProject',
        'createSnippet',
        'updateSnippet',
        'deleteSnippet',
        'assignSnippetToProject',
        'manageSnippetVersions',
        'manageSnippetTags',
        'createComment',
    ],
    viewer: [
        'read',
        'createComment',
    ],
} as const satisfies Record<WorkspaceRole, readonly WorkspacePermission[]>;

export function hasWorkspacePermission(
    role: WorkspaceRole,
    permission: WorkspacePermission,
): boolean {
    return (workspacePermissions[role] as readonly WorkspacePermission[]).includes(permission);
}

export function workspaceRolesWithPermission(permission: WorkspacePermission): WorkspaceRole[] {
    return workspaceRole.enumValues.filter((role) => hasWorkspacePermission(role, permission));
}
