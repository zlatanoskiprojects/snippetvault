import { apiFetch } from './utils';
import type { SharedSnippet } from './types';

const BASE_URL = `${import.meta.env.VITE_API_URL}/share`;

export async function getSharedSnippet(token: string): Promise<SharedSnippet> {
    return apiFetch<SharedSnippet>(`${BASE_URL}/${encodeURIComponent(token)}`, { silent: true });
}
