/**
 * <PluginSlot name="..." /> renders every registered contribution for a slot.
 *
 * Contribution components are vanilla-JS friendly: each one receives a host
 * <div> element and may either populate it imperatively or return an
 * HTMLElement that will be appended. A cleanup function may be returned to
 * tear down on unmount.
 */

import React, { useEffect, useRef } from 'react';
import { pluginRegistry, type PluginContribution, type PluginSlotName } from './registry';

interface PluginSlotProps {
    name: PluginSlotName;
    className?: string;
}

function ContributionHost({ contribution }: { contribution: PluginContribution; key?: React.Key }) {
    const ref = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const host = ref.current;
        if (!host) return;

        let cleanup: void | (() => void);
        let appended: HTMLElement | null = null;

        try {
            const result = (contribution.component as (host: HTMLElement) => unknown)(host);

            if (result instanceof HTMLElement) {
                host.appendChild(result);
                appended = result;
            } else if (typeof result === 'function') {
                cleanup = result as () => void;
            } else if (result && typeof (result as { nodeType?: number }).nodeType === 'number') {
                // Defensive: any other DOM node-like value.
                host.appendChild(result as unknown as HTMLElement);
                appended = result as unknown as HTMLElement;
            }
        } catch (err) {
            console.error(`[plugins] contribution from ${contribution.slug} failed`, err);
        }

        return () => {
            if (typeof cleanup === 'function') {
                try {
                    cleanup();
                } catch (err) {
                    console.error(`[plugins] cleanup for ${contribution.slug} failed`, err);
                }
            }
            if (appended && appended.parentNode === host) {
                host.removeChild(appended);
            }
            if (host) host.innerHTML = '';
        };
    }, [contribution]);

    return <div ref={ref} data-plugin-slug={contribution.slug} />;
}

export function PluginSlot({ name, className }: PluginSlotProps): React.ReactElement | null {
    const contributions = pluginRegistry.get(name).filter((c) => (c.when ? c.when() : true));
    if (contributions.length === 0) return null;

    return (
        <div data-plugin-slot={name} className={className}>
            {contributions.map((c, idx) => (
                <ContributionHost key={`${c.slug}-${idx}`} contribution={c} />
            ))}
        </div>
    );
}

export default PluginSlot;
