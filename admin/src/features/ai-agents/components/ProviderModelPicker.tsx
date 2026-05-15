import React from 'react';
import { Sparkles } from 'lucide-react';
import { Input } from '../../../components/UI';

/**
 * Canonical provider + model suggestions. The backend accepts any string
 * (AI router resolves provider), so we keep these as suggestions rather than
 * a hard enum. Users can still type a custom model name.
 */
const PROVIDERS: ReadonlyArray<{ value: string; label: string; models: string[] }> = [
    {
        value: 'openai',
        label: 'OpenAI',
        models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4.1-mini', 'o4-mini'],
    },
    {
        value: 'anthropic',
        label: 'Anthropic',
        models: ['claude-3-5-sonnet-latest', 'claude-3-5-haiku-latest', 'claude-3-opus-latest'],
    },
    {
        value: 'groq',
        label: 'Groq',
        models: ['llama-3.3-70b-versatile', 'mixtral-8x7b-32768'],
    },
    {
        value: 'google',
        label: 'Google',
        models: ['gemini-2.0-flash', 'gemini-1.5-pro'],
    },
];

interface Props {
    provider: string | null | undefined;
    model: string | null | undefined;
    onProviderChange: (value: string) => void;
    onModelChange: (value: string) => void;
    disabled?: boolean;
}

export function ProviderModelPicker({ provider, model, onProviderChange, onModelChange, disabled }: Props) {
    const selectedProvider = PROVIDERS.find((p) => p.value === provider);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-primary" /> Provider
                </label>
                <div className="grid grid-cols-2 gap-2">
                    {PROVIDERS.map((p) => {
                        const active = provider === p.value;
                        return (
                            <button
                                key={p.value}
                                type="button"
                                disabled={disabled}
                                onClick={() => onProviderChange(p.value)}
                                className={
                                    'px-3 py-2 rounded-xl border text-sm font-medium transition-all ' +
                                    (active
                                        ? 'border-primary bg-primary/10 text-primary'
                                        : 'border-border bg-card text-foreground hover:border-primary/50 hover:bg-muted/40')
                                }
                            >
                                {p.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">Model</label>
                <Input
                    value={model ?? ''}
                    onChange={(e) => onModelChange(e.target.value)}
                    placeholder="e.g. gpt-4o-mini"
                    disabled={disabled}
                />
                {selectedProvider && (
                    <div className="flex flex-wrap gap-1.5">
                        {selectedProvider.models.map((m) => (
                            <button
                                key={m}
                                type="button"
                                disabled={disabled}
                                onClick={() => onModelChange(m)}
                                className={
                                    'text-xs px-2 py-1 rounded-md border transition-colors ' +
                                    (model === m
                                        ? 'border-primary bg-primary/10 text-primary'
                                        : 'border-border bg-muted/40 text-muted-foreground hover:text-foreground')
                                }
                            >
                                {m}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default ProviderModelPicker;
