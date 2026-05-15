import { QueryClient } from '@tanstack/react-query';

/**
 * TanStack Query client with sensible defaults
 * - No automatic retries on 401/403
 * - Default staleTime of 30 seconds
 */
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 30 * 1000, // 30 seconds
            retry: (failureCount, error) => {
                // Don't retry on auth errors
                if (error && typeof error === 'object' && 'response' in error) {
                    const status = (error as { response?: { status?: number } }).response?.status;
                    if (status === 401 || status === 403 || status === 404) {
                        return false;
                    }
                }
                return failureCount < 2;
            },
            refetchOnWindowFocus: false,
        },
        mutations: {
            retry: false,
        },
    },
});

export default queryClient;
