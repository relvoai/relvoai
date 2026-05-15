import React from 'react';
import { AlertCircle, CheckCheck, Clock } from 'lucide-react';
import { Message } from '../types';
import { AgentAvatar } from './AgentAvatar';
import { formatClockTime } from '../utils';

interface MessageBubbleProps {
    message: Message;
    showAvatar: boolean;
    showTimestamp: boolean;
    agentName?: string;
    agentAvatar?: string;
}

export function MessageBubble({
    message,
    showAvatar,
    showTimestamp,
    agentName,
    agentAvatar,
}: MessageBubbleProps & { key?: React.Key }): React.ReactElement {
    if (message.type === 'system') {
        return (
            <div className="rv-msg-in flex justify-center">
                <div className="max-w-[85%] rounded-full bg-slate-100 px-3 py-1 text-center text-[11.5px] text-slate-500 dark:bg-slate-800/70 dark:text-slate-400">
                    {message.body}
                </div>
            </div>
        );
    }

    const isVisitor = message.type === 'visitor';
    const attachments = message.attachments ?? [];
    const senderName = message.sender?.name ?? agentName;
    const senderAvatar = message.sender?.avatar_url ?? agentAvatar;

    return (
        <div className={`rv-msg-in flex items-end gap-2 ${isVisitor ? 'justify-end' : 'justify-start'}`}>
            {!isVisitor && (
                <div className={`shrink-0 ${showAvatar ? 'opacity-100' : 'invisible'}`}>
                    <AgentAvatar name={senderName} src={senderAvatar} size="sm" />
                </div>
            )}
            <div className={`flex max-w-[78%] flex-col gap-1 ${isVisitor ? 'items-end' : 'items-start'}`}>
                {attachments.length > 0 && (
                    <div className={`flex flex-col gap-1 ${isVisitor ? 'items-end' : 'items-start'}`}>
                        {attachments.map((a, i) => (
                            <Attachment key={a.id ?? i} url={a.url} name={a.name} contentType={a.content_type} isVisitor={isVisitor} />
                        ))}
                    </div>
                )}
                {message.body && (
                    <div
                        className={`relative break-words rounded-2xl px-3.5 py-2 text-[13.5px] leading-relaxed shadow-sm ${
                            isVisitor
                                ? 'rounded-br-sm text-[color:var(--rv-brand-contrast)]'
                                : 'rounded-bl-sm border border-slate-200/80 bg-white text-slate-800 dark:border-slate-700/70 dark:bg-slate-800 dark:text-slate-100'
                        }`}
                        style={isVisitor ? { background: 'var(--rv-brand-gradient)' } : undefined}
                    >
                        {message.body}
                    </div>
                )}
                {showTimestamp && (
                    <div
                        className={`flex items-center gap-1 px-1 text-[10.5px] ${
                            isVisitor ? 'text-slate-400' : 'text-slate-400 dark:text-slate-500'
                        }`}
                    >
                        {!isVisitor && senderName && (
                            <span className="font-medium text-slate-500 dark:text-slate-400">{senderName}</span>
                        )}
                        {!isVisitor && senderName && <span aria-hidden="true">·</span>}
                        <span>{formatClockTime(message.created_at)}</span>
                        {isVisitor && <MessageStatus pending={message.pending} failed={message.failed} />}
                    </div>
                )}
            </div>
        </div>
    );
}

interface AttachmentProps {
    url: string;
    name?: string;
    contentType?: string;
    isVisitor: boolean;
}

function Attachment({ url, name, contentType, isVisitor }: AttachmentProps & { key?: React.Key }): React.ReactElement {
    const isImage = contentType ? contentType.startsWith('image/') : /\.(png|jpe?g|gif|webp|avif)$/i.test(url);
    if (isImage) {
        return (
            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="rv-focusable block overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-100 shadow-sm dark:border-slate-700/70 dark:bg-slate-800"
            >
                <img
                    src={url}
                    alt={name ?? 'Attachment'}
                    className="max-h-60 max-w-[240px] object-cover"
                    loading="lazy"
                />
            </a>
        );
    }
    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={`rv-focusable inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-[12.5px] font-medium shadow-sm ${
                isVisitor
                    ? 'border-white/30 bg-white/10 text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
            }`}
        >
            <span className="truncate max-w-[180px]">{name ?? 'Attachment'}</span>
        </a>
    );
}

interface MessageStatusProps {
    pending?: boolean;
    failed?: boolean;
}

function MessageStatus({ pending, failed }: MessageStatusProps): React.ReactElement {
    if (failed) {
        return (
            <span className="inline-flex items-center gap-0.5 text-rose-500" aria-label="Failed to send">
                <AlertCircle className="h-3 w-3" aria-hidden="true" />
            </span>
        );
    }
    if (pending) {
        return (
            <span className="inline-flex items-center gap-0.5" aria-label="Sending">
                <Clock className="h-3 w-3" aria-hidden="true" />
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-0.5" aria-label="Sent">
            <CheckCheck className="h-3 w-3" aria-hidden="true" style={{ color: 'var(--rv-brand)' }} />
        </span>
    );
}
