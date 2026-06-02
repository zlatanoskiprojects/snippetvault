const BASE_URL = 'http://localhost:3000/api/snippets';

function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
}

export async function getAllSnippets() {
    const response = await fetch(`${BASE_URL}`, {
        headers: getAuthHeaders()
    });
    if (!response.ok) {
        const err = new Error(response.status === 401 ? 'Unauthorized' : `Server error: ${response.status}`);
        err.status = response.status;
        throw err;
    }
    return response.json();
}

export async function getSnippetById(id) {
    const response = await fetch(`${BASE_URL}/${id}`, {
        headers: getAuthHeaders()
    });
    return response.json();
}
export async function createSnippet(data) {
    const response = await fetch(`${BASE_URL}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
    });
    return response.json();
}

export async function deleteSnippet(id) {
    const response = await fetch(`${BASE_URL}/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
    });
    return response.json();
}

export async function updateSnippet(id, data) {
    const response = await fetch(`${BASE_URL}/${id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
    });
    return response.json();
    }
