const BASE_URL = 'http://localhost:3000/api/collections';

function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
    };
}

export async function getAllCollections() {
    const response = await fetch(BASE_URL, {
        headers: getAuthHeaders(),
    });
    return response.json();
}

export async function createCollection(data) {
    const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    });
    return response.json();
}

export async function updateCollection(id, data) {
    const response = await fetch(`${BASE_URL}/${id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    });
    return response.json();
}

export async function deleteCollection(id) {
    const response = await fetch(`${BASE_URL}/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });
    return response.json();
}

export async function assignSnippetToCollection(collectionId, snippetId) {
    const response = await fetch(`${BASE_URL}/${collectionId}/snippets/${snippetId}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
    });
    return response.json();
}