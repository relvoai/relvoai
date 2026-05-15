import { useQuery } from '@tanstack/react-query';
import { client } from '../../core/http/client';
import { ENDPOINTS } from '../../core/http/endpoints';
import { VisitorResource } from '../../types';

// ============================================================================
// Query Keys
// ============================================================================

export const visitorKeys = {
    online: ['visitors', 'online'] as const,
};

// ============================================================================
// Queries
// ============================================================================

/**
 * GET /admin/visitors/online - List online visitors
 * Polls every 30 seconds
 */
export function useOnlineVisitors() {
    return useQuery({
        queryKey: visitorKeys.online,
        queryFn: async () => {
            const response = await client.get<VisitorResource[]>(ENDPOINTS.visitors.online);
            return response.data;
        },
        refetchInterval: 30000, // Poll every 30 seconds
    });
}
