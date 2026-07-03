import { JSON_HEADERS, throwIfNotOk } from './utils';
import type { User } from './types';

const BASE_URL = `${import.meta.env.VITE_API_URL}/profile`;

export interface ProfileResponse {
    user: User;
}

export interface UpdateProfileData {
    username?: string;
    email?: string;
    display_name?: string;
    bio?: string;
    avatar_url?: string;
}

export interface ChangePasswordData {
    currentPassword: string;
    newPassword: string;
}

export async function getProfile(): Promise<ProfileResponse> {
    const response = await fetch(BASE_URL, {
        credentials: 'include',
    });
    await throwIfNotOk(response);
    return response.json();
}

export async function updateProfile(data: UpdateProfileData): Promise<ProfileResponse> {
    const response = await fetch(BASE_URL, {
        method: 'PATCH',
        headers: JSON_HEADERS,
        credentials: 'include',
        body: JSON.stringify(data),
    });
    await throwIfNotOk(response);
    return response.json();
}

export async function changePassword(data: ChangePasswordData): Promise<{ message?: string }> {
    const response = await fetch(`${BASE_URL}/password`, {
        method: 'PATCH',
        headers: JSON_HEADERS,
        credentials: 'include',
        body: JSON.stringify(data),
    });
    await throwIfNotOk(response);
    return response.json();
}

export async function deleteAccount(): Promise<{ message?: string }> {
    const response = await fetch(BASE_URL, {
        method: 'DELETE',
        credentials: 'include',
    });
    await throwIfNotOk(response);
    return response.json();
}
