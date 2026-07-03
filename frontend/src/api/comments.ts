import { JSON_HEADERS, throwIfNotOk } from './utils';
import type { Comment } from './types';

const BASE_URL = import.meta.env.VITE_API_URL;

export interface CommentInput {
    content: string;
}

export async function getCommentsBySnippetId(snippetId: number | string): Promise<Comment[]> {
    const response = await fetch(`${BASE_URL}/snippets/${snippetId}/comments`, {
        credentials: 'include',
    });
    await throwIfNotOk(response);
    return response.json();
}

export async function createComment(snippetId: number | string, data: CommentInput): Promise<Comment> {
    const response = await fetch(`${BASE_URL}/snippets/${snippetId}/comments`, {
        method: 'POST',
        headers: JSON_HEADERS,
        credentials: 'include',
        body: JSON.stringify(data),
    });
    await throwIfNotOk(response);
    return response.json();
}

export async function updateComment(id: number | string, data: CommentInput): Promise<Comment> {
    const response = await fetch(`${BASE_URL}/comments/${id}`, {
        method: 'PATCH',
        headers: JSON_HEADERS,
        credentials: 'include',
        body: JSON.stringify(data),
    });
    await throwIfNotOk(response);
    return response.json();
}

export async function deleteComment(id: number | string): Promise<Comment | null> {
    const response = await fetch(`${BASE_URL}/comments/${id}`, {
        method: 'DELETE',
        credentials: 'include',
    });
    await throwIfNotOk(response);
    if (response.status === 204) return null;
    return response.json();
}
