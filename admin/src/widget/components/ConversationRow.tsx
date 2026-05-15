import React from 'react';
import { ChevronRight, CheckCircle2, Clock, MessageCircle } from 'lucide-react';
import { ConversationSummary } from '../types';
import { formatRelativeTime } from '../utils';

interface ConversationRowProps {
    conversation: ConversationSummary;
    onClick: () => void;
}

export function ConversationRow({ conversation, onClick }: ConversationRowProps & { key?: React.Key }): React.ReactElement {
    const isClosed = conversation.status === 'closed';
    const isPending = conversation.status === 'pending';
    const preview = conversation.last_message?.body?.trim() || 'No messages yet';
    const time = formatRelativeTime(conversation.last_message?.created_at || conversation.updated_at);

    return (
        <button
            type="button"
            onClick={onClick}
            className="rv-focusable group flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3.5 text-left transition-colors hover:bg-slate-50 dark:border-slate-800/80 dark:hover:bg-slate-800/40"
        >
            <div
                aria-hidden="true"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                style={{
                    backgroundColor: isClosed ? 'rgba(148, 163, 184, 0.16)' : 'var(--rv-brand-soft)',
                    color: isClosed ? '#64748b' : 'var(--rv-brand)',
                }}
            >
                {isClosed ? (
                    <CheckCircle2 className="h-5 w-5" />
                ) : isPending ? (
                    <Clock className="h-5 w-5" />
                ) : (
                    <MessageCircle className="h-5 w-5" />
                )}
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-[14px] font-semibold text-slate-900 dark:text-slate-100">
                        {conversation.subject || 'Conversation'}
                    </span>
                    <span className="shrink-0 text-[11px] text-slate-400 dark:text-slate-500">{time}</span>
                </div>
                <p className="mt-0.5 truncate text-[12.5px] text-slate-500 dark:text-slate-400">
                    {preview}
                </p>
            </div>
            <ChevronRight
                aria-hidden="true"
                className="h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 dark:text-slate-600"
            />
        </button>
    );
}
