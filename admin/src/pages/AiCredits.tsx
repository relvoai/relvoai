import React from 'react';
import { useForm } from 'react-hook-form';
import { Zap, Plus, Loader2, RefreshCcw, MinusCircle, PlusCircle } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import {
    Button,
    Card,
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    Input,
    Textarea,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    cn,
} from '../components/UI';
import {
    useAiCredits,
    useGrantCredits,
    type AiCreditLedgerEntry,
    type CreditReason,
} from '../features/ai-agents/api';
import { usePermissions } from '../hooks/usePermissions';

interface GrantFormValues {
    amount: number;
    note: string;
}

const REASON_META: Record<CreditReason, { label: string; badge: string }> = {
    chat: { label: 'Chat', badge: 'bg-sky-500/10 text-sky-700 dark:text-sky-300' },
    train: { label: 'Train', badge: 'bg-violet-500/10 text-violet-700 dark:text-violet-300' },
    refill: { label: 'Refill', badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' },
    adjust: { label: 'Adjust', badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-300' },
    grant: { label: 'Grant', badge: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300' },
};

function formatNumber(n: number): string {
    return n.toLocaleString();
}

function formatDate(iso: string | null): string {
    if (!iso) {
        return '—';
    }
    const d = new Date(iso);
    return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export default function AiCredits() {
    const { can } = usePermissions();
    const canManage = can('ai.credits.manage');
    const { data, isLoading, error, refetch, isFetching } = useAiCredits();
    const grant = useGrantCredits();
    const [grantOpen, setGrantOpen] = React.useState(false);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error) {
        return (
            <Card className="p-8 text-center rounded-2xl border-destructive/30 bg-destructive/5">
                <p className="text-destructive">Failed to load credits: {(error as Error).message}</p>
            </Card>
        );
    }

    const summary = data!;
    const ledger = summary.ledger ?? [];

    return (
        <div className="space-y-6">
            <PageHeader
                title="AI Credits"
                description="Every AI interaction consumes credits. Top up when low, monitor usage here."
                action={
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => refetch()} className="rounded-xl">
                            <RefreshCcw className={cn('w-4 h-4 mr-2', isFetching && 'animate-spin')} /> Refresh
                        </Button>
                        {canManage && (
                            <Button onClick={() => setGrantOpen(true)} className="rounded-xl">
                                <Plus className="w-4 h-4 mr-2" /> Grant credits
                            </Button>
                        )}
                    </div>
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-6 rounded-2xl md:col-span-2 relative overflow-hidden">
                    <div className="absolute -right-8 -top-8 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Zap className="w-4 h-4 text-primary" /> Current balance
                    </div>
                    <div className="mt-2 flex items-baseline gap-3">
                        <span className="text-5xl font-bold tracking-tight tabular-nums">{formatNumber(summary.balance)}</span>
                        <span className="text-sm text-muted-foreground">credits</span>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-sm">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-xs">
                            Monthly refill · {formatNumber(summary.monthly_refill)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            Last refilled: {formatDate(summary.last_refilled_at)}
                        </span>
                    </div>
                </Card>
                <Card className="p-6 rounded-2xl">
                    <div className="text-sm text-muted-foreground">Ledger entries (latest 50)</div>
                    <div className="mt-2 text-3xl font-bold tabular-nums">{ledger.length}</div>
                    <p className="text-xs text-muted-foreground mt-2">
                        Each entry is one action: a chat reply, indexing a knowledge source, a refill, or a manual grant.
                    </p>
                </Card>
            </div>

            <Card className="rounded-2xl overflow-hidden">
                <div className="p-6 pb-3">
                    <h3 className="font-semibold">Usage ledger</h3>
                    <p className="text-sm text-muted-foreground">Timeline of credit movements.</p>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>When</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead className="text-right">Delta</TableHead>
                            <TableHead className="text-right">Tokens</TableHead>
                            <TableHead>Provider / Model</TableHead>
                            <TableHead>Note</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {ledger.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                                    No activity yet. Start a conversation or train an agent to see entries.
                                </TableCell>
                            </TableRow>
                        )}
                        {ledger.map((entry) => (
                            <React.Fragment key={entry.id}>
                                <LedgerRow entry={entry} />
                            </React.Fragment>
                        ))}
                    </TableBody>
                </Table>
            </Card>

            <Dialog open={grantOpen} onOpenChange={setGrantOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Zap className="w-5 h-5 text-primary" /> Grant credits
                        </DialogTitle>
                    </DialogHeader>
                    <GrantForm
                        submitting={grant.isPending}
                        onCancel={() => setGrantOpen(false)}
                        onSubmit={(payload) => {
                            grant.mutate(payload, {
                                onSuccess: () => setGrantOpen(false),
                            });
                        }}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
}

function LedgerRow({ entry }: { entry: AiCreditLedgerEntry }) {
    const meta = REASON_META[entry.reason] ?? { label: entry.reason, badge: 'bg-muted text-foreground' };
    const positive = entry.delta > 0;
    const noteFromMeta =
        typeof entry.meta?.note === 'string' && entry.meta.note.length > 0 ? (entry.meta.note as string) : null;

    return (
        <TableRow>
            <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{formatDate(entry.created_at)}</TableCell>
            <TableCell>
                <span className={cn('inline-flex items-center px-2 py-0.5 rounded-md text-[11px] uppercase tracking-wider font-semibold', meta.badge)}>
                    {meta.label}
                </span>
            </TableCell>
            <TableCell className={cn('text-right font-mono tabular-nums', positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')}>
                <span className="inline-flex items-center gap-1 justify-end">
                    {positive ? <PlusCircle className="w-3 h-3" /> : <MinusCircle className="w-3 h-3" />}
                    {formatNumber(Math.abs(entry.delta))}
                </span>
            </TableCell>
            <TableCell className="text-right text-xs tabular-nums text-muted-foreground">
                {entry.tokens_prompt + entry.tokens_completion > 0
                    ? `${formatNumber(entry.tokens_prompt)} · ${formatNumber(entry.tokens_completion)}`
                    : '—'}
            </TableCell>
            <TableCell className="text-xs text-muted-foreground">
                {entry.provider || entry.model ? `${entry.provider ?? '—'} · ${entry.model ?? '—'}` : '—'}
            </TableCell>
            <TableCell className="text-xs text-muted-foreground max-w-[220px] truncate" title={noteFromMeta ?? undefined}>
                {noteFromMeta ?? '—'}
            </TableCell>
        </TableRow>
    );
}

interface GrantFormProps {
    submitting: boolean;
    onCancel: () => void;
    onSubmit: (payload: { amount: number; note?: string | null }) => void;
}

function GrantForm({ submitting, onCancel, onSubmit }: GrantFormProps) {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<GrantFormValues>({ defaultValues: { amount: 1000, note: '' } });

    return (
        <form
            onSubmit={handleSubmit((raw) => {
                const values = (raw ?? {}) as GrantFormValues;
                onSubmit({
                    amount: Math.max(1, Math.floor(values.amount ?? 0)),
                    note: (values.note ?? '').trim() || null,
                });
            })}
            className="space-y-4"
        >
            <div>
                <label className="text-sm font-medium">Amount</label>
                <Input
                    type="number"
                    min={1}
                    step={1}
                    {...register('amount', {
                        valueAsNumber: true,
                        required: 'Amount is required',
                        min: { value: 1, message: 'Amount must be at least 1' },
                    })}
                />
                {errors.amount && <p className="text-xs text-destructive mt-1">{errors.amount.message}</p>}
            </div>
            <div>
                <label className="text-sm font-medium">Note (optional)</label>
                <Textarea rows={2} {...register('note', { maxLength: 255 })} placeholder="e.g. Manual top-up from payment #12345" />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
                    Grant
                </Button>
            </div>
        </form>
    );
}
