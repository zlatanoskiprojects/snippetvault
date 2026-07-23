import { JSON_HEADERS, apiFetch } from './utils';
import type { AiSettings } from './types';

const BASE_URL = import.meta.env.VITE_API_URL;

export interface SaveAiSettingsData {
    provider_type: string;
    api_key: string;
    model_name?: string;
    base_url?: string;
}

export async function getAiSettings(): Promise<AiSettings | null> {
    return apiFetch<AiSettings | null>(BASE_URL);
}

export async function saveAiSettings(data: SaveAiSettingsData): Promise<AiSettings> {
    return apiFetch<AiSettings>(BASE_URL, {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify(data),
    });
}

export async function deleteAiSettings(): Promise<null> {
    return apiFetch<null>(BASE_URL, {
        method: 'DELETE',
    });
}
