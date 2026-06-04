import { JSON_HEADERS, throwIfNotOk } from './utils';

const BASE_URL = `${import.meta.env.VITE_API_URL}/auth`;

export async function register(username, email, password) {
    const response = await fetch(`${BASE_URL}/register`, {
        method: 'POST',
        headers: JSON_HEADERS,
        credentials: 'include',
        body: JSON.stringify({ username, email, password }),
    });
    await throwIfNotOk(response);
    return response.json();
}

export async function login(email, password) {
    const response = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: JSON_HEADERS,
        credentials: 'include',
        body: JSON.stringify({ email, password }),
    });
    await throwIfNotOk(response);
    return response.json();
}

export async function logout() {
    const response = await fetch(`${BASE_URL}/logout`, {
        method: 'POST',
        credentials: 'include',
    });
    await throwIfNotOk(response);
    return response.json();
}