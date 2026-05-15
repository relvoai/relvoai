import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { useAuthStore } from '../auth/authStore';

// Make Pusher available globally for Laravel Echo
(window as any).Pusher = Pusher;

let echoInstance: Echo<any> | null = null;
let connectionFailed = false;

export function getEcho(): Echo<any> | null {
    if (connectionFailed) return null;
    if (echoInstance) return echoInstance;

    const token = useAuthStore.getState().token;
    if (!token) return null;

    try {
        echoInstance = new Echo({
            broadcaster: 'reverb',
            key: import.meta.env.VITE_REVERB_APP_KEY || 'livechatappkey',
            wsHost: import.meta.env.VITE_REVERB_HOST || 'localhost',
            wsPort: parseInt(import.meta.env.VITE_REVERB_PORT || '8080'),
            wssPort: parseInt(import.meta.env.VITE_REVERB_PORT || '8080'),
            forceTLS: (import.meta.env.VITE_REVERB_SCHEME || 'http') === 'https',
            enabledTransports: ['ws', 'wss'],
            authEndpoint: `${import.meta.env.VITE_API_BASE_URL || 'http://livechat.test/api/v1'}/../broadcasting/auth`,
            auth: {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json',
                },
            },
        });

        // Listen for connection state changes
        const connector = (echoInstance as any).connector;
        if (connector?.pusher) {
            connector.pusher.connection.bind('connected', () => {
                console.log('[Relvo AI] WebSocket connected via Reverb');
                connectionFailed = false;
            });

            connector.pusher.connection.bind('failed', () => {
                console.warn('[Relvo AI] WebSocket connection failed, switching to HTTP polling');
                connectionFailed = true;
                echoInstance = null;
            });

            connector.pusher.connection.bind('unavailable', () => {
                console.warn('[Relvo AI] WebSocket unavailable, switching to HTTP polling');
                connectionFailed = true;
                echoInstance = null;
            });
        }

        return echoInstance;
    } catch (e) {
        console.warn('[Relvo AI] WebSocket initialization failed, switching to HTTP polling');
        connectionFailed = false;
        return null;
    }
}

export function disconnectEcho(): void {
    if (echoInstance) {
        echoInstance.disconnect();
        echoInstance = null;
    }
    connectionFailed = false;
}

export function isWebSocketAvailable(): boolean {
    return !connectionFailed && echoInstance !== null;
}
