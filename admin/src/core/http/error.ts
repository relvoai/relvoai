import { AxiosError } from 'axios';

/**
 * Shape of a Laravel validation / API error response.
 */
export interface ApiErrorBody {
    success?: false;
    message?: string;
    errors?: Record<string, string[] | string>;
}

/**
 * Extract a user-readable message from an API error.
 *
 * Priority:
 *   1. First validation error (from `errors` object)
 *   2. Top-level `message`
 *   3. Generic fallback
 */
export function extractApiError(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
    if (!error) return fallback;

    const axiosErr = error as AxiosError<ApiErrorBody>;
    const body = axiosErr?.response?.data;

    if (body?.errors && typeof body.errors === 'object') {
        const first = Object.values(body.errors)[0];
        if (Array.isArray(first) && first.length > 0) {
            return String(first[0]);
        }
        if (typeof first === 'string' && first.length > 0) {
            return first;
        }
    }

    if (body?.message && typeof body.message === 'string') {
        return body.message;
    }

    if (error instanceof Error && error.message) {
        return error.message;
    }

    return fallback;
}
