import { useQuery } from '@tanstack/react-query';
import { client } from '../http/client';
import { useAuthStore } from '../auth/authStore';
import { queryClient } from '../query/queryClient';

// ============================================================================
// Types
// ============================================================================

export type LicenseEdition = 'community' | 'enterprise';
export type LicenseMode = 'missing' | 'test' | 'remote';

export interface LicenseStatus {
    valid: boolean;
    edition: LicenseEdition;
    mode: LicenseMode;
}

// ============================================================================
// Query Keys
// ============================================================================

export const licenseKeys = {
    all: ['license'] as const,
};

const LICENSE_ENDPOINT = '/admin/license';
const LICENSE_STALE_TIME = 5 * 60 * 1000; // 5 minutes

async function fetchLicense(): Promise<LicenseStatus> {
    const response = await client.get<LicenseStatus>(LICENSE_ENDPOINT);
    return response.data;
}

/**
 * GET /admin/license - Enterprise license status
 * Returns license validity, edition, and resolution mode.
 */
export function useLicense() {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

    const query = useQuery({
        queryKey: licenseKeys.all,
        queryFn: fetchLicense,
        enabled: isAuthenticated,
        staleTime: LICENSE_STALE_TIME,
    });

    return {
        status: query.data,
        isLoading: query.isLoading,
        isEnterprise: query.data?.valid === true && query.data?.edition === 'enterprise',
    };
}

/**
 * Prefetch the license query into the shared query client.
 * Call on app boot once the user is authenticated.
 */
export function prefetchLicense() {
    return queryClient.prefetchQuery({
        queryKey: licenseKeys.all,
        queryFn: fetchLicense,
        staleTime: LICENSE_STALE_TIME,
    });
}
