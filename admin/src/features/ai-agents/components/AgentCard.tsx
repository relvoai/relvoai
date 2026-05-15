import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Star, Radio, MoreVertical, Trash2 } from 'lucide-react';
import {
    Card,
    Badge,
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from '../../../components/UI';
import type { AiAgentResource } from '../api';

interface Props {
    agent: AiAgentResource;
    onDelete?: (agent: AiAgentResource) => void;
}

export function AgentCard({ agent, onDelete }: Props) {
    const navigate = useNavigate();
    const channels = agent.channels ?? [];
    const primary = channels.find((c) => c.pivot?.is_primary);

    return (
        <Card
            onClick={() => navigate(`/ai/agents/${agent.id}`)}
            className="cursor-pointer group relative p-5 rounded-2xl hover:border-primary/50 transition-all duration-200 hover:shadow-md"
        >
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                        <Bot className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-foreground leading-tight">{agent.name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {agent.provider ?? 'provider —'} · {agent.model ?? 'model —'}
                        </p>
                    </div>
                </div>
                <div
                    className="flex items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                >
                    <Badge variant={agent.is_active ? 'success' : 'secondary'} className="rounded-md text-[10px] tracking-wide uppercase">
                        {agent.is_active ? 'Active' : 'Off'}
                    </Badge>
                    <DropdownMenu>
                        <DropdownMenuTrigger>
                            <button className="p-1.5 rounded-md text-muted-foreground hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreVertical className="w-4 h-4" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {onDelete && (
                                <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => onDelete(agent)}
                                >
                                    <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete agent
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {agent.identity_persona && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{agent.identity_persona}</p>
            )}

            <div className="flex flex-wrap gap-1.5 min-h-[24px]">
                {channels.length === 0 && (
                    <span className="text-xs text-muted-foreground italic">No channels attached</span>
                )}
                {channels.map((channel) => (
                    <span
                        key={channel.id}
                        className={
                            'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs border ' +
                            (channel.pivot?.is_primary
                                ? 'border-amber-300/60 bg-amber-100/40 text-amber-900 dark:text-amber-200 dark:bg-amber-500/10'
                                : 'border-border bg-muted text-foreground/80')
                        }
                    >
                        {channel.pivot?.is_primary ? <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> : <Radio className="w-3 h-3" />}
                        {channel.name}
                    </span>
                ))}
            </div>

            {primary && (
                <div className="mt-4 text-[11px] text-muted-foreground flex items-center gap-1.5 border-t border-border/50 pt-3">
                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                    Primary on <span className="font-medium text-foreground">{primary.name}</span>
                </div>
            )}
        </Card>
    );
}

export default AgentCard;
