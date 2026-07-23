import { JSON_HEADERS, apiFetch } from './utils';
import type { User } from './types';

const BASE_URL = `${import.meta.env.VITE_API_URL}/auth`;
const APP_URL = window.location.origin;

export interface AuthResponse {
    user: User;
}

export async function register(username: string, email: string, password: string, captchaToken?: string): Promise<AuthResponse> {
    return apiFetch<AuthResponse>(`${BASE_URL}/sign-up/email`, {
        method: 'POST',
        headers: captchaToken ? { ...JSON_HEADERS, 'x-captcha-response': captchaToken } : JSON_HEADERS,
        silent: true,
        body: JSON.stringify({
            name: username,
            email,
            password,
            callbackURL: `${APP_URL}/dashboard`,
        }),
    });
}

export async function login(email: string, password: string, captchaToken?: string): Promise<AuthResponse> {
    return apiFetch<AuthResponse>(`${BASE_URL}/sign-in/email`, {
        method: 'POST',
        headers: captchaToken ? { ...JSON_HEADERS, 'x-captcha-response': captchaToken } : JSON_HEADERS,
        silent: true,
        body: JSON.stringify({
            email,
            password,
            callbackURL: `${APP_URL}/dashboard`,
        }),
    });
}

export async function logout(): Promise<{ message?: string }> {
    return apiFetch<{ message?: string }>(`${BASE_URL}/sign-out`, {
        method: 'POST',
        silent: true,
    });
}

export async function socialLogin(provider: 'google' | 'github'): Promise<void> {
    const data = await apiFetch<{ url?: string }>(`${BASE_URL}/sign-in/social`, {
        method: 'POST',
        headers: JSON_HEADERS,
        silent: true,
        body: JSON.stringify({
            provider,
            callbackURL: `${APP_URL}/dashboard`,
            errorCallbackURL: `${APP_URL}/login`,
        }),
    });

    if (data?.url) {
        window.location.href = data.url;
        return;
    }

    throw new Error('Social login is not configured.');
}
