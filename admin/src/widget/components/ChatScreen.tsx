import React, { useEffect, useMemo, useRef } from 'react';
import { Loader2, WifiOff } from 'lucide-react';
import { ConversationSummary, Message, WidgetConfig } from '../types';
import { MessageBubble } from './MessageBubble';
import { TypingDots } from './TypingDots';
import { Composer } from './Composer';
import { Branding } from './Branding';
import { formatDayLabel } from '../utils';

interface ChatScreenProps {
    config: WidgetConfig;
    messages: Message[];
    isLoading: boolean;
    isSending: boolean;
    isTyping?: boolean;
    isOffline?: boolean;
    inputValue: string;
    onInputChange: (value: string) => void;
    onSend: () => void;
    isBootstrapped: boolean;
    activeConversation?: ConversationSummary;
}

export function ChatScreen({
    config,
    messages,
    isLoading,
    isSending,
    isTyping,
    isOffline,
    inputValue,
    onInputChange,
    onSend,
    isBootstrapped,
    activeConversation,
}: ChatScreenProps): React.ReactElement {
    const scrollRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) {
            return;
        }
        el.scrollTop = el.scrollHeight;
    }, [messages.length, isTyping, isLoading]);

    const groups = useMemo(() => groupMessagesByDay(messages), [messages]);
    const closed = activeConversation?.status === 'closed';
    const composerDisabled = closed || !isBootstrapped || isOffline === true;

    return (
        <div className="flex min-h-0 flex-1 flex-col bg-[color:var(--rv-surface-muted)] dark:bg-[color:var(--rv-surface-muted)]">
            {isOffline && (
                <div
                    role="status"
                    className="flex items-center justify-center gap-2 bg-amber-50 px-3 py-1.5 text-[12px] font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                >
                    <WifiOff className="h-3.5 w-3.5" aria-hidden="true" />
                    You appear to be offline — messages will send once you reconnect.
                </div>
            )}
            <div
                ref={scrollRef}
                className="rv-scroll relative flex-1 overflow-y-auto px-4 pb-2 pt-4"
                role="log"
                aria-live="polite"
                aria-relevant="additions"
                aria-label="Conversation messages"
            >
                {isLoading ? (
                    <div className="flex h-full items-center justify-center">
                        <Loader2 className="h-5 w-5 animate-spin text-slate-300" aria-label="Loading messages" />
                    </div>
                ) : messages.length === 0 ? (
                    <EmptyChat agentName={config.agent?.name} />
                ) : (
                    <div className="flex min-h-full flex-col justify-end gap-3">
                        {groups.map(group => (
                            <DayGroup
                                key={group.key}
                                label={group.label}
                                messages={group.messages}
                                agentName={config.agent?.name}
                                agentAvatar={config.agent?.avatar_url}
                            />
                        ))}
                        {isTyping && (
                            <div className="rv-msg-in flex items-end gap-2">
                                <TypingDots />
                            </div>
                        )}
                    </div>
                )}
            </div>

            {closed && (
                <div className="shrink-0 border-t border-slate-100 bg-slate-100 px-4 py-2 text-center text-[12px] text-slate-500 dark:border-slate-800/70 dark:bg-slate-800/50 dark:text-slate-400">
                    This conversation has been closed.
                </div>
            )}

            <Composer
                value={inputValue}
                onChange={onInputChange}
                onSend={onSend}
                sending={isSending}
                disabled={composerDisabled}
                placeholder={closed ? 'This conversation is closed' : 'Write a message...'}
            />

            <div className="shrink-0 bg-[color:var(--rv-surface)] pb-1.5 dark:bg-[color:var(--rv-surface)]">
                <Branding visible={config.show_branding !== false} />
            </div>
        </div>
    );
}

function EmptyChat({ agentName }: { agentName?: string }): React.ReactElement {
    return (
        <div className="flex h-full flex-col items-center justify-center py-8 text-center">
            <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-md"
                style={{ background: 'var(--rv-brand-gradient)' }}
                aria-hidden="true"
            >
                <span className="text-lg font-semibold">
                    {agentName ? agentName.trim().charAt(0).toUpperCase() : 'R'}
                </span>
            </div>
            <p className="mt-3 text-[13.5px] font-medium text-slate-600 dark:text-slate-300">
                Send a message to start the conversation
            </p>
            <p className="mt-1 max-w-[240px] text-[12px] text-slate-400 dark:text-slate-500">
                {agentName
                    ? `${agentName} usually replies in a few minutes.`
                    : 'Someone from the team will be with you shortly.'}
            </p>
        </div>
    );
}

interface DayGroupProps {
    label: string;
    messages: Message[];
    agentName?: string;
    agentAvatar?: string;
}

function DayGroup({ label, messages, agentName, agentAvatar }: DayGroupProps & { key?: React.Key }): React.ReactElement {
    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center justify-center py-1">
                <span className="rounded-full bg-slate-200/60 px-2.5 py-0.5 text-[10.5px] font-medium uppercase tracking-wider text-slate-500 dark:bg-slate-800/80 dark:text-slate-400">
                    {label}
                </span>
            </div>
            {messages.map((msg, i) => {
                const prev = messages[i - 1];
                const next = messages[i + 1];
                const isLastInGroup = !next || next.type !== msg.type || timeGap(msg.created_at, next.created_at) > 120;
                const isFirstInGroup = !prev || prev.type !== msg.type || timeGap(prev.created_at, msg.created_at) > 120;
                return (
                    <MessageBubble
                        key={msg.id}
                        message={msg}
                        showAvatar={isLastInGroup}
                        showTimestamp={isLastInGroup}
                        agentName={isFirstInGroup ? agentName : undefined}
                        agentAvatar={agentAvatar}
                    />
                );
            })}
        </div>
    );
}

interface MessageGroup {
    key: string;
    label: string;
    messages: Message[];
}

function groupMessagesByDay(messages: Message[]): MessageGroup[] {
    const groups: MessageGroup[] = [];
    for (const msg of messages) {
        const key = new Date(msg.created_at).toDateString();
        const last = groups[groups.length - 1];
        if (last && last.key === key) {
            last.messages.push(msg);
        } else {
            groups.push({ key, label: formatDayLabel(msg.created_at), messages: [msg] });
        }
    }
    return groups;
}

function timeGap(a: string, b: string): number {
    const aT = new Date(a).getTime();
    const bT = new Date(b).getTime();
    return Math.abs((bT - aT) / 1000);
}
