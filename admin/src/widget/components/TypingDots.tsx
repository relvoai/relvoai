import React from 'react';

interface TypingDotsProps {
    label?: string;
}

export function TypingDots({ label = 'Agent is typing' }: TypingDotsProps): React.ReactElement {
    return (
        <div
            className="inline-flex items-center gap-1 rounded-2xl rounded-bl-sm border border-slate-200/70 bg-white px-3 py-2 text-slate-400 shadow-sm dark:border-slate-700/70 dark:bg-slate-800 dark:text-slate-400"
            role="status"
            aria-label={label}
        >
            <span className="rv-dot" />
            <span className="rv-dot" />
            <span className="rv-dot" />
        </div>
    );
}
