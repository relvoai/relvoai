// @ts-nocheck
/**
 * Tests for plugin registry.
 *
 * NOTE: vitest is not yet installed in this workspace. These tests are
 * written in vitest's standard API. Adding vitest + jsdom as devDependencies
 * is the recommended next step — see task brief.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { pluginRegistry, attachToWindow } from './registry';

describe('pluginRegistry', () => {
    beforeEach(() => {
        pluginRegistry._reset();
    });

    it('registers and retrieves contributions by slot', () => {
        const component = () => document.createElement('div');
        pluginRegistry.register({ slug: 'demo', slot: 'sidebar.section', component });

        const items = pluginRegistry.get('sidebar.section');
        expect(items).toHaveLength(1);
        expect(items[0].slug).toBe('demo');
    });

    it('preserves registration order', () => {
        pluginRegistry.register({ slug: 'a', slot: 'sidebar.section', component: () => document.createElement('div') });
        pluginRegistry.register({ slug: 'b', slot: 'sidebar.section', component: () => document.createElement('div') });
        pluginRegistry.register({ slug: 'c', slot: 'conversation.tab', component: () => document.createElement('div') });

        expect(pluginRegistry.get('sidebar.section').map((c) => c.slug)).toEqual(['a', 'b']);
        expect(pluginRegistry.get('conversation.tab').map((c) => c.slug)).toEqual(['c']);
    });

    it('filters by slot type', () => {
        pluginRegistry.register({ slug: 'a', slot: 'ai.tool', component: () => document.createElement('div') });
        expect(pluginRegistry.get('settings.section')).toHaveLength(0);
    });

    it('attaches registry to window.Relvo', () => {
        const fakeWindow = {} as Window;
        attachToWindow(fakeWindow);
        expect(fakeWindow.Relvo).toBeDefined();
        expect(fakeWindow.Relvo?.plugins).toBe(pluginRegistry);
    });

    it('window.Relvo allows external scripts to register', () => {
        const fakeWindow = {} as Window;
        attachToWindow(fakeWindow);
        fakeWindow.Relvo!.plugins.register({
            slug: 'external',
            slot: 'ai.tool',
            component: () => document.createElement('span'),
        });
        expect(pluginRegistry.get('ai.tool').map((c) => c.slug)).toContain('external');
    });
});
