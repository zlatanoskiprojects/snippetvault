import { JSON_HEADERS, throwIfNotOk, ApiError } from './utils';
import type { Snippet, Tag } from './types';

const BASE_URL = `${import.meta.env.VITE_API_URL}/tags`;

export interface TagInput {
    name: string;
}

export async function getAllTags(): Promise<Tag[]> {
    const response = await fetch(BASE_URL, {
        credentials: 'include',
    });
    await throwIfNotOk(response);
    return response.json();
}

export async function getTagById(id: number | string): Promise<Tag> {
    const response = await fetch(`${BASE_URL}/${id}`, {
        credentials: 'include',
    });
    await throwIfNotOk(response);
    return response.json();
}

export async function getSnippetsByTag(id: number | string): Promise<Snippet[]> {
    const response = await fetch(`${BASE_URL}/${id}/snippets`, {
        credentials: 'include',
    });
    await throwIfNotOk(response);
    return response.json();
}

export async function createTag(data: TagInput): Promise<Tag> {
    const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: JSON_HEADERS,
        credentials: 'include',
        body: JSON.stringify(data),
    });
    await throwIfNotOk(response);
    return response.json();
}

export async function assignTagToSnippet(id: number | string, snippetId: number | string): Promise<Snippet> {
    const response = await fetch(`${BASE_URL}/${id}/snippets/${snippetId}`, {
        method: 'POST',
        credentials: 'include',
    });
    await throwIfNotOk(response);
    return response.json();
}

export async function removeTagFromSnippet(id: number | string, snippetId: number | string): Promise<Snippet | null> {
    const response = await fetch(`${BASE_URL}/${id}/snippets/${snippetId}`, {
        method: 'DELETE',
        credentials: 'include',
    });
    await throwIfNotOk(response);
    if (response.status === 204) return null;
    return response.json();
}

export async function getOrCreateTag(name: string): Promise<Tag | undefined> {
    try {
        return await createTag({ name });
    } catch (err) {
        if (err instanceof ApiError && err.status === 409) {
            const all = await getAllTags();
            return all.find(t => t.name === name);
        }
        throw err;
    }
}
