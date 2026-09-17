const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

export class ApiError extends Error {
    status: number;
    code?: string;

    constructor(message: string, status: number, code?: string) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.code = code;
    }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });

    const contentType = response.headers.get('Content-Type');

    const body = contentType?.includes('application/json')
        ? await response.json()
        : null;

     if (!response.ok) {
        throw new ApiError(body?.error?.message ?? 'An unexpected error occured.',
            response.status,
            body?.error?.code
        )
     }
    
    return body as T;
}