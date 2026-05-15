// @ts-nocheck
/**
 * Tests for plugin loader.
 *
 * NOTE: vitest is not yet installed in this workspace. See registry.test.ts.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { resolveBundleUrl, loadEnabledPlugins, _resetLoader, type PluginManifestEntry } from './loader';
import client from '../http/client';

vi.mock('../http/client', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
    },
}));

describe('resolveBundleUrl', () => {
    it('preserves absolute http(s) URLs', () => {
        expect(resolveBundleUrl('https://cdn.example.com/x.js', 'http://api.test/api/v1'))
            .toBe('https://cdn.example.com/x.js');
    });

    it('resolves relative paths against the API origin (strips /api/v1)', () => {
        expect(resolveBundleUrl('/plugins/demo/dist/index.js', 'http://api.test/api/v1'))
            .toBe('http://api.test/plugins/demo/dist/index.js');
    });

    it('handles path-only base URLs', () => {
        // jsdom default origin
        const url = resolveBundleUrl('/plugins/demo/dist/index.js', '/api/v1');
        expect(url.endsWith('/plugins/demo/dist/index.js')).toBe(true);
    });

    it('prepends leading slash when missing', () => {
        const url = resolveBundleUrl('plugins/demo/dist/index.js', 'http://api.test/api/v1');
        expect(url).toBe('http://api.test/plugins/demo/dist/index.js');
    });
});

describe('loadEnabledPlugins', () => {
    beforeEach(() => {
        _resetLoader();
        document.head.innerHTML = '';
        vi.clearAllMocks();
    });

    it('fetches manifest and injects one script per bundled plugin', async () => {
        const manifest: PluginManifestEntry[] = [
            { slug: 'a', name: 'A', version: '1.0', bundle: '/plugins/a/dist/index.js', capabilities: [] },
            { slug: 'b', name: 'B', version: '1.0', bundle: null, capabilities: [] },
            { slug: 'c', name: 'C', version: '1.0', bundle: '/plugins/c/dist/index.js', capabilities: [] },
        ];
        (client.get as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true, data: manifest, message: null });

        // Resolve script load synchronously by firing onload after append.
        const origAppend = document.head.appendChild.bind(document.head);
        vi.spyOn(document.head, 'appendChild').mockImplementation((node: Node) => {
            const result = origAppend(node);
            queueMicrotask(() => {
                const ev = new Event('load');
                (node as HTMLScriptElement).dispatchEvent(ev);
                (node as HTMLScriptElement).onload?.(ev as unknown as Event);
            });
            return result;
        });

        const result = await loadEnabledPlugins('http://api.test/api/v1');
        expect(result).toHaveLength(3);

        const scripts = Array.from(document.head.querySelectorAll('script[data-relvoai-plugin]')) as HTMLScriptElement[];
        const srcs = scripts.map((s) => s.src);
        expect(srcs).toContain('http://api.test/plugins/a/dist/index.js');
        expect(srcs).toContain('http://api.test/plugins/c/dist/index.js');
        expect(srcs.some((s) => s.includes('/plugins/b/'))).toBe(false);
    });

    it('does not re-inject scripts already loaded', async () => {
        const manifest: PluginManifestEntry[] = [
            { slug: 'a', name: 'A', version: '1.0', bundle: '/plugins/a/dist/index.js', capabilities: [] },
        ];
        (client.get as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true, data: manifest, message: null });

        const origAppend = document.head.appendChild.bind(document.head);
        vi.spyOn(document.head, 'appendChild').mockImplementation((node: Node) => {
            const result = origAppend(node);
            queueMicrotask(() => (node as HTMLScriptElement).onload?.(new Event('load')));
            return result;
        });

        await loadEnabledPlugins('http://api.test/api/v1');
        await loadEnabledPlugins('http://api.test/api/v1');

        const scripts = document.head.querySelectorAll('script[data-relvoai-plugin]');
        expect(scripts.length).toBe(1);
    });
});
