import React, { useState } from 'react';
import { cn } from '../../../components/UI';
import { MessageResource } from '../../../types';
import { User, Bot, Copy, Check, Lock } from 'lucide-react';

interface MessageBubbleProps {
    message: MessageResource;
    showAvatar: boolean;
    showName: boolean;
    isFirstInGroup: boolean;
    isLastInGroup: boolean;
}

export function MessageBubble({ message, showAvatar, showName, isFirstInGroup, isLastInGroup }: MessageBubbleProps & { key?: React.Key }) {
    const [copied, setCopied] = useState(false);
    const isAgent = message.sender.type === 'agent';
    const isSystem = message.message_type === 'system';
    const isInternal = message.is_internal;

    if (isSystem) {
        return (
            <div className="flex justify-center py-1">
                <span className="text-[11px] text-muted-foreground/70 bg-muted/40 px-3 py-1 rounded-full">
                    {message.body}
                </span>
            </div>
        );
    }

    const handleCopy = () => {
        navigator.clipboard.writeText(message.body);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    const time = new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Internal note — full-width with subtle left border
    if (isInternal) {
        return (
            <div className={cn('group relative mx-4', isFirstInGroup ? 'mt-4' : 'mt-0.5')}>
                <div className="flex items-start gap-3">
                    <div className="w-7 shrink-0">
                        {showAvatar && (
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-yellow-500/15 text-yellow-600 dark:text-yellow-400">
                                <Lock className="h-3.5 w-3.5" />
                            </div>
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        {showName && (
                            <div className="mb-1 flex items-center gap-2">
                                <span className="text-xs font-semibold text-yellow-700 dark:text-yellow-400">{message.sender.name}</span>
                                <span className="text-[10px] text-yellow-600/50 dark:text-yellow-500/50">{time}</span>
                                <span className="rounded-sm bg-yellow-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-yellow-700 dark:text-yellow-400">Note</span>
                            </div>
                        )}
                        <div className="rounded-lg border-l-2 border-yellow-500/40 bg-yellow-500/[0.06] px-3 py-2 text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                            {message.body}
                        </div>
                        {!showName && (
                            <div className="mt-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                                <span className="text-[10px] text-muted-foreground/50">{time}</span>
                            </div>
                        )}
                    </div>
                    {/* Hover actions */}
                    <div className="mt-1 flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                        <button onClick={handleCopy} className="rounded p-1 text-muted-foreground/50 hover:bg-muted hover:text-muted-foreground" title="Copy">
                            {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Visitor messages (left-aligned)
    if (!isAgent) {
        return (
            <div className={cn('group relative flex items-end gap-2 px-4', isFirstInGroup ? 'mt-4' : 'mt-0.5')}>
                {/* Avatar column */}
                <div className="w-7 shrink-0 self-end">
                    {isLastInGroup && (
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground">
                            {message.sender.avatar ? (
                                <img src={message.sender.avatar} alt="" className="h-full w-full rounded-full object-cover" />
                            ) : message.sender.type === 'bot' ? (
                                <Bot className="h-3.5 w-3.5" />
                            ) : (
                                <User className="h-3.5 w-3.5" />
                            )}
                        </div>
                    )}
                </div>

                <div className="max-w-[65%] min-w-0">
                    {showName && (
                        <div className="mb-1 flex items-center gap-2 pl-1">
                            <span className="text-[11px] font-medium text-muted-foreground">{message.sender.name}</span>
                        </div>
                    )}
                    <div className={cn(
                        'relative rounded-2xl bg-card px-3.5 py-2 text-sm leading-relaxed shadow-[0_1px_2px_rgba(0,0,0,0.06)] border border-border/60 whitespace-pre-wrap',
                        isFirstInGroup && 'rounded-tl-md',
                        isLastInGroup && 'rounded-bl-md',
                    )}>
                        {message.body}
                    </div>
                    {isLastInGroup && (
                        <div className="mt-0.5 pl-1">
                            <span className="text-[10px] text-muted-foreground/50">{time}</span>
                        </div>
                    )}
                </div>

                {/* Hover actions */}
                <div className="mb-2 flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <button onClick={handleCopy} className="rounded p-1 text-muted-foreground/40 hover:bg-muted hover:text-muted-foreground" title="Copy">
                        {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                    </button>
                </div>
            </div>
        );
    }

    // Agent messages (right-aligned)
    return (
        <div className={cn('group relative flex flex-row-reverse items-end gap-2 px-4', isFirstInGroup ? 'mt-4' : 'mt-0.5')}>
            {/* Avatar column */}
            <div className="w-7 shrink-0 self-end">
                {isLastInGroup && (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        {message.sender.avatar ? (
                            <img src={message.sender.avatar} alt="" className="h-full w-full rounded-full object-cover" />
                        ) : (
                            <User className="h-3.5 w-3.5" />
                        )}
                    </div>
                )}
            </div>

            <div className="flex max-w-[65%] min-w-0 flex-col items-end">
                {showName && (
                    <div className="mb-1 flex items-center gap-2 pr-1">
                        <span className="text-[11px] font-medium text-muted-foreground">{message.sender.name}</span>
                    </div>
                )}
                <div className={cn(
                    'relative rounded-2xl bg-primary px-3.5 py-2 text-sm leading-relaxed text-primary-foreground shadow-sm whitespace-pre-wrap',
                    isFirstInGroup && 'rounded-tr-md',
                    isLastInGroup && 'rounded-br-md',
                )}>
                    {message.body}
                </div>
                {isLastInGroup && (
                    <div className="mt-0.5 pr-1">
                        <span className="text-[10px] text-muted-foreground/50">{time}</span>
                    </div>
                )}
            </div>

            {/* Hover actions */}
            <div className="mb-2 flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                <button onClick={handleCopy} className="rounded p-1 text-muted-foreground/40 hover:bg-muted hover:text-muted-foreground" title="Copy">
                    {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                </button>
            </div>
        </div>
    );
}

// Date separator component
export function DateSeparator({ date }: { date: string } & { key?: React.Key }) {
    return (
        <div className="flex items-center gap-3 px-4 py-3">
            <div className="h-px flex-1 bg-border/50" />
            <span className="text-[11px] font-medium text-muted-foreground/60">{date}</span>
            <div className="h-px flex-1 bg-border/50" />
        </div>
    );
}
