import React from 'react';

interface BrandingProps {
    visible?: boolean;
    className?: string;
}

export function Branding({ visible = true, className = '' }: BrandingProps): React.ReactElement | null {
    if (!visible) {
        return null;
    }
    return (
        <div className={`shrink-0 text-center ${className}`}>
            <a
                href="https://relvo.com"
                target="_blank"
                rel="noopener noreferrer"
                className="rv-focusable inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-medium text-slate-400 transition-colors hover:text-slate-500 dark:text-slate-500 dark:hover:text-slate-300"
            >
                Powered by <span className="font-semibold tracking-tight text-slate-500 dark:text-slate-300">Relvo</span>
            </a>
        </div>
    );
}
