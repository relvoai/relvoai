import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { client } from '../../core/http/client';
import { ENDPOINTS } from '../../core/http/endpoints';
import { AdminConversationResource, MessageResource, UserResource, DepartmentResource, VisitorResource } from '../../types';

// ============================================================================
// Types
// ============================================================================

interface ConversationFilters {
    status?: 'open' | 'closed' | 'pending';
    assigned_to_me?: boolean;
}

interface ReplyPayload {
    body: string;
    /**
     * When true, creates an internal note instead of a visitor-facing reply.
     * Maps to the backend's `is_note` flag (see StoreAgentReplyRequest).
     */
    is_note?: boolean;
    attachments?: string[];
}

interface TransferPayload {
    /**
     * Backend expects `to_user_id` / `to_department_id` (see TransferConversationRequest).
     */
    to_user_id?: string | null;
    to_department_id?: string | null;
    note?: string | null;
}

// ============================================================================
// Query Keys
// ============================================================================

export const conversationKeys = {
    all: ['conversations'] as const,
    list: (filters?: ConversationFilters) => ['conversations', filters] as const,
    detail: (id: string) => ['conversation', id] as const,
};

// ============================================================================
// Queries
// ============================================================================

/**
 * GET /admin/conversations - List conversations with filters
 */
export function useConversations(filters?: ConversationFilters) {
    return useQuery({
        queryKey: conversationKeys.list(filters),
        queryFn: async () => {
            const response = await client.get<AdminConversationResource[]>(
                ENDPOINTS.conversations.list,
                filters
            );
            return response.data;
        },
    });
}

/**
 * GET /admin/conversations/{id} - Get conversation details with messages
 */
export function useConversation(id: string) {
    return useQuery({
        queryKey: conversationKeys.detail(id),
        queryFn: async () => {
            const response = await client.get<AdminConversationResource>(
                ENDPOINTS.conversations.show(id)
            );
            return response.data;
        },
        enabled: !!id,
    });
}

// ============================================================================
// Mutations
// ============================================================================

/**
 * POST /admin/conversations/{id}/reply - Send agent reply or note
 */
export function useReplyToConversation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: ReplyPayload }) => {
            const response = await client.post<MessageResource>(
                ENDPOINTS.conversations.reply(id),
                data
            );
            return response.data;
        },
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: conversationKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: conversationKeys.all });
        },
    });
}

/**
 * POST /admin/conversations/{id}/join - Join conversation as participant
 */
export function useJoinConversation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await client.post(ENDPOINTS.conversations.join(id));
        },
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: conversationKeys.detail(id) });
        },
    });
}

/**
 * POST /admin/conversations/{id}/leave - Leave conversation
 */
export function useLeaveConversation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await client.post(ENDPOINTS.conversations.leave(id));
        },
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: conversationKeys.detail(id) });
        },
    });
}

/**
 * POST /admin/conversations/{id}/transfer - Transfer to user/department
 */
export function useTransferConversation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: TransferPayload }) => {
            await client.post(ENDPOINTS.conversations.transfer(id), data);
        },
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: conversationKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: conversationKeys.all });
        },
    });
}

/**
 * POST /admin/conversations/{id}/close - Close conversation
 */
export function useCloseConversation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await client.post(ENDPOINTS.conversations.close(id));
        },
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: conversationKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: conversationKeys.all });
        },
    });
}
