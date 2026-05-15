import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { Input, cn } from '../components/UI';
import { AdminConversationResource } from '../types';

type StatusFilter = 'all' | 'open' | 'pending' | 'closed';

interface ConversationListProps {
    conversations: AdminConversationResource[];
    selectedId?: string;
    onSelect: (id: string) => void;
    isLoading?: boolean;
    defaultFilter?: StatusFilter;
}

const FILTERS: Array<{ key: StatusFilter; label: string }> = [
    { key: 'all', label: 'All' },
    { key: 'open', label: 'Open' },
    { key: 'pending', label: 'Pending' },
    { key: 'closed', label: 'Closed' },
];

export default function ConversationList({
    conversations,
    selectedId,
    onSelect,
    isLoading,
    defaultFilter = 'all',
}: ConversationListProps) {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>(defaultFilter);

    const filtered = conversations.filter(c => {
        if (statusFilter !== 'all' && c.status !== statusFilter) return false;
        if (search) {
            const q = search.toLowerCase();
            const name = (c.visitor?.contact?.name || '').toLowerCase();
            const subject = (c.subject || '').toLowerCase();
            return name.includes(q) || subject.includes(q);
        }
        return true;
    });

    return (
        <div className="flex h-full flex-col">
            {/* Search + Filters */}
            <div className="space-y-2 border-b border-border bg-card p-3">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                        placeholder="Search conversations..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="h-9 border-none bg-muted/50 pl-8 text-sm"
                    />
                </div>
                <div className="flex gap-1">
                    {FILTERS.map(f => (
                        <button
                            key={f.key}
                            onClick={() => setStatusFilter(f.key)}
                            className={cn(
                                'rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
                                statusFilter === f.key
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-muted-foreground hover:bg-muted'
                            )}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Conversation Items */}
            <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                    <div className="p-6 text-center text-sm text-muted-foreground">Loading...</div>
                ) : filtered.length === 0 ? (
                    <div className="p-6 text-center text-sm text-muted-foreground">No conversations found</div>
                ) : (
                    filtered.map(conv => (
                        <ConversationItem
                            key={conv.id}
                            conversation={conv}
                            isSelected={conv.id === selectedId}
                            onSelect={() => onSelect(conv.id)}
                        />
                    ))
                )}
            </div>
        </div>
    );
}

function ConversationItem({
    conversation: c,
    isSelected,
    onSelect,
}: {
    conversation: AdminConversationResource;
    isSelected: boolean;
    onSelect: () => void;
} & { key?: React.Key }) {
    const name = c.visitor?.contact?.name || 'Visitor';
    const lastMsg = c.messages?.[c.messages.length - 1];
    const preview = lastMsg?.body || 'No messages yet';
    const initial = name[0]?.toUpperCase() || 'V';
    const time = formatRelativeTime(c.updated_at);

    const priorityColor = c.priority === 'high' ? 'border-l-red-500' : c.priority === 'medium' ? 'border-l-amber-400' : 'border-l-transparent';

    return (
        <button
            onClick={onSelect}
            className={cn(
                'flex w-full gap-3 border-b border-border/50 border-l-[3px] px-3 py-3 text-left transition-colors',
                isSelected
                    ? 'border-l-primary bg-primary/5'
                    : `${priorityColor} hover:bg-muted/50`,
            )}
        >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                {initial}
            </div>

            <div className="min-w-0 flex-1">
                <div className="mb-0.5 flex items-center justify-between">
                    <span className="truncate text-sm font-semibold text-foreground">{name}</span>
                    <span className="ml-2 shrink-0 text-[10px] text-muted-foreground">{time}</span>
                </div>
                <div className="mb-1 truncate text-xs font-medium text-foreground/80">{c.subject || 'No subject'}</div>
                <div className="truncate text-xs text-muted-foreground">{preview}</div>
            </div>

            <div className="flex shrink-0 flex-col items-end gap-1">
                {c.unread_count && c.unread_count > 0 ? (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                        {c.unread_count}
                    </span>
                ) : null}
                <span className={cn(
                    'rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase',
                    c.status === 'open' ? 'bg-green-500/10 text-green-600' :
                    c.status === 'pending' ? 'bg-amber-500/10 text-amber-600' :
                    'bg-muted text-muted-foreground'
                )}>
                    {c.status}
                </span>
            </div>
        </button>
    );
}

function formatRelativeTime(dateStr: string): string {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d`;

    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}
