import React from 'react';
import { ArrowLeft, Minus, X } from 'lucide-react';
import { AgentAvatar } from './AgentAvatar';
import { WidgetAgentSummary } from '../types';

interface PanelProps {
    title: string;
    subtitle?: string;
    agent?: WidgetAgentSummary;
    showBack?: boolean;
    onBack?: () => void;
    onClose: () => void;
    onMinimize?: () => void;
    children: React.ReactNode;
    footer?: React.ReactNode;
    radius: number;
}

export function Panel({
    title,
    subtitle,
    agent,
    showBack,
    onBack,
    onClose,
    onMinimize,
    children,
    footer,
    radius,
}: PanelProps): React.ReactElement {
    return (
        <div
            className="rv-panel rv-fullscreen pointer-events-auto flex h-[600px] max-h-[min(720px,calc(100dvh-2rem))] w-[380px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden border border-slate-200/70 bg-[color:var(--rv-surface)] text-[color:var(--rv-text)] shadow-[var(--rv-shadow)] backdrop-blur-xl dark:border-slate-700/60"
            style={{ borderRadius: `${radius}px` }}
            role="dialog"
            aria-modal="true"
            aria-label={title}
        >
            <PanelHeader
                title={title}
                subtitle={subtitle}
                agent={agent}
                showBack={showBack}
                onBack={onBack}
                onClose={onClose}
                onMinimize={onMinimize}
            />
            <div className="flex min-h-0 flex-1 flex-col">
                {children}
            </div>
            {footer}
        </div>
    );
}

interface HeaderProps {
    title: string;
    subtitle?: string;
    agent?: WidgetAgentSummary;
    showBack?: boolean;
    onBack?: () => void;
    onClose: () => void;
    onMinimize?: () => void;
}

function PanelHeader({
    title,
    subtitle,
    agent,
    showBack,
    onBack,
    onClose,
    onMinimize,
}: HeaderProps): React.ReactElement {
    return (
        <div
            className="relative shrink-0 overflow-hidden px-4 py-4 text-[color:var(--rv-brand-contrast)]"
            style={{ background: 'var(--rv-brand-gradient)' }}
        >
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-60"
                style={{
                    background:
                        'radial-gradient(120% 80% at 100% 0%, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0) 60%), radial-gradient(80% 60% at 0% 100%, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0) 60%)',
                }}
            />
            <div className="relative flex items-start gap-3">
                {showBack && (
                    <button
                        type="button"
                        onClick={onBack}
                        aria-label="Back"
                        className="rv-focusable -ml-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-[color:var(--rv-brand-contrast)] transition-colors hover:bg-white/20"
                    >
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    </button>
                )}
                {agent && !showBack && (
                    <AgentAvatar
                        name={agent.name}
                        src={agent.avatar_url}
                        size="md"
                        showStatus
                        online
                    />
                )}
                <div className="min-w-0 flex-1">
                    <h2 className="truncate text-[15px] font-semibold leading-tight">
                        {title}
                    </h2>
                    {subtitle && (
                        <p className="mt-0.5 truncate text-[12px] text-white/75">{subtitle}</p>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    {onMinimize && (
                        <button
                            type="button"
                            onClick={onMinimize}
                            aria-label="Minimize chat"
                            className="rv-focusable hidden h-8 w-8 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white sm:inline-flex"
                        >
                            <Minus className="h-4 w-4" aria-hidden="true" />
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close chat"
                        className="rv-focusable inline-flex h-8 w-8 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                    >
                        <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                </div>
            </div>
        </div>
    );
}
