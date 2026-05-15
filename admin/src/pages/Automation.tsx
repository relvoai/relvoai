import React, { useState } from 'react';
import { useBotRules, useCreateBotRule, useDeleteBotRule, useUpdateBotRule } from '../features/bot-rules/api';
import { useInboxes } from '../features/inboxes/api';
import {
    Card, CardHeader, CardTitle, CardContent,
    Table, TableHeader, TableRow, TableHead, TableBody, TableCell,
    Button, Badge, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
    Input, Switch, Textarea
} from '../components/UI';
import { Plus, Bot, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { extractApiError } from '../core/http/error';

export default function Automation() {
    const [isRuleOpen, setIsRuleOpen] = useState(false);
    const [ruleForm, setRuleForm] = useState({
        inbox_id: '',
        name: '',
        trigger_type: 'keyword' as 'keyword' | 'regex' | 'exact',
        keywords: '',
        reply_content: '',
        is_active: true,
    });
    const [formError, setFormError] = useState<string | null>(null);

    const { data: rules, isLoading } = useBotRules();
    const { data: inboxes } = useInboxes();
    const createRule = useCreateBotRule();
    const deleteRule = useDeleteBotRule();
    const updateRule = useUpdateBotRule();

    const handleSaveRule = () => {
        if (!ruleForm.name || !ruleForm.keywords || !ruleForm.reply_content || !ruleForm.inbox_id) {
            setFormError('All fields are required.');
            return;
        }
        setFormError(null);

        createRule.mutate({
            inbox_id: ruleForm.inbox_id,
            name: ruleForm.name,
            trigger_type: ruleForm.trigger_type,
            keywords: ruleForm.keywords.split(',').map(k => k.trim()).filter(Boolean),
            reply_content: ruleForm.reply_content,
            is_active: ruleForm.is_active,
        }, {
            onSuccess: () => {
                setIsRuleOpen(false);
                setRuleForm({ inbox_id: '', name: '', trigger_type: 'keyword', keywords: '', reply_content: '', is_active: true });
            },
            onError: (err) => setFormError(extractApiError(err, 'Failed to create bot rule.')),
        });
    };

    const handleToggle = (id: string, currentActive: boolean) => {
        updateRule.mutate({ id, data: { is_active: !currentActive } });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Automation</h1>
                    <p className="mt-1 text-muted-foreground">Configure automated bot responses triggered by keywords.</p>
                </div>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Bot className="h-5 w-5" /> Bot Rules
                    </CardTitle>
                    <Button size="sm" className="gap-2" onClick={() => setIsRuleOpen(true)}>
                        <Plus className="h-4 w-4" /> New Rule
                    </Button>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex h-32 items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Rule Name</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Keywords</TableHead>
                                    <TableHead>Reply</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rules?.map(rule => (
                                    <TableRow key={rule.id}>
                                        <TableCell className="font-medium">{rule.name}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{rule.trigger_type}</Badge>
                                        </TableCell>
                                        <TableCell className="max-w-[200px] truncate text-muted-foreground">
                                            {rule.keywords.join(', ')}
                                        </TableCell>
                                        <TableCell className="max-w-[200px] truncate text-muted-foreground">
                                            {rule.reply_content}
                                        </TableCell>
                                        <TableCell>
                                            <Switch
                                                checked={rule.is_active}
                                                onCheckedChange={() => handleToggle(rule.id, rule.is_active)}
                                            />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                    if (window.confirm('Delete this rule?')) {
                                                        deleteRule.mutate(rule.id);
                                                    }
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4 text-muted-foreground" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {rules?.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                                            No bot rules configured. Create one to get started.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isRuleOpen} onOpenChange={setIsRuleOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Create Bot Rule</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                        {formError && (
                            <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
                                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                <span>{formError}</span>
                            </div>
                        )}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Inbox</label>
                            <select
                                value={ruleForm.inbox_id}
                                onChange={e => setRuleForm({ ...ruleForm, inbox_id: e.target.value })}
                                className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                            >
                                <option value="">Select inbox...</option>
                                {inboxes?.map(inbox => (
                                    <option key={inbox.id} value={inbox.id}>{inbox.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Rule Name</label>
                            <Input value={ruleForm.name} onChange={e => setRuleForm({ ...ruleForm, name: e.target.value })} placeholder="e.g. Price Auto-Reply" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Trigger Type</label>
                            <select
                                value={ruleForm.trigger_type}
                                onChange={e => setRuleForm({ ...ruleForm, trigger_type: e.target.value as 'keyword' | 'regex' | 'exact' })}
                                className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                            >
                                <option value="keyword">Keyword (contains)</option>
                                <option value="exact">Exact Match</option>
                                <option value="regex">Regex</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Keywords</label>
                            <Input value={ruleForm.keywords} onChange={e => setRuleForm({ ...ruleForm, keywords: e.target.value })} placeholder="price, cost, pricing (comma separated)" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Auto-Reply Message</label>
                            <Textarea value={ruleForm.reply_content} onChange={e => setRuleForm({ ...ruleForm, reply_content: e.target.value })} placeholder="Our pricing starts at..." rows={3} />
                        </div>
                        <div className="flex items-center justify-between rounded-lg border p-3">
                            <span className="text-sm font-medium">Active</span>
                            <Switch checked={ruleForm.is_active} onCheckedChange={c => setRuleForm({ ...ruleForm, is_active: c })} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsRuleOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveRule} disabled={createRule.isPending}>
                            {createRule.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Rule
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
