import React, { useState } from 'react';
import { AdminConversationResource } from '../../../types';
import { Mail, Phone, Globe, Clock, ExternalLink, ChevronDown, User, MessageSquare } from 'lucide-react';
import { cn } from '../../../components/UI';

interface ContactSidebarProps {
    conversation: AdminConversationResource;
}

function Section({ title, defaultOpen = true, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="border-b border-border/50">
            <button
                onClick={() => setOpen(!open)}
                className="flex w-full items-center justify-between px-4 py-2.5 text-left"
            >
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">{title}</span>
                <ChevronDown className={cn('h-3.5 w-3.5 text-muted-foreground/50 transition-transform', open && 'rotate-180')} />
            </button>
            {open && <div className="px-4 pb-3">{children}</div>}
        </div>
    );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | null }) {
    return (
        <div className="flex items-center justify-between py-1">
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
                <Icon className="h-3 w-3" /> {label}
            </span>
            <span className="max-w-[140px] truncate text-xs text-foreground/80" title={value || undefined}>
                {value || 'N/A'}
            </span>
        </div>
    );
}

export function ContactSidebar({ conversation }: ContactSidebarProps) {
    const visitor = conversation.visitor;
    const contact = visitor?.contact;
    const name = contact?.name || `Visitor ${visitor?.id?.slice(0, 8) || ''}`;
    const initial = name[0]?.toUpperCase() || '?';

    return (
        <div className="flex h-full flex-col overflow-hidden">
            {/* Contact Header */}
            <div className="border-b border-border p-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-base font-bold text-primary">
                        {contact?.avatar_url ? (
                            <img src={contact.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
                        ) : (
                            initial
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <h3 className="truncate text-sm font-semibold">{name}</h3>
                            <span className="h-2 w-2 shrink-0 rounded-full bg-green-500" />
                        </div>
                        <p className="truncate text-xs text-muted-foreground">{contact?.email || 'No email'}</p>
                    </div>
                </div>

                {/* Quick contact info */}
                <div className="mt-3 space-y-1.5">
                    {contact?.email && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            <span className="truncate">{contact.email}</span>
                        </div>
                    )}
                    {contact?.phone && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <span>{contact.phone}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Scrollable sections */}
            <div className="flex-1 overflow-y-auto">
                {/* Conversation Details */}
                <Section title="Conversation">
                    <div className="space-y-0.5">
                        <div className="flex items-center justify-between py-1">
                            <span className="text-xs text-muted-foreground">Status</span>
                            <span className={cn(
                                'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase',
                                conversation.status === 'open' ? 'bg-green-500/10 text-green-600' :
                                conversation.status === 'pending' ? 'bg-amber-500/10 text-amber-600' :
                                'bg-zinc-500/10 text-zinc-500'
                            )}>
                                {conversation.status}
                            </span>
                        </div>
                        <div className="flex items-center justify-between py-1">
                            <span className="text-xs text-muted-foreground">Priority</span>
                            <span className={cn(
                                'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase',
                                conversation.priority === 'high' ? 'bg-red-500/10 text-red-600' :
                                conversation.priority === 'medium' ? 'bg-amber-500/10 text-amber-600' :
                                'bg-muted text-muted-foreground'
                            )}>
                                {conversation.priority}
                            </span>
                        </div>
                        <div className="flex items-center justify-between py-1">
                            <span className="text-xs text-muted-foreground">Assigned</span>
                            <span className="flex items-center gap-1.5 text-xs text-foreground/80">
                                {conversation.assigned_to ? (
                                    <>
                                        <User className="h-3 w-3 text-muted-foreground" />
                                        {conversation.assigned_to.first_name}
                                    </>
                                ) : (
                                    <span className="text-muted-foreground">Unassigned</span>
                                )}
                            </span>
                        </div>
                        {conversation.department && (
                            <div className="flex items-center justify-between py-1">
                                <span className="text-xs text-muted-foreground">Department</span>
                                <span className="text-xs text-foreground/80">{conversation.department.name}</span>
                            </div>
                        )}
                        <div className="flex items-center justify-between py-1">
                            <span className="text-xs text-muted-foreground">Created</span>
                            <span className="text-xs text-foreground/80">
                                {new Date(conversation.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </div>
                </Section>

                {/* Source Info */}
                <Section title="Source" defaultOpen={false}>
                    <div className="space-y-0.5">
                        <InfoRow icon={Globe} label="IP Address" value={visitor?.ip_address} />
                        <InfoRow icon={ExternalLink} label="Browser" value={visitor?.browser} />
                        <InfoRow icon={MessageSquare} label="OS" value={visitor?.os} />
                        <InfoRow icon={Clock} label="First Seen" value={visitor?.first_seen_at ? new Date(visitor.first_seen_at).toLocaleDateString([], { month: 'short', day: 'numeric' }) : undefined} />
                        {visitor?.last_seen_url && (
                            <div className="mt-2">
                                <span className="text-[11px] text-muted-foreground">Last Page</span>
                                <p className="mt-0.5 truncate rounded bg-muted/50 px-2 py-1 font-mono text-[10px] text-muted-foreground" title={visitor.last_seen_url}>
                                    {visitor.last_seen_url}
                                </p>
                            </div>
                        )}
                    </div>
                </Section>

                {/* Contact Details (if exists) */}
                {contact && (
                    <Section title="Contact" defaultOpen={false}>
                        <div className="space-y-0.5">
                            {contact.conversations_count > 0 && (
                                <div className="flex items-center justify-between py-1">
                                    <span className="text-xs text-muted-foreground">Conversations</span>
                                    <span className="text-xs text-foreground/80">{contact.conversations_count}</span>
                                </div>
                            )}
                            {contact.tags?.length > 0 && (
                                <div className="mt-2">
                                    <span className="text-[11px] text-muted-foreground">Tags</span>
                                    <div className="mt-1 flex flex-wrap gap-1">
                                        {contact.tags.map(tag => (
                                            <span key={tag} className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {contact.internal_notes && (
                                <div className="mt-2">
                                    <span className="text-[11px] text-muted-foreground">Notes</span>
                                    <p className="mt-0.5 text-xs text-foreground/70">{contact.internal_notes}</p>
                                </div>
                            )}
                        </div>
                    </Section>
                )}
            </div>
        </div>
    );
}
