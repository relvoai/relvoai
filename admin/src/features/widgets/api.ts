import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { client } from '../../core/http/client';
import { ENDPOINTS } from '../../core/http/endpoints';
import { WidgetResource, WidgetConfig } from '../../types';

// ============================================================================
// Types
// ============================================================================

interface CreateWidgetPayload {
    name: string;
    config?: Partial<WidgetConfig>;
    domains?: string[];
}

interface UpdateWidgetPayload {
    name?: string;
    is_active?: boolean;
    config?: Partial<WidgetConfig>;
    domains?: string[];
}

// ============================================================================
// Query Keys
// ============================================================================

export const widgetKeys = {
    all: ['widgets'] as const,
    detail: (id: string) => ['widget', id] as const,
};

// ============================================================================
// Queries
// ============================================================================

/**
 * GET /admin/widgets - List widgets
 */
export function useWidgets() {
    return useQuery({
        queryKey: widgetKeys.all,
        queryFn: async () => {
            const response = await client.get<WidgetResource[]>(ENDPOINTS.widgets.list);
            return response.data;
        },
    });
}

/**
 * GET /admin/widgets/{id} - Get widget details
 */
export function useWidget(id: string) {
    return useQuery({
        queryKey: widgetKeys.detail(id),
        queryFn: async () => {
            const response = await client.get<WidgetResource>(ENDPOINTS.widgets.show(id));
            return response.data;
        },
        enabled: !!id,
    });
}

// ============================================================================
// Mutations
// ============================================================================

/**
 * POST /admin/widgets - Create widget
 */
export function useCreateWidget() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: CreateWidgetPayload) => {
            const response = await client.post<WidgetResource>(ENDPOINTS.widgets.create, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: widgetKeys.all });
        },
    });
}

/**
 * PUT /admin/widgets/{id} - Update widget
 */
export function useUpdateWidget() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: UpdateWidgetPayload }) => {
            const response = await client.put<WidgetResource>(ENDPOINTS.widgets.update(id), data);
            return response.data;
        },
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: widgetKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: widgetKeys.all });
        },
    });
}

/**
 * DELETE /admin/widgets/{id} - Delete widget
 */
export function useDeleteWidget() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await client.delete(ENDPOINTS.widgets.delete(id));
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: widgetKeys.all });
        },
    });
}
