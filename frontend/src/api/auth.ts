import { JSON_HEADERS, throwIfNotOk } from './utils';
import type { User } from './types';

const BASE_URL = `${import.meta.env.VITE_API_URL}/auth`;

export interface AuthResponse {
    user: User;
}

export async function register(username: string, email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${BASE_URL}/register`, {
        method: 'POST',
        headers: JSON_HEADERS,
        credentials: 'include',
        body: JSON.stringify({ username, email, password }),
    });
    await throwIfNotOk(response);
    return response.json();
}

export async function login(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: JSON_HEADERS,
        credentials: 'include',
        body: JSON.stringify({ email, password }),
    });
    await throwIfNotOk(response);
    return response.json();
}

export async function logout(): Promise<{ message?: string }> {
    const response = await fetch(`${BASE_URL}/logout`, {
        method: 'POST',
        credentials: 'include',
    });
    await throwIfNotOk(response);
    return response.json();
}
