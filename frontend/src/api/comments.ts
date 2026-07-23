import { JSON_HEADERS, apiFetch } from './utils';
import type { Comment } from './types';

const BASE_URL = import.meta.env.VITE_API_URL;

export interface CommentInput {
    content: string;
}

export async function getCommentsBySnippetId(snippetId: number | string): Promise<Comment[]> {
    return apiFetch<Comment[]>(`${BASE_URL}/snippets/${snippetId}/comments`);
}

export async function createComment(snippetId: number | string, data: CommentInput): Promise<Comment> {
    return apiFetch<Comment>(`${BASE_URL}/snippets/${snippetId}/comments`, {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify(data),
    });
}

export async function updateComment(id: number | string, data: CommentInput): Promise<Comment> {
    return apiFetch<Comment>(`${BASE_URL}/comments/${id}`, {
        method: 'PATCH',
        headers: JSON_HEADERS,
        body: JSON.stringify(data),
    });
}

export async function deleteComment(id: number | string): Promise<Comment | null> {
    return apiFetch<Comment | null>(`${BASE_URL}/comments/${id}`, {
        method: 'DELETE',
    });
}
