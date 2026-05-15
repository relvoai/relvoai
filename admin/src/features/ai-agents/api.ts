import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../../core/http/axios';
import { client, ApiResponse } from '../../core/http/client';
import { ENDPOINTS } from '../../core/http/endpoints';

// ============================================================================
// Types — mirror App\Models\Ai\* + AiCreditController response
// ============================================================================

export type KnowledgeType = 'pdf' | 'text' | 'url';
export type KnowledgeStatus = 'processing' | 'ready' | 'failed';
export type CreditReason = 'chat' | 'train' | 'refill' | 'adjust' | 'grant';

export interface AiAgentChannelPivot {
    is_primary: boolean;
}

export interface AiAgentChannel {
    id: string;
    name: string;
    pivot?: AiAgentChannelPivot;
}

export interface AiAgentHandoffPolicy {
    trigger?: 'on_low_confidence' | 'on_keyword' | 'never';
    keywords?: string[];
    confidence_threshold?: number;
    message?: string;
    [key: string]: unknown;
}

export interface AiAgentResource {
    id: string;
    name: string;
    identity_persona: string | null;
    welcome_message: string | null;
    custom_instructions: string | null;
    provider: string | null;
    model: string | null;
    temperature: number | null;
    is_active: boolean;
    handoff_policy: AiAgentHandoffPolicy | null;
    meta: Record<string, unknown> | null;
    created_at: string | null;
    updated_at: string | null;
    channels?: AiAgentChannel[];
    knowledge_sources?: AiKnowledgeSourceResource[];
    knowledgeSources?: AiKnowledgeSourceResource[];
}

export interface AiKnowledgeSourceResource {
    id: string;
    ai_agent_id: string;
    type: KnowledgeType;
    name: string;
    status: KnowledgeStatus;
    chunk_count: number;
    token_count: number;
    last_indexed_at: string | null;
    last_error: string | null;
    source_url: string | null;
    raw_text: string | null;
    storage_path: string | null;
    disk: string | null;
    created_at: string | null;
    updated_at: string | null;
}

export interface AiCreditLedgerEntry {
    id: string;
    ai_agent_id: string | null;
    conversation_id: string | null;
    delta: number;
    reason: CreditReason;
    tokens_prompt: number;
    tokens_completion: number;
    cost_usd: number | null;
    provider: string | null;
    model: string | null;
    meta: Record<string, unknown> | null;
    created_at: string | null;
}

export interface AiCreditSummary {
    balance: number;
    monthly_refill: number;
    last_refilled_at: string | null;
    ledger: AiCreditLedgerEntry[];
}

// ============================================================================
// Payloads
// ============================================================================

export interface AgentUpsertPayload {
    name?: string;
    identity_persona?: string | null;
    welcome_message?: string | null;
    custom_instructions?: string | null;
    provider?: string | null;
    model?: string | null;
    temperature?: number | null;
    is_active?: boolean;
    handoff_policy?: AiAgentHandoffPolicy | null;
}

export interface CreateAgentPayload extends AgentUpsertPayload {
    name: string;
}

export interface AttachChannelPayload {
    is_primary?: boolean;
}

export type CreateKnowledgePayload =
    | {
          type: 'text';
          name: string;
          raw_text: string;
      }
    | {
          type: 'url';
          name: string;
          source_url: string;
      }
    | {
          type: 'pdf';
          name: string;
          file: File;
      };

export interface GrantCreditsPayload {
    amount: number;
    note?: string | null;
}

// ============================================================================
// Query Keys
// ============================================================================

export const agentKeys = {
    all: ['ai-agents'] as const,
    detail: (id: string) => ['ai-agent', id] as const,
    knowledge: (agentId: string) => ['ai-agent', agentId, 'knowledge'] as const,
};

export const creditKeys = {
    summary: ['ai-credits'] as const,
};

// ============================================================================
// Helpers
// ============================================================================

/** Agent detail may come back with either `knowledgeSources` (relation name) or `knowledge_sources` (snake). Normalize. */
export function normalizeAgent(agent: AiAgentResource): AiAgentResource {
    return {
        ...agent,
        knowledge_sources: agent.knowledge_sources ?? agent.knowledgeSources ?? [],
    };
}

export function fullName(agent: AiAgentResource): string {
    return agent.name || 'Untitled Agent';
}

// ============================================================================
// Agent Queries
// ============================================================================

export function useAiAgents() {
    return useQuery({
        queryKey: agentKeys.all,
        queryFn: async () => {
            const response = await client.get<AiAgentResource[]>(ENDPOINTS.aiAgents.list);
            return response.data;
        },
    });
}

export function useAiAgent(id: string | undefined) {
    return useQuery({
        queryKey: id ? agentKeys.detail(id) : ['ai-agent', 'null'],
        queryFn: async () => {
            const response = await client.get<AiAgentResource>(ENDPOINTS.aiAgents.show(id!));
            return normalizeAgent(response.data);
        },
        enabled: !!id,
    });
}

// ============================================================================
// Agent Mutations
// ============================================================================

export function useCreateAiAgent() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (data: CreateAgentPayload) => {
            const response = await client.post<AiAgentResource>(ENDPOINTS.aiAgents.create, data);
            return response.data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: agentKeys.all });
        },
    });
}

export function useUpdateAiAgent() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: AgentUpsertPayload }) => {
            const response = await client.put<AiAgentResource>(ENDPOINTS.aiAgents.update(id), data);
            return response.data;
        },
        onSuccess: (_, { id }) => {
            qc.invalidateQueries({ queryKey: agentKeys.detail(id) });
            qc.invalidateQueries({ queryKey: agentKeys.all });
        },
    });
}

export function useDeleteAiAgent() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await client.delete(ENDPOINTS.aiAgents.delete(id));
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: agentKeys.all });
        },
    });
}

export function useAttachAgentChannel() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({
            agentId,
            channelId,
            data,
        }: {
            agentId: string;
            channelId: string;
            data?: AttachChannelPayload;
        }) => {
            await client.post(ENDPOINTS.aiAgents.attachChannel(agentId, channelId), data ?? {});
        },
        onSuccess: (_, { agentId }) => {
            qc.invalidateQueries({ queryKey: agentKeys.detail(agentId) });
            qc.invalidateQueries({ queryKey: agentKeys.all });
        },
    });
}

export function useDetachAgentChannel() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ agentId, channelId }: { agentId: string; channelId: string }) => {
            await client.delete(ENDPOINTS.aiAgents.detachChannel(agentId, channelId));
        },
        onSuccess: (_, { agentId }) => {
            qc.invalidateQueries({ queryKey: agentKeys.detail(agentId) });
            qc.invalidateQueries({ queryKey: agentKeys.all });
        },
    });
}

// ============================================================================
// Knowledge Queries / Mutations
// ============================================================================

export function useKnowledgeSources(agentId: string | undefined, options?: { refetchInterval?: number | false }) {
    return useQuery({
        queryKey: agentId ? agentKeys.knowledge(agentId) : ['ai-agent', 'null', 'knowledge'],
        queryFn: async () => {
            const response = await client.get<AiKnowledgeSourceResource[]>(
                ENDPOINTS.aiAgents.knowledgeList(agentId!)
            );
            return response.data;
        },
        enabled: !!agentId,
        refetchInterval: options?.refetchInterval,
    });
}

export function useCreateKnowledgeSource() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({
            agentId,
            data,
        }: {
            agentId: string;
            data: CreateKnowledgePayload;
        }): Promise<AiKnowledgeSourceResource> => {
            if (data.type === 'pdf') {
                const form = new FormData();
                form.append('type', 'pdf');
                form.append('name', data.name);
                form.append('file', data.file);
                const response = await axiosInstance.post<ApiResponse<AiKnowledgeSourceResource>>(
                    ENDPOINTS.aiAgents.knowledgeCreate(agentId),
                    form,
                    { headers: { 'Content-Type': 'multipart/form-data' } }
                );
                return response.data.data;
            }

            const payload =
                data.type === 'text'
                    ? { type: 'text', name: data.name, raw_text: data.raw_text }
                    : { type: 'url', name: data.name, source_url: data.source_url };

            const response = await client.post<AiKnowledgeSourceResource>(
                ENDPOINTS.aiAgents.knowledgeCreate(agentId),
                payload
            );
            return response.data;
        },
        onSuccess: (_, { agentId }) => {
            qc.invalidateQueries({ queryKey: agentKeys.knowledge(agentId) });
            qc.invalidateQueries({ queryKey: agentKeys.detail(agentId) });
        },
    });
}

export function useDeleteKnowledgeSource() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ agentId, sourceId }: { agentId: string; sourceId: string }) => {
            await client.delete(ENDPOINTS.aiAgents.knowledgeDelete(agentId, sourceId));
        },
        onSuccess: (_, { agentId }) => {
            qc.invalidateQueries({ queryKey: agentKeys.knowledge(agentId) });
        },
    });
}

export function useReindexKnowledgeSource() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ agentId, sourceId }: { agentId: string; sourceId: string }) => {
            const response = await client.post<AiKnowledgeSourceResource>(
                ENDPOINTS.aiAgents.knowledgeReindex(agentId, sourceId)
            );
            return response.data;
        },
        onSuccess: (_, { agentId }) => {
            qc.invalidateQueries({ queryKey: agentKeys.knowledge(agentId) });
        },
    });
}

// ============================================================================
// Credits
// ============================================================================

export function useAiCredits() {
    return useQuery({
        queryKey: creditKeys.summary,
        queryFn: async () => {
            const response = await client.get<AiCreditSummary>(ENDPOINTS.aiCredits.show);
            return response.data;
        },
    });
}

export function useGrantCredits() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (data: GrantCreditsPayload) => {
            const response = await client.post<{ balance: number }>(ENDPOINTS.aiCredits.grant, data);
            return response.data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: creditKeys.summary });
        },
    });
}
