import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { client } from '../../core/http/client';
import { ENDPOINTS } from '../../core/http/endpoints';

// ============================================================================
// Types (from api.json)
// ============================================================================

export interface SettingResource {
    key: string;
    value: unknown;
    type: string;
    label: string;
    description: string | null;
}

interface UpdateSettingPayload {
    value: unknown;
}

// ============================================================================
// Query Keys
// ============================================================================

export const settingKeys = {
    all: ['settings'] as const,
};

// ============================================================================
// Queries
// ============================================================================

/**
 * GET /admin/settings - List all settings
 */
export function useSettings() {
    return useQuery({
        queryKey: settingKeys.all,
        queryFn: async () => {
            const response = await client.get<SettingResource[]>(ENDPOINTS.settings.list);
            return response.data;
        },
    });
}

// ============================================================================
// Mutations
// ============================================================================

/**
 * PUT /admin/settings/{key} - Update setting
 */
export function useUpdateSetting() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ key, data }: { key: string; data: UpdateSettingPayload }) => {
            const response = await client.put<SettingResource>(ENDPOINTS.settings.update(key), data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: settingKeys.all });
        },
    });
}
