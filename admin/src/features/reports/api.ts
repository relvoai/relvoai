import { useQuery } from '@tanstack/react-query';
import { client } from '../../core/http/client';
import { ENDPOINTS } from '../../core/http/endpoints';

// ============================================================================
// Types (from api.json)
// ============================================================================

export interface ReportData {
    summary: {
        total_conversations: number;
        avg_response_time_seconds: number;
    };
    daily: Array<{
        date: string;
        conversations: number | string;
        messages: number | string;
    }>;
}

interface ReportParams {
    start_date: string;
    end_date: string;
    timezone?: string;
}

// ============================================================================
// Query Keys
// ============================================================================

export const reportKeys = {
    all: ['reports'] as const,
    list: (params: ReportParams) => ['reports', params] as const,
};

// ============================================================================
// Queries
// ============================================================================

/**
 * GET /admin/reports - Get report statistics
 */
export function useReports(params: ReportParams) {
    return useQuery({
        queryKey: reportKeys.list(params),
        queryFn: async () => {
            const response = await client.get<ReportData>(ENDPOINTS.reports.list, params);
            return response.data;
        },
        enabled: !!params.start_date && !!params.end_date,
    });
}
