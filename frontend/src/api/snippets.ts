import { JSON_HEADERS, apiFetch } from './utils';
import type { Snippet, SnippetVersion } from './types';

const API_URL = import.meta.env.VITE_API_URL;
const BASE_URL = `${API_URL}/snippets`;
const workspaceSnippetsUrl = (workspaceId: number) => `${API_URL}/workspaces/${workspaceId}/snippets`;

export interface SnippetInput {
    title: string;
    description?: string | null;
    code: string;
    language: string;
    project_id?: number | null;
    visibility?: string;
    tags?: string[];
}

export async function getAllSnippets(workspaceId: number): Promise<Snippet[]> {
    return apiFetch<Snippet[]>(workspaceSnippetsUrl(workspaceId), { silent: true });
}

export async function getSnippetById(id: number | string): Promise<Snippet> {
    return apiFetch<Snippet>(`${BASE_URL}/${id}`);
}

export async function createSnippet(workspaceId: number, data: SnippetInput, silent = false): Promise<Snippet> {
    return apiFetch<Snippet>(workspaceSnippetsUrl(workspaceId), {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify(data),
        silent,
    });
}

export async function deleteSnippet(id: number | string): Promise<Snippet | null> {
    return apiFetch<Snippet | null>(`${BASE_URL}/${id}`, {
        method: 'DELETE',
    });
}

export async function updateSnippet(id: number | string, data: Partial<SnippetInput>, silent = false): Promise<Snippet> {
    return apiFetch<Snippet>(`${BASE_URL}/${id}`, {
        method: 'PATCH',
        headers: JSON_HEADERS,
        body: JSON.stringify(data),
        silent,
    });
}

export async function getSnippetVersions(snippetId: number | string): Promise<SnippetVersion[]> {
    return apiFetch<SnippetVersion[]>(`${BASE_URL}/${snippetId}/versions`);
}

export async function getSnippetVersion(snippetId: number | string, versionId: number | string): Promise<SnippetVersion> {
    return apiFetch<SnippetVersion>(`${BASE_URL}/${snippetId}/versions/${versionId}`);
}

export async function deleteSnippetVersion(snippetId: number | string, versionId: number | string): Promise<void> {
    await apiFetch<void>(`${BASE_URL}/${snippetId}/versions/${versionId}`, {
        method: 'DELETE',
    });
}

export async function restoreSnippetVersion(snippetId: number | string, versionId: number | string): Promise<Snippet> {
    return apiFetch<Snippet>(`${BASE_URL}/${snippetId}/versions/${versionId}/restore`, {
        method: 'POST',
    });
}
