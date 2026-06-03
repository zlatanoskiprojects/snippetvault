import { getAuthHeaders, throwIfNotOk } from './utils';

const BASE_URL = import.meta.env.VITE_API_URL;

export async function getAiSettings() {
    const response = await fetch(BASE_URL, {
        headers: getAuthHeaders(),
    });
    await throwIfNotOk(response);
    return response.json();
}

export async function saveAiSettings(data) {
    const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    });
    await throwIfNotOk(response);
    return response.json();
}

export async function deleteAiSettings() {
    const response = await fetch(BASE_URL, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });
    await throwIfNotOk(response);
    if (response.status === 204) return null;
    return response.json();
}
