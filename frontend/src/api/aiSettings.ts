import { JSON_HEADERS, throwIfNotOk } from './utils';
import type { AiSettings } from './types';

const BASE_URL = import.meta.env.VITE_API_URL;

export interface SaveAiSettingsData {
    provider_type: string;
    api_key: string;
    model_name?: string;
    base_url?: string;
}

export async function getAiSettings(): Promise<AiSettings | null> {
    const response = await fetch(BASE_URL, {
        credentials: 'include',
    });
    await throwIfNotOk(response);
    return response.json();
}

export async function saveAiSettings(data: SaveAiSettingsData): Promise<AiSettings> {
    const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: JSON_HEADERS,
        credentials: 'include',
        body: JSON.stringify(data),
    });
    await throwIfNotOk(response);
    return response.json();
}

export async function deleteAiSettings(): Promise<null> {
    const response = await fetch(BASE_URL, {
        method: 'DELETE',
        credentials: 'include',
    });
    await throwIfNotOk(response);
    if (response.status === 204) return null;
    return response.json();
}
