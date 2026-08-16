import { notifyError } from '../contexts/ToastContext';

export const JSON_HEADERS = { 'Content-Type': 'application/json' };

export class ApiError extends Error {
    status: number;
    code?: string;
    method?: 'password' | 'oauth';

    constructor(
        message: string,
        status: number,
        details?: { code?: string; method?: 'password' | 'oauth' },
    ) {
        super(message);
        this.status = status;
        this.code = details?.code;
        this.method = details?.method;
    }
}

const FRIENDLY_BY_STATUS: Record<number, string> = {
    0: 'Network problem — check your connection and try again.',
    400: 'That request was invalid.',
    401: 'Your session has expired. Please sign in again.',
    403: "You don't have access to that.",
    404: "We couldn't find what you were looking for.",
    409: 'That conflicts with something that already exists.',
    429: 'Too many requests — please wait a moment.',
};

function friendlyMessage(status: number): string {
    if (status >= 500) return 'Something went wrong on our end. Please try again.';
    return FRIENDLY_BY_STATUS[status] ?? 'Something went wrong. Please try again.';
}

function parseJson(body: string): any {
    if (!body) return null;
    try {
        return JSON.parse(body);
    } catch {
        return null;
    }
}

export interface ApiFetchOptions extends RequestInit {
    silent?: boolean;
}

export async function apiFetch<T>(url: string, options: ApiFetchOptions = {}): Promise<T> {
    const { silent, ...init } = options;
    const method = init.method ?? 'GET';

    let response: Response;
    try {
        response = await fetch(url, { credentials: 'include', ...init });
    } catch (err) {
        console.error(`[api] ${method} ${url} — network failure`, err);
        if (!silent) notifyError(friendlyMessage(0));
        throw new ApiError('Unable to reach the server', 0);
    }

    const body = await response.text().catch(() => '');

    if (!response.ok) {
        const generic = response.status === 401 ? 'Unauthorized' : `Server error: ${response.status}`;
        const parsed = parseJson(body);
        const message = parsed?.message || parsed?.error || (Array.isArray(parsed?.errors) && parsed.errors[0]?.msg) || generic;
        console.error(`[api] ${method} ${url} — ${response.status} ${response.statusText}`);
        if (!silent && response.status !== 401) notifyError(friendlyMessage(response.status));
        throw new ApiError(message, response.status, {
            code: parsed?.code ?? parsed?.error,
            method: parsed?.method,
        });
    }

    if (!body) return null as T;

    try {
        return JSON.parse(body) as T;
    } catch (err) {
        console.error(`[api] ${method} ${url} — malformed JSON response`, err);
        if (!silent) notifyError('The server sent an unexpected response.');
        throw new ApiError('Malformed response from server', response.status);
    }
}
