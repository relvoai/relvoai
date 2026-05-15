import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Loader2, Save } from 'lucide-react';
import { Input, Textarea, Button, Switch } from '../../../components/UI';
import ProviderModelPicker from './ProviderModelPicker';
import type {
    AgentUpsertPayload,
    AiAgentResource,
    CreateAgentPayload,
} from '../api';

export interface AgentFormValues {
    name: string;
    identity_persona: string;
    welcome_message: string;
    custom_instructions: string;
    provider: string;
    model: string;
    temperature: number;
    is_active: boolean;
}

type SubmitHandler =
    | { mode: 'create'; onSubmit: (payload: CreateAgentPayload) => void }
    | { mode: 'edit'; onSubmit: (payload: AgentUpsertPayload) => void };

type Props = {
    defaultValues?: Partial<AiAgentResource>;
    submitting?: boolean;
    onCancel?: () => void;
} & SubmitHandler;

const INSTRUCTION_MAX = 4000;
const PERSONA_MAX = 500;
const WELCOME_MAX = 300;

function toFormValues(src?: Partial<AiAgentResource>): AgentFormValues {
    return {
        name: src?.name ?? '',
        identity_persona: src?.identity_persona ?? '',
        welcome_message: src?.welcome_message ?? '',
        custom_instructions: src?.custom_instructions ?? '',
        provider: src?.provider ?? 'openai',
        model: src?.model ?? 'gpt-4o-mini',
        temperature: src?.temperature ?? 0.3,
        is_active: src?.is_active ?? true,
    };
}

export function AgentForm(props: Props) {
    const { mode, defaultValues, submitting, onCancel } = props;
    const {
        register,
        handleSubmit,
        control,
        watch,
        formState: { errors, isDirty },
    } = useForm<AgentFormValues>({
        defaultValues: toFormValues(defaultValues),
    });

    const personaValue = watch('identity_persona') ?? '';
    const welcomeValue = watch('welcome_message') ?? '';
    const instructionsValue = watch('custom_instructions') ?? '';
    const temperatureValue = watch('temperature');

    const submit = handleSubmit((raw) => {
        const values = (raw ?? {}) as AgentFormValues;
        const payload: CreateAgentPayload = {
            name: (values.name ?? '').trim(),
            identity_persona: (values.identity_persona ?? '').trim() || null,
            welcome_message: (values.welcome_message ?? '').trim() || null,
            custom_instructions: (values.custom_instructions ?? '').trim() || null,
            provider: (values.provider ?? '').trim() || null,
            model: (values.model ?? '').trim() || null,
            temperature: Number.isFinite(values.temperature) ? values.temperature : null,
            is_active: values.is_active ?? true,
        };
        if (props.mode === 'create') {
            props.onSubmit(payload);
        } else {
            props.onSubmit(payload as AgentUpsertPayload);
        }
    });

    return (
        <form onSubmit={submit} className="space-y-8">
            <div className="space-y-6">
                <div className="space-y-2">
                    <label className="block text-sm font-medium">
                        Name <span className="text-destructive">*</span>
                    </label>
                    <Input
                        {...register('name', { required: 'Name is required', maxLength: { value: 255, message: 'Too long' } })}
                        placeholder="e.g. Support Concierge"
                    />
                    {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="block text-sm font-medium">Identity / persona</label>
                        <span className="text-xs text-muted-foreground tabular-nums">
                            {personaValue.length} / {PERSONA_MAX}
                        </span>
                    </div>
                    <Textarea
                        rows={2}
                        {...register('identity_persona', { maxLength: PERSONA_MAX })}
                        placeholder="A friendly, concise concierge who knows the product docs cold."
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="block text-sm font-medium">Welcome message</label>
                        <span className="text-xs text-muted-foreground tabular-nums">
                            {welcomeValue.length} / {WELCOME_MAX}
                        </span>
                    </div>
                    <Textarea
                        rows={2}
                        {...register('welcome_message', { maxLength: WELCOME_MAX })}
                        placeholder="Hey, I'm Ada — ask me anything about pricing or how to get started."
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="block text-sm font-medium">Custom instructions</label>
                        <span className="text-xs text-muted-foreground tabular-nums">
                            {instructionsValue.length} / {INSTRUCTION_MAX}
                        </span>
                    </div>
                    <Textarea
                        rows={6}
                        {...register('custom_instructions', { maxLength: INSTRUCTION_MAX })}
                        placeholder="Only answer from knowledge sources. If a question is outside, say you'll escalate. Never quote prices above $500 without confirmation."
                    />
                </div>
            </div>

            <div className="space-y-2 rounded-xl border border-border bg-muted/20 p-4">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Temperature</label>
                    <span className="text-sm font-mono tabular-nums">{temperatureValue?.toFixed?.(2) ?? '0.00'}</span>
                </div>
                <Controller
                    control={control}
                    name="temperature"
                    rules={{ min: 0, max: 2 }}
                    render={({ field }) => (
                        <input
                            type="range"
                            min={0}
                            max={2}
                            step={0.05}
                            value={field.value ?? 0.3}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            className="w-full accent-primary"
                        />
                    )}
                />
                <p className="text-xs text-muted-foreground">
                    Lower = deterministic and factual. Higher = creative and varied. Most support agents live between 0.2 and 0.5.
                </p>
            </div>

            <Controller
                control={control}
                name="provider"
                render={({ field: providerField }) => (
                    <Controller
                        control={control}
                        name="model"
                        render={({ field: modelField }) => (
                            <ProviderModelPicker
                                provider={providerField.value}
                                model={modelField.value}
                                onProviderChange={providerField.onChange}
                                onModelChange={modelField.onChange}
                            />
                        )}
                    />
                )}
            />

            <div className="flex items-center justify-between rounded-xl border border-border p-4">
                <div>
                    <div className="text-sm font-medium">Active</div>
                    <div className="text-xs text-muted-foreground">Inactive agents are skipped by channel routing.</div>
                </div>
                <Controller
                    control={control}
                    name="is_active"
                    render={({ field }) => <Switch checked={!!field.value} onCheckedChange={field.onChange} />}
                />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
                {onCancel && (
                    <Button type="button" variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                )}
                <Button type="submit" disabled={submitting || (mode === 'edit' && !isDirty)}>
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    {mode === 'create' ? 'Create agent' : 'Save changes'}
                </Button>
            </div>
        </form>
    );
}

export default AgentForm;
