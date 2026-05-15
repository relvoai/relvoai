import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useConversation, useConversations, useReplyToConversation, useCloseConversation, useJoinConversation, useLeaveConversation } from '../features/conversations/api';
import { ConversationLayout } from '../features/conversations/components/ConversationLayout';
import { ChatArea } from '../features/conversations/components/ChatArea';
import { ContactSidebar } from '../features/conversations/components/ContactSidebar';
import { ConversationHeader } from '../features/conversations/components/ConversationHeader';
import ConversationList from './ConversationList';
import { MessageCircle, Loader2 } from 'lucide-react';
import { useRealtimeChat, useRealtimeConversationList } from '../core/realtime/useRealtimeChat';

interface UnifiedInboxProps {
    assignedToMe?: boolean;
}

export default function ConversationDetails({ assignedToMe }: UnifiedInboxProps) {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    // List data
    const { data: conversations, isLoading: listLoading } = useConversations(
        assignedToMe ? { assigned_to_me: true } : undefined
    );

    // Detail data (only when a conversation is selected)
    const { data: conversation, isLoading: detailLoading } = useConversation(id ?? '');

    // Mutations
    const replyMutation = useReplyToConversation();
    const closeMutation = useCloseConversation();
    const joinMutation = useJoinConversation();
    const leaveMutation = useLeaveConversation();

    // Real-time
    useRealtimeConversationList();
    useRealtimeChat({ conversationId: id ?? '', enabled: !!id });

    const handleSelectConversation = (convId: string) => {
        const basePath = assignedToMe ? '/inbox' : '/conversations';
        navigate(`${basePath}/${convId}`);
    };

    const handleSendMessage = async (body: string, isInternal: boolean) => {
        if (!id) return;
        await replyMutation.mutateAsync({
            id,
            data: { body, is_note: isInternal },
        });
    };

    const handleResolve = async () => {
        if (!id) return;
        if (window.confirm('Mark this conversation as resolved?')) {
            await closeMutation.mutateAsync(id);
        }
    };

    return (
        <ConversationLayout
            list={
                <ConversationList
                    conversations={conversations || []}
                    selectedId={id}
                    onSelect={handleSelectConversation}
                    isLoading={listLoading}
                    defaultFilter="open"
                />
            }
            header={
                conversation ? (
                    <ConversationHeader
                        conversation={conversation}
                        onResolve={handleResolve}
                        onJoin={id ? () => joinMutation.mutate(id) : undefined}
                        onLeave={id ? () => leaveMutation.mutate(id) : undefined}
                    />
                ) : null
            }
            sidebar={
                conversation ? (
                    <ContactSidebar conversation={conversation} />
                ) : (
                    <div />
                )
            }
        >
            {id && conversation ? (
                <ChatArea conversation={conversation} onSendMessage={handleSendMessage} />
            ) : id && detailLoading ? (
                <div className="flex h-full items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
                    <MessageCircle className="mb-4 h-16 w-16 opacity-15" />
                    <p className="text-lg font-medium">Select a conversation</p>
                    <p className="mt-1 text-sm">Choose from the list to start chatting</p>
                </div>
            )}
        </ConversationLayout>
    );
}
