import { useMemo } from 'react';

export interface BrandTheme {
    color: string;
    contrast: string;
    soft: string;
    gradient: string;
    ring: string;
    cssVars: Record<string, string>;
}

const FALLBACK = '#4F46E5'; // indigo-600

/**
 * Derive a small palette from the brand color returned by the backend. All
 * values are plain CSS — no runtime color lib, no Tailwind arbitrary value
 * gymnastics. Consumers apply `cssVars` via `style` on the widget root so
 * every descendant can reference `var(--rv-brand)` etc.
 */
export function useBrandTheme(rawColor: string | undefined): BrandTheme {
    return useMemo(() => {
        const color = normalize(rawColor) ?? FALLBACK;
        const rgb = hexToRgb(color);
        const isLight = relativeLuminance(rgb) > 0.6;
        const contrast = isLight ? '#0f172a' : '#ffffff';
        const soft = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.12)`;
        const ring = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.35)`;
        const gradient = `linear-gradient(135deg, ${color} 0%, ${shift(color, -12)} 100%)`;
        return {
            color,
            contrast,
            soft,
            gradient,
            ring,
            cssVars: {
                '--rv-brand': color,
                '--rv-brand-contrast': contrast,
                '--rv-brand-soft': soft,
                '--rv-brand-ring': ring,
                '--rv-brand-gradient': gradient,
            },
        };
    }, [rawColor]);
}

function normalize(value: string | undefined): string | null {
    if (!value) {
        return null;
    }
    const trimmed = value.trim();
    if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed)) {
        if (trimmed.length === 4) {
            const r = trimmed[1];
            const g = trimmed[2];
            const b = trimmed[3];
            return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
        }
        return trimmed.toLowerCase();
    }
    return null;
}

interface RGB { r: number; g: number; b: number }

function hexToRgb(hex: string): RGB {
    const h = hex.replace('#', '');
    return {
        r: parseInt(h.slice(0, 2), 16),
        g: parseInt(h.slice(2, 4), 16),
        b: parseInt(h.slice(4, 6), 16),
    };
}

function relativeLuminance({ r, g, b }: RGB): number {
    const toLinear = (c: number): number => {
        const s = c / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function shift(hex: string, delta: number): string {
    const { r, g, b } = hexToRgb(hex);
    const clamp = (n: number): number => Math.max(0, Math.min(255, n));
    const amount = Math.round((delta / 100) * 255);
    const toHex = (n: number): string => clamp(n + amount).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
