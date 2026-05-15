import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    useChannel,
    useChannelEmbedScript,
    useChannelTypes,
    useDeleteChannel,
    useRotateHmacSecret,
    useUpdateChannel,
    useUpdateChannelDomains,
} from '../features/channels/api';
import { DomainListEditor } from '../components/widget-builder/DomainListEditor';
import { WidgetPreviewCanvas } from '../components/widget-builder/WidgetPreviewCanvas';
import { WidgetConfig } from '../types';
import {
    ArrowLeft,
    AlertCircle,
    Check,
    Code,
    Copy,
    ExternalLink,
    Loader2,
    MessageSquare,
    Palette,
    RefreshCw,
    RotateCcw,
    Save,
    Send,
    Shield,
    Sparkles,
    Trash2,
    Zap,
} from 'lucide-react';
import {
    Badge,
    Button,
    Input,
    Textarea,
    Switch,
    cn,
} from '../components/UI';

type ChannelTab = 'appearance' | 'launcher' | 'behavior' | 'pre_chat' | 'security' | 'embed';
type DomainPolicy = 'allow_all' | 'restrict';
type OfflineMode = 'form' | 'message' | 'hide';
type LauncherStyle = 'bubble' | 'text_bubble';
type WidgetPosition = 'bottom-right' | 'bottom-left';

interface PreChatFormConfig {
    enabled?: boolean;
    pre_chat_message?: string;
    collect_name?: boolean;
    collect_email?: boolean;
    collect_phone?: boolean;
}

interface WidgetChannelConfig {
    widget_color?: string;
    welcome_title?: string;
    welcome_tagline?: string;
    launcher_style?: LauncherStyle;
    launcher_text?: string;
    position?: WidgetPosition;
    radius?: number;
    show_branding?: boolean;
    enable_email_collect?: boolean;
    auto_open?: boolean;
    bot_enabled?: boolean;
    offline_mode?: OfflineMode;
    offline_message?: string;
    pre_chat_form?: PreChatFormConfig;
    domain_policy?: DomainPolicy;
    [key: string]: unknown;
}

const WEB_TABS: Array<{ id: ChannelTab; label: string; icon: React.ElementType }> = [
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'launcher', label: 'Launcher', icon: Sparkles },
    { id: 'behavior', label: 'Behavior', icon: Zap },
    { id: 'pre_chat', label: 'Pre-Chat', icon: MessageSquare },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'embed', label: 'Install', icon: Code },
];

const PRESET_COLORS = ['#0ea5e9', '#6366f1', '#8b5cf6', '#ec4899', '#f97316', '#22c55e', '#0f172a', '#ef4444'];

const DEFAULT_WIDGET_CONFIG: WidgetChannelConfig = {
    widget_color: '#0ea5e9',
    welcome_title: 'Hi there!',
    welcome_tagline: 'Ask us anything. We usually reply in minutes.',
    launcher_style: 'bubble',
    launcher_text: 'Chat with us',
    position: 'bottom-right',
    radius: 18,
    show_branding: true,
    enable_email_collect: false,
    auto_open: false,
    bot_enabled: false,
    offline_mode: 'form',
    offline_message: 'We are offline right now. Leave your details and we will follow up.',
    pre_chat_form: {
        enabled: false,
        pre_chat_message: 'Tell us a bit about what you need and we will connect you faster.',
        collect_name: true,
        collect_email: true,
        collect_phone: false,
    },
    domain_policy: 'allow_all',
};

export default function ChannelDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<ChannelTab>('appearance');
    const [copied, setCopied] = useState(false);
    const [saveState, setSaveState] = useState<'idle' | 'saved' | 'error'>('idle');

    const [draftName, setDraftName] = useState('');
    const [draftIsActive, setDraftIsActive] = useState(true);
    const [draftWebhookUrl, setDraftWebhookUrl] = useState('');
    const [draftHmacMandatory, setDraftHmacMandatory] = useState(false);
    const [draftConfig, setDraftConfig] = useState<WidgetChannelConfig>(DEFAULT_WIDGET_CONFIG);
    const [domains, setDomains] = useState<string[]>([]);

    const { data: channel, isLoading, error } = useChannel(id ?? '');
    const { data: channelTypes } = useChannelTypes();
    const { data: embedScript } = useChannelEmbedScript(id ?? '', channel?.type === 'web_chat');

    const updateChannel = useUpdateChannel();
    const deleteChannel = useDeleteChannel();
    const rotateHmac = useRotateHmacSecret();
    const updateDomains = useUpdateChannelDomains();

    const isWebChannel = channel?.type === 'web_chat';
    const isTelegramChannel = channel?.type === 'telegram';
    const isSaving = updateChannel.isPending || updateDomains.isPending;

    const baselineConfig = useMemo(
        () => normalizeWidgetConfig((channel?.config as Record<string, unknown> | null) ?? null),
        [channel?.config, channel?.id, channel?.updated_at]
    );
    const baselineDomains = useMemo(() => normalizeDomains(extractDomainsFromConfig(baselineConfig)), [baselineConfig]);
    const baselineDomainPolicy: DomainPolicy = baselineConfig.domain_policy ?? (baselineDomains.length ? 'restrict' : 'allow_all');

    useEffect(() => {
        if (!channel) return;
        const normalizedConfig = normalizeWidgetConfig((channel.config as Record<string, unknown> | null) ?? null);
        const normalizedDomains = normalizeDomains(extractDomainsFromConfig(normalizedConfig));
        const domainPolicy: DomainPolicy = normalizedConfig.domain_policy ?? (normalizedDomains.length ? 'restrict' : 'allow_all');

        setDraftName(channel.name);
        setDraftIsActive(channel.is_active);
        setDraftWebhookUrl(channel.webhook_url ?? '');
        setDraftHmacMandatory(channel.hmac_mandatory);
        setDraftConfig({ ...normalizedConfig, domain_policy: domainPolicy });
        setDomains(normalizedDomains);
        setSaveState('idle');
    }, [channel?.id, channel?.updated_at]);

    const currentDomainPolicy: DomainPolicy = draftConfig.domain_policy ?? (domains.length ? 'restrict' : 'allow_all');
    const normalizedDraftDomains = useMemo(() => normalizeDomains(domains), [domains]);

    const draftConfigPayload = useMemo(
        () => buildConfigPayload(draftConfig, currentDomainPolicy),
        [draftConfig, currentDomainPolicy]
    );
    const baselineConfigPayload = useMemo(
        () => buildConfigPayload(baselineConfig, baselineDomainPolicy),
        [baselineConfig, baselineDomainPolicy]
    );

    const configDirty = serializeForCompare(draftConfigPayload) !== serializeForCompare(baselineConfigPayload);
    const domainsDirty =
        serializeForCompare(currentDomainPolicy === 'restrict' ? normalizedDraftDomains : []) !==
        serializeForCompare(baselineDomainPolicy === 'restrict' ? baselineDomains : []);

    const hasUnsavedChanges = Boolean(channel) && (
        draftName !== channel?.name ||
        draftIsActive !== channel?.is_active ||
        draftWebhookUrl !== (channel?.webhook_url ?? '') ||
        draftHmacMandatory !== channel?.hmac_mandatory ||
        configDirty ||
        domainsDirty
    );

    const channelTypeMeta = useMemo(
        () => channelTypes?.find((type) => type.type === channel?.type),
        [channel?.type, channelTypes]
    );

    const updateConfig = (patch: Partial<WidgetChannelConfig>) => {
        setDraftConfig((prev) => ({ ...prev, ...patch }));
        setSaveState('idle');
    };

    const updatePreChatForm = (patch: Partial<PreChatFormConfig>) => {
        setDraftConfig((prev) => ({
            ...prev,
            pre_chat_form: {
                ...(prev.pre_chat_form ?? DEFAULT_WIDGET_CONFIG.pre_chat_form),
                ...patch,
            },
        }));
        setSaveState('idle');
    };

    const resetDraft = () => {
        if (!channel) return;
        const normalizedConfig = normalizeWidgetConfig((channel.config as Record<string, unknown> | null) ?? null);
        const normalizedDomains = normalizeDomains(extractDomainsFromConfig(normalizedConfig));
        const domainPolicy: DomainPolicy = normalizedConfig.domain_policy ?? (normalizedDomains.length ? 'restrict' : 'allow_all');

        setDraftName(channel.name);
        setDraftIsActive(channel.is_active);
        setDraftWebhookUrl(channel.webhook_url ?? '');
        setDraftHmacMandatory(channel.hmac_mandatory);
        setDraftConfig({ ...normalizedConfig, domain_policy: domainPolicy });
        setDomains(normalizedDomains);
        setSaveState('idle');
    };

    const handleSave = async () => {
        if (!id || !channel || isSaving) return;
        setSaveState('idle');
        try {
            await updateChannel.mutateAsync({
                id,
                data: {
                    name: draftName.trim() || channel.name,
                    is_active: draftIsActive,
                    hmac_mandatory: draftHmacMandatory,
                    webhook_url: draftWebhookUrl.trim() ? draftWebhookUrl.trim() : null,
                    config: draftConfigPayload,
                },
            });
            if (isWebChannel && domainsDirty) {
                await updateDomains.mutateAsync({
                    id,
                    data: { domains: currentDomainPolicy === 'restrict' ? normalizedDraftDomains : [] },
                });
            }
            setSaveState('saved');
            window.setTimeout(() => setSaveState('idle'), 2200);
        } catch {
            setSaveState('error');
        }
    };

    const handleDelete = () => {
        if (!id || !channel) return;
        if (!window.confirm('Delete this channel? This action cannot be undone.')) return;
        deleteChannel.mutate(id, { onSuccess: () => navigate(`/inboxes/${channel.inbox_id}`) });
    };

    const handleRotateSecret = () => {
        if (!id) return;
        if (!window.confirm('Rotate HMAC secret? Existing signatures will stop working.')) return;
        rotateHmac.mutate(id);
    };

    const copyToClipboard = async (text: string) => {
        if (!text) return;
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1800);
        } catch { /* ignore */ }
    };

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error || !channel) {
        return <div className="p-6 text-center text-destructive">Failed to load channel</div>;
    }

    const preChatForm = draftConfig.pre_chat_form ?? DEFAULT_WIDGET_CONFIG.pre_chat_form!;

    return (
        <div className="flex h-[calc(100vh-4rem)] flex-col">
            {/* Top bar */}
            <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/inboxes/${channel.inbox_id}`)}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <h1 className="truncate text-base font-semibold">{draftName || channel.name}</h1>
                            <Badge variant={draftIsActive ? 'success' : 'secondary'} className="text-[10px]">
                                {draftIsActive ? 'Active' : 'Inactive'}
                            </Badge>
                            <Badge variant="outline" className="text-[10px]">
                                {channelTypeMeta?.label ?? channel.type.replace('_', ' ')}
                            </Badge>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {isWebChannel && channel.channel_key && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1.5 text-xs"
                            onClick={() => {
                                const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || window.location.origin;
                                window.open(`${baseUrl}/widget/test/${channel.channel_key}`, '_blank');
                            }}
                        >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Test
                        </Button>
                    )}

                    {/* Save status */}
                    {saveState === 'saved' && (
                        <span className="flex items-center gap-1 text-xs text-emerald-600">
                            <Check className="h-3.5 w-3.5" /> Saved
                        </span>
                    )}
                    {saveState === 'error' && (
                        <span className="text-xs text-destructive">Save failed</span>
                    )}
                    {hasUnsavedChanges && (
                        <span className="hidden text-xs text-amber-600 sm:inline">Unsaved changes</span>
                    )}

                    <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs" onClick={resetDraft} disabled={!hasUnsavedChanges || isSaving}>
                        <RotateCcw className="h-3.5 w-3.5" />
                        Reset
                    </Button>
                    <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={handleSave} disabled={!hasUnsavedChanges || isSaving}>
                        {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                        Save
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={handleDelete} disabled={deleteChannel.isPending}>
                        <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>

            {/* Main content */}
            <div className="flex min-h-0 flex-1">
                {/* Settings panel */}
                <div className="flex w-full flex-col border-r border-border xl:w-[480px]">
                    {/* Channel name + status */}
                    <div className="border-b border-border bg-card/50 p-4">
                        <div className="flex gap-3">
                            <div className="flex-1 space-y-1">
                                <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Name</label>
                                <Input
                                    value={draftName}
                                    onChange={(e) => { setDraftName(e.target.value); setSaveState('idle'); }}
                                    placeholder="Website Chat"
                                    className="h-9 text-sm"
                                />
                            </div>
                            <div className="w-28 space-y-1">
                                <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Status</label>
                                <div className="flex h-9 items-center justify-between rounded-md border border-border bg-background px-3">
                                    <span className="text-xs">{draftIsActive ? 'On' : 'Off'}</span>
                                    <Switch checked={draftIsActive} onCheckedChange={setDraftIsActive} />
                                </div>
                            </div>
                        </div>

                        {isTelegramChannel && (
                            <div className="mt-3 flex items-center gap-2 rounded-md border border-blue-400/30 bg-blue-50 px-3 py-2 text-xs text-blue-700 dark:border-blue-500/20 dark:bg-blue-950/30 dark:text-blue-400">
                                <Send className="h-3.5 w-3.5 shrink-0" />
                                Telegram Bot Channel
                            </div>
                        )}
                        {!isWebChannel && !isTelegramChannel && (
                            <div className="mt-3 flex items-center gap-2 rounded-md border border-amber-400/30 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-500/20 dark:bg-amber-950/30 dark:text-amber-400">
                                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                Widget editor unavailable for this channel type
                            </div>
                        )}
                    </div>

                    {/* Tabs (web only) */}
                    {isWebChannel && (
                        <div className="no-scrollbar flex gap-0.5 overflow-x-auto border-b border-border bg-muted/30 px-3 py-1.5">
                            {WEB_TABS.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        'flex items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
                                        activeTab === tab.id
                                            ? 'bg-background text-foreground shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground'
                                    )}
                                >
                                    <tab.icon className="h-3.5 w-3.5" />
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Tab content */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {/* Telegram */}
                        {isTelegramChannel && (
                            <div className="space-y-4">
                                <SettingSection title="Bot Connection">
                                    {(draftConfig as Record<string, unknown>).bot_username && (
                                        <div className="flex items-center gap-2.5 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950/30">
                                            <Check className="h-4 w-4 text-green-600" />
                                            <div>
                                                <p className="text-sm font-medium text-green-800 dark:text-green-400">
                                                    @{(draftConfig as Record<string, unknown>).bot_username as string}
                                                </p>
                                                <p className="text-[11px] text-green-600/70">Connected</p>
                                            </div>
                                        </div>
                                    )}
                                    <FieldGroup label="Bot Token">
                                        <Input
                                            type="password"
                                            value={((draftConfig as Record<string, unknown>).bot_token as string) ?? ''}
                                            onChange={(e) => { setDraftConfig(prev => ({ ...prev, bot_token: e.target.value })); setSaveState('idle'); }}
                                            placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                                            className="h-9 font-mono text-xs"
                                        />
                                        <p className="text-[11px] text-muted-foreground">
                                            Get from <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-primary underline">@BotFather</a>
                                        </p>
                                    </FieldGroup>
                                </SettingSection>
                                <SettingSection title="Webhook">
                                    <div className="flex gap-2">
                                        <Input value={channel.webhook_url ?? 'Not registered'} readOnly className="h-9 bg-muted font-mono text-[11px]" />
                                        {channel.webhook_url && (
                                            <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={() => copyToClipboard(channel.webhook_url!)}>
                                                {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                                            </Button>
                                        )}
                                    </div>
                                </SettingSection>
                            </div>
                        )}

                        {/* Non-web, non-telegram */}
                        {!isWebChannel && !isTelegramChannel && (
                            <div className="space-y-4">
                                <SettingSection title="Configuration">
                                    <FieldGroup label="Webhook URL">
                                        <Input
                                            value={draftWebhookUrl}
                                            onChange={(e) => { setDraftWebhookUrl(e.target.value); setSaveState('idle'); }}
                                            placeholder="https://your-app.com/webhook"
                                            className="h-9 text-sm"
                                        />
                                    </FieldGroup>
                                    <SettingSwitch
                                        title="HMAC Verification"
                                        description="Require signed requests"
                                        checked={draftHmacMandatory}
                                        onChange={(v) => { setDraftHmacMandatory(v); setSaveState('idle'); }}
                                    />
                                </SettingSection>
                            </div>
                        )}

                        {/* Web: Appearance */}
                        {isWebChannel && activeTab === 'appearance' && (
                            <div className="space-y-5">
                                <FieldGroup label="Accent Color">
                                    <div className="flex flex-wrap items-center gap-2">
                                        {PRESET_COLORS.map((color) => (
                                            <button
                                                key={color}
                                                type="button"
                                                onClick={() => updateConfig({ widget_color: color })}
                                                className={cn(
                                                    'h-8 w-8 rounded-full border-2 transition-all hover:scale-110',
                                                    draftConfig.widget_color === color ? 'border-foreground scale-110 ring-2 ring-foreground/20' : 'border-transparent'
                                                )}
                                                style={{ backgroundColor: color }}
                                            />
                                        ))}
                                        <div className="relative">
                                            <Input
                                                type="color"
                                                value={draftConfig.widget_color}
                                                onChange={(e) => updateConfig({ widget_color: e.target.value })}
                                                className="h-8 w-10 cursor-pointer rounded-full border-2 border-dashed border-border p-0.5"
                                            />
                                        </div>
                                    </div>
                                </FieldGroup>
                                <FieldGroup label="Welcome Title">
                                    <Input
                                        value={draftConfig.welcome_title}
                                        onChange={(e) => updateConfig({ welcome_title: e.target.value })}
                                        placeholder="Hi there!"
                                        className="h-9 text-sm"
                                    />
                                </FieldGroup>
                                <FieldGroup label="Welcome Message">
                                    <Input
                                        value={draftConfig.welcome_tagline}
                                        onChange={(e) => updateConfig({ welcome_tagline: e.target.value })}
                                        placeholder="Ask us anything."
                                        className="h-9 text-sm"
                                    />
                                </FieldGroup>
                            </div>
                        )}

                        {/* Web: Launcher */}
                        {isWebChannel && activeTab === 'launcher' && (
                            <div className="space-y-5">
                                <FieldGroup label="Position">
                                    <div className="grid grid-cols-2 gap-2">
                                        {(['bottom-right', 'bottom-left'] as const).map((pos) => (
                                            <button
                                                key={pos}
                                                type="button"
                                                className={cn(
                                                    'rounded-lg border px-3 py-2 text-xs font-medium transition-colors',
                                                    draftConfig.position === pos
                                                        ? 'border-primary bg-primary/5 text-primary'
                                                        : 'border-border text-muted-foreground hover:bg-muted'
                                                )}
                                                onClick={() => updateConfig({ position: pos })}
                                            >
                                                {pos === 'bottom-right' ? 'Bottom Right' : 'Bottom Left'}
                                            </button>
                                        ))}
                                    </div>
                                </FieldGroup>

                                <FieldGroup label="Style">
                                    <select
                                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        value={draftConfig.launcher_style}
                                        onChange={(e) => updateConfig({ launcher_style: e.target.value as LauncherStyle })}
                                    >
                                        <option value="bubble">Icon Bubble</option>
                                        <option value="text_bubble">Bubble + Text</option>
                                    </select>
                                </FieldGroup>

                                {draftConfig.launcher_style === 'text_bubble' && (
                                    <FieldGroup label="Label Text">
                                        <Input
                                            value={draftConfig.launcher_text}
                                            onChange={(e) => updateConfig({ launcher_text: e.target.value })}
                                            placeholder="Chat with us"
                                            className="h-9 text-sm"
                                        />
                                    </FieldGroup>
                                )}

                                <FieldGroup label={`Corner Radius (${draftConfig.radius}px)`}>
                                    <input
                                        type="range"
                                        min={4}
                                        max={28}
                                        value={draftConfig.radius}
                                        onChange={(e) => updateConfig({ radius: Number(e.target.value) })}
                                        className="w-full accent-primary"
                                    />
                                </FieldGroup>
                            </div>
                        )}

                        {/* Web: Behavior */}
                        {isWebChannel && activeTab === 'behavior' && (
                            <div className="space-y-3">
                                <SettingSwitch title="Collect Email" description="Ask visitors for email before chat." checked={Boolean(draftConfig.enable_email_collect)} onChange={(v) => updateConfig({ enable_email_collect: v })} />
                                <SettingSwitch title="Auto Open" description="Open widget automatically on first visit." checked={Boolean(draftConfig.auto_open)} onChange={(v) => updateConfig({ auto_open: v })} />
                                <SettingSwitch title="Bot Demo Replies" description="Show automated reply in preview." checked={Boolean(draftConfig.bot_enabled)} onChange={(v) => updateConfig({ bot_enabled: v })} />
                                <SettingSwitch title="Show Branding" description="Display Powered by Relvo." checked={draftConfig.show_branding !== false} onChange={(v) => updateConfig({ show_branding: v })} />

                                <FieldGroup label="When Team Is Offline">
                                    <select
                                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        value={draftConfig.offline_mode}
                                        onChange={(e) => updateConfig({ offline_mode: e.target.value as OfflineMode })}
                                    >
                                        <option value="form">Show contact form</option>
                                        <option value="message">Show offline message</option>
                                        <option value="hide">Hide widget</option>
                                    </select>
                                </FieldGroup>

                                {draftConfig.offline_mode === 'message' && (
                                    <FieldGroup label="Offline Message">
                                        <Textarea
                                            rows={2}
                                            value={draftConfig.offline_message}
                                            onChange={(e) => updateConfig({ offline_message: e.target.value })}
                                            className="text-sm"
                                        />
                                    </FieldGroup>
                                )}
                            </div>
                        )}

                        {/* Web: Pre-Chat */}
                        {isWebChannel && activeTab === 'pre_chat' && (
                            <div className="space-y-4">
                                <SettingSwitch title="Enable Pre-Chat Form" description="Collect visitor details before an agent joins." checked={Boolean(preChatForm.enabled)} onChange={(v) => updatePreChatForm({ enabled: v })} />

                                {preChatForm.enabled && (
                                    <>
                                        <FieldGroup label="Intro Message">
                                            <Textarea
                                                rows={2}
                                                value={preChatForm.pre_chat_message}
                                                onChange={(e) => updatePreChatForm({ pre_chat_message: e.target.value })}
                                                className="text-sm"
                                            />
                                        </FieldGroup>
                                        <FieldGroup label="Fields to Collect">
                                            <div className="grid grid-cols-3 gap-2">
                                                <ToggleChip label="Name" checked={Boolean(preChatForm.collect_name)} onChange={(v) => updatePreChatForm({ collect_name: v })} />
                                                <ToggleChip label="Email" checked={Boolean(preChatForm.collect_email)} onChange={(v) => updatePreChatForm({ collect_email: v })} />
                                                <ToggleChip label="Phone" checked={Boolean(preChatForm.collect_phone)} onChange={(v) => updatePreChatForm({ collect_phone: v })} />
                                            </div>
                                        </FieldGroup>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Web: Security */}
                        {isWebChannel && activeTab === 'security' && (
                            <div className="space-y-4">
                                <SettingSection title="Domain Access">
                                    <div className="flex gap-2">
                                        {(['allow_all', 'restrict'] as const).map(policy => (
                                            <button
                                                key={policy}
                                                type="button"
                                                onClick={() => updateConfig({ domain_policy: policy })}
                                                className={cn(
                                                    'rounded-md border px-3 py-1.5 text-xs font-medium transition-colors',
                                                    currentDomainPolicy === policy
                                                        ? 'border-primary bg-primary/5 text-primary'
                                                        : 'border-border text-muted-foreground hover:text-foreground'
                                                )}
                                            >
                                                {policy === 'allow_all' ? 'All Domains' : 'Restricted'}
                                            </button>
                                        ))}
                                    </div>
                                    {currentDomainPolicy === 'restrict' && (
                                        <DomainListEditor
                                            domains={normalizedDraftDomains}
                                            onChange={(next) => { setDomains(normalizeDomains(next)); setSaveState('idle'); }}
                                        />
                                    )}
                                </SettingSection>

                                <SettingSection title="Identity Security">
                                    <SettingSwitch
                                        title="Require HMAC Signatures"
                                        description="Prevent user impersonation with server-side signing."
                                        checked={draftHmacMandatory}
                                        onChange={(v) => { setDraftHmacMandatory(v); setSaveState('idle'); }}
                                    />
                                    {draftHmacMandatory && (
                                        <div className="flex items-start gap-2 rounded-md border border-amber-300/40 bg-amber-50 p-3 dark:border-amber-500/20 dark:bg-amber-950/30">
                                            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                                            <div className="space-y-1.5">
                                                <p className="text-xs font-medium text-amber-800 dark:text-amber-400">HMAC enabled</p>
                                                <Button size="sm" variant="outline" className="h-7 gap-1.5 text-xs" onClick={handleRotateSecret} disabled={rotateHmac.isPending}>
                                                    {rotateHmac.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                                                    Rotate Secret
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </SettingSection>
                            </div>
                        )}

                        {/* Web: Embed */}
                        {isWebChannel && activeTab === 'embed' && (
                            <div className="space-y-4">
                                <p className="text-xs text-muted-foreground">
                                    Paste this script before <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">&lt;/body&gt;</code> on every page where you want chat.
                                </p>
                                <div className="relative">
                                    <pre className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-[11px] leading-relaxed text-zinc-100">
                                        <code>{embedScript?.script ?? 'Loading...'}</code>
                                    </pre>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        className="absolute right-2 top-2 h-7 gap-1.5 text-xs"
                                        onClick={() => copyToClipboard(embedScript?.script ?? '')}
                                        disabled={!embedScript?.script}
                                    >
                                        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                        {copied ? 'Copied' : 'Copy'}
                                    </Button>
                                </div>
                                <ol className="list-inside list-decimal space-y-1 text-xs text-muted-foreground">
                                    <li>Save your widget settings first</li>
                                    <li>Paste the script in your site template</li>
                                    <li>Open your site and confirm the launcher appears</li>
                                </ol>
                            </div>
                        )}
                    </div>
                </div>

                {/* Preview panel */}
                <div className="hidden flex-1 xl:block">
                    {isWebChannel ? (
                        <WidgetPreviewCanvas config={mapToWidgetConfig(draftConfig)} className="h-full" />
                    ) : (
                        <div className="flex h-full items-center justify-center bg-muted/20 p-8">
                            <div className="space-y-2 text-center">
                                <p className="text-sm font-medium text-muted-foreground">Channel Summary</p>
                                <div className="space-y-1 text-xs text-muted-foreground/70">
                                    <p>Type: {channelTypeMeta?.label ?? channel.type}</p>
                                    <p>Status: {draftIsActive ? 'Enabled' : 'Paused'}</p>
                                    <p>HMAC: {draftHmacMandatory ? 'Required' : 'Optional'}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// Sub-components
// ============================================================================

function SettingSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="space-y-3">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">{title}</h3>
            <div className="space-y-3">{children}</div>
        </div>
    );
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground/80">{label}</label>
            {children}
        </div>
    );
}

function SettingSwitch({ title, description, checked, onChange }: {
    title: string;
    description: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}) {
    return (
        <div className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2.5">
            <div className="min-w-0 pr-3">
                <p className="text-sm font-medium">{title}</p>
                <p className="text-[11px] text-muted-foreground">{description}</p>
            </div>
            <Switch checked={checked} onCheckedChange={onChange} />
        </div>
    );
}

function ToggleChip({ label, checked, onChange }: {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}) {
    return (
        <button
            type="button"
            onClick={() => onChange(!checked)}
            className={cn(
                'flex items-center justify-center rounded-lg border py-2 text-xs font-medium transition-colors',
                checked ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:bg-muted'
            )}
        >
            {label}
        </button>
    );
}

// ============================================================================
// Utilities
// ============================================================================

function mapToWidgetConfig(draft: WidgetChannelConfig): WidgetConfig {
    return {
        theme_color: draft.widget_color ?? '#0ea5e9',
        welcome_title: draft.welcome_title ?? 'Hi there!',
        welcome_message: draft.welcome_tagline ?? 'Ask us anything. We usually reply in minutes.',
        position: draft.position ?? 'bottom-right',
        launcher_style: draft.launcher_style ?? 'bubble',
        launcher_text: draft.launcher_text ?? 'Chat with us',
        radius: draft.radius ?? 18,
        show_branding: draft.show_branding !== false,
        bot_enabled: draft.bot_enabled ?? false,
        offline_mode: draft.offline_mode ?? 'form',
        offline_message: draft.offline_message,
        domain_policy: draft.domain_policy ?? 'allow_all',
    };
}

function normalizeWidgetConfig(raw: Record<string, unknown> | null): WidgetChannelConfig {
    const base = (raw ?? {}) as WidgetChannelConfig;
    const basePreChat = (base.pre_chat_form ?? {}) as PreChatFormConfig;
    const fallbackPreChat = DEFAULT_WIDGET_CONFIG.pre_chat_form ?? {};
    return { ...DEFAULT_WIDGET_CONFIG, ...base, pre_chat_form: { ...fallbackPreChat, ...basePreChat } };
}

function buildConfigPayload(config: WidgetChannelConfig, domainPolicy: DomainPolicy): Record<string, unknown> {
    const payload: WidgetChannelConfig = {
        ...config,
        domain_policy: domainPolicy,
        pre_chat_form: { ...(DEFAULT_WIDGET_CONFIG.pre_chat_form ?? {}), ...(config.pre_chat_form ?? {}) },
    };
    delete payload.domains;
    return payload;
}

function extractDomainsFromConfig(config: WidgetChannelConfig): string[] {
    const explicit = config.domains;
    if (Array.isArray(explicit)) return explicit.filter((v): v is string => typeof v === 'string');
    const fallback = (config as { allowed_domains?: unknown }).allowed_domains;
    if (Array.isArray(fallback)) return fallback.filter((v): v is string => typeof v === 'string');
    return [];
}

function normalizeDomains(domains: string[]): string[] {
    return Array.from(new Set(domains.map(d => d.trim().toLowerCase()).filter(d => d.length > 0)));
}

function serializeForCompare(value: unknown): string {
    return JSON.stringify(sortValue(value));
}

function sortValue(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(sortValue);
    if (value && typeof value === 'object') {
        return Object.keys(value as Record<string, unknown>).sort().reduce<Record<string, unknown>>((acc, key) => {
            acc[key] = sortValue((value as Record<string, unknown>)[key]);
            return acc;
        }, {});
    }
    return value;
}
