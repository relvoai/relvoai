import React from 'react';
import ReactDOM from 'react-dom/client';
import WidgetApp from './WidgetApp';
import { widgetApi } from './api';
import { generateUUID } from './utils';
import { RelvoSettings } from './types';

// Import styles as inline string (Vite feature)
import styles from '../../index.css?inline';
import widgetStyles from './styles/widget.css?inline';

// Widget Initialization Logic
async function initRelvoWidget(overrideSettings?: RelvoSettings): Promise<void> {
    // 1. Check for settings
    const settings = overrideSettings ?? window.RelvoSettings;
    if (!settings || !settings.channel_key) {
        console.warn('Relvo Widget: Missing "channel_key" in window.RelvoSettings. Widget will not load.');
        return;
    }

    // 2. Identify Visitor (Persistent)
    let visitorUid = localStorage.getItem('relvo_visitor_uid');
    if (!visitorUid) {
        visitorUid = generateUUID();
        localStorage.setItem('relvo_visitor_uid', visitorUid);
    }

    // 3. Configure API Client with keys
    // Check for existing session token to resume immediately if valid
    const storedSession = localStorage.getItem('relvo_session_token');
    widgetApi.configure(settings.channel_key, visitorUid, storedSession);

    // Setup token refresh listener to persist new tokens
    widgetApi.setTokenRefreshedCallback((newToken) => {
        localStorage.setItem('relvo_session_token', newToken);
    });

    // 4. Create container
    const containerId = 'relvo-widget-container';
    if (document.getElementById(containerId)) {
        return; // Already loaded
    }

    const container = document.createElement('div');
    container.id = containerId;
    document.body.appendChild(container);

    // 5. Shadow DOM for isolation
    const shadow = container.attachShadow({ mode: 'open' });

    // Inject styles explicitly into shadow
    const styleSheet = document.createElement('style');
    // Combine font import + tailwind styles + widget-scoped layer + resets
    styleSheet.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        ${styles}
        ${widgetStyles}
        :host {
            all: initial;
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            display: block;
            position: fixed;
            bottom: 0;
            right: 0;
            z-index: 2147483000;
        }
        div, button, input, textarea, form, a {
            box-sizing: border-box;
        }
    `;
    shadow.appendChild(styleSheet);

    const rootElement = document.createElement('div');
    shadow.appendChild(rootElement);

    // 6. Mount React App
    // We pass settings so the app can use user details for bootstrapping
    const root = ReactDOM.createRoot(rootElement);
    root.render(
        <React.StrictMode>
            <WidgetApp settings={settings} />
        </React.StrictMode>
    );
}

// Expose a preview hook for the in-repo admin preview route, which mounts the
// widget inside the admin app without needing a built `relvo.js` bundle.
declare global {
    interface Window {
        __relvoMountForPreview?: (settings: RelvoSettings) => Promise<void>;
    }
}
if (typeof window !== 'undefined') {
    window.__relvoMountForPreview = initRelvoWidget;
}

// Auto-run when script loads (production embedded bundle)
if (typeof window !== 'undefined' && window.RelvoSettings) {
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        initRelvoWidget();
    } else {
        window.addEventListener('load', () => { initRelvoWidget(); });
    }
}
