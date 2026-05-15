// Simple UUID v4 generator
export function generateUUID(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Gather browser/device context
export function getBrowserContext(): {
    page_url: string;
    page_title: string;
    referrer: string;
    user_agent: string;
    timezone: string;
    language: string;
    screen_resolution: string;
} {
    return {
        page_url: window.location.href,
        page_title: document.title,
        referrer: document.referrer,
        user_agent: navigator.userAgent,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language,
        screen_resolution: `${window.screen.width}x${window.screen.height}`,
    };
}

/**
 * Short relative time label used throughout the widget (e.g. "2m", "3h", "now").
 * Intentionally compact — the widget header + conversation rows are narrow.
 */
export function formatRelativeTime(dateStr: string | undefined): string {
    if (!dateStr) {
        return '';
    }
    const now = Date.now();
    const date = new Date(dateStr).getTime();
    if (Number.isNaN(date)) {
        return '';
    }
    const diffMs = Math.max(0, now - date);
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) {
        return 'now';
    }
    if (diffMins < 60) {
        return `${diffMins}m`;
    }
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) {
        return `${diffHours}h`;
    }
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) {
        return `${diffDays}d`;
    }
    return new Date(dateStr).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

/**
 * Format a time-of-day label for message bubbles ("3:42 PM").
 */
export function formatClockTime(dateStr: string | undefined): string {
    if (!dateStr) {
        return '';
    }
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) {
        return '';
    }
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

/**
 * Day-level label for message group separators ("Today", "Yesterday", "Mar 3").
 */
export function formatDayLabel(dateStr: string): string {
    const now = new Date();
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) {
        return '';
    }
    const startOfDay = (x: Date): number => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
    const diffDays = Math.round((startOfDay(now) - startOfDay(d)) / (24 * 60 * 60 * 1000));
    if (diffDays === 0) {
        return 'Today';
    }
    if (diffDays === 1) {
        return 'Yesterday';
    }
    if (diffDays < 7) {
        return d.toLocaleDateString([], { weekday: 'long' });
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: now.getFullYear() === d.getFullYear() ? undefined : 'numeric' });
}
