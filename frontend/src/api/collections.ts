import { JSON_HEADERS, apiFetch } from './utils';
import type { Collection } from './types';

const BASE_URL = `${import.meta.env.VITE_API_URL}/collections`;

export interface CollectionInput {
    name: string;
    description?: string | null;
}

export async function getAllCollections(): Promise<Collection[]> {
    return apiFetch<Collection[]>(BASE_URL, { silent: true });
}

export async function createCollection(data: CollectionInput): Promise<Collection> {
    return apiFetch<Collection>(BASE_URL, {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify(data),
    });
}

export async function updateCollection(id: number | string, data: Partial<CollectionInput>): Promise<Collection> {
    return apiFetch<Collection>(`${BASE_URL}/${id}`, {
        method: 'PATCH',
        headers: JSON_HEADERS,
        body: JSON.stringify(data),
    });
}

export async function deleteCollection(id: number | string): Promise<{ message?: string }> {
    return apiFetch<{ message?: string }>(`${BASE_URL}/${id}`, {
        method: 'DELETE',
    });
}
