import { JSON_HEADERS, throwIfNotOk } from './utils';

const BASE_URL = `${import.meta.env.VITE_API_URL}/tags`;

export async function getAllTags() {
    const response = await fetch(BASE_URL, {
        credentials: 'include',
    });
    await throwIfNotOk(response);
    return response.json();
}

export async function getTagById(id) {
    const response = await fetch(`${BASE_URL}/${id}`, {
        credentials: 'include',
    });
    await throwIfNotOk(response);
    return response.json();
}

export async function getSnippetsByTag(id) {
    const response = await fetch(`${BASE_URL}/${id}/snippets`, {
        credentials: 'include',
    });
    await throwIfNotOk(response);
    return response.json();
}

export async function createTag(data) {
    const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: JSON_HEADERS,
        credentials: 'include',
        body: JSON.stringify(data),
    });
    await throwIfNotOk(response);
    return response.json();
}

export async function assignTagToSnippet(id, snippetId) {
    const response = await fetch(`${BASE_URL}/${id}/snippets/${snippetId}`, {
        method: 'POST',
        credentials: 'include',
    });
    await throwIfNotOk(response);
    return response.json();
}

export async function removeTagFromSnippet(id, snippetId) {
    const response = await fetch(`${BASE_URL}/${id}/snippets/${snippetId}`, {
        method: 'DELETE',
        credentials: 'include',
    });
    await throwIfNotOk(response);
    if (response.status === 204) return null;
    return response.json();
}

export async function getOrCreateTag(name) {
    try {
        return await createTag({ name });
    } catch (err) {
        if (err.status === 409) {
            const all = await getAllTags();
            return all.find(t => t.name === name);
        }
        throw err;
    }
}