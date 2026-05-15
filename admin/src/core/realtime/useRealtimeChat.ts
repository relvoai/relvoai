import { useEffect, useRef, useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getEcho, isWebSocketAvailable } from './echo';
import { client } from '../http/client';
import { conversationKeys } from '../../features/conversations/api';
import { MessageResource } from '../../types';

interface RealtimeChatOptions {
    conversationId: string;
    enabled?: boolean;
}

interface RealtimeMessage {
    id: string;
    body: string;
    conversation_id: string;
    user_id: string | null;
    message_type: string;
    created_at: string;
    sender: { name: string };
}

/**
 * Hook that provides real-time message updates for a conversation.
 * Tries WebSocket (Reverb) first, falls back to HTTP polling on failure.
 */
export function useRealtimeChat({ conversationId, enabled = true }: RealtimeChatOptions) {
    const queryClient = useQueryClient();
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const channelRef = useRef<any>(null);
    const [transport, setTransport] = useState<'websocket' | 'polling' | 'disconnected'>('disconnected');

    const invalidateConversation = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: conversationKeys.detail(conversationId) });
    }, [queryClient, conversationId]);

    // Start HTTP polling fallback
    const startPolling = useCallback(() => {
        if (pollingRef.current) return; // Already polling

        console.log('[Relvo AI] Starting HTTP polling for conversation', conversationId);
        setTransport('polling');

        pollingRef.current = setInterval(() => {
            invalidateConversation();
        }, 3000);
    }, [conversationId, invalidateConversation]);

    // Stop polling
    const stopPolling = useCallback(() => {
        if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
        }
    }, []);

    useEffect(() => {
        if (!enabled || !conversationId) return;

        const echo = getEcho();

        if (echo) {
            try {
                channelRef.current = echo
                    .private(`conversations.${conversationId}`)
                    .listen('.MessageCreated', (data: RealtimeMessage) => {
                        invalidateConversation();
                    })
                    .listen('.ConversationUpdated', () => {
                        invalidateConversation();
                    });

                setTransport('websocket');
                console.log('[Relvo AI] Listening via WebSocket for conversation', conversationId);
            } catch {
                startPolling();
            }
        } else {
            startPolling();
        }

        return () => {
            stopPolling();
            if (channelRef.current) {
                const echo = getEcho();
                if (echo) {
                    echo.leave(`conversations.${conversationId}`);
                }
                channelRef.current = null;
            }
            setTransport('disconnected');
        };
    }, [conversationId, enabled, invalidateConversation, startPolling, stopPolling]);

    return { transport };
}

/**
 * Hook that listens for new conversations and messages on the admin channel.
 * Used on the conversation list page for real-time updates.
 */
export function useRealtimeConversationList() {
    const queryClient = useQueryClient();
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const [transport, setTransport] = useState<'websocket' | 'polling' | 'disconnected'>('disconnected');

    useEffect(() => {
        const echo = getEcho();

        const invalidateList = () => {
            queryClient.invalidateQueries({ queryKey: conversationKeys.all });
        };

        if (echo) {
            try {
                echo.private('admin.conversations')
                    .listen('.MessageCreated', invalidateList)
                    .listen('.ConversationUpdated', invalidateList);

                setTransport('websocket');
            } catch {
                // Fallback to polling
                pollingRef.current = setInterval(invalidateList, 5000);
                setTransport('polling');
            }
        } else {
            // HTTP polling fallback
            pollingRef.current = setInterval(invalidateList, 5000);
            setTransport('polling');
            console.log('[Relvo AI] Conversation list using HTTP polling');
        }

        return () => {
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
                pollingRef.current = null;
            }
            if (echo) {
                echo.leave('admin.conversations');
            }
            setTransport('disconnected');
        };
    }, [queryClient]);

    return { transport };
}
