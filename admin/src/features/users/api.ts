import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { client } from '../../core/http/client';
import { ENDPOINTS } from '../../core/http/endpoints';
import { UserResource } from '../../types';

// ============================================================================
// Types (from api.json)
// ============================================================================

/**
 * Payload for POST /admin/users. Note that the backend uses:
 *   - `roles` (array of role names, not ids — matches StoreUserRequest)
 *   - `departments` (array of department ids)
 *   - `password_confirmation` is required (Laravel `confirmed` rule)
 */
interface CreateUserPayload {
    first_name: string;
    last_name: string;
    email: string;
    username: string;
    password: string;
    password_confirmation: string;
    is_active?: boolean;
    roles?: string[];
    departments?: string[];
}

interface UpdateUserPayload {
    first_name?: string;
    last_name?: string;
    email?: string;
    username?: string;
    password?: string;
    password_confirmation?: string;
    is_active?: boolean;
    roles?: string[];
    departments?: string[];
}

// ============================================================================
// Query Keys
// ============================================================================

export const userKeys = {
    all: ['users'] as const,
    detail: (id: string) => ['user', id] as const,
};

// ============================================================================
// Queries
// ============================================================================

/**
 * GET /admin/users - List users (agents and admins)
 */
export function useUsers() {
    return useQuery({
        queryKey: userKeys.all,
        queryFn: async () => {
            const response = await client.get<UserResource[]>(ENDPOINTS.users.list);
            return response.data;
        },
    });
}

/**
 * GET /admin/users/{id} - Get user details
 */
export function useUser(id: string) {
    return useQuery({
        queryKey: userKeys.detail(id),
        queryFn: async () => {
            const response = await client.get<UserResource>(ENDPOINTS.users.show(id));
            return response.data;
        },
        enabled: !!id,
    });
}

// ============================================================================
// Mutations
// ============================================================================

/**
 * POST /admin/users - Create user
 */
export function useCreateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: CreateUserPayload) => {
            const response = await client.post<UserResource>(ENDPOINTS.users.create, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: userKeys.all });
        },
    });
}

/**
 * PUT /admin/users/{id} - Update user
 */
export function useUpdateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: UpdateUserPayload }) => {
            const response = await client.put<UserResource>(ENDPOINTS.users.update(id), data);
            return response.data;
        },
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: userKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: userKeys.all });
        },
    });
}

/**
 * DELETE /admin/users/{id} - Delete user
 */
export function useDeleteUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await client.delete(ENDPOINTS.users.delete(id));
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: userKeys.all });
        },
    });
}
