import type { WorkspaceRole } from './workspacePermissions';

export type ProjectPermission =
    | 'read'
    | 'update'
    | 'delete';

export const projectPermissions = {
    owner: ['read', 'update', 'delete'],
    editor: ['read'],
    viewer: ['read'],
} as const satisfies Record<WorkspaceRole, readonly ProjectPermission[]>;

export function hasProjectPermission(
    role: WorkspaceRole,
    permission: ProjectPermission,
): boolean {
    return (projectPermissions[role] as readonly ProjectPermission[]).includes(permission);
}

export function projectRolesWithPermission(permission: ProjectPermission): WorkspaceRole[] {
    return (Object.keys(projectPermissions) as WorkspaceRole[])
        .filter((role) => hasProjectPermission(role, permission));
}
