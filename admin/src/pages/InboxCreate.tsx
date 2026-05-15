import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChannelTypes } from '../features/channels/api';
import { useCreateInbox, useUpdateInboxAgents } from '../features/inboxes/api';
import { useUsers } from '../features/users/api';
import {
    ArrowLeft, ArrowRight, Check, Loader2,
    Mail, Phone, Globe, Webhook,
    CheckCircle2, Send, AlertCircle
} from 'lucide-react';
import { Button, Input, cn } from '../components/UI';
import { useForm } from 'react-hook-form';
import { extractApiError } from '../core/http/error';

type Step = 1 | 2 | 3;

interface InboxFormData {
    inbox_name: string;
    channel_name: string;
    webhook_url?: string;
    bot_token?: string;
}

const channelIcons: Record<string, React.ElementType> = {
    web_chat: Globe,
    email: Mail,
    telegram: Send,
    whatsapp: Phone,
    api: Webhook,
};

export default function InboxCreate() {
    const navigate = useNavigate();
    const [step, setStep] = useState<Step>(1);
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [createdInboxId, setCreatedInboxId] = useState<string | null>(null);
    const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
    const [apiError, setApiError] = useState<string | null>(null);

    const { data: channelTypes, isLoading: loadingTypes } = useChannelTypes();
    const { data: users, isLoading: loadingUsers } = useUsers();
    const createInbox = useCreateInbox();
    const updateAgents = useUpdateInboxAgents();

    const { register, handleSubmit, formState: { errors } } = useForm<InboxFormData>();

    // Step 1: Select Channel Type
    const handleSelectType = (type: string) => {
        setSelectedType(type);
        setApiError(null);
        setStep(2);
    };

    // Step 2: Create Inbox + Channel
    const onCreateInbox = async (data: InboxFormData) => {
        if (!selectedType) return;
        setApiError(null);

        // Find selected channel type to get default config
        const channelTypeConfig = channelTypes?.find(t => t.type === selectedType);

        let channelConfig: Record<string, unknown> = {};

        // Merge defaults with user input if needed
        if (channelTypeConfig?.default_config) {
            channelConfig = { ...channelTypeConfig.default_config };
        }

        // For Telegram channels, include bot_token in config
        if (selectedType === 'telegram' && data.bot_token) {
            channelConfig.bot_token = data.bot_token;
        }

        // For API channels, set webhook_url specifically
        let webhookUrl: string | null = null;
        if (selectedType === 'api' && data.webhook_url) {
            webhookUrl = data.webhook_url;
        }

        createInbox.mutate(
            {
                inbox: {
                    name: data.inbox_name,
                    greeting_enabled: false,
                    greeting_message: null,
                    timezone: "UTC",
                },
                channel: {
                    type: selectedType as 'web_chat' | 'telegram' | 'api' | 'whatsapp' | 'email',
                    name: data.channel_name,
                    webhook_url: webhookUrl,
                    config: channelConfig,
                },
            },
            {
                onSuccess: (result) => {
                    setCreatedInboxId(result.inbox.id);
                    setStep(3);
                },
                onError: (err) => {
                    setApiError(extractApiError(err, 'Failed to create inbox.'));
                },
            }
        );
    };

    // Step 3: Assign Agents
    const toggleAgent = (agentId: string) => {
        setSelectedAgents((prev) =>
            prev.includes(agentId)
                ? prev.filter((id) => id !== agentId)
                : [...prev, agentId]
        );
    };

    const handleAssignAgents = async () => {
        if (!createdInboxId) return;
        setApiError(null);

        if (selectedAgents.length > 0) {
            updateAgents.mutate(
                { id: createdInboxId, data: { agent_ids: selectedAgents } },
                {
                    onSuccess: () => navigate(`/inboxes/${createdInboxId}`),
                    onError: (err) => {
                        setApiError(extractApiError(err, 'Failed to assign agents.'));
                    },
                }
            );
        } else {
            navigate(`/inboxes/${createdInboxId}`);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/inboxes')}>
                    <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Create Inbox</h1>
                    <p className="text-muted-foreground">Set up a new inbox with a channel</p>
                </div>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center gap-2">
                {[1, 2, 3].map((s) => (
                    <React.Fragment key={s}>
                        <div
                            className={cn(
                                "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors",
                                step >= s
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-muted-foreground"
                            )}
                        >
                            {step > s ? <Check className="w-4 h-4" /> : s}
                        </div>
                        {s < 3 && (
                            <div className={cn(
                                "flex-1 h-0.5 transition-colors",
                                step > s ? "bg-primary" : "bg-muted"
                            )} />
                        )}
                    </React.Fragment>
                ))}
            </div>

            {/* Step 1: Select Channel Type */}
            {step === 1 && (
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold">Select Channel Type</h2>
                    {loadingTypes ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4">
                            {channelTypes?.map((type) => {
                                const Icon = channelIcons[type.type] || Globe;
                                return (
                                    <button
                                        key={type.type}
                                        onClick={() => handleSelectType(type.type)}
                                        className={cn(
                                            "p-4 rounded-lg border border-border text-left transition-all",
                                            "hover:border-primary/50 hover:shadow-sm",
                                            selectedType === type.type && "border-primary bg-primary/5"
                                        )}
                                    >
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 rounded-lg bg-muted">
                                                <Icon className="w-5 h-5" />
                                            </div>
                                            <span className="font-semibold">{type.label}</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">{type.description}</p>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Step 2: Create Inbox */}
            {step === 2 && (
                <form onSubmit={handleSubmit(onCreateInbox)} className="space-y-6">
                    <h2 className="text-lg font-semibold">Configure Inbox</h2>

                    {apiError && (
                        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                            <span>{apiError}</span>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Inbox Name</label>
                            <Input
                                placeholder="e.g., Customer Support"
                                {...register('inbox_name', { required: 'Inbox name is required' })}
                            />
                            {errors.inbox_name && (
                                <p className="text-xs text-destructive">{errors.inbox_name.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Channel Name</label>
                            <Input
                                placeholder="e.g., Website Chat"
                                {...register('channel_name', { required: 'Channel name is required' })}
                            />
                            {errors.channel_name && (
                                <p className="text-xs text-destructive">{errors.channel_name.message}</p>
                            )}
                        </div>

                        {selectedType === 'telegram' && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Bot Token</label>
                                <Input
                                    type="password"
                                    placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                                    {...register('bot_token', { required: selectedType === 'telegram' ? 'Bot token is required' : false })}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Get your bot token from{' '}
                                    <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                                        @BotFather
                                    </a>{' '}
                                    on Telegram.
                                </p>
                                {errors.bot_token && (
                                    <p className="text-xs text-destructive">{errors.bot_token.message}</p>
                                )}
                            </div>
                        )}

                        {selectedType === 'api' && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Webhook URL (optional)</label>
                                <Input
                                    placeholder="https://your-server.com/webhook"
                                    {...register('webhook_url')}
                                />
                            </div>
                        )}
                    </div>

                    <div className="flex justify-between pt-4">
                        <Button type="button" variant="outline" onClick={() => setStep(1)}>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                        </Button>
                        <Button type="submit" disabled={createInbox.isPending}>
                            {createInbox.isPending ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <ArrowRight className="w-4 h-4 mr-2" />
                            )}
                            Continue
                        </Button>
                    </div>
                </form>
            )}

            {/* Step 3: Assign Agents */}
            {step === 3 && (
                <div className="space-y-6">
                    <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <span className="text-green-700 font-medium">Inbox created successfully!</span>
                    </div>

                    {apiError && (
                        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                            <span>{apiError}</span>
                        </div>
                    )}

                    <h2 className="text-lg font-semibold">Assign Agents (Optional)</h2>
                    <p className="text-sm text-muted-foreground">
                        Select team members who can access conversations in this inbox.
                    </p>

                    {loadingUsers ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {users?.map((user) => (
                                <button
                                    key={user.id}
                                    type="button"
                                    onClick={() => toggleAgent(user.id)}
                                    className={cn(
                                        "w-full p-3 rounded-lg border border-border text-left transition-all flex items-center gap-3",
                                        selectedAgents.includes(user.id) && "border-primary bg-primary/5"
                                    )}
                                >
                                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                                        {user.first_name[0]}
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-medium">{user.first_name} {user.last_name}</div>
                                        <div className="text-sm text-muted-foreground">{user.email}</div>
                                    </div>
                                    {selectedAgents.includes(user.id) && (
                                        <Check className="w-4 h-4 text-primary" />
                                    )}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="flex justify-between pt-4">
                        <Button variant="outline" onClick={handleAssignAgents} disabled={updateAgents.isPending}>
                            Skip for now
                        </Button>
                        <Button onClick={handleAssignAgents} disabled={updateAgents.isPending}>
                            {updateAgents.isPending ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Check className="w-4 h-4 mr-2" />
                            )}
                            {selectedAgents.length > 0 ? `Assign ${selectedAgents.length} Agent${selectedAgents.length > 1 ? 's' : ''}` : 'Finish'}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
