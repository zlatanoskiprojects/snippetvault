import { JSON_HEADERS, apiFetch } from './utils';
import type { Project } from './types';

const API_URL = import.meta.env.VITE_API_URL;
const workspaceProjectsUrl = (workspaceId: number) => `${API_URL}/workspaces/${workspaceId}/projects`;

export interface ProjectInput {
    name: string;
    description?: string | null;
}

export async function getAllProjects(workspaceId: number): Promise<Project[]> {
    return apiFetch<Project[]>(workspaceProjectsUrl(workspaceId), { silent: true });
}

export async function createProject(workspaceId: number, data: ProjectInput): Promise<Project> {
    return apiFetch<Project>(workspaceProjectsUrl(workspaceId), {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify(data),
    });
}

export async function updateProject(id: number | string, data: Partial<ProjectInput>): Promise<Project> {
    return apiFetch<Project>(`${API_URL}/projects/${id}`, {
        method: 'PATCH',
        headers: JSON_HEADERS,
        body: JSON.stringify(data),
    });
}

export async function deleteProject(id: number | string): Promise<{ message?: string }> {
    return apiFetch<{ message?: string }>(`${API_URL}/projects/${id}`, {
        method: 'DELETE',
    });
}
