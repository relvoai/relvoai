import React from 'react';
import {
    FileText,
    Link as LinkIcon,
    Type,
    RefreshCw,
    Trash2,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Info,
} from 'lucide-react';
import { Button, Card, cn } from '../../../components/UI';
import {
    useDeleteKnowledgeSource,
    useKnowledgeSources,
    useReindexKnowledgeSource,
    type AiKnowledgeSourceResource,
    type KnowledgeStatus,
} from '../api';

interface Props {
    agentId: string;
}

const TYPE_ICONS = {
    pdf: FileText,
    text: Type,
    url: LinkIcon,
} as const;

function statusConfig(status: KnowledgeStatus): { label: string; cls: string; icon: typeof CheckCircle2 } {
    switch (status) {
        case 'ready':
            return {
                label: 'Ready',
                cls: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
                icon: CheckCircle2,
            };
        case 'failed':
            return {
                label: 'Failed',
                cls: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30',
                icon: AlertCircle,
            };
        case 'processing':
        default:
            return {
                label: 'Processing',
                cls: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30',
                icon: Loader2,
            };
    }
}

function relative(dateIso: string | null): string {
    if (!dateIso) {
        return '—';
    }
    const diff = Date.now() - new Date(dateIso).getTime();
    if (diff < 60_000) {
        return 'just now';
    }
    if (diff < 3_600_000) {
        return `${Math.floor(diff / 60_000)}m ago`;
    }
    if (diff < 86_400_000) {
        return `${Math.floor(diff / 3_600_000)}h ago`;
    }
    return `${Math.floor(diff / 86_400_000)}d ago`;
}

export function KnowledgeTable({ agentId }: Props) {
    const { data: sources, isLoading } = useKnowledgeSources(agentId, { refetchInterval: false });
    const reindex = useReindexKnowledgeSource();
    const remove = useDeleteKnowledgeSource();

    // Poll every 5s while any source is processing.
    const hasProcessing = (sources ?? []).some((s) => s.status === 'processing');
    const pollingQuery = useKnowledgeSources(agentId, { refetchInterval: hasProcessing ? 5000 : false });
    const rows: AiKnowledgeSourceResource[] = pollingQuery.data ?? sources ?? [];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-32">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (rows.length === 0) {
        return (
            <Card className="p-10 text-center rounded-2xl">
                <Info className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="font-medium">No training sources yet</p>
                <p className="text-sm text-muted-foreground mt-1">Upload a PDF, paste text, or add a URL to teach your agent.</p>
            </Card>
        );
    }

    return (
        <div className="space-y-2">
            {rows.map((src) => {
                const Icon = TYPE_ICONS[src.type];
                const cfg = statusConfig(src.status);
                const StatusIcon = cfg.icon;
                return (
                    <Card key={src.id} className="p-4 rounded-2xl flex items-center gap-4">
                        <div className="w-10 h-10 shrink-0 rounded-xl bg-muted flex items-center justify-center">
                            <Icon className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="font-medium truncate flex items-center gap-2">
                                {src.name}
                                <span
                                    className={cn(
                                        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] uppercase tracking-wider border font-semibold',
                                        cfg.cls
                                    )}
                                    title={src.status === 'failed' ? src.last_error ?? undefined : undefined}
                                >
                                    <StatusIcon className={cn('w-3 h-3', src.status === 'processing' && 'animate-spin')} />
                                    {cfg.label}
                                </span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                <span className="capitalize">{src.type}</span>
                                <span>·</span>
                                <span>{src.chunk_count.toLocaleString()} chunks</span>
                                <span>·</span>
                                <span>{src.token_count.toLocaleString()} tokens</span>
                                {src.last_indexed_at && (
                                    <>
                                        <span>·</span>
                                        <span>indexed {relative(src.last_indexed_at)}</span>
                                    </>
                                )}
                            </div>
                            {src.status === 'failed' && src.last_error && (
                                <p className="mt-1 text-xs text-rose-600 dark:text-rose-300 truncate" title={src.last_error}>
                                    {src.last_error}
                                </p>
                            )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            <Button
                                size="sm"
                                variant="outline"
                                disabled={reindex.isPending || src.status === 'processing'}
                                onClick={() => reindex.mutate({ agentId, sourceId: src.id })}
                                title="Re-index this source"
                            >
                                <RefreshCw className={cn('w-3.5 h-3.5', reindex.isPending && 'animate-spin')} />
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                className="text-destructive hover:bg-destructive/5"
                                disabled={remove.isPending}
                                onClick={() => {
                                    if (!confirm(`Delete "${src.name}"?`)) {
                                        return;
                                    }
                                    remove.mutate({ agentId, sourceId: src.id });
                                }}
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                        </div>
                    </Card>
                );
            })}
        </div>
    );
}

export default KnowledgeTable;
