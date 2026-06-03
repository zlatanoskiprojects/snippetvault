import { getAuthHeaders, throwIfNotOk } from './utils';

const BASE_URL = `${import.meta.env.VITE_API_URL}/collections`;

export async function getAllCollections() {
    const response = await fetch(BASE_URL, {
        headers: getAuthHeaders(),
    });
    await throwIfNotOk(response);
    return response.json();
}

export async function createCollection(data) {
    const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    });
    await throwIfNotOk(response);
    return response.json();
}

export async function updateCollection(id, data) {
    const response = await fetch(`${BASE_URL}/${id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    });
    await throwIfNotOk(response);
    return response.json();
}

export async function deleteCollection(id) {
    const response = await fetch(`${BASE_URL}/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });
    await throwIfNotOk(response);
    return response.json();
}