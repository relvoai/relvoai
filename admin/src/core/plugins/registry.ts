/**
 * Plugin slot registry.
 *
 * Plugins register contributions for named slots in the admin UI. Each
 * contribution provides a `component` factory that returns either an
 * HTMLElement (vanilla JS plugins) or a React element. <PluginSlot /> picks
 * up registered contributions and renders them.
 *
 * The registry is exposed on `window.Relvo` so that non-bundled plugin
 * JS files (loaded via <script src=...>) can call into it without needing
 * a module import.
 */

import type { ReactNode } from 'react';

export type PluginSlotName =
    | 'sidebar.section'
    | 'conversation.tab'
    | 'settings.section'
    | 'widget.message-renderer'
    | 'ai.tool';

export type PluginComponent =
    | ((host: HTMLElement) => void | (() => void))
    | (() => HTMLElement)
    | (() => ReactNode);

export interface PluginContribution {
    slug: string;
    slot: PluginSlotName;
    component: PluginComponent;
    /** Optional predicate; if returns false at render time the contribution is skipped. */
    when?: () => boolean;
}

export interface PluginRegistry {
    register: (contribution: PluginContribution) => void;
    get: (slot: PluginSlotName) => PluginContribution[];
    /** Test-only: drop all registrations. */
    _reset: () => void;
}

const contributions: PluginContribution[] = [];

export const pluginRegistry: PluginRegistry = {
    register(contribution) {
        contributions.push(contribution);
    },
    get(slot) {
        return contributions.filter((c) => c.slot === slot);
    },
    _reset() {
        contributions.length = 0;
    },
};

declare global {
    interface Window {
        Relvo?: {
            plugins: PluginRegistry;
        };
    }
}

/**
 * Attach the registry to window.Relvo so plugin scripts can register
 * contributions without a module import. Idempotent.
 */
export function attachToWindow(target: Window = window): void {
    if (!target.Relvo) {
        target.Relvo = { plugins: pluginRegistry };
    } else {
        target.Relvo.plugins = pluginRegistry;
    }
}

// Auto-attach on module load (browser only).
if (typeof window !== 'undefined') {
    attachToWindow(window);
}
