import { JSON_HEADERS, apiFetch, ApiError } from './utils';
import { notifyError } from '../contexts/ToastContext';
import type { Snippet, Tag } from './types';

const BASE_URL = `${import.meta.env.VITE_API_URL}/tags`;

export interface TagInput {
    name: string;
}

export async function getAllTags(): Promise<Tag[]> {
    return apiFetch<Tag[]>(BASE_URL);
}

export async function getTagById(id: number | string): Promise<Tag> {
    return apiFetch<Tag>(`${BASE_URL}/${id}`);
}

export async function getSnippetsByTag(id: number | string): Promise<Snippet[]> {
    return apiFetch<Snippet[]>(`${BASE_URL}/${id}/snippets`);
}

export async function createTag(data: TagInput, silent = false): Promise<Tag> {
    return apiFetch<Tag>(BASE_URL, {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify(data),
        silent,
    });
}

export async function assignTagToSnippet(id: number | string, snippetId: number | string): Promise<Snippet> {
    return apiFetch<Snippet>(`${BASE_URL}/${id}/snippets/${snippetId}`, {
        method: 'POST',
    });
}

export async function removeTagFromSnippet(id: number | string, snippetId: number | string): Promise<Snippet | null> {
    return apiFetch<Snippet | null>(`${BASE_URL}/${id}/snippets/${snippetId}`, {
        method: 'DELETE',
    });
}

export async function getOrCreateTag(name: string): Promise<Tag | undefined> {
    try {
        return await createTag({ name }, true);
    } catch (err) {
        if (err instanceof ApiError && err.status === 409) {
            const all = await getAllTags();
            return all.find(t => t.name === name);
        }
        if (err instanceof ApiError && err.status !== 401) notifyError('Could not save that tag.');
        throw err;
    }
}
