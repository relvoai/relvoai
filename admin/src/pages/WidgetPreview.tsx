import React, { useEffect, useState } from 'react';

const DEV_CHANNEL_KEY =
    (import.meta.env.VITE_WIDGET_TEST_CHANNEL_KEY as string | undefined) ??
    'ca2dac84-2512-48b7-8338-095f3ad4436c';

/**
 * In-app preview harness for the embeddable widget. Mounts `src/widget` into a
 * shadow-DOM container via the exposed `window.__relvoMountForPreview` hook so
 * designers/devs can iterate on the widget without rebuilding `relvo.js`.
 *
 * Not a production route — intended for local design work. Registered at
 * `/widget-preview` in `App.tsx`.
 */
export default function WidgetPreview(): React.ReactElement {
    const [mounted, setMounted] = useState<boolean>(false);
    const [scheme, setScheme] = useState<'light' | 'dark' | 'system'>('system');

    useEffect(() => {
        let cancelled = false;
        (async (): Promise<void> => {
            // Dynamically import the widget entry — this runs its side effects,
            // including registering `window.__relvoMountForPreview`.
            await import('../widget/index');
            if (cancelled) {
                return;
            }
            const mount = window.__relvoMountForPreview;
            if (mount) {
                await mount({
                    channel_key: DEV_CHANNEL_KEY,
                    user: {
                        external_id: 'preview_user',
                        name: 'Preview Visitor',
                        email: 'preview@example.com',
                    },
                });
                setMounted(true);
            }
        })();
        return (): void => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        const root = document.documentElement;
        if (scheme === 'system') {
            root.classList.remove('light-forced', 'dark-forced');
            root.style.colorScheme = '';
            return;
        }
        root.style.colorScheme = scheme;
    }, [scheme]);

    return (
        <div className={`relative min-h-screen w-full ${scheme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
            <div className="mx-auto max-w-3xl px-6 py-12">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-indigo-500">Relvo · Design preview</p>
                        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Widget preview harness</h1>
                        <p className="mt-2 max-w-lg text-sm text-slate-500 dark:text-slate-400">
                            The embeddable widget mounts in the bottom-right. Use this page to iterate on
                            the widget design. The mount reads from <code className="rounded bg-slate-200 px-1.5 py-0.5 text-[12px] dark:bg-slate-800">VITE_WIDGET_TEST_CHANNEL_KEY</code>
                            or falls back to the known-good dev channel key.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white p-1 text-xs shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        {(['light', 'system', 'dark'] as const).map(opt => (
                            <button
                                key={opt}
                                type="button"
                                onClick={() => setScheme(opt)}
                                className={`rounded-full px-3 py-1.5 font-medium capitalize transition-colors ${
                                    scheme === opt
                                        ? 'bg-indigo-600 text-white shadow'
                                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                                }`}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <h2 className="text-lg font-semibold">What this page tests</h2>
                    <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-slate-600 dark:text-slate-300">
                        <li>Launcher bubble with brand color, entrance animation, unread badge.</li>
                        <li>Panel open/close, dark-mode surfaces, mobile full-screen at &lt; 480px.</li>
                        <li>Welcome screen greeting + agent info row.</li>
                        <li>Pre-chat identity form (shown when the channel requires identity).</li>
                        <li>Message bubbles with timestamp grouping, typing dots, send status.</li>
                        <li>Auto-growing composer with Enter-to-send / Shift+Enter newline.</li>
                    </ul>
                    <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">
                        Mount status: <span className="font-medium">{mounted ? 'Mounted' : 'Mounting...'}</span>
                    </p>
                </div>
            </div>
        </div>
    );
}
