import { useQuery } from '@tanstack/react-query';
import { client } from '../../core/http/client';
import { ENDPOINTS } from '../../core/http/endpoints';

export interface AuditLogResource {
    id: string;
    event: string;
    user_id: string | null;
    user_name: string;
    auditable_type: string | null;
    auditable_id: string | null;
    old_values: Record<string, unknown> | null;
    new_values: Record<string, unknown> | null;
    ip_address: string | null;
    url: string | null;
    created_at: string;
}

export const auditLogKeys = {
    all: ['audit-logs'] as const,
    list: (params?: Record<string, string>) => ['audit-logs', params] as const,
};

export function useAuditLogs(params?: { search?: string; event?: string; per_page?: number }) {
    return useQuery({
        queryKey: auditLogKeys.list(params as Record<string, string>),
        queryFn: async () => {
            const response = await client.get<AuditLogResource[]>(ENDPOINTS.auditLogs.list, params);
            return response.data;
        },
    });
}
