import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { MessageBubble, DateSeparator } from './MessageBubble';
import { CannedReplyPicker } from './CannedReplyPicker';
import { MessageResource, AdminConversationResource } from '../../../types';
import { Button } from '../../../components/UI';
import { Send, Paperclip, Smile, Lock, ChevronDown, Slash, X } from 'lucide-react';
import { cn } from '../../../components/UI';

interface ChatAreaProps {
    conversation: AdminConversationResource;
    onSendMessage: (body: string, isInternal: boolean) => Promise<void>;
}

// Group consecutive messages from the same sender within a 2-minute window
interface MessageGroup {
    type: 'messages';
    senderId: string;
    senderType: string;
    messages: MessageResource[];
}

interface DateGroup {
    type: 'date';
    label: string;
    dateKey: string;
}

type ChatItem = MessageGroup | DateGroup;

function formatDateLabel(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const messageDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffDays = Math.floor((today.getTime() - messageDay.getTime()) / 86400000);

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return date.toLocaleDateString([], { weekday: 'long' });
    return date.toLocaleDateString([], { month: 'long', day: 'numeric', year: now.getFullYear() !== date.getFullYear() ? 'numeric' : undefined });
}

function groupMessages(messages: MessageResource[]): ChatItem[] {
    if (!messages.length) return [];

    const items: ChatItem[] = [];
    let currentDate = '';
    let currentGroup: MessageGroup | null = null;

    for (const msg of messages) {
        const msgDate = new Date(msg.created_at);
        const dateKey = msgDate.toDateString();

        if (dateKey !== currentDate) {
            if (currentGroup) {
                items.push(currentGroup);
                currentGroup = null;
            }
            items.push({ type: 'date', label: formatDateLabel(msg.created_at), dateKey });
            currentDate = dateKey;
        }

        const senderId = msg.sender.id || 'unknown';
        const senderType = msg.is_internal ? 'note' : msg.sender.type;

        if (
            currentGroup &&
            currentGroup.senderId === senderId &&
            currentGroup.senderType === senderType &&
            msg.message_type !== 'system'
        ) {
            const lastMsg = currentGroup.messages[currentGroup.messages.length - 1];
            const timeDiff = msgDate.getTime() - new Date(lastMsg.created_at).getTime();
            if (timeDiff < 120000) {
                currentGroup.messages.push(msg);
                continue;
            }
        }

        if (currentGroup) items.push(currentGroup);

        if (msg.message_type === 'system') {
            items.push({ type: 'messages', senderId: 'system', senderType: 'system', messages: [msg] });
            currentGroup = null;
        } else {
            currentGroup = { type: 'messages', senderId, senderType, messages: [msg] };
        }
    }

    if (currentGroup) items.push(currentGroup);
    return items;
}

// Contextual suggestion pills based on conversation state
function getSuggestions(conversation: AdminConversationResource): string[] {
    const messages = conversation.messages || [];
    const agentMessages = messages.filter(m => m.sender.type === 'agent' && !m.is_internal);
    const visitorMessages = messages.filter(m => m.sender.type === 'visitor');

    if (messages.length === 0) {
        return ['Hi! How can I help you today?'];
    }

    if (agentMessages.length === 0 && visitorMessages.length > 0) {
        return ['Hi! Thanks for reaching out.', 'Let me look into that for you.'];
    }

    const lastVisitor = visitorMessages[visitorMessages.length - 1];
    if (lastVisitor) {
        const body = lastVisitor.body.toLowerCase();
        if (body.includes('?')) {
            return ['Let me check that for you.', 'Could you share more details?'];
        }
        if (body.includes('thank')) {
            return ["You're welcome! Is there anything else?"];
        }
    }

    // If conversation has been idle (last message > 30min ago)
    const lastMsg = messages[messages.length - 1];
    if (lastMsg) {
        const age = Date.now() - new Date(lastMsg.created_at).getTime();
        if (age > 1800000) {
            return ['Sorry for the wait!', 'Thanks for your patience.'];
        }
    }

    return [];
}

export function ChatArea({ conversation, onSendMessage }: ChatAreaProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const composerRef = useRef<HTMLDivElement>(null);
    const [inputValue, setInputValue] = useState('');
    const [isInternal, setIsInternal] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [showScrollBtn, setShowScrollBtn] = useState(false);
    const [hasNewMessages, setHasNewMessages] = useState(false);
    const [showCannedPicker, setShowCannedPicker] = useState(false);
    const [cannedSearch, setCannedSearch] = useState('');
    const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());
    const prevMessageCount = useRef(conversation.messages?.length ?? 0);

    const chatItems = useMemo(() => groupMessages(conversation.messages || []), [conversation.messages]);

    const suggestions = useMemo(() => {
        return getSuggestions(conversation).filter(s => !dismissedSuggestions.has(s));
    }, [conversation, dismissedSuggestions]);

    // Reset dismissed suggestions when conversation changes
    useEffect(() => {
        setDismissedSuggestions(new Set());
    }, [conversation.id]);

    // Detect `/` slash command in input
    useEffect(() => {
        if (inputValue.startsWith('/')) {
            setShowCannedPicker(true);
            setCannedSearch(inputValue.slice(1));
        } else {
            setShowCannedPicker(false);
            setCannedSearch('');
        }
    }, [inputValue]);

    const handleScroll = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
        setShowScrollBtn(distFromBottom > 100);
        if (distFromBottom < 50) setHasNewMessages(false);
    }, []);

    useEffect(() => {
        const count = conversation.messages?.length ?? 0;
        if (count > prevMessageCount.current) {
            const el = scrollRef.current;
            if (el) {
                const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
                if (distFromBottom < 150) {
                    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
                } else {
                    setHasNewMessages(true);
                }
            }
        }
        prevMessageCount.current = count;
    }, [conversation.messages]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'auto' });
    }, [conversation.id]);

    const scrollToBottom = () => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        setHasNewMessages(false);
    };

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInputValue(e.target.value);
        const ta = e.target;
        ta.style.height = 'auto';
        ta.style.height = Math.min(ta.scrollHeight, 160) + 'px';
    };

    const handleSend = async () => {
        if (!inputValue.trim() || isSending) return;
        setIsSending(true);
        try {
            await onSendMessage(inputValue.trim(), isInternal);
            setInputValue('');
            if (textareaRef.current) textareaRef.current.style.height = 'auto';
        } finally {
            setIsSending(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        // Don't handle Enter when canned picker is open (it handles its own Enter)
        if (showCannedPicker) return;
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleCannedSelect = (content: string) => {
        setInputValue(content);
        setShowCannedPicker(false);
        textareaRef.current?.focus();
    };

    const handleSuggestionClick = (text: string) => {
        setInputValue(text);
        textareaRef.current?.focus();
    };

    const dismissSuggestion = (text: string) => {
        setDismissedSuggestions(prev => new Set(prev).add(text));
    };

    const openCannedPicker = () => {
        setInputValue('/');
        setShowCannedPicker(true);
        textareaRef.current?.focus();
    };

    return (
        <div className="flex h-full flex-col">
            {/* Messages */}
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="relative flex-1 overflow-y-auto bg-slate-50/50 dark:bg-zinc-950/20"
            >
                <div className="flex min-h-full flex-col justify-end pb-2 pt-4">
                    {chatItems.map((item, idx) => {
                        if (item.type === 'date') {
                            return <DateSeparator key={item.dateKey} date={item.label} />;
                        }

                        return item.messages.map((msg, msgIdx) => (
                            <MessageBubble
                                key={msg.id || `${idx}-${msgIdx}`}
                                message={msg}
                                showAvatar={msgIdx === item.messages.length - 1}
                                showName={msgIdx === 0}
                                isFirstInGroup={msgIdx === 0}
                                isLastInGroup={msgIdx === item.messages.length - 1}
                            />
                        ));
                    })}
                    <div ref={bottomRef} />
                </div>

                {showScrollBtn && (
                    <button
                        onClick={scrollToBottom}
                        className={cn(
                            'absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-lg transition-all hover:bg-muted',
                            hasNewMessages && 'border-primary/30 bg-primary/5 text-primary'
                        )}
                    >
                        <ChevronDown className="h-3.5 w-3.5" />
                        {hasNewMessages ? 'New messages' : 'Scroll to bottom'}
                    </button>
                )}
            </div>

            {/* Suggestion Pills */}
            {suggestions.length > 0 && !isInternal && (
                <div className="flex items-center gap-2 border-t border-border/40 bg-muted/20 px-3 py-2">
                    <span className="text-[10px] font-medium text-muted-foreground/50">Suggestions</span>
                    <div className="flex flex-wrap gap-1.5">
                        {suggestions.map(s => (
                            <button
                                key={s}
                                onClick={() => handleSuggestionClick(s)}
                                className="group/pill flex items-center gap-1 rounded-full border border-border/60 bg-background px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
                            >
                                {s}
                                <X
                                    className="h-3 w-3 opacity-0 transition-opacity group-hover/pill:opacity-60"
                                    onClick={(e) => { e.stopPropagation(); dismissSuggestion(s); }}
                                />
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Composer */}
            <div ref={composerRef} className="relative border-t border-border bg-background p-3">
                {/* Canned Reply Picker */}
                {showCannedPicker && (
                    <CannedReplyPicker
                        search={cannedSearch}
                        onSelect={handleCannedSelect}
                        onClose={() => { setShowCannedPicker(false); setInputValue(''); }}
                        anchorBottom={(composerRef.current?.offsetHeight ?? 0) - 12}
                    />
                )}

                <div className={cn(
                    'rounded-xl border transition-colors',
                    isInternal
                        ? 'border-yellow-500/40 bg-yellow-500/[0.03]'
                        : 'border-border bg-card'
                )}>
                    {/* Mode tabs */}
                    <div className="flex items-center gap-1 border-b border-border/40 px-2 py-1.5">
                        <button
                            onClick={() => setIsInternal(false)}
                            className={cn(
                                'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                                !isInternal ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'
                            )}
                        >
                            Reply
                        </button>
                        <button
                            onClick={() => setIsInternal(true)}
                            className={cn(
                                'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                                isInternal ? 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400' : 'text-muted-foreground hover:bg-muted'
                            )}
                        >
                            <Lock className="h-3 w-3" />
                            Note
                        </button>
                    </div>

                    {/* Textarea */}
                    <textarea
                        ref={textareaRef}
                        value={inputValue}
                        onChange={handleInput}
                        onKeyDown={handleKeyDown}
                        placeholder={isInternal ? 'Write a private note...' : 'Type / for canned replies, or write a message...'}
                        rows={1}
                        className="w-full resize-none border-none bg-transparent px-3 py-2.5 text-sm leading-relaxed placeholder:text-muted-foreground/50 focus:outline-none focus:ring-0"
                        style={{ minHeight: '38px', maxHeight: '160px' }}
                    />

                    {/* Toolbar */}
                    <div className="flex items-center justify-between px-2 py-1.5">
                        <div className="flex items-center gap-0.5">
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground/60 hover:text-muted-foreground" title="Emoji">
                                <Smile className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground/60 hover:text-muted-foreground" title="Attach file">
                                <Paperclip className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground/60 hover:text-muted-foreground"
                                title="Canned replies (/)"
                                onClick={openCannedPicker}
                            >
                                <Slash className="h-4 w-4" />
                            </Button>
                        </div>
                        <Button
                            onClick={handleSend}
                            disabled={!inputValue.trim() || isSending || showCannedPicker}
                            size="sm"
                            className={cn(
                                'h-8 gap-1.5 px-3 text-xs',
                                isInternal ? 'bg-yellow-600 hover:bg-yellow-700 text-white' : ''
                            )}
                        >
                            <Send className="h-3.5 w-3.5" />
                            {isInternal ? 'Add Note' : 'Send'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
