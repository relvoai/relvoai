import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { client } from '../../../core/http/client';

// ============================================================================
// Types — mirror backend AiCustomTool resource
// ============================================================================

export type AiToolHttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type AiToolAuthType = 'none' | 'bearer' | 'header';

export interface AiToolParameter {
    type: string;
    description?: string;
    required?: boolean;
}

export type AiToolParameterSchema = Record<string, AiToolParameter>;

export interface AiCustomTool {
    id: string;
    workspace_id: string;
    ai_agent_id: string | null;
    name: string;
    description: string | null;
    parameter_schema: AiToolParameterSchema;
    endpoint: string;
    http_method: AiToolHttpMethod;
    auth_type: AiToolAuthType;
    auth_value?: string | null;
    rate_limit_per_minute: number;
    response_size_limit: number;
    timeout_seconds: number;
    enabled: boolean;
    created_at: string | null;
    updated_at: string | null;
}

export interface CreateAiToolPayload {
    name: string;
    description?: string;
    endpoint: string;
    http_method: AiToolHttpMethod;
    auth_type: AiToolAuthType;
    auth_value?: string;
    rate_limit_per_minute: number;
    response_size_limit: number;
    timeout_seconds: number;
    parameter_schema: AiToolParameterSchema;
    ai_agent_id?: string | null;
    enabled?: boolean;
}

// ============================================================================
// Endpoints + Query Keys
// ============================================================================

const AI_TOOLS_BASE = '/admin/enterprise/ai-tools';

export const aiToolKeys = {
    all: ['enterprise', 'ai-tools'] as const,
    detail: (id: string) => ['enterprise', 'ai-tools', id] as const,
};

// ============================================================================
// Queries
// ============================================================================

export function useAiTools() {
    return useQuery({
        queryKey: aiToolKeys.all,
        queryFn: async () => {
            const response = await client.get<AiCustomTool[]>(AI_TOOLS_BASE);
            return response.data;
        },
        retry: false,
    });
}

// ============================================================================
// Mutations
// ============================================================================

export function useCreateAiTool() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (payload: CreateAiToolPayload) => {
            const response = await client.post<AiCustomTool>(AI_TOOLS_BASE, payload);
            return response.data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: aiToolKeys.all });
        },
    });
}

export function useDeleteAiTool() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await client.delete(`${AI_TOOLS_BASE}/${id}`);
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: aiToolKeys.all });
        },
    });
}
