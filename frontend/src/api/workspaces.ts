import { JSON_HEADERS, apiFetch } from './utils';
import type { Workspace, WorkspaceMember, WorkspaceRole } from './types';

const BASE_URL = `${import.meta.env.VITE_API_URL}/workspaces`;

export function getAllWorkspaces(): Promise<Workspace[]> {
    return apiFetch<Workspace[]>(BASE_URL, { silent: true });
}

export function createWorkspace(name: string): Promise<Workspace> {
    return apiFetch<Workspace>(BASE_URL, {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify({ name }),
    });
}

export function updateWorkspace(id: number, name: string): Promise<Workspace> {
    return apiFetch<Workspace>(`${BASE_URL}/${id}`, {
        method: 'PATCH',
        headers: JSON_HEADERS,
        body: JSON.stringify({ name }),
    });
}

export function deleteWorkspace(id: number): Promise<{ message: string }> {
    return apiFetch<{ message: string }>(`${BASE_URL}/${id}`, { method: 'DELETE' });
}

export function getWorkspaceMembers(id: number): Promise<WorkspaceMember[]> {
    return apiFetch<WorkspaceMember[]>(`${BASE_URL}/${id}/members`);
}

export function updateWorkspaceMemberRole(workspaceId: number, userId: number, role: Exclude<WorkspaceRole, 'owner'>): Promise<WorkspaceMember> {
    return apiFetch<WorkspaceMember>(`${BASE_URL}/${workspaceId}/members/${userId}`, {
        method: 'PATCH',
        headers: JSON_HEADERS,
        body: JSON.stringify({ role }),
    });
}

export function removeWorkspaceMember(workspaceId: number, userId: number): Promise<{ message: string }> {
    return apiFetch<{ message: string }>(`${BASE_URL}/${workspaceId}/members/${userId}`, { method: 'DELETE' });
}
