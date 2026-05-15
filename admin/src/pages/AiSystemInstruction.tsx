import React from 'react';
import { BookText, Loader2, Save, ShieldCheck, Sparkles } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { Button, Card, cn } from '../components/UI';
import { useSettings, useUpdateSetting } from '../features/settings/api';
import { usePermissions } from '../hooks/usePermissions';

const SETTING_KEY = 'ai.system_instruction';
const MAX_LENGTH = 8000;

export default function AiSystemInstruction() {
    const { can } = usePermissions();
    const canEdit = can('system.settings.update');
    const { data: settings, isLoading } = useSettings();
    const update = useUpdateSetting();

    const remote = React.useMemo(() => {
        const row = settings?.find((s) => s.key === SETTING_KEY);
        if (!row) {
            return '';
        }
        return typeof row.value === 'string' ? row.value : '';
    }, [settings]);

    const [value, setValue] = React.useState<string>('');
    React.useEffect(() => {
        setValue(remote);
    }, [remote]);

    const dirty = value !== remote;

    const save = (): void => {
        update.mutate({ key: SETTING_KEY, data: { value } });
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="System instruction"
                description="Platform-wide guardrails that prepend every agent's prompt. Use this for non-negotiable rules (safety, brand voice, forbidden topics)."
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 p-6 rounded-2xl">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-32">
                            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium flex items-center gap-2">
                                    <BookText className="w-4 h-4 text-primary" />
                                    Global AI system instruction
                                </label>
                                <span className="text-xs text-muted-foreground tabular-nums">
                                    {value.length.toLocaleString()} / {MAX_LENGTH.toLocaleString()}
                                </span>
                            </div>
                            <textarea
                                disabled={!canEdit}
                                value={value}
                                maxLength={MAX_LENGTH}
                                onChange={(e) => setValue(e.target.value)}
                                rows={14}
                                className={cn(
                                    'w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-mono leading-relaxed placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                                    !canEdit && 'opacity-70 cursor-not-allowed'
                                )}
                                placeholder={`You are a helpful support assistant for <Company>.\n- Never invent product details. If unsure, escalate.\n- Never promise refunds or discounts above $X.\n- Always reply in the visitor's language.`}
                            />
                            <div className="flex items-center justify-between">
                                <p className="text-xs text-muted-foreground">
                                    This is autoloaded into every agent's prompt. Agent-level custom instructions appear after these rules.
                                </p>
                                {canEdit && (
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" disabled={!dirty || update.isPending} onClick={() => setValue(remote)}>
                                            Reset
                                        </Button>
                                        <Button disabled={!dirty || update.isPending} onClick={save}>
                                            {update.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                            Save
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </Card>

                <div className="space-y-4">
                    <Card className="p-5 rounded-2xl bg-primary/5 border-primary/20">
                        <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
                                <ShieldCheck className="w-4 h-4" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-sm">Why this exists</h4>
                                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                    Individual agents can be edited by any teammate with agent access. This global rule set gives
                                    you a guardrail that can only be changed by owners — it overrides conflicting agent
                                    instructions for safety rules.
                                </p>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-5 rounded-2xl">
                        <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                                <Sparkles className="w-4 h-4" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-sm">Writing tips</h4>
                                <ul className="text-xs text-muted-foreground mt-1 space-y-1 list-disc list-inside leading-relaxed">
                                    <li>Use declarative sentences. "Never X." beats "Try not to X."</li>
                                    <li>Front-load the most important rules.</li>
                                    <li>Keep under 500 words — longer prompts hurt latency and focus.</li>
                                    <li>Put agent-specific tone in the agent's persona, not here.</li>
                                </ul>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
