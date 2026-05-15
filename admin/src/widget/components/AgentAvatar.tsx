import React from 'react';

interface AgentAvatarProps {
    name?: string;
    src?: string;
    size?: 'sm' | 'md' | 'lg';
    showStatus?: boolean;
    online?: boolean;
}

const SIZE_MAP: Record<NonNullable<AgentAvatarProps['size']>, string> = {
    sm: 'h-7 w-7 text-[11px]',
    md: 'h-9 w-9 text-xs',
    lg: 'h-12 w-12 text-sm',
};

export function AgentAvatar({
    name,
    src,
    size = 'md',
    showStatus = false,
    online = true,
}: AgentAvatarProps): React.ReactElement {
    const initials = getInitials(name);
    return (
        <div className={`relative shrink-0 ${SIZE_MAP[size]}`}>
            {src ? (
                <img
                    src={src}
                    alt={name ?? 'Agent avatar'}
                    className="h-full w-full rounded-full object-cover ring-2 ring-white/70 dark:ring-slate-900/70"
                />
            ) : (
                <div
                    aria-hidden="true"
                    className="flex h-full w-full items-center justify-center rounded-full font-semibold text-white ring-2 ring-white/70 dark:ring-slate-900/70"
                    style={{ background: 'var(--rv-brand-gradient)' }}
                >
                    {initials}
                </div>
            )}
            {showStatus && (
                <span
                    aria-hidden="true"
                    className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-white dark:ring-slate-900 ${
                        online ? 'bg-emerald-500' : 'bg-slate-400'
                    }`}
                />
            )}
        </div>
    );
}

function getInitials(name: string | undefined): string {
    if (!name) {
        return 'RV';
    }
    const parts = name.trim().split(/\s+/).slice(0, 2);
    return parts.map(part => part.charAt(0).toUpperCase()).join('') || 'RV';
}
