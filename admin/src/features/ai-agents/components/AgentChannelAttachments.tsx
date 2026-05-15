import React from 'react';
import { Star, Radio, Link2, Unlink, Loader2, MessageSquare, Globe, Send, Mail } from 'lucide-react';
import { Button, Card, cn } from '../../../components/UI';
import { useInboxes } from '../../inboxes/api';
import {
    useAttachAgentChannel,
    useDetachAgentChannel,
    type AiAgentResource,
    type AiAgentChannel,
} from '../api';

interface Props {
    agent: AiAgentResource;
}

const CHANNEL_ICONS: Record<string, typeof MessageSquare> = {
    web_chat: Globe,
    telegram: Send,
    whatsapp: MessageSquare,
    email: Mail,
    api: Radio,
};

interface FlatChannel {
    id: string;
    name: string;
    type: string;
    inbox_name: string;
}

export function AgentChannelAttachments({ agent }: Props) {
    const { data: inboxes, isLoading } = useInboxes();
    const attach = useAttachAgentChannel();
    const detach = useDetachAgentChannel();

    const allChannels: FlatChannel[] = React.useMemo(() => {
        if (!inboxes) {
            return [];
        }
        const out: FlatChannel[] = [];
        inboxes.forEach((inbox) => {
            (inbox.channels ?? []).forEach((channel) => {
                out.push({
                    id: channel.id,
                    name: channel.name,
                    type: channel.type,
                    inbox_name: inbox.name,
                });
            });
        });
        return out;
    }, [inboxes]);

    const attached = React.useMemo(() => {
        const map = new Map<string, AiAgentChannel>();
        (agent.channels ?? []).forEach((c) => map.set(c.id, c));
        return map;
    }, [agent.channels]);

    const handleAttach = (channelId: string, isPrimary: boolean): void => {
        attach.mutate({ agentId: agent.id, channelId, data: { is_primary: isPrimary } });
    };

    const handleDetach = (channelId: string): void => {
        detach.mutate({ agentId: agent.id, channelId });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-40">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (allChannels.length === 0) {
        return (
            <Card className="p-8 text-center space-y-2 rounded-2xl">
                <p className="font-medium">No channels yet</p>
                <p className="text-sm text-muted-foreground">
                    Create an inbox with a channel first, then attach this agent to it.
                </p>
            </Card>
        );
    }

    return (
        <div className="space-y-3">
            {allChannels.map((channel) => {
                const isAttached = attached.has(channel.id);
                const agentChannel = attached.get(channel.id);
                const isPrimary = !!agentChannel?.pivot?.is_primary;
                const Icon = CHANNEL_ICONS[channel.type] ?? MessageSquare;
                return (
                    <Card
                        key={channel.id}
                        className={cn(
                            'p-4 rounded-2xl flex items-center justify-between transition-all',
                            isAttached ? 'border-primary/40 bg-primary/[0.03]' : 'hover:bg-muted/30'
                        )}
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            <div
                                className={cn(
                                    'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                                    isAttached ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                                )}
                            >
                                <Icon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                                <div className="font-medium truncate">{channel.name}</div>
                                <div className="text-xs text-muted-foreground truncate">
                                    {channel.inbox_name} · {channel.type.replace('_', ' ')}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            {isAttached && (
                                <button
                                    type="button"
                                    onClick={() => handleAttach(channel.id, !isPrimary)}
                                    disabled={attach.isPending}
                                    className={cn(
                                        'inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors',
                                        isPrimary
                                            ? 'bg-amber-500/15 text-amber-700 dark:text-amber-200 hover:bg-amber-500/25'
                                            : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                                    )}
                                    title={isPrimary ? 'Demote from primary' : 'Make primary (auto-handles inbound)'}
                                >
                                    <Star className={cn('w-3.5 h-3.5', isPrimary && 'fill-current')} />
                                    {isPrimary ? 'Primary' : 'Make primary'}
                                </button>
                            )}

                            {isAttached ? (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDetach(channel.id)}
                                    disabled={detach.isPending}
                                >
                                    <Unlink className="w-3.5 h-3.5 mr-1.5" /> Detach
                                </Button>
                            ) : (
                                <Button
                                    size="sm"
                                    onClick={() => handleAttach(channel.id, false)}
                                    disabled={attach.isPending}
                                >
                                    <Link2 className="w-3.5 h-3.5 mr-1.5" /> Attach
                                </Button>
                            )}
                        </div>
                    </Card>
                );
            })}

            <p className="text-xs text-muted-foreground pt-2">
                Only one primary agent per channel. Promoting a new primary auto-demotes the previous one.
            </p>
        </div>
    );
}

export default AgentChannelAttachments;
