import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { client } from '../../core/http/client';
import { ENDPOINTS } from '../../core/http/endpoints';

// ============================================================================
// Types (from api.json)
// ============================================================================

export interface Inbox {
    id: string;
    name: string;
    is_active: boolean;
    timezone: string | null;
    greeting_enabled: boolean;
    greeting_message: string | null;
    working_hours_enabled: boolean;
    out_of_office_message: string | null;
    working_hours: string[] | null;
    csat_survey_enabled: boolean;
    csat_config: string[] | null;
    enable_auto_assignment: boolean;
    auto_assignment_config: string[] | null;
    allow_messages_after_resolved: boolean;
    lock_to_single_conversation: boolean;
    sender_name_type: 'friendly' | 'professional';
    business_name: string | null;
    callback_webhook_url: string | null;
    agents_count: number;
    channels_count: number;
    created_at: string | null;
    updated_at: string | null;
    channels?: Channel[];
    agents?: User[];
}

export interface Channel {
    id: string;
    inbox_id: string;
    type: 'web_chat' | 'telegram' | 'api' | 'whatsapp' | 'email';
    name: string;
    is_active: boolean;
    channel_key: string | null;
    inbox_identifier: string | null;
    hmac_mandatory: boolean;
    webhook_url: string | null;
    config: unknown[] | null;
    created_at: string | null;
    updated_at: string | null;
    deleted_at: string | null;
}

export interface User {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar_url: string | null;
}

// Payloads
interface CreateInboxPayload {
    inbox: {
        name: string;
        greeting_enabled?: boolean;
        greeting_message?: string | null;
        timezone?: string;
    };
    channel: {
        type: 'web_chat' | 'telegram' | 'api' | 'whatsapp' | 'email';
        name: string;
        webhook_url?: string | null;
        config?: Record<string, unknown> | null;
    };
}

interface UpdateInboxPayload {
    name?: string;
    is_active?: boolean;
    greeting_enabled?: boolean;
    greeting_message?: string | null;
    working_hours_enabled?: boolean;
    timezone?: string | null;
    out_of_office_message?: string | null;
    working_hours?: string[] | null;
    csat_survey_enabled?: boolean;
    csat_config?: string[] | null;
    enable_auto_assignment?: boolean;
    auto_assignment_config?: string[] | null;
    allow_messages_after_resolved?: boolean;
    lock_to_single_conversation?: boolean;
    sender_name_type?: 'friendly' | 'professional';
    business_name?: string | null;
    callback_webhook_url?: string | null;
}

interface UpdateAgentsPayload {
    agent_ids: string[];
}

// ============================================================================
// Query Keys
// ============================================================================

export const inboxKeys = {
    all: ['inboxes'] as const,
    detail: (id: string) => ['inbox', id] as const,
};

// ============================================================================
// Queries
// ============================================================================

/**
 * GET /inboxes - List all inboxes
 */
export function useInboxes() {
    return useQuery({
        queryKey: inboxKeys.all,
        queryFn: async () => {
            const response = await client.get<Inbox[]>(ENDPOINTS.inboxes.list);
            return response.data;
        },
    });
}

/**
 * GET /inboxes/{id} - Get inbox details
 */
export function useInbox(id: string) {
    return useQuery({
        queryKey: inboxKeys.detail(id),
        queryFn: async () => {
            const response = await client.get<Inbox>(ENDPOINTS.inboxes.show(id));
            return response.data;
        },
        enabled: !!id,
    });
}

// ============================================================================
// Mutations
// ============================================================================

/**
 * POST /inboxes - Create inbox + channel (atomic)
 *
 * Backend returns { inbox, channel }. We normalize so consumers receive the
 * full payload (with .inbox.id, .channel.id, etc.).
 */
export interface CreateInboxResponse {
    inbox: Inbox;
    channel: Channel;
}

export function useCreateInbox() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: CreateInboxPayload) => {
            const response = await client.post<CreateInboxResponse>(ENDPOINTS.inboxes.create, payload);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inboxKeys.all });
        },
    });
}

/**
 * PUT /inboxes/{id} - Update inbox settings
 */
export function useUpdateInbox() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: UpdateInboxPayload }) => {
            const response = await client.put<Inbox>(ENDPOINTS.inboxes.update(id), data);
            return response.data;
        },
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: inboxKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: inboxKeys.all });
        },
    });
}

/**
 * DELETE /inboxes/{id} - Delete inbox
 */
export function useDeleteInbox() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await client.delete(ENDPOINTS.inboxes.delete(id));
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inboxKeys.all });
        },
    });
}

/**
 * PUT /inboxes/{id}/agents - Update assigned agents
 */
export function useUpdateInboxAgents() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: UpdateAgentsPayload }) => {
            const response = await client.put<{ id: string; agents_count: number; agents: User[] }>(
                ENDPOINTS.inboxes.agents(id),
                data
            );
            return response.data;
        },
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: inboxKeys.detail(id) });
        },
    });
}

/**
 * POST /inboxes/{id}/channels - Add channel to inbox
 */
export function useCreateChannel() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            inboxId,
            data,
        }: {
            inboxId: string;
            data: {
                type: 'web_chat' | 'telegram' | 'api' | 'whatsapp' | 'email';
                name: string;
                webhook_url?: string | null;
                config?: Record<string, unknown> | null;
            };
        }) => {
            const response = await client.post<Channel>(ENDPOINTS.inboxes.channels(inboxId), data);
            return response.data;
        },
        onSuccess: (_, { inboxId }) => {
            queryClient.invalidateQueries({ queryKey: inboxKeys.detail(inboxId) });
            queryClient.invalidateQueries({ queryKey: inboxKeys.all });
        },
    });
}
