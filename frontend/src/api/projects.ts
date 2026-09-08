import { JSON_HEADERS, apiFetch } from './utils';
import type { Project } from './types';

const BASE_URL = `${import.meta.env.VITE_API_URL}/projects`;

export interface ProjectInput {
    name: string;
    description?: string | null;
}

export async function getAllProjects(): Promise<Project[]> {
    return apiFetch<Project[]>(BASE_URL, { silent: true });
}

export async function createProject(data: ProjectInput): Promise<Project> {
    return apiFetch<Project>(BASE_URL, {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify(data),
    });
}

export async function updateProject(id: number | string, data: Partial<ProjectInput>): Promise<Project> {
    return apiFetch<Project>(`${BASE_URL}/${id}`, {
        method: 'PATCH',
        headers: JSON_HEADERS,
        body: JSON.stringify(data),
    });
}

export async function deleteProject(id: number | string): Promise<{ message?: string }> {
    return apiFetch<{ message?: string }>(`${BASE_URL}/${id}`, {
        method: 'DELETE',
    });
}
