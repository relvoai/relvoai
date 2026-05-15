import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { client } from '../../core/http/client';
import { ENDPOINTS } from '../../core/http/endpoints';

// ============================================================================
// Types (from api.json)
// ============================================================================

export interface ChannelDetails {
    id: string;
    inbox_id: string;
    type: 'web_chat' | 'telegram' | 'api' | 'whatsapp' | 'email';
    name: string;
    is_active: boolean;
    channel_key: string | null;
    inbox_identifier: string | null;
    hmac_mandatory: boolean;
    webhook_url: string | null;
    config: Record<string, unknown> | null;
    created_at: string | null;
    updated_at: string | null;
    deleted_at: string | null;
    hmac_secret: string | null; // Always '****' for security
}

export interface ChannelType {
    type: string;
    label: string;
    description: string;
    logo_key: string;
    required_fields: string[];
    requires_setup: boolean;
    default_config: Record<string, unknown>;
}

interface UpdateChannelPayload {
    name?: string;
    is_active?: boolean;
    hmac_mandatory?: boolean;
    webhook_url?: string | null;
    config?: Record<string, unknown>;
}

interface UpdateDomainsPayload {
    domains: string[];
}

// ============================================================================
// Query Keys
// ============================================================================

export const channelKeys = {
    detail: (id: string) => ['channel', id] as const,
    embedScript: (id: string) => ['channel', id, 'embed-script'] as const,
    types: ['channelTypes'] as const,
};

// ============================================================================
// Queries
// ============================================================================

/**
 * GET /channels/{id} - Get channel settings
 */
export function useChannel(id: string) {
    return useQuery({
        queryKey: channelKeys.detail(id),
        queryFn: async () => {
            const response = await client.get<ChannelDetails>(ENDPOINTS.channels.show(id));
            return response.data;
        },
        enabled: !!id,
    });
}

/**
 * GET /channels/{id}/embed-script - Get embed script (web_chat only)
 */
export function useChannelEmbedScript(id: string, enabled = true) {
    return useQuery({
        queryKey: channelKeys.embedScript(id),
        queryFn: async () => {
            const response = await client.get<{ script: string }>(ENDPOINTS.channels.embedScript(id));
            return response.data;
        },
        enabled: !!id && enabled,
    });
}

/**
 * GET /channel-types - Get available channel types
 */
export function useChannelTypes() {
    return useQuery({
        queryKey: channelKeys.types,
        queryFn: async () => {
            // This endpoint returns array directly, not wrapped in ApiResponse
            const response = await client.get<ChannelType[]>(ENDPOINTS.setup.channelTypes);
            return response as unknown as ChannelType[];
        },
    });
}

// ============================================================================
// Mutations
// ============================================================================

/**
 * PUT /channels/{id} - Update channel settings
 */
export function useUpdateChannel() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: UpdateChannelPayload }) => {
            const response = await client.put<string>(ENDPOINTS.channels.update(id), data);
            return response.data;
        },
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: channelKeys.detail(id) });
        },
    });
}

/**
 * DELETE /channels/{id} - Delete channel
 */
export function useDeleteChannel() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await client.delete(ENDPOINTS.channels.delete(id));
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inboxes'] });
        },
    });
}

/**
 * POST /channels/{id}/rotate-hmac-secret - Rotate HMAC secret
 */
export function useRotateHmacSecret() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const response = await client.post<string>(ENDPOINTS.channels.rotateHmacSecret(id));
            return response.data; // New secret
        },
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: channelKeys.detail(id) });
        },
    });
}

/**
 * PUT /channels/{id}/domains - Update allowed domains (web_chat only)
 */
export function useUpdateChannelDomains() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: UpdateDomainsPayload }) => {
            const response = await client.put<{ channel: ChannelDetails; domains: string }>(
                ENDPOINTS.channels.domains(id),
                data
            );
            return response.data;
        },
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: channelKeys.detail(id) });
        },
    });
}
