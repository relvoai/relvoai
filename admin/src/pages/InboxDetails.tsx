import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useInbox, useUpdateInbox, useUpdateInboxAgents, useCreateChannel, useDeleteInbox } from '../features/inboxes/api';
import { useUsers } from '../features/users/api';
import { useChannelTypes } from '../features/channels/api';
import {
    ArrowLeft, Save, Loader2, Plus, Settings, Users,
    MessageSquare, Trash2, Check, X, Clock, Sliders, Smile, AlertCircle
} from 'lucide-react';
import { Button, Input, cn, Card, CardHeader, CardTitle, CardContent, Textarea, Switch } from '../components/UI';
import { useForm } from 'react-hook-form';
import { extractApiError } from '../core/http/error';

// Separate forms for separate tabs/endpoints
interface GeneralFormData {
    name: string;
    business_name: string;
    sender_name_type: 'friendly' | 'professional';
    is_active: boolean;
    timezone: string;
}

interface AutomationFormData {
    enable_auto_assignment: boolean;
    lock_to_single_conversation: boolean;
    allow_messages_after_resolved: boolean;
}

interface AvailabilityFormData {
    working_hours_enabled: boolean;
    out_of_office_message: string;
    // working_hours...
}

interface CSATFormData {
    csat_survey_enabled: boolean;
}

export default function InboxDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'general' | 'availability' | 'automation' | 'csat' | 'agents' | 'channels'>('general');

    // Channels state
    const [showAddChannel, setShowAddChannel] = useState(false);
    const [selectedChannelType, setSelectedChannelType] = useState('');
    const [newChannelName, setNewChannelName] = useState('');
    const [newChannelBotToken, setNewChannelBotToken] = useState('');
    const [newChannelWebhookUrl, setNewChannelWebhookUrl] = useState('');
    const [channelError, setChannelError] = useState<string | null>(null);
    const [agentsError, setAgentsError] = useState<string | null>(null);

    // Queries
    const { data: inbox, isLoading, error } = useInbox(id!);
    const { data: users } = useUsers();
    const { data: channelTypes } = useChannelTypes();

    // Mutations
    const updateInbox = useUpdateInbox();
    const updateAgents = useUpdateInboxAgents();
    const createChannel = useCreateChannel();
    const deleteInbox = useDeleteInbox();

    // Forms
    // In a real app complexity, these might be separate components
    const generalForm = useForm<GeneralFormData>({
        values: inbox ? {
            name: inbox.name,
            business_name: inbox.business_name || '',
            sender_name_type: inbox.sender_name_type || 'friendly',
            is_active: inbox.is_active,
            timezone: inbox.timezone || ''
        } : undefined
    });
    const automationForm = useForm<AutomationFormData>({
        values: inbox ? {
            enable_auto_assignment: inbox.enable_auto_assignment,
            lock_to_single_conversation: inbox.lock_to_single_conversation,
            allow_messages_after_resolved: inbox.allow_messages_after_resolved
        } : undefined
    });
    const availabilityForm = useForm<AvailabilityFormData>({
        values: inbox ? {
            working_hours_enabled: inbox.working_hours_enabled,
            out_of_office_message: inbox.out_of_office_message || ''
        } : undefined
    });
    const csatForm = useForm<CSATFormData>({ values: inbox ? { csat_survey_enabled: inbox.csat_survey_enabled } : undefined });


    const onSaveGeneral = (data: GeneralFormData) => {
        if (!id) return;
        updateInbox.mutate({ id, data });
    };

    const onSaveAutomation = (data: AutomationFormData) => {
        if (!id) return;
        updateInbox.mutate({ id, data });
    };

    const onSaveAvailability = (data: AvailabilityFormData) => {
        if (!id) return;
        updateInbox.mutate({ id, data });
    };

    const onSaveCSAT = (data: CSATFormData) => {
        if (!id) return;
        updateInbox.mutate({ id, data });
    };


    const handleToggleAgent = (agentId: string) => {
        if (!id || !inbox) return;
        setAgentsError(null);
        const currentAgents = inbox.agents?.map(a => a.id) || [];
        const newAgents = currentAgents.includes(agentId)
            ? currentAgents.filter(a => a !== agentId)
            : [...currentAgents, agentId];
        updateAgents.mutate(
            { id, data: { agent_ids: newAgents } },
            {
                onError: (err) => setAgentsError(extractApiError(err, 'Failed to update agents.')),
            }
        );
    };

    const handleAddChannel = () => {
        if (!id || !selectedChannelType || !newChannelName) return;
        setChannelError(null);

        // Build config + webhook based on channel type
        const selectedTypeMeta = channelTypes?.find(t => t.type === selectedChannelType);
        const config: Record<string, unknown> = { ...(selectedTypeMeta?.default_config ?? {}) };
        let webhookUrl: string | null = null;

        if (selectedChannelType === 'telegram') {
            if (!newChannelBotToken.trim()) {
                setChannelError('Bot token is required for Telegram channels.');
                return;
            }
            config.bot_token = newChannelBotToken.trim();
        }

        if (selectedChannelType === 'api' && newChannelWebhookUrl.trim()) {
            webhookUrl = newChannelWebhookUrl.trim();
        }

        createChannel.mutate(
            {
                inboxId: id,
                data: {
                    type: selectedChannelType as 'web_chat' | 'telegram' | 'api' | 'whatsapp' | 'email',
                    name: newChannelName,
                    webhook_url: webhookUrl,
                    config,
                },
            },
            {
                onSuccess: () => {
                    setShowAddChannel(false);
                    setNewChannelName('');
                    setSelectedChannelType('');
                    setNewChannelBotToken('');
                    setNewChannelWebhookUrl('');
                    setChannelError(null);
                },
                onError: (err) => setChannelError(extractApiError(err, 'Failed to create channel.')),
            }
        );
    };

    const handleDelete = () => {
        if (!id || !confirm('Are you sure you want to delete this inbox?')) return;
        deleteInbox.mutate(id, { onSuccess: () => navigate('/inboxes') });
    };

    if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
    if (error || !inbox) return <div className="p-6 text-center text-destructive">Failed to load inbox</div>;

    const tabs = [
        { id: 'general' as const, label: 'General', icon: Settings },
        { id: 'availability' as const, label: 'Availability', icon: Clock },
        { id: 'automation' as const, label: 'Automation', icon: Sliders },
        { id: 'csat' as const, label: 'CSAT', icon: Smile },
        { id: 'agents' as const, label: 'Agents', icon: Users, count: inbox.agents?.length },
        { id: 'channels' as const, label: 'Channels', icon: MessageSquare, count: inbox.channels?.length },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/inboxes')}><ArrowLeft className="w-4 h-4" /></Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{inbox.name}</h1>
                        <p className="text-muted-foreground">Inbox configuration</p>
                    </div>
                </div>
                <Button variant="destructive" size="sm" onClick={handleDelete}><Trash2 className="w-4 h-4 mr-2" />Delete</Button>
            </div>

            <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit flex-wrap">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                            activeTab === tab.id ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                        {tab.count !== undefined && <span className="px-1.5 py-0.5 text-xs bg-muted rounded-full ml-1 border">{tab.count}</span>}
                    </button>
                ))}
            </div>

            {/* TAB CONTENT */}

            {/* 1. General */}
            {activeTab === 'general' && (
                <Card><CardHeader><CardTitle>General Settings</CardTitle></CardHeader><CardContent>
                    <form onSubmit={generalForm.handleSubmit(onSaveGeneral)} className="space-y-4 max-w-xl">
                        <div className="flex items-center justify-between border p-3 rounded-lg">
                            <label className="text-sm font-medium">Inbox Active</label>
                            <Switch checked={generalForm.watch('is_active')} onCheckedChange={(c) => generalForm.setValue('is_active', c, { shouldDirty: true })} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Inbox Name</label>
                            <Input {...generalForm.register('name')} placeholder="Internal name (e.g. Support)" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Business Name</label>
                            <Input {...generalForm.register('business_name')} placeholder="Public name (e.g. Acme Corp)" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Sender Name Style</label>
                            <select {...generalForm.register('sender_name_type')} className="w-full h-10 px-3 rounded-md border border-input bg-background">
                                <option value="friendly">Friendly (e.g. "Benny from Acme")</option>
                                <option value="professional">Professional (e.g. "Acme Support")</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Timezone</label>
                            <Input {...generalForm.register('timezone')} placeholder="UTC" />
                        </div>
                        <Button type="submit" disabled={!generalForm.formState.isDirty || updateInbox.isPending}>
                            {updateInbox.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Save
                        </Button>
                    </form>
                </CardContent></Card>
            )}

            {/* 2. Availability */}
            {activeTab === 'availability' && (
                <Card><CardHeader><CardTitle>Availability & Working Hours</CardTitle></CardHeader><CardContent>
                    <form onSubmit={availabilityForm.handleSubmit(onSaveAvailability)} className="space-y-4 max-w-xl">
                        <div className="flex items-center justify-between border p-3 rounded-lg">
                            <label className="text-sm font-medium">Enable Working Hours</label>
                            <Switch checked={availabilityForm.watch('working_hours_enabled')} onCheckedChange={(c) => availabilityForm.setValue('working_hours_enabled', c, { shouldDirty: true })} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Out of Office Message</label>
                            <Textarea {...availabilityForm.register('out_of_office_message')} placeholder="We are currently away..." />
                        </div>
                        <Button type="submit" disabled={!availabilityForm.formState.isDirty || updateInbox.isPending}>
                            {updateInbox.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Save
                        </Button>
                    </form>
                </CardContent></Card>
            )}

            {/* 3. Automation */}
            {activeTab === 'automation' && (
                <Card><CardHeader><CardTitle>Automation & Assignment</CardTitle></CardHeader><CardContent>
                    <form onSubmit={automationForm.handleSubmit(onSaveAutomation)} className="space-y-4 max-w-xl">
                        <div className="flex items-center justify-between border p-3 rounded-lg">
                            <div><div className="font-medium">Auto Assignment</div><div className="text-xs text-muted-foreground">Round-robin assignment</div></div>
                            <Switch checked={automationForm.watch('enable_auto_assignment')} onCheckedChange={(c) => automationForm.setValue('enable_auto_assignment', c, { shouldDirty: true })} />
                        </div>
                        <div className="flex items-center justify-between border p-3 rounded-lg">
                            <div><div className="font-medium">Lock to Single Conversation</div><div className="text-xs text-muted-foreground">Only one open conversation per contact</div></div>
                            <Switch checked={automationForm.watch('lock_to_single_conversation')} onCheckedChange={(c) => automationForm.setValue('lock_to_single_conversation', c, { shouldDirty: true })} />
                        </div>
                        <Button type="submit" disabled={!automationForm.formState.isDirty || updateInbox.isPending}>
                            {updateInbox.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Save
                        </Button>
                    </form>
                </CardContent></Card>
            )}

            {/* 4. CSAT */}
            {activeTab === 'csat' && (
                <Card><CardHeader><CardTitle>Customer Satisfaction</CardTitle></CardHeader><CardContent>
                    <form onSubmit={csatForm.handleSubmit(onSaveCSAT)} className="space-y-4 max-w-xl">
                        <div className="flex items-center justify-between border p-3 rounded-lg">
                            <div><div className="font-medium">Enable CSAT Survey</div><div className="text-xs text-muted-foreground">Ask for feedback after resolution</div></div>
                            <Switch checked={csatForm.watch('csat_survey_enabled')} onCheckedChange={(c) => csatForm.setValue('csat_survey_enabled', c, { shouldDirty: true })} />
                        </div>
                        <Button type="submit" disabled={!csatForm.formState.isDirty || updateInbox.isPending}>
                            {updateInbox.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Save
                        </Button>
                    </form>
                </CardContent></Card>
            )}

            {/* 5. Agents (Same as before) */}
            {activeTab === 'agents' && (
                <Card><CardHeader><CardTitle>Assigned Agents</CardTitle></CardHeader><CardContent>
                    {agentsError && (
                        <div className="mb-3 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
                            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            <span>{agentsError}</span>
                        </div>
                    )}
                    <div className="space-y-2">
                        {users?.map((user) => {
                            const isAssigned = inbox.agents?.some(a => a.id === user.id);
                            return (
                                <button key={user.id} onClick={() => handleToggleAgent(user.id)} className={cn("w-full p-3 rounded-lg border border-border text-left flex items-center gap-3 transition-colors", isAssigned && "border-primary bg-primary/5")}>
                                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">{user.first_name[0]}</div>
                                    <div className="flex-1"><div className="font-medium">{user.first_name} {user.last_name}</div><div className="text-sm text-muted-foreground">{user.email}</div></div>
                                    {isAssigned && <Check className="w-4 h-4 text-primary" />}
                                </button>
                            );
                        })}
                    </div>
                </CardContent></Card>
            )}

            {/* 6. Channels (Same as before) */}
            {activeTab === 'channels' && (
                <Card><CardHeader><CardTitle>Connected Channels</CardTitle></CardHeader><CardContent>
                    <div className="space-y-4">
                        <div className="flex justify-end"><Button size="sm" onClick={() => setShowAddChannel(true)}><Plus className="w-4 h-4 mr-2" />Add Channel</Button></div>
                        {showAddChannel && (
                            <div className="p-4 border border-border rounded-lg space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-medium">Add New Channel</h3>
                                    <Button variant="ghost" size="icon" onClick={() => { setShowAddChannel(false); setChannelError(null); }}>
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                                {channelError && (
                                    <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
                                        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                        <span>{channelError}</span>
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Channel Type</label>
                                        <select value={selectedChannelType} onChange={(e) => { setSelectedChannelType(e.target.value); setChannelError(null); }} className="w-full h-10 px-3 rounded-md border border-input bg-background">
                                            <option value="">Select type...</option>
                                            {channelTypes?.map((t) => (<option key={t.type} value={t.type}>{t.label}</option>))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Channel Name</label>
                                        <Input value={newChannelName} onChange={(e) => setNewChannelName(e.target.value)} placeholder="e.g., Website Chat" />
                                    </div>
                                </div>
                                {selectedChannelType === 'telegram' && (
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Bot Token</label>
                                        <Input
                                            type="password"
                                            value={newChannelBotToken}
                                            onChange={(e) => setNewChannelBotToken(e.target.value)}
                                            placeholder="123456:ABC-DEF…"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Get from{' '}
                                            <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-primary underline">@BotFather</a>. The token is validated against Telegram when you click Add.
                                        </p>
                                    </div>
                                )}
                                {selectedChannelType === 'api' && (
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Webhook URL (optional)</label>
                                        <Input
                                            value={newChannelWebhookUrl}
                                            onChange={(e) => setNewChannelWebhookUrl(e.target.value)}
                                            placeholder="https://your-server.com/webhook"
                                        />
                                    </div>
                                )}
                                <Button onClick={handleAddChannel} disabled={!selectedChannelType || !newChannelName || createChannel.isPending}>
                                    {createChannel.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                                    Add Channel
                                </Button>
                            </div>
                        )}
                        <div className="space-y-2">
                            {inbox.channels?.map((channel) => (
                                <div key={channel.id} onClick={() => navigate(`/channels/${channel.id}`)} className="p-4 border border-border rounded-lg hover:border-primary/50 cursor-pointer flex items-center justify-between">
                                    <div><div className="font-medium">{channel.name}</div><div className="text-sm text-muted-foreground capitalize">{channel.type.replace('_', ' ')}</div></div>
                                    <span className={cn("px-2 py-0.5 text-xs rounded-full", channel.is_active ? "bg-green-500/10 text-green-600" : "bg-muted text-muted-foreground")}>{channel.is_active ? 'Active' : 'Inactive'}</span>
                                </div>
                            ))}
                            {(!inbox.channels || inbox.channels.length === 0) && <p className="text-muted-foreground text-center py-8">No channels configured</p>}
                        </div>
                    </div>
                </CardContent></Card>
            )}
        </div>
    );
}
