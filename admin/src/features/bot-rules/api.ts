import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '../../core/http/client';
import { ENDPOINTS } from '../../core/http/endpoints';

export interface BotRuleResource {
    id: string;
    inbox_id: string;
    name: string;
    trigger_type: 'keyword' | 'regex' | 'exact';
    keywords: string[];
    reply_content: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export const botRuleKeys = {
    all: ['bot-rules'] as const,
    list: (inboxId?: string) => ['bot-rules', { inboxId }] as const,
};

export function useBotRules(inboxId?: string) {
    return useQuery({
        queryKey: botRuleKeys.list(inboxId),
        queryFn: async () => {
            const params = inboxId ? { inbox_id: inboxId } : {};
            const response = await client.get<BotRuleResource[]>(ENDPOINTS.botRules.list, params);
            return response.data;
        },
    });
}

export function useCreateBotRule() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: {
            inbox_id: string;
            name: string;
            trigger_type: string;
            keywords: string[];
            reply_content: string;
            is_active?: boolean;
        }) => {
            const response = await client.post(ENDPOINTS.botRules.create, data);
            return response.data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: botRuleKeys.all }),
    });
}

export function useUpdateBotRule() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<BotRuleResource> }) => {
            const response = await client.put(ENDPOINTS.botRules.update(id), data);
            return response.data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: botRuleKeys.all }),
    });
}

export function useDeleteBotRule() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await client.delete(ENDPOINTS.botRules.delete(id));
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: botRuleKeys.all }),
    });
}
