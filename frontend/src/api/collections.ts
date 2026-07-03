import { JSON_HEADERS, throwIfNotOk } from './utils';
import type { Collection } from './types';

const BASE_URL = `${import.meta.env.VITE_API_URL}/collections`;

export interface CollectionInput {
    name: string;
    description?: string | null;
}

export async function getAllCollections(): Promise<Collection[]> {
    const response = await fetch(BASE_URL, {
        credentials: 'include',
    });
    await throwIfNotOk(response);
    return response.json();
}

export async function createCollection(data: CollectionInput): Promise<Collection> {
    const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: JSON_HEADERS,
        credentials: 'include',
        body: JSON.stringify(data),
    });
    await throwIfNotOk(response);
    return response.json();
}

export async function updateCollection(id: number | string, data: Partial<CollectionInput>): Promise<Collection> {
    const response = await fetch(`${BASE_URL}/${id}`, {
        method: 'PATCH',
        headers: JSON_HEADERS,
        credentials: 'include',
        body: JSON.stringify(data),
    });
    await throwIfNotOk(response);
    return response.json();
}

export async function deleteCollection(id: number | string): Promise<{ message?: string }> {
    const response = await fetch(`${BASE_URL}/${id}`, {
        method: 'DELETE',
        credentials: 'include',
    });
    await throwIfNotOk(response);
    return response.json();
}
