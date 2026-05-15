import React from 'react';
import { MessageCircle, X } from 'lucide-react';

interface LauncherProps {
    isOpen: boolean;
    unreadCount: number;
    teaser?: string;
    onToggle: () => void;
    ariaLabel?: string;
}

export function Launcher({
    isOpen,
    unreadCount,
    teaser,
    onToggle,
    ariaLabel,
}: LauncherProps): React.ReactElement {
    const hasUnread = unreadCount > 0;
    const label = ariaLabel ?? (isOpen ? 'Close chat' : 'Open chat');
    return (
        <div className="rv-launch flex items-center gap-3">
            {!isOpen && teaser && (
                <div className="hidden max-w-[220px] rounded-2xl border border-slate-200/70 bg-white px-3.5 py-2.5 text-[13px] font-medium leading-snug text-slate-700 shadow-lg dark:border-slate-700/70 dark:bg-slate-800 dark:text-slate-200 sm:block">
                    {teaser}
                </div>
            )}
            <button
                type="button"
                onClick={onToggle}
                aria-label={label}
                aria-expanded={isOpen}
                className="rv-focusable group relative flex h-14 w-14 items-center justify-center rounded-full text-[color:var(--rv-brand-contrast)] shadow-[0_18px_40px_-12px_rgba(15,23,42,0.45)] transition-[transform,box-shadow] duration-200 hover:scale-[1.04] hover:shadow-[0_22px_50px_-12px_rgba(15,23,42,0.55)] active:scale-95"
                style={{ background: 'var(--rv-brand-gradient)' }}
            >
                <span className="absolute inset-0 rounded-full bg-white/5 opacity-0 transition-opacity group-hover:opacity-100" />
                <span className="relative flex h-6 w-6 items-center justify-center">
                    <MessageCircle
                        className={`absolute h-6 w-6 transition-all duration-200 ${
                            isOpen ? 'rotate-45 opacity-0' : 'rotate-0 opacity-100'
                        }`}
                        aria-hidden="true"
                    />
                    <X
                        className={`absolute h-6 w-6 transition-all duration-200 ${
                            isOpen ? 'rotate-0 opacity-100' : '-rotate-45 opacity-0'
                        }`}
                        aria-hidden="true"
                    />
                </span>
                {!isOpen && hasUnread && (
                    <span
                        aria-live="polite"
                        aria-label={`${unreadCount} unread messages`}
                        className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] font-semibold leading-none text-white ring-2 ring-white dark:ring-slate-900"
                    >
                        <span className="rv-badge-ping text-rose-500/70" aria-hidden="true" />
                        <span className="relative">{unreadCount > 9 ? '9+' : unreadCount}</span>
                    </span>
                )}
            </button>
        </div>
    );
}
