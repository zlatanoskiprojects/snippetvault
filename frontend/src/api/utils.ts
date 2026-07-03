export const JSON_HEADERS = { 'Content-Type': 'application/json' };

export class ApiError extends Error {
    status: number;

    constructor(message: string, status: number) {
        super(message);
        this.status = status;
    }
}

export async function throwIfNotOk(response: Response): Promise<void> {
    if (!response.ok) {
        const generic = response.status === 401 ? 'Unauthorized' : `Server error: ${response.status}`;
        let message: string;
        try {
            const body = await response.json();
            message = body.message || body.error || (Array.isArray(body.errors) && body.errors[0]?.msg) || generic;
        } catch {
            message = generic;
        }
        throw new ApiError(message, response.status);
    }
}
