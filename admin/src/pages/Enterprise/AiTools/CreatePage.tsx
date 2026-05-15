import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { PageHeader } from '../../../components/PageHeader';
import {
    Button,
    Card,
    CardContent,
    Input,
    Textarea,
    cn,
} from '../../../components/UI';
import { LicenseGate } from '../../../core/license/LicenseGate';
import EnterpriseLockedNotice from './EnterpriseLockedNotice';
import {
    useCreateAiTool,
    type AiToolAuthType,
    type AiToolHttpMethod,
    type AiToolParameterSchema,
    type CreateAiToolPayload,
} from './hooks';

const HTTP_METHODS: AiToolHttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
const AUTH_TYPES: AiToolAuthType[] = ['none', 'bearer', 'header'];

const DEFAULT_SCHEMA = `{
  "query": { "type": "string", "description": "Search query", "required": true }
}`;

interface FormState {
    name: string;
    description: string;
    endpoint: string;
    http_method: AiToolHttpMethod;
    auth_type: AiToolAuthType;
    auth_value: string;
    rate_limit_per_minute: number;
    response_size_limit: number;
    timeout_seconds: number;
    parameter_schema_raw: string;
}

const INITIAL_STATE: FormState = {
    name: '',
    description: '',
    endpoint: '',
    http_method: 'POST',
    auth_type: 'none',
    auth_value: '',
    rate_limit_per_minute: 60,
    response_size_limit: 4096,
    timeout_seconds: 10,
    parameter_schema_raw: DEFAULT_SCHEMA,
};

const labelClass = 'block text-sm font-medium mb-1.5';
const selectClass =
    'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50';

type ValidateResult =
    | { ok: true; value: AiToolParameterSchema; error?: undefined }
    | { ok: false; value?: undefined; error: string };

function validateParameterSchema(raw: string): ValidateResult {
    let parsed: unknown;
    try {
        parsed = JSON.parse(raw);
    } catch (e) {
        return { ok: false, error: `parameter_schema is not valid JSON: ${(e as Error).message}` };
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return { ok: false, error: 'parameter_schema must be a JSON object' };
    }
    const out: AiToolParameterSchema = {};
    for (const [key, val] of Object.entries(parsed as Record<string, unknown>)) {
        if (!val || typeof val !== 'object' || Array.isArray(val)) {
            return { ok: false, error: `parameter "${key}" must be an object` };
        }
        const v = val as Record<string, unknown>;
        if (typeof v.type !== 'string' || !v.type) {
            return { ok: false, error: `parameter "${key}" missing string "type"` };
        }
        if (v.description !== undefined && typeof v.description !== 'string') {
            return { ok: false, error: `parameter "${key}" description must be a string` };
        }
        if (v.required !== undefined && typeof v.required !== 'boolean') {
            return { ok: false, error: `parameter "${key}" required must be a boolean` };
        }
        out[key] = {
            type: v.type,
            description: v.description as string | undefined,
            required: v.required as boolean | undefined,
        };
    }
    return { ok: true, value: out };
}

function CreateAiToolForm() {
    const navigate = useNavigate();
    const createTool = useCreateAiTool();
    const [form, setForm] = React.useState<FormState>(INITIAL_STATE);
    const [error, setError] = React.useState<string | null>(null);

    const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!form.name.trim() || form.name.length > 120) {
            setError('Name is required and must be at most 120 characters.');
            return;
        }
        if (form.description.length > 1000) {
            setError('Description must be at most 1000 characters.');
            return;
        }
        if (!form.endpoint.trim() || form.endpoint.length > 2048) {
            setError('Endpoint is required and must be at most 2048 characters.');
            return;
        }
        try {
            // eslint-disable-next-line no-new
            new URL(form.endpoint);
        } catch {
            setError('Endpoint must be a valid URL.');
            return;
        }
        if (form.rate_limit_per_minute < 1 || form.rate_limit_per_minute > 600) {
            setError('Rate limit must be between 1 and 600.');
            return;
        }
        if (form.response_size_limit < 128 || form.response_size_limit > 131072) {
            setError('Response size limit must be between 128 and 131072.');
            return;
        }
        if (form.timeout_seconds < 1 || form.timeout_seconds > 60) {
            setError('Timeout must be between 1 and 60 seconds.');
            return;
        }
        const schemaResult = validateParameterSchema(form.parameter_schema_raw);
        if (!schemaResult.ok) {
            setError(schemaResult.error);
            return;
        }
        if (form.auth_type !== 'none' && !form.auth_value.trim()) {
            setError('Auth value is required when auth type is not "none".');
            return;
        }

        const payload: CreateAiToolPayload = {
            name: form.name.trim(),
            description: form.description.trim() || undefined,
            endpoint: form.endpoint.trim(),
            http_method: form.http_method,
            auth_type: form.auth_type,
            auth_value: form.auth_type === 'none' ? undefined : form.auth_value,
            rate_limit_per_minute: form.rate_limit_per_minute,
            response_size_limit: form.response_size_limit,
            timeout_seconds: form.timeout_seconds,
            parameter_schema: schemaResult.value,
        };

        createTool.mutate(payload, {
            onSuccess: () => {
                navigate('/enterprise/ai-tools');
            },
            onError: (err) => {
                setError((err as Error).message);
            },
        });
    };

    const showAuthValue = form.auth_type !== 'none';

    return (
        <div className="space-y-6">
            <PageHeader
                title="New custom AI tool"
                description="Define an HTTP endpoint your AI agents can invoke."
                action={
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/enterprise/ai-tools')}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                }
            />

            <Card className="rounded-2xl">
                <CardContent className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className={labelClass} htmlFor="name">Name</label>
                            <Input
                                id="name"
                                value={form.name}
                                onChange={(e) => update('name', e.target.value)}
                                placeholder="lookup_order"
                                maxLength={120}
                                required
                            />
                        </div>

                        <div>
                            <label className={labelClass} htmlFor="description">Description</label>
                            <Textarea
                                id="description"
                                value={form.description}
                                onChange={(e) => update('description', e.target.value)}
                                placeholder="What this tool does. Helps the LLM decide when to call it."
                                rows={3}
                                maxLength={1000}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-[1fr,160px] gap-4">
                            <div>
                                <label className={labelClass} htmlFor="endpoint">Endpoint URL</label>
                                <Input
                                    id="endpoint"
                                    type="url"
                                    value={form.endpoint}
                                    onChange={(e) => update('endpoint', e.target.value)}
                                    placeholder="https://example.com/api/orders"
                                    maxLength={2048}
                                    required
                                />
                            </div>
                            <div>
                                <label className={labelClass} htmlFor="http_method">Method</label>
                                <select
                                    id="http_method"
                                    className={selectClass}
                                    value={form.http_method}
                                    onChange={(e) => update('http_method', e.target.value as AiToolHttpMethod)}
                                >
                                    {HTTP_METHODS.map((m) => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className={cn('grid grid-cols-1 gap-4', showAuthValue ? 'md:grid-cols-2' : '')}>
                            <div>
                                <label className={labelClass} htmlFor="auth_type">Auth type</label>
                                <select
                                    id="auth_type"
                                    className={selectClass}
                                    value={form.auth_type}
                                    onChange={(e) => update('auth_type', e.target.value as AiToolAuthType)}
                                >
                                    {AUTH_TYPES.map((a) => (
                                        <option key={a} value={a}>{a}</option>
                                    ))}
                                </select>
                            </div>
                            {showAuthValue && (
                                <div>
                                    <label className={labelClass} htmlFor="auth_value">
                                        Auth value {form.auth_type === 'header' ? '(format: "Header-Name: value")' : '(token)'}
                                    </label>
                                    <Input
                                        id="auth_value"
                                        value={form.auth_value}
                                        onChange={(e) => update('auth_value', e.target.value)}
                                        placeholder={form.auth_type === 'header' ? 'X-Api-Key: abc123' : 'sk-...'}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className={labelClass} htmlFor="rate_limit_per_minute">Rate limit / min</label>
                                <Input
                                    id="rate_limit_per_minute"
                                    type="number"
                                    min={1}
                                    max={600}
                                    value={form.rate_limit_per_minute}
                                    onChange={(e) => update('rate_limit_per_minute', Number(e.target.value))}
                                />
                            </div>
                            <div>
                                <label className={labelClass} htmlFor="response_size_limit">Response size (bytes)</label>
                                <Input
                                    id="response_size_limit"
                                    type="number"
                                    min={128}
                                    max={131072}
                                    value={form.response_size_limit}
                                    onChange={(e) => update('response_size_limit', Number(e.target.value))}
                                />
                            </div>
                            <div>
                                <label className={labelClass} htmlFor="timeout_seconds">Timeout (s)</label>
                                <Input
                                    id="timeout_seconds"
                                    type="number"
                                    min={1}
                                    max={60}
                                    value={form.timeout_seconds}
                                    onChange={(e) => update('timeout_seconds', Number(e.target.value))}
                                />
                            </div>
                        </div>

                        <div>
                            <label className={labelClass} htmlFor="parameter_schema">
                                Parameter schema (JSON)
                            </label>
                            <Textarea
                                id="parameter_schema"
                                value={form.parameter_schema_raw}
                                onChange={(e) => update('parameter_schema_raw', e.target.value)}
                                rows={8}
                                className="font-mono text-xs"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Map of parameter name to {'{ type, description?, required? }'}.
                            </p>
                        </div>

                        {error && (
                            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                                {error}
                            </div>
                        )}

                        <div className="flex items-center justify-end gap-2 pt-2">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => navigate('/enterprise/ai-tools')}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={createTool.isPending} className="rounded-xl">
                                {createTool.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Create tool
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

export default function AiToolsCreatePage() {
    return (
        <LicenseGate fallback={<EnterpriseLockedNotice />}>
            <CreateAiToolForm />
        </LicenseGate>
    );
}
