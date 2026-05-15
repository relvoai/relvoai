import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { client } from '../../core/http/client';
import { ENDPOINTS } from '../../core/http/endpoints';
import { DepartmentResource } from '../../types';

// ============================================================================
// Types
// ============================================================================

interface CreateDepartmentPayload {
    name: string;
    is_active?: boolean;
}

interface UpdateDepartmentPayload {
    name?: string;
    is_active?: boolean;
}

// ============================================================================
// Query Keys
// ============================================================================

export const departmentKeys = {
    all: ['departments'] as const,
    detail: (id: string) => ['department', id] as const,
};

// ============================================================================
// Queries
// ============================================================================

/**
 * GET /admin/departments - List departments
 */
export function useDepartments() {
    return useQuery({
        queryKey: departmentKeys.all,
        queryFn: async () => {
            const response = await client.get<DepartmentResource[]>(ENDPOINTS.departments.list);
            return response.data;
        },
    });
}

/**
 * GET /admin/departments/{id} - Get department details
 */
export function useDepartment(id: string) {
    return useQuery({
        queryKey: departmentKeys.detail(id),
        queryFn: async () => {
            const response = await client.get<DepartmentResource>(ENDPOINTS.departments.show(id));
            return response.data;
        },
        enabled: !!id,
    });
}

// ============================================================================
// Mutations
// ============================================================================

/**
 * POST /admin/departments - Create department
 */
export function useCreateDepartment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: CreateDepartmentPayload) => {
            const response = await client.post<DepartmentResource>(ENDPOINTS.departments.create, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: departmentKeys.all });
        },
    });
}

/**
 * PUT /admin/departments/{id} - Update department
 */
export function useUpdateDepartment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: UpdateDepartmentPayload }) => {
            const response = await client.put<DepartmentResource>(ENDPOINTS.departments.update(id), data);
            return response.data;
        },
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: departmentKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: departmentKeys.all });
        },
    });
}

/**
 * DELETE /admin/departments/{id} - Delete department
 */
export function useDeleteDepartment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await client.delete(ENDPOINTS.departments.delete(id));
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: departmentKeys.all });
        },
    });
}
