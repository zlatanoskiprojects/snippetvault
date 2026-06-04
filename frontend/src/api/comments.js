import { JSON_HEADERS, throwIfNotOk } from './utils';

const BASE_URL = import.meta.env.VITE_API_URL;

export async function getCommentsBySnippetId(snippetId) {
    const response = await fetch(`${BASE_URL}/snippets/${snippetId}/comments`, {
        credentials: 'include',
    });
    await throwIfNotOk(response);
    return response.json();
}

export async function createComment(snippetId, data) {
    const response = await fetch(`${BASE_URL}/snippets/${snippetId}/comments`, {
        method: 'POST',
        headers: JSON_HEADERS,
        credentials: 'include',
        body: JSON.stringify(data),
    });
    await throwIfNotOk(response);
    return response.json();
}

export async function updateComment(id, data) {
    const response = await fetch(`${BASE_URL}/comments/${id}`, {
        method: 'PATCH',
        headers: JSON_HEADERS,
        credentials: 'include',
        body: JSON.stringify(data),
    });
    await throwIfNotOk(response);
    return response.json();
}

export async function deleteComment(id) {
    const response = await fetch(`${BASE_URL}/comments/${id}`, {
        method: 'DELETE',
        credentials: 'include',
    });
    await throwIfNotOk(response);
    if (response.status === 204) return null;
    return response.json();
}