import { JSON_HEADERS, throwIfNotOk } from './utils';
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
    const response = await fetch(BASE_URL, {
        credentials: 'include',
    });
    await throwIfNotOk(response);
    return response.json();
}

export async function getSnippetById(id: number | string): Promise<Snippet> {
    const response = await fetch(`${BASE_URL}/${id}`, {
        credentials: 'include',
    });
    await throwIfNotOk(response);
    return response.json();
}

export async function createSnippet(data: SnippetInput): Promise<Snippet> {
    const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: JSON_HEADERS,
        credentials: 'include',
        body: JSON.stringify(data),
    });
    await throwIfNotOk(response);
    return response.json();
}

export async function deleteSnippet(id: number | string): Promise<Snippet | null> {
    const response = await fetch(`${BASE_URL}/${id}`, {
        method: 'DELETE',
        credentials: 'include',
    });
    await throwIfNotOk(response);
    if (response.status === 204) return null;
    return response.json();
}

export async function updateSnippet(id: number | string, data: Partial<SnippetInput>): Promise<Snippet> {
    const response = await fetch(`${BASE_URL}/${id}`, {
        method: 'PATCH',
        headers: JSON_HEADERS,
        credentials: 'include',
        body: JSON.stringify(data),
    });
    await throwIfNotOk(response);
    return response.json();
}

export async function getSnippetVersions(snippetId: number | string): Promise<SnippetVersion[]> {
    const response = await fetch(`${BASE_URL}/${snippetId}/versions`, {
        credentials: 'include',
    });
    await throwIfNotOk(response);
    return response.json();
}

export async function getSnippetVersion(snippetId: number | string, versionId: number | string): Promise<SnippetVersion> {
    const response = await fetch(`${BASE_URL}/${snippetId}/versions/${versionId}`, {
        credentials: 'include',
    });
    await throwIfNotOk(response);
    return response.json();
}

export async function deleteSnippetVersion(snippetId: number | string, versionId: number | string): Promise<void> {
    const response = await fetch(`${BASE_URL}/${snippetId}/versions/${versionId}`, {
        method: 'DELETE',
        credentials: 'include',
    });
    await throwIfNotOk(response);
}

export async function restoreSnippetVersion(snippetId: number | string, versionId: number | string): Promise<Snippet> {
    const response = await fetch(`${BASE_URL}/${snippetId}/versions/${versionId}/restore`, {
        method: 'POST',
        credentials: 'include',
    });
    await throwIfNotOk(response);
    return response.json();
}
