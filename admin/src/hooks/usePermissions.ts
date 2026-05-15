import { useAuthStore } from '../core/auth/authStore';

/**
 * Returns a `can(permission)` helper plus the flat set of the current user's permission names.
 * Permissions come from the `/me` response (see backend UserResource::toArray).
 *
 * Example: `const { can } = usePermissions(); can('ai.agents.manage')`
 */
export function usePermissions(): {
    permissions: string[];
    can: (permission: string) => boolean;
    canAny: (...permissions: string[]) => boolean;
    isAdmin: boolean;
} {
    const user = useAuthStore((state) => state.user);
    const permissions = user?.permissions ?? [];
    const roles = user?.roles ?? [];
    const isAdmin = roles.includes('admin') || roles.includes('owner');

    const can = (permission: string): boolean => {
        if (isAdmin) {
            return true;
        }
        return permissions.includes(permission);
    };

    const canAny = (...needed: string[]): boolean => needed.some((p) => can(p));

    return { permissions, can, canAny, isAdmin };
}
