import { JSON_HEADERS, apiFetch } from './utils';
import type { User } from './types';

const BASE_URL = `${import.meta.env.VITE_API_URL}/profile`;
const AUTH_BASE_URL = `${import.meta.env.VITE_API_URL}/auth`;

export interface ProfileResponse {
    user: User;
}

export interface UpdateProfileData {
    username?: string;
    display_name?: string;
    bio?: string;
    avatar_url?: string;
}

export interface ChangePasswordData {
    currentPassword: string;
    newPassword: string;
}

export interface SetPasswordData {
    newPassword: string;
}

export interface ChangeEmailData {
    newEmail: string;
    currentPassword?: string;
}

export async function getProfile(): Promise<ProfileResponse> {
    return apiFetch<ProfileResponse>(BASE_URL, { silent: true });
}

export async function updateProfile(data: UpdateProfileData): Promise<ProfileResponse> {
    return apiFetch<ProfileResponse>(BASE_URL, {
        method: 'PATCH',
        headers: JSON_HEADERS,
        silent: true,
        body: JSON.stringify(data),
    });
}

export async function changeEmail(data: ChangeEmailData): Promise<{ status: boolean }> {
    return apiFetch<{ status: boolean }>(`${AUTH_BASE_URL}/change-email`, {
        method: 'POST',
        headers: JSON_HEADERS,
        silent: true,
        body: JSON.stringify({
            ...data,
            callbackURL: `${window.location.origin}/dashboard?emailChange=old-confirmed`,
        }),
    });
}

export async function changePassword(data: ChangePasswordData): Promise<{ message?: string }> {
    return apiFetch<{ message?: string }>(`${AUTH_BASE_URL}/change-password`, {
        method: 'POST',
        headers: JSON_HEADERS,
        silent: true,
        body: JSON.stringify({ ...data, revokeOtherSessions: true }),
    });
}

export async function setPassword(data: SetPasswordData): Promise<{ status: boolean }> {
    return apiFetch<{ status: boolean }>(`${BASE_URL}/set-password`, {
        method: 'POST',
        headers: JSON_HEADERS,
        silent: true,
        body: JSON.stringify(data),
    });
}

export async function deleteAccount(): Promise<{ message?: string }> {
    return apiFetch<{ message?: string }>(`${AUTH_BASE_URL}/delete-user`, {
        method: 'POST',
        headers: JSON_HEADERS,
        silent: true,
        body: JSON.stringify({ callbackURL: `${window.location.origin}/login` }),
    });
}
