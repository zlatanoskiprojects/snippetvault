import { JSON_HEADERS, apiFetch } from './utils';
import type { Snippet, SnippetVersion } from './types';

const BASE_URL = `${import.meta.env.VITE_API_URL}/snippets`;

export interface SnippetInput {
    title: string;
    description?: string | null;
    code: string;
    language: string;
    collection_id?: number | null;
    visibility?: string;
    tags?: string[];
}

export async function getAllSnippets(): Promise<Snippet[]> {
    return apiFetch<Snippet[]>(BASE_URL, { silent: true });
}

export async function getSnippetById(id: number | string): Promise<Snippet> {
    return apiFetch<Snippet>(`${BASE_URL}/${id}`);
}

export async function createSnippet(data: SnippetInput): Promise<Snippet> {
    return apiFetch<Snippet>(BASE_URL, {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify(data),
    });
}

export async function deleteSnippet(id: number | string): Promise<Snippet | null> {
    return apiFetch<Snippet | null>(`${BASE_URL}/${id}`, {
        method: 'DELETE',
    });
}

export async function updateSnippet(id: number | string, data: Partial<SnippetInput>): Promise<Snippet> {
    return apiFetch<Snippet>(`${BASE_URL}/${id}`, {
        method: 'PATCH',
        headers: JSON_HEADERS,
        body: JSON.stringify(data),
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
