import React from 'react';
import { MessageCircle, Plus, Sparkles } from 'lucide-react';
import { ConversationSummary, WidgetConfig } from '../types';
import { ConversationRow } from './ConversationRow';
import { AgentAvatar } from './AgentAvatar';
import { Branding } from './Branding';

interface HomeScreenProps {
    config: WidgetConfig;
    conversations: ConversationSummary[];
    isLoading: boolean;
    onSelectConversation: (id: string) => void;
    onNewConversation: () => void;
}

export function HomeScreen({
    config,
    conversations,
    isLoading,
    onSelectConversation,
    onNewConversation,
}: HomeScreenProps): React.ReactElement {
    const agentName = config.agent?.name;
    const replyTime = config.reply_time ?? 'We usually reply in a few minutes';

    return (
        <div className="flex min-h-0 flex-1 flex-col bg-[color:var(--rv-surface)] dark:bg-[color:var(--rv-surface)]">
            {/* Greeting block */}
            <div className="shrink-0 px-5 pb-5 pt-3">
                <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    <Sparkles className="h-3.5 w-3.5" style={{ color: 'var(--rv-brand)' }} aria-hidden="true" />
                    Chat support
                </div>
                <h1 className="mt-2 text-[22px] font-semibold leading-tight tracking-tight text-slate-900 dark:text-slate-50">
                    {config.welcome_title}
                </h1>
                {config.welcome_tagline && (
                    <p className="mt-1.5 text-[14px] leading-relaxed text-slate-500 dark:text-slate-400">
                        {config.welcome_tagline}
                    </p>
                )}
                {agentName && (
                    <div className="mt-4 flex items-center gap-2 text-[12.5px] text-slate-500 dark:text-slate-400">
                        <AgentAvatar name={agentName} src={config.agent?.avatar_url} size="sm" showStatus online />
                        <span>
                            <span className="font-medium text-slate-700 dark:text-slate-200">{agentName}</span>
                            {config.agent?.title ? ` · ${config.agent.title}` : ''}
                        </span>
                    </div>
                )}
            </div>

            {/* Start conversation CTA */}
            <div className="shrink-0 px-4">
                <button
                    type="button"
                    onClick={onNewConversation}
                    className="rv-focusable group relative flex w-full items-center gap-3 overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700/70 dark:bg-slate-800/50"
                >
                    <div
                        aria-hidden="true"
                        className="absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"
                        style={{
                            background:
                                'radial-gradient(120% 80% at 0% 0%, var(--rv-brand-soft) 0%, transparent 60%)',
                        }}
                    />
                    <div
                        className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[color:var(--rv-brand-contrast)] shadow-md"
                        style={{ background: 'var(--rv-brand-gradient)' }}
                        aria-hidden="true"
                    >
                        <Plus className="h-5 w-5" />
                    </div>
                    <div className="relative min-w-0 flex-1">
                        <p className="text-[14.5px] font-semibold text-slate-900 dark:text-slate-50">
                            Start a new conversation
                        </p>
                        <p className="mt-0.5 text-[12px] text-slate-500 dark:text-slate-400">
                            {replyTime}
                        </p>
                    </div>
                </button>
            </div>

            {/* Recent list */}
            <div className="mt-4 min-h-0 flex-1 overflow-hidden">
                {isLoading ? (
                    <HomeSkeleton />
                ) : conversations.length === 0 ? (
                    <HomeEmptyState />
                ) : (
                    <div className="flex h-full min-h-0 flex-col">
                        <p className="px-5 pb-2 pt-3 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500">
                            Recent conversations
                        </p>
                        <div className="rv-scroll flex-1 overflow-y-auto">
                            {conversations.map(conv => (
                                <ConversationRow
                                    key={conv.id}
                                    conversation={conv}
                                    onClick={() => onSelectConversation(conv.id)}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="shrink-0 border-t border-slate-100 bg-[color:var(--rv-surface-muted)] py-2.5 dark:border-slate-800/70">
                <Branding visible={config.show_branding !== false} />
            </div>
        </div>
    );
}

function HomeSkeleton(): React.ReactElement {
    return (
        <div className="flex flex-col gap-3 px-4 pt-4" aria-hidden="true">
            {[0, 1, 2].map(i => (
                <div key={i} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 dark:border-slate-800/70">
                    <div className="h-10 w-10 animate-pulse rounded-full bg-slate-100 dark:bg-slate-700/60" />
                    <div className="flex-1 space-y-2">
                        <div className="h-3 w-2/3 animate-pulse rounded bg-slate-100 dark:bg-slate-700/60" />
                        <div className="h-2.5 w-full animate-pulse rounded bg-slate-100 dark:bg-slate-700/40" />
                    </div>
                </div>
            ))}
        </div>
    );
}

function HomeEmptyState(): React.ReactElement {
    return (
        <div className="flex h-full flex-col items-center justify-center px-6 py-8 text-center">
            <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{ backgroundColor: 'var(--rv-brand-soft)', color: 'var(--rv-brand)' }}
                aria-hidden="true"
            >
                <MessageCircle className="h-6 w-6" />
            </div>
            <p className="mt-3 text-[13.5px] font-medium text-slate-600 dark:text-slate-300">
                No conversations yet
            </p>
            <p className="mt-1 text-[12px] text-slate-400 dark:text-slate-500">
                Tap the button above to say hi — a human is usually around.
            </p>
        </div>
    );
}
