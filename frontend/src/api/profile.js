import { JSON_HEADERS, throwIfNotOk } from './utils';

const BASE_URL = `${import.meta.env.VITE_API_URL}/profile`;

export async function getProfile() {
    const response = await fetch(BASE_URL, {
        credentials: 'include',
    });
    await throwIfNotOk(response);
    return response.json();
}

export async function updateProfile(data) {
    const response = await fetch(BASE_URL, {
        method: 'PATCH',
        headers: JSON_HEADERS,
        credentials: 'include',
        body: JSON.stringify(data),
    });
    await throwIfNotOk(response);
    return response.json();
}

export async function changePassword(data) {
    const response = await fetch(`${BASE_URL}/password`, {
        method: 'PATCH',
        headers: JSON_HEADERS,
        credentials: 'include',
        body: JSON.stringify(data),
    });
    await throwIfNotOk(response);
    return response.json();
}

export async function deleteAccount() {
    const response = await fetch(BASE_URL, {
        method: 'DELETE',
        credentials: 'include',
    });
    await throwIfNotOk(response);
    return response.json();
}
