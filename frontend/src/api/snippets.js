import { getAuthHeaders, throwIfNotOk } from './utils';

const BASE_URL = `${import.meta.env.VITE_API_URL}/snippets`;

export async function getAllSnippets() {
    const response = await fetch(BASE_URL, {
        headers: getAuthHeaders(),
    });
    await throwIfNotOk(response);
    return response.json();
}

export async function getSnippetById(id) {
    const response = await fetch(`${BASE_URL}/${id}`, {
        headers: getAuthHeaders(),
    });
    await throwIfNotOk(response);
    return response.json();
}

export async function createSnippet(data) {
    const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    });
    await throwIfNotOk(response);
    return response.json();
}

export async function deleteSnippet(id) {
    const response = await fetch(`${BASE_URL}/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });
    await throwIfNotOk(response);
    if (response.status === 204) return null;
    return response.json();
}

export async function updateSnippet(id, data) {
    const response = await fetch(`${BASE_URL}/${id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    });
    await throwIfNotOk(response);
    return response.json();
}