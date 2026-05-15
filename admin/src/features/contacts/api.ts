import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { client } from '../../core/http/client';
import { ENDPOINTS } from '../../core/http/endpoints';

// ============================================================================
// Types
// ============================================================================

export interface Contact {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    avatar_url: string | null;
    custom_attributes: Record<string, unknown> | null;
    tags: string[];
    created_at: string;
    updated_at: string;
}

export interface CreateContactPayload {
    name: string;
    email?: string | null;
    phone?: string | null;
    avatar_url?: string | null;
    custom_attributes?: Record<string, unknown> | null;
    tags?: string[];
}

export interface UpdateContactPayload {
    name?: string;
    email?: string | null;
    phone?: string | null;
    avatar_url?: string | null;
    custom_attributes?: Record<string, unknown> | null;
    tags?: string[];
}

// ============================================================================
// Query Keys
// ============================================================================

export const contactKeys = {
    all: ['contacts'] as const,
    list: (page: number, search: string) => ['contacts', 'list', page, search] as const,
    detail: (id: string) => ['contacts', 'detail', id] as const,
    conversations: (id: string) => ['contacts', 'detail', id, 'conversations'] as const,
    notes: (id: string) => ['contacts', 'detail', id, 'notes'] as const,
};

// ============================================================================
// Queries
// ============================================================================

/**
 * GET /admin/contacts - List contacts (paginated on the backend but the success()
 * helper flattens the data, so we receive a plain Contact[]).
 */
export function useContacts(page: number = 1, search: string = '') {
    return useQuery({
        queryKey: contactKeys.list(page, search),
        queryFn: async () => {
            const params = { page, search };
            const response = await client.get<Contact[]>(ENDPOINTS.contacts.list, params);
            return response.data;
        },
    });
}

export function useContact(id: string) {
    return useQuery({
        queryKey: contactKeys.detail(id),
        queryFn: async () => {
            const response = await client.get<Contact>(ENDPOINTS.contacts.show(id));
            return response.data;
        },
        enabled: !!id,
    });
}

// ============================================================================
// Mutations
// ============================================================================

export function useCreateContact() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: CreateContactPayload) => {
            const response = await client.post<Contact>(ENDPOINTS.contacts.create, payload);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: contactKeys.all });
        },
    });
}

export function useUpdateContact() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: UpdateContactPayload }) => {
            const response = await client.put<Contact>(ENDPOINTS.contacts.update(id), data);
            return response.data;
        },
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: contactKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: contactKeys.all });
        },
    });
}

export function useDeleteContact() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await client.delete(ENDPOINTS.contacts.delete(id));
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: contactKeys.all });
        },
    });
}
// ... existing imports ...
import { AdminConversationResource } from '../../types';

export interface NoteResource {
    id: string;
    content: string;
    created_at: string;
    user?: {
        id: string;
        name: string;
        avatar_url?: string;
    };
}

export interface NotePayload {
    content: string;
}

export interface MergePayload {
    target_contact_id: string;
}

export function useContactConversations(id: string) {
    return useQuery({
        queryKey: contactKeys.conversations(id),
        queryFn: async () => {
            const response = await client.get<AdminConversationResource[]>(ENDPOINTS.contacts.conversations(id));
            return response.data;
        },
        enabled: !!id,
    });
}

export function useContactNotes(id: string) {
    return useQuery({
        queryKey: contactKeys.notes(id),
        queryFn: async () => {
            const response = await client.get<NoteResource[]>(ENDPOINTS.contacts.notes(id));
            return response.data;
        },
        enabled: !!id,
    });
}

export function useCreateContactNote() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: NotePayload }) => {
            const response = await client.post<NoteResource>(ENDPOINTS.contacts.notes(id), data);
            return response.data;
        },
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: contactKeys.notes(id) });
        }
    });
}

export function useMergeContact() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: MergePayload }) => {
            const response = await client.post<Contact>(ENDPOINTS.contacts.merge(id), data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: contactKeys.all });
        }
    });
}
