import React, { useState, useEffect, useRef } from 'react';
import { useCannedReplies } from '../../cannedReplies/api';
import { cn } from '../../../components/UI';
import { Zap, Command } from 'lucide-react';

interface CannedReplyPickerProps {
    search: string;
    onSelect: (content: string) => void;
    onClose: () => void;
    anchorBottom?: number;
}

export function CannedReplyPicker({ search, onSelect, onClose, anchorBottom = 0 }: CannedReplyPickerProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const listRef = useRef<HTMLDivElement>(null);
    const { data: replies } = useCannedReplies(search || undefined);

    const filtered = (replies || []).slice(0, 6);

    // Reset active index when results change
    useEffect(() => {
        setActiveIndex(0);
    }, [search]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveIndex(i => Math.min(i + 1, filtered.length - 1));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveIndex(i => Math.max(i - 1, 0));
            } else if (e.key === 'Enter' && filtered.length > 0) {
                e.preventDefault();
                onSelect(filtered[activeIndex].content);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [filtered, activeIndex, onSelect, onClose]);

    // Scroll active item into view
    useEffect(() => {
        const list = listRef.current;
        if (!list) return;
        const active = list.children[activeIndex] as HTMLElement;
        active?.scrollIntoView({ block: 'nearest' });
    }, [activeIndex]);

    if (!filtered.length) {
        return (
            <div
                className="absolute left-0 right-0 z-20 rounded-lg border border-border bg-popover p-3 shadow-xl"
                style={{ bottom: anchorBottom }}
            >
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Zap className="h-4 w-4" />
                    {search ? `No canned replies matching "${search}"` : 'No canned replies available'}
                </div>
            </div>
        );
    }

    return (
        <div
            className="absolute left-0 right-0 z-20 overflow-hidden rounded-lg border border-border bg-popover shadow-xl"
            style={{ bottom: anchorBottom }}
        >
            <div className="flex items-center gap-2 border-b border-border/50 px-3 py-2">
                <Command className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Canned Replies</span>
                <span className="ml-auto text-[10px] text-muted-foreground/50">
                    <kbd className="rounded border border-border/50 bg-muted px-1 py-0.5 font-mono text-[9px]">Enter</kbd> to select
                </span>
            </div>
            <div ref={listRef} className="max-h-[240px] overflow-y-auto py-1">
                {filtered.map((reply, i) => (
                    <button
                        key={reply.id}
                        onClick={() => onSelect(reply.content)}
                        onMouseEnter={() => setActiveIndex(i)}
                        className={cn(
                            'flex w-full items-start gap-3 px-3 py-2 text-left transition-colors',
                            i === activeIndex ? 'bg-primary/5' : 'hover:bg-muted/50'
                        )}
                    >
                        <span className="shrink-0 rounded bg-primary/10 px-1.5 py-0.5 font-mono text-xs font-semibold text-primary">
                            /{reply.shortcut}
                        </span>
                        <span className="min-w-0 truncate text-sm text-muted-foreground">
                            {reply.content}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}
