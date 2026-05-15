import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { client } from '../../core/http/client';
import { ENDPOINTS } from '../../core/http/endpoints';
import { useAuthStore } from '../../core/auth/authStore';
import { UserResource } from '../../types';

// ============================================================================
// Types
// ============================================================================

interface LoginPayload {
    email: string;
    password: string;
}

interface LoginResponse {
    token: string;
    user: UserResource;
}

// ============================================================================
// Query Keys
// ============================================================================

export const authKeys = {
    me: ['me'] as const,
};

// ============================================================================
// Queries
// ============================================================================

/**
 * GET /me - Get the authenticated user
 * Called on app boot to validate session
 */
export function useCurrentUser() {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

    return useQuery({
        queryKey: authKeys.me,
        queryFn: async () => {
            const response = await client.get<UserResource>(ENDPOINTS.auth.me);
            return response.data;
        },
        enabled: isAuthenticated,
    });
}

// ============================================================================
// Mutations
// ============================================================================

/**
 * POST /login - Log the user in and return a token
 * On success: store token, store user, invalidate queries
 */
export function useLogin() {
    const queryClient = useQueryClient();
    const loginSuccess = useAuthStore((state) => state.loginSuccess);

    return useMutation({
        mutationFn: async (payload: LoginPayload) => {
            const response = await client.post<LoginResponse>(ENDPOINTS.auth.login, payload);
            return response.data;
        },
        onSuccess: (data) => {
            loginSuccess(data.token, data.user);
            queryClient.invalidateQueries({ queryKey: authKeys.me });
        },
    });
}

/**
 * POST /logout - Log the user out (revoke token)
 * On success: clear auth store, reset queries
 */
export function useLogout() {
    const queryClient = useQueryClient();
    const logout = useAuthStore((state) => state.logout);

    return useMutation({
        mutationFn: async () => {
            await client.post(ENDPOINTS.auth.logout);
        },
        onSuccess: () => {
            logout();
            queryClient.clear();
        },
        onError: () => {
            // Even if logout fails, clear local state
            logout();
            queryClient.clear();
        },
    });
}
