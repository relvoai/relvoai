import React, { useEffect, useRef } from 'react';
import { Loader2, Paperclip, Send, Smile } from 'lucide-react';

interface ComposerProps {
    value: string;
    onChange: (value: string) => void;
    onSend: () => void;
    disabled?: boolean;
    sending?: boolean;
    placeholder?: string;
    onAttachClick?: () => void;
}

export function Composer({
    value,
    onChange,
    onSend,
    disabled,
    sending,
    placeholder,
    onAttachClick,
}: ComposerProps): React.ReactElement {
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    useEffect(() => {
        const el = textareaRef.current;
        if (!el) {
            return;
        }
        el.style.height = 'auto';
        el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
    }, [value]);

    const trimmed = value.trim();
    const canSend = trimmed.length > 0 && !sending && !disabled;

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (canSend) {
                onSend();
            }
        }
    };

    return (
        <div className="shrink-0 border-t border-slate-100 bg-[color:var(--rv-surface)] px-3 py-2.5 dark:border-slate-800/70">
            <form
                className={`flex items-end gap-2 rounded-2xl border bg-[color:var(--rv-surface-muted)] px-2.5 py-1.5 transition-colors focus-within:border-transparent focus-within:ring-2 dark:bg-slate-800/60 ${
                    disabled
                        ? 'border-slate-200 opacity-60 dark:border-slate-700'
                        : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600'
                }`}
                style={{ ['--tw-ring-color' as string]: 'var(--rv-brand-ring)' }}
                onSubmit={e => {
                    e.preventDefault();
                    if (canSend) {
                        onSend();
                    }
                }}
            >
                <div className="flex items-center gap-1 pb-1.5 pt-1.5">
                    {onAttachClick && (
                        <button
                            type="button"
                            onClick={onAttachClick}
                            disabled={disabled}
                            aria-label="Attach file"
                            title="Attach file"
                            className="rv-focusable inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-200/70 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-slate-700/70 dark:hover:text-slate-100"
                        >
                            <Paperclip className="h-4 w-4" aria-hidden="true" />
                        </button>
                    )}
                </div>
                <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={1}
                    placeholder={placeholder ?? 'Write a message...'}
                    disabled={disabled}
                    aria-label="Message"
                    className="rv-textarea flex-1 bg-transparent px-1 py-2 text-[14px] text-slate-900 placeholder:text-slate-400 focus:outline-none disabled:cursor-not-allowed dark:text-slate-100 dark:placeholder:text-slate-500"
                />
                <div className="flex items-center gap-1 pb-1.5 pt-1.5">
                    <button
                        type="button"
                        aria-label="Emoji"
                        title="Emoji — coming soon"
                        disabled
                        className="hidden h-7 w-7 items-center justify-center rounded-full text-slate-300 disabled:cursor-not-allowed sm:inline-flex"
                    >
                        <Smile className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                        type="submit"
                        disabled={!canSend}
                        aria-label="Send message"
                        className="rv-focusable inline-flex h-8 w-8 items-center justify-center rounded-full text-[color:var(--rv-brand-contrast)] shadow-md transition-transform duration-150 hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                        style={{ background: 'var(--rv-brand-gradient)' }}
                    >
                        {sending ? (
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        ) : (
                            <Send className="h-4 w-4" aria-hidden="true" />
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
