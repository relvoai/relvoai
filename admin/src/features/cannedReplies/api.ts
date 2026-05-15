import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { client } from '../../core/http/client';
import { ENDPOINTS } from '../../core/http/endpoints';
import { CannedReplyResource } from '../../types';

// ============================================================================
// Types
// ============================================================================

interface CreateCannedReplyPayload {
    shortcut: string;
    content: string;
    is_shared?: boolean;
}

// ============================================================================
// Query Keys
// ============================================================================

export const cannedReplyKeys = {
    all: ['cannedReplies'] as const,
    list: (search?: string) => ['cannedReplies', { search }] as const,
};

// ============================================================================
// Queries
// ============================================================================

/**
 * GET /admin/canned-replies - List canned replies with optional search
 */
export function useCannedReplies(search?: string) {
    return useQuery({
        queryKey: cannedReplyKeys.list(search),
        queryFn: async () => {
            const response = await client.get<CannedReplyResource[]>(
                ENDPOINTS.cannedReplies.list,
                search ? { search } : undefined
            );
            return response.data;
        },
    });
}

// ============================================================================
// Mutations
// ============================================================================

/**
 * POST /admin/canned-replies - Create canned reply
 */
export function useCreateCannedReply() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: CreateCannedReplyPayload) => {
            const response = await client.post<CannedReplyResource>(ENDPOINTS.cannedReplies.create, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: cannedReplyKeys.all });
        },
    });
}

/**
 * DELETE /admin/canned-replies/{id} - Delete canned reply
 */
export function useDeleteCannedReply() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await client.delete(ENDPOINTS.cannedReplies.delete(id));
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: cannedReplyKeys.all });
        },
    });
}
