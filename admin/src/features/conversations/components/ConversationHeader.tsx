import React, { useState } from 'react';
import { CheckCircle, MoreVertical, User, Globe, MessageSquare, ChevronDown, UserPlus, UserMinus, ArrowRightLeft } from 'lucide-react';
import { Button, cn } from '../../../components/UI';
import { AdminConversationResource } from '../../../types';

interface ConversationHeaderProps {
    conversation: AdminConversationResource;
    onResolve: () => void;
    onJoin?: () => void;
    onLeave?: () => void;
}

const STATUS_CONFIG = {
    open: { label: 'Open', color: 'bg-green-500/10 text-green-600 border-green-500/20' },
    pending: { label: 'Pending', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
    closed: { label: 'Closed', color: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20' },
} as const;

export function ConversationHeader({ conversation, onResolve, onJoin, onLeave }: ConversationHeaderProps) {
    const [showMenu, setShowMenu] = useState(false);
    const visitor = conversation.visitor;
    const contact = visitor?.contact;
    const name = contact?.name || 'Anonymous Visitor';
    const email = contact?.email;
    const initial = name[0]?.toUpperCase() || '?';
    const statusInfo = STATUS_CONFIG[conversation.status];

    return (
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4">
            {/* Left: Visitor info */}
            <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {contact?.avatar_url ? (
                        <img src={contact.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
                    ) : (
                        initial
                    )}
                </div>
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold text-foreground">{name}</span>
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" title="Online" />
                    </div>
                    {email && (
                        <span className="text-xs text-muted-foreground">{email}</span>
                    )}
                </div>
            </div>

            {/* Center: Channel + Subject */}
            <div className="hidden items-center gap-2 md:flex">
                <div className="flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/30 px-2.5 py-1">
                    <Globe className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[11px] font-medium text-muted-foreground">
                        {conversation.widget?.name || 'Web Chat'}
                    </span>
                </div>
                {conversation.subject && (
                    <span className="max-w-[200px] truncate text-xs text-muted-foreground/70">
                        {conversation.subject}
                    </span>
                )}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1.5">
                {/* Status badge */}
                <span className={cn(
                    'rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase',
                    statusInfo.color
                )}>
                    {statusInfo.label}
                </span>

                {/* Assigned agent */}
                {conversation.assigned_to && (
                    <div className="hidden items-center gap-1.5 rounded-md border border-border/50 bg-muted/30 px-2 py-1 lg:flex" title={`Assigned to ${conversation.assigned_to.first_name}`}>
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[11px] text-muted-foreground">{conversation.assigned_to.first_name}</span>
                    </div>
                )}

                {/* Resolve */}
                {conversation.status !== 'closed' && (
                    <Button
                        onClick={onResolve}
                        size="sm"
                        className="h-7 gap-1.5 bg-green-600 px-2.5 text-xs text-white hover:bg-green-700"
                    >
                        <CheckCircle className="h-3.5 w-3.5" />
                        Resolve
                    </Button>
                )}

                {/* More menu */}
                <div className="relative">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setShowMenu(!showMenu)}
                    >
                        <MoreVertical className="h-4 w-4" />
                    </Button>

                    {showMenu && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                            <div className="absolute right-0 top-full z-50 mt-1 w-48 overflow-hidden rounded-lg border border-border bg-popover py-1 shadow-xl">
                                {onJoin && (
                                    <button
                                        onClick={() => { onJoin(); setShowMenu(false); }}
                                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted"
                                    >
                                        <UserPlus className="h-4 w-4 text-muted-foreground" /> Join
                                    </button>
                                )}
                                {onLeave && (
                                    <button
                                        onClick={() => { onLeave(); setShowMenu(false); }}
                                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted"
                                    >
                                        <UserMinus className="h-4 w-4 text-muted-foreground" /> Leave
                                    </button>
                                )}
                                <button className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted">
                                    <ArrowRightLeft className="h-4 w-4 text-muted-foreground" /> Transfer
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
