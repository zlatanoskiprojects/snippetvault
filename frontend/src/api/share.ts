import { throwIfNotOk } from './utils';
import type { SharedSnippet } from './types';

const BASE_URL = `${import.meta.env.VITE_API_URL}/share`;

export async function getSharedSnippet(token: string): Promise<SharedSnippet> {
    const response = await fetch(`${BASE_URL}/${encodeURIComponent(token)}`, {
        credentials: 'include',
    });
    await throwIfNotOk(response);
    return response.json();
}
