import { JSON_HEADERS, throwIfNotOk } from './utils';

const BASE_URL = `${import.meta.env.VITE_API_URL}/snippets`;

export async function getAllSnippets() {
    const response = await fetch(BASE_URL, {
        credentials: 'include',
    });
    await throwIfNotOk(response);
    return response.json();
}

export async function getSnippetById(id) {
    const response = await fetch(`${BASE_URL}/${id}`, {
        credentials: 'include',
    });
    await throwIfNotOk(response);
    return response.json();
}

export async function createSnippet(data) {
    const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: JSON_HEADERS,
        credentials: 'include',
        body: JSON.stringify(data),
    });
    await throwIfNotOk(response);
    return response.json();
}

export async function deleteSnippet(id) {
    const response = await fetch(`${BASE_URL}/${id}`, {
        method: 'DELETE',
        credentials: 'include',
    });
    await throwIfNotOk(response);
    if (response.status === 204) return null;
    return response.json();
}

export async function updateSnippet(id, data) {
    const response = await fetch(`${BASE_URL}/${id}`, {
        method: 'PATCH',
        headers: JSON_HEADERS,
        credentials: 'include',
        body: JSON.stringify(data),
    });
    await throwIfNotOk(response);
    return response.json();
}

export async function getSnippetVersions(snippetId) {
    const response = await fetch(`${BASE_URL}/${snippetId}/versions`, {
        credentials: 'include',
    });
    await throwIfNotOk(response);
    return response.json();
}

export async function getSnippetVersion(snippetId, versionId) {
    const response = await fetch(`${BASE_URL}/${snippetId}/versions/${versionId}`, {
        credentials: 'include',
    });
    await throwIfNotOk(response);
    return response.json();
}

export async function deleteSnippetVersion(snippetId, versionId) {
    const response = await fetch(`${BASE_URL}/${snippetId}/versions/${versionId}`, {
        method: 'DELETE',
        credentials: 'include',
    });
    await throwIfNotOk(response);
}

export async function restoreSnippetVersion(snippetId, versionId) {
    const response = await fetch(`${BASE_URL}/${snippetId}/versions/${versionId}/restore`, {
        method: 'POST',
        credentials: 'include',
    });
    await throwIfNotOk(response);
    return response.json();
}