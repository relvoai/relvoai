import React, { useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { IdentityFieldsConfig, IdentityPayload, WidgetConfig } from '../types';
import { Branding } from './Branding';

interface IdentityFormProps {
    config: WidgetConfig;
    fields: Partial<IdentityFieldsConfig>;
    isSubmitting: boolean;
    error?: string | null;
    onSubmit: (payload: IdentityPayload) => void;
}

export function IdentityForm({
    config,
    fields,
    isSubmitting,
    error,
    onSubmit,
}: IdentityFormProps): React.ReactElement {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [touched, setTouched] = useState<{ name: boolean; email: boolean }>({ name: false, email: false });

    const nameRequired = fields.name !== false;
    const emailRequired = fields.email !== false;
    const nameError = touched.name && nameRequired && name.trim().length < 2;
    const emailError = touched.email && emailRequired && !isValidEmail(email);

    const canSubmit =
        !isSubmitting &&
        (!nameRequired || name.trim().length >= 2) &&
        (!emailRequired || isValidEmail(email));

    const handleSubmit = (e: React.FormEvent): void => {
        e.preventDefault();
        setTouched({ name: true, email: true });
        if (!canSubmit) {
            return;
        }
        onSubmit({ name: name.trim(), email: email.trim() });
    };

    return (
        <div className="flex min-h-0 flex-1 flex-col bg-[color:var(--rv-surface)] dark:bg-[color:var(--rv-surface)]">
            <div className="flex-1 overflow-y-auto px-5 py-6">
                <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    <Sparkles className="h-3.5 w-3.5" style={{ color: 'var(--rv-brand)' }} aria-hidden="true" />
                    Before we chat
                </div>
                <h2 className="mt-2 text-[20px] font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                    Let us know who you are
                </h2>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-slate-500 dark:text-slate-400">
                    We use this to follow up if we get disconnected. No spam, ever.
                </p>

                <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
                    {nameRequired && (
                        <Field
                            id="rv-identity-name"
                            label="Your name"
                            type="text"
                            value={name}
                            onChange={setName}
                            onBlur={() => setTouched(t => ({ ...t, name: true }))}
                            autoComplete="name"
                            placeholder="Jane Doe"
                            error={nameError ? 'Please enter your name' : undefined}
                            disabled={isSubmitting}
                        />
                    )}
                    {emailRequired && (
                        <Field
                            id="rv-identity-email"
                            label="Email address"
                            type="email"
                            value={email}
                            onChange={setEmail}
                            onBlur={() => setTouched(t => ({ ...t, email: true }))}
                            autoComplete="email"
                            placeholder="you@example.com"
                            error={emailError ? 'Please enter a valid email' : undefined}
                            disabled={isSubmitting}
                        />
                    )}

                    {error && (
                        <div
                            role="alert"
                            className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[12.5px] text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
                        >
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={!canSubmit}
                        className="rv-focusable mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-[14px] font-semibold text-[color:var(--rv-brand-contrast)] shadow-md transition-all duration-200 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                        style={{ background: 'var(--rv-brand-gradient)' }}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                                Starting chat...
                            </>
                        ) : (
                            <>Start chatting</>
                        )}
                    </button>

                    <p className="mt-1 text-center text-[11px] text-slate-400 dark:text-slate-500">
                        By continuing you agree to be contacted about your inquiry.
                    </p>
                </form>
            </div>
            <div className="shrink-0 border-t border-slate-100 bg-[color:var(--rv-surface-muted)] py-2.5 dark:border-slate-800/70">
                <Branding visible={config.show_branding !== false} />
            </div>
        </div>
    );
}

interface FieldProps {
    id: string;
    label: string;
    type: string;
    value: string;
    onChange: (value: string) => void;
    onBlur: () => void;
    autoComplete?: string;
    placeholder?: string;
    error?: string;
    disabled?: boolean;
}

function Field({
    id,
    label,
    type,
    value,
    onChange,
    onBlur,
    autoComplete,
    placeholder,
    error,
    disabled,
}: FieldProps): React.ReactElement {
    return (
        <div>
            <label htmlFor={id} className="mb-1.5 block text-[12.5px] font-medium text-slate-700 dark:text-slate-300">
                {label}
            </label>
            <input
                id={id}
                name={id}
                type={type}
                value={value}
                onChange={e => onChange(e.target.value)}
                onBlur={onBlur}
                autoComplete={autoComplete}
                placeholder={placeholder}
                disabled={disabled}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? `${id}-err` : undefined}
                className={`rv-focusable w-full rounded-xl border bg-white px-3.5 py-2.5 text-[14px] text-slate-900 placeholder:text-slate-400 transition-colors focus:border-transparent disabled:opacity-60 dark:bg-slate-900/60 dark:text-slate-100 dark:placeholder:text-slate-500 ${
                    error
                        ? 'border-rose-300 dark:border-rose-800'
                        : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600'
                }`}
            />
            {error && (
                <p id={`${id}-err`} className="mt-1 text-[11.5px] text-rose-600 dark:text-rose-400">
                    {error}
                </p>
            )}
        </div>
    );
}

function isValidEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
