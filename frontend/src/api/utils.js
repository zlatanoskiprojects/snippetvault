export const JSON_HEADERS = { 'Content-Type': 'application/json' };

export async function throwIfNotOk(response) {
    if (!response.ok) {
        const generic = response.status === 401 ? 'Unauthorized' : `Server error: ${response.status}`;
        let message;
        try {
            const body = await response.json();
            message = body.message || body.error || generic;
        } catch {
            message = generic;
        }
        const err = new Error(message);
        err.status = response.status;
        throw err;
    }
}