import { getAuthHeaders, throwIfNotOk } from './utils';

const BASE_URL = `${import.meta.env.VITE_API_URL}/tags`;

export async function getAllTags() {
    const response = await fetch(BASE_URL, {
        headers: getAuthHeaders(),
    });
    await throwIfNotOk(response);
    return response.json();
}

export async function getTagById(id) {
    const response = await fetch(`${BASE_URL}/${id}`, {
        headers: getAuthHeaders(),
    });
    await throwIfNotOk(response);
    return response.json();
}

export async function getSnippetsByTag(id) {
    const response = await fetch(`${BASE_URL}/${id}/snippets`, {
        headers: getAuthHeaders(),
    });
    await throwIfNotOk(response);
    return response.json();
}

export async function createTag(data) {
    const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    });
    await throwIfNotOk(response);
    return response.json();
}

export async function deleteTag(id) {
    const response = await fetch(`${BASE_URL}/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });
    await throwIfNotOk(response);
    if (response.status === 204) return null;
    return response.json();
}

export async function assignTagToSnippet(id, snippetId) {
    const response = await fetch(`${BASE_URL}/${id}/snippets/${snippetId}`, {
        method: 'POST',
        headers: getAuthHeaders(),
    });
    await throwIfNotOk(response);
    return response.json();
}

export async function removeTagFromSnippet(id, snippetId) {
    const response = await fetch(`${BASE_URL}/${id}/snippets/${snippetId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });
    await throwIfNotOk(response);
    if (response.status === 204) return null;
    return response.json();
}
