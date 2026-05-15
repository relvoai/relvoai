import { useEffect, useState } from 'react';
import { WidgetAppearance } from '../types';

type ResolvedScheme = 'light' | 'dark';

/**
 * Resolve the effective color scheme for the widget.
 *
 * - `light` / `dark` from backend config force that scheme.
 * - `auto` (or undefined) follows the host page's `prefers-color-scheme`.
 *
 * Returns the resolved scheme and the `dark` class flag consumers toggle
 * on the widget root for Tailwind's class-based dark mode.
 */
export function useColorScheme(preference: WidgetAppearance | undefined): ResolvedScheme {
    const [scheme, setScheme] = useState<ResolvedScheme>(() => resolveInitial(preference));

    useEffect(() => {
        if (preference === 'light' || preference === 'dark') {
            setScheme(preference);
            return;
        }
        if (typeof window === 'undefined' || !window.matchMedia) {
            setScheme('light');
            return;
        }
        const media = window.matchMedia('(prefers-color-scheme: dark)');
        const update = (): void => setScheme(media.matches ? 'dark' : 'light');
        update();
        media.addEventListener('change', update);
        return (): void => media.removeEventListener('change', update);
    }, [preference]);

    return scheme;
}

function resolveInitial(preference: WidgetAppearance | undefined): ResolvedScheme {
    if (preference === 'light' || preference === 'dark') {
        return preference;
    }
    if (typeof window !== 'undefined' && window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
}
