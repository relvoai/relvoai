import { useQuery } from '@tanstack/react-query';
import { client } from '../../core/http/client';
import { ENDPOINTS } from '../../core/http/endpoints';

export interface RoleResource {
    id: string;
    name: string;
    description: string;
    permissions_count: number;
    users_count: number;
}

export interface RoleDetailResource extends RoleResource {
    permissions: Array<{
        id: string;
        name: string;
        display_name: string | null;
    }>;
}

export const roleKeys = {
    all: ['roles'] as const,
    detail: (id: string) => ['roles', id] as const,
};

export function useRoles() {
    return useQuery({
        queryKey: roleKeys.all,
        queryFn: async () => {
            const response = await client.get<RoleResource[]>(ENDPOINTS.roles.list);
            return response.data;
        },
    });
}

export function useRole(id: string) {
    return useQuery({
        queryKey: roleKeys.detail(id),
        queryFn: async () => {
            const response = await client.get<RoleDetailResource>(ENDPOINTS.roles.show(id));
            return response.data;
        },
        enabled: !!id,
    });
}
