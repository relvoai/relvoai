import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { widgetApi } from './api';
import {
    ConversationSummary,
    IdentityPayload,
    Message,
    RelvoSettings,
    UIConfigResponse,
    WidgetConfig,
} from './types';
import { useColorScheme } from './hooks/useColorScheme';
import { useBrandTheme } from './hooks/useBrandTheme';
import { getBrowserContext } from './utils';
import { Launcher } from './components/Launcher';
import { Panel } from './components/Panel';
import { HomeScreen } from './components/HomeScreen';
import { ChatScreen } from './components/ChatScreen';
import { IdentityForm } from './components/IdentityForm';

interface WidgetAppProps {
    settings: RelvoSettings;
}

type Screen = 'home' | 'chat' | 'identity';

const DEFAULT_CONFIG: WidgetConfig = {
    widget_color: '#4F46E5',
    welcome_title: 'Hi there!',
    welcome_tagline: 'Ask us anything. We usually reply in minutes.',
    radius: 20,
};

export default function WidgetApp({ settings }: WidgetAppProps): React.ReactElement {
    const [isOpen, setIsOpen] = useState<boolean>(() => localStorage.getItem('relvo_widget_open') === 'true');
    const [screen, setScreen] = useState<Screen>('home');
    const [config, setConfig] = useState<WidgetConfig>(DEFAULT_CONFIG);
    const [identityState, setIdentityState] = useState<UIConfigResponse['identity'] | null>(null);

    const [conversations, setConversations] = useState<ConversationSummary[]>([]);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState<string>('');
    const [isSending, setIsSending] = useState<boolean>(false);

    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);
    const [isBootstrapped, setIsBootstrapped] = useState<boolean>(false);
    const [identityError, setIdentityError] = useState<string | null>(null);
    const [identitySubmitting, setIdentitySubmitting] = useState<boolean>(false);
    const [isOffline, setIsOffline] = useState<boolean>(typeof navigator !== 'undefined' ? !navigator.onLine : false);

    // Persist open state
    useEffect(() => {
        localStorage.setItem('relvo_widget_open', String(isOpen));
    }, [isOpen]);

    useEffect(() => {
        const goOnline = (): void => setIsOffline(false);
        const goOffline = (): void => setIsOffline(true);
        window.addEventListener('online', goOnline);
        window.addEventListener('offline', goOffline);
        return (): void => {
            window.removeEventListener('online', goOnline);
            window.removeEventListener('offline', goOffline);
        };
    }, []);

    // Initial load: config + (session-resume or bootstrap)
    useEffect(() => {
        let cancelled = false;
        const init = async (): Promise<void> => {
            try {
                const configData = await widgetApi.getConfig();
                if (cancelled) {
                    return;
                }
                if (configData.widget_config) {
                    setConfig(c => ({ ...c, ...configData.widget_config }));
                }
                setIdentityState(configData.identity ?? null);

                const storedToken = localStorage.getItem('relvo_session_token');
                const userProvided = Boolean(settings.user?.email || settings.user?.external_id);
                const identityRequired = configData.identity?.mode === 'required';

                if (storedToken) {
                    try {
                        const convos = await widgetApi.getConversations();
                        if (cancelled) {
                            return;
                        }
                        setConversations(convos);
                        setIsBootstrapped(true);
                        return;
                    } catch {
                        // fall through to bootstrap / identity gate
                    }
                }

                if (identityRequired && !userProvided) {
                    setScreen('identity');
                    return;
                }

                await runBootstrap();
            } catch (error) {
                console.error('Relvo Widget: Init failed', error);
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        };

        const runBootstrap = async (): Promise<void> => {
            const clientContext = { ...getBrowserContext(), ...settings.client };
            const bootstrapData = await widgetApi.bootstrap(settings.user, clientContext);
            if (cancelled) {
                return;
            }
            localStorage.setItem('relvo_session_token', bootstrapData.session_token);
            widgetApi.configure(settings.channel_key, localStorage.getItem('relvo_visitor_uid') || '', bootstrapData.session_token);
            setIsBootstrapped(true);
            const convos = await widgetApi.getConversations();
            if (!cancelled) {
                setConversations(convos);
            }
        };

        init();
        return (): void => {
            cancelled = true;
        };
    }, [settings]);

    const loadConversation = useCallback(async (conversationId: string): Promise<void> => {
        setActiveConversationId(conversationId);
        setScreen('chat');
        setIsLoadingMessages(true);
        setMessages([]);
        try {
            await widgetApi.selectConversation(conversationId);
            const msgs = await widgetApi.getMessages();
            setMessages(msgs);
        } catch (error) {
            console.error('Failed to load conversation', error);
        } finally {
            setIsLoadingMessages(false);
        }
    }, []);

    const startNewConversation = useCallback(async (): Promise<void> => {
        try {
            const conv = await widgetApi.createConversation();
            setConversations(prev => [conv, ...prev]);
            setActiveConversationId(conv.id);
            setMessages([]);
            setScreen('chat');
        } catch (error) {
            console.error('Failed to create conversation', error);
        }
    }, []);

    const goHome = useCallback(async (): Promise<void> => {
        setScreen('home');
        setActiveConversationId(null);
        setMessages([]);
        try {
            const convos = await widgetApi.getConversations();
            setConversations(convos);
        } catch {
            /* swallow — home still renders */
        }
    }, []);

    const handleIdentitySubmit = useCallback(async (payload: IdentityPayload): Promise<void> => {
        setIdentitySubmitting(true);
        setIdentityError(null);
        try {
            const clientContext = { ...getBrowserContext(), ...settings.client };
            const bootstrapData = await widgetApi.bootstrap(
                { ...settings.user, name: payload.name, email: payload.email },
                clientContext,
            );
            localStorage.setItem('relvo_session_token', bootstrapData.session_token);
            widgetApi.configure(
                settings.channel_key,
                localStorage.getItem('relvo_visitor_uid') || '',
                bootstrapData.session_token,
            );
            setIsBootstrapped(true);
            const convos = await widgetApi.getConversations();
            setConversations(convos);
            setScreen('home');
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Could not start the chat. Please try again.';
            setIdentityError(message);
        } finally {
            setIdentitySubmitting(false);
        }
    }, [settings]);

    const handleSend = useCallback(async (): Promise<void> => {
        const body = inputValue.trim();
        if (!body || isSending || !isBootstrapped) {
            return;
        }
        setInputValue('');
        setIsSending(true);

        const tempId = `temp-${Date.now()}`;
        const optimistic: Message = {
            id: tempId,
            body,
            type: 'visitor',
            created_at: new Date().toISOString(),
            pending: true,
        };
        setMessages(prev => [...prev, optimistic]);

        try {
            const saved = await widgetApi.sendMessage(body);
            setMessages(prev => prev.map(m => (m.id === tempId ? { ...saved, pending: false } : m)));
        } catch (error) {
            console.error('Failed to send message', error);
            setMessages(prev => prev.map(m => (m.id === tempId ? { ...m, pending: false, failed: true } : m)));
        } finally {
            setIsSending(false);
        }
    }, [inputValue, isSending, isBootstrapped]);

    const brand = useBrandTheme(config.widget_color);
    const scheme = useColorScheme(config.appearance);
    const radius = config.radius ?? 20;
    const isLeft = config.position === 'bottom-left';

    const activeConversation = useMemo(
        () => conversations.find(c => c.id === activeConversationId),
        [conversations, activeConversationId],
    );

    const rootStyle = { ...brand.cssVars } as React.CSSProperties;
    const rootClass = `rv-root ${scheme === 'dark' ? 'rv-dark dark' : ''} pointer-events-none fixed bottom-4 z-[2147483000] flex flex-col ${
        isLeft ? 'left-4 items-start' : 'right-4 items-end'
    } sm:bottom-5 ${isLeft ? 'sm:left-5' : 'sm:right-5'}`;

    const unreadCount = useMemo(
        () => conversations.filter(c => c.status === 'open').length,
        [conversations],
    );

    const panelTitle = screen === 'chat'
        ? (activeConversation?.subject || config.welcome_title)
        : screen === 'identity'
            ? 'Welcome'
            : config.welcome_title;

    const panelSubtitle = screen === 'chat'
        ? (activeConversation?.status === 'closed' ? 'Conversation closed' : config.reply_time ?? 'We typically reply in minutes')
        : screen === 'identity'
            ? 'Just a couple of details to get started'
            : config.welcome_tagline;

    return (
        <div className={rootClass} style={rootStyle}>
            {isOpen && (
                <div className="pointer-events-auto mb-3">
                    <Panel
                        title={panelTitle}
                        subtitle={panelSubtitle}
                        agent={config.agent}
                        showBack={screen === 'chat'}
                        onBack={goHome}
                        onClose={() => setIsOpen(false)}
                        onMinimize={() => setIsOpen(false)}
                        radius={radius}
                    >
                        {screen === 'identity' && (
                            <IdentityForm
                                config={config}
                                fields={identityState?.fields ?? { name: true, email: true }}
                                isSubmitting={identitySubmitting}
                                error={identityError}
                                onSubmit={handleIdentitySubmit}
                            />
                        )}
                        {screen === 'home' && (
                            <HomeScreen
                                config={config}
                                conversations={conversations}
                                isLoading={isLoading}
                                onSelectConversation={loadConversation}
                                onNewConversation={startNewConversation}
                            />
                        )}
                        {screen === 'chat' && (
                            <ChatScreen
                                config={config}
                                messages={messages}
                                isLoading={isLoadingMessages}
                                isSending={isSending}
                                isOffline={isOffline}
                                inputValue={inputValue}
                                onInputChange={setInputValue}
                                onSend={handleSend}
                                isBootstrapped={isBootstrapped}
                                activeConversation={activeConversation}
                            />
                        )}
                    </Panel>
                </div>
            )}

            <div className="pointer-events-auto">
                <Launcher
                    isOpen={isOpen}
                    unreadCount={unreadCount}
                    teaser={config.launcher_style === 'text_bubble' ? config.launcher_text : undefined}
                    onToggle={() => setIsOpen(prev => !prev)}
                />
            </div>
        </div>
    );
}
