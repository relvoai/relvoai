import React from 'react';
import { X, Plus } from 'lucide-react';
import { Input, Textarea, Button } from '../../../components/UI';
import type { AiAgentHandoffPolicy } from '../api';

interface Props {
    value: AiAgentHandoffPolicy | null | undefined;
    onChange: (policy: AiAgentHandoffPolicy) => void;
}

const TRIGGERS: ReadonlyArray<{ value: NonNullable<AiAgentHandoffPolicy['trigger']>; label: string; description: string }> = [
    { value: 'never', label: 'Never', description: 'Agent handles every message end-to-end.' },
    { value: 'on_low_confidence', label: 'Low confidence', description: 'Hand off when the model isn\'t confident in its answer.' },
    { value: 'on_keyword', label: 'On keyword', description: 'Hand off if the visitor types one of your keywords.' },
];

export function HandoffPolicyEditor({ value, onChange }: Props) {
    const trigger = value?.trigger ?? 'never';
    const threshold = value?.confidence_threshold ?? 0.5;
    const keywords = value?.keywords ?? [];
    const message = value?.message ?? '';
    const [kwInput, setKwInput] = React.useState('');

    const patch = (next: Partial<AiAgentHandoffPolicy>): void => {
        onChange({ ...(value ?? {}), trigger, ...next });
    };

    const addKeyword = (): void => {
        const v = kwInput.trim();
        if (!v) {
            return;
        }
        if (keywords.includes(v)) {
            setKwInput('');
            return;
        }
        patch({ keywords: [...keywords, v] });
        setKwInput('');
    };

    const removeKeyword = (kw: string): void => {
        patch({ keywords: keywords.filter((k) => k !== kw) });
    };

    return (
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium mb-2">When should the AI hand off to a human?</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {TRIGGERS.map((t) => {
                        const active = trigger === t.value;
                        return (
                            <button
                                key={t.value}
                                type="button"
                                onClick={() => patch({ trigger: t.value })}
                                className={
                                    'text-left p-3 rounded-xl border transition-all ' +
                                    (active
                                        ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                                        : 'border-border bg-card hover:border-primary/40 hover:bg-muted/30')
                                }
                            >
                                <div className="text-sm font-semibold">{t.label}</div>
                                <div className="text-xs text-muted-foreground mt-1">{t.description}</div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {trigger === 'on_low_confidence' && (
                <div className="space-y-2">
                    <label className="block text-sm font-medium">Confidence threshold</label>
                    <div className="flex items-center gap-3">
                        <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.05}
                            value={threshold}
                            onChange={(e) => patch({ confidence_threshold: parseFloat(e.target.value) })}
                            className="flex-1 accent-primary"
                        />
                        <span className="w-12 text-sm font-mono tabular-nums text-right">
                            {Math.round(threshold * 100)}%
                        </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        If the model's confidence falls below {Math.round(threshold * 100)}%, the conversation is handed to a human agent.
                    </p>
                </div>
            )}

            {trigger === 'on_keyword' && (
                <div className="space-y-2">
                    <label className="block text-sm font-medium">Trigger keywords</label>
                    <div className="flex gap-2">
                        <Input
                            placeholder="e.g. refund, speak to human, cancel"
                            value={kwInput}
                            onChange={(e) => setKwInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    addKeyword();
                                }
                            }}
                        />
                        <Button type="button" variant="outline" onClick={addKeyword}>
                            <Plus className="w-4 h-4" /> Add
                        </Button>
                    </div>
                    {keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                            {keywords.map((kw) => (
                                <span
                                    key={kw}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted text-sm"
                                >
                                    {kw}
                                    <button
                                        type="button"
                                        onClick={() => removeKeyword(kw)}
                                        className="text-muted-foreground hover:text-destructive"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {trigger !== 'never' && (
                <div className="space-y-2">
                    <label className="block text-sm font-medium">Handoff message</label>
                    <Textarea
                        rows={2}
                        value={message}
                        onChange={(e) => patch({ message: e.target.value })}
                        placeholder="e.g. Let me connect you with someone from our team — give me one moment."
                    />
                </div>
            )}
        </div>
    );
}

export default HandoffPolicyEditor;
