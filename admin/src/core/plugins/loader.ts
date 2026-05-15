/**
 * Plugin bundle loader.
 *
 * Fetches the admin plugin manifest from the backend, then injects a
 * <script> tag for every enabled plugin that ships a bundle. Each plugin
 * bundle is responsible for calling `window.Relvo.plugins.register(...)`
 * on load.
 */

import client from '../http/client';

export interface PluginManifestEntry {
    slug: string;
    name: string;
    version: string;
    bundle: string | null;
    capabilities: string[];
}

const MANIFEST_PATH = '/admin/plugins/manifest';

/** Track already-injected bundle URLs so reloads are idempotent. */
const loaded = new Set<string>();
const inflight = new Map<string, Promise<void>>();

/**
 * Resolve a manifest bundle path against the API host.
 *
 * Manifest entries are absolute paths like `/plugins/<slug>/dist/index.js`
 * served by the Laravel host. We strip the API prefix (e.g. `/api/v1`)
 * from the configured base URL so the script tag points at the host root.
 */
export function resolveBundleUrl(bundle: string, apiBaseUrl: string): string {
    if (/^https?:\/\//i.test(bundle)) {
        return bundle;
    }

    // apiBaseUrl can be absolute (http://host/api/v1) or path-only (/api/v1).
    let origin = '';
    try {
        const url = new URL(apiBaseUrl, typeof window !== 'undefined' ? window.location.href : 'http://localhost');
        origin = url.origin;
    } catch {
        origin = '';
    }

    const path = bundle.startsWith('/') ? bundle : `/${bundle}`;
    return `${origin}${path}`;
}

function injectScript(src: string): Promise<void> {
    if (loaded.has(src)) return Promise.resolve();
    const existing = inflight.get(src);
    if (existing) return existing;

    const promise = new Promise<void>((resolve, reject) => {
        if (typeof document === 'undefined') {
            resolve();
            return;
        }
        const tag = document.createElement('script');
        tag.src = src;
        tag.async = true;
        tag.dataset.relvoaiPlugin = '1';
        tag.onload = () => {
            loaded.add(src);
            resolve();
        };
        tag.onerror = () => {
            inflight.delete(src);
            reject(new Error(`Failed to load plugin bundle: ${src}`));
        };
        document.head.appendChild(tag);
    });

    inflight.set(src, promise);
    return promise;
}

/**
 * Fetch the manifest and load every enabled plugin bundle. Fire-and-forget
 * friendly: rejections from individual scripts are logged but don't fail
 * the overall promise.
 */
export async function loadEnabledPlugins(
    apiBaseUrl: string = import.meta.env.VITE_API_BASE_URL || '/api/v1',
): Promise<PluginManifestEntry[]> {
    const response = await client.get<PluginManifestEntry[]>(MANIFEST_PATH);
    const entries = response.data ?? [];

    await Promise.all(
        entries
            .filter((e): e is PluginManifestEntry & { bundle: string } => !!e.bundle)
            .map((entry) => {
                const url = resolveBundleUrl(entry.bundle, apiBaseUrl);
                return injectScript(url).catch((err) => {
                    // Surface failures but don't break the rest of the app.
                    console.error(`[plugins] ${entry.slug} failed to load`, err);
                });
            }),
    );

    return entries;
}

/** Test-only: reset module state. */
export function _resetLoader(): void {
    loaded.clear();
    inflight.clear();
}
