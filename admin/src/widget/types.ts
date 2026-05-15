export interface RelvoSettings {
    channel_key: string;
    user?: {
        external_id?: string;
        name?: string;
        email?: string;
    };
    client?: {
        page_url?: string;
        page_title?: string;
        referrer?: string;
        user_agent?: string;
        timezone?: string;
        language?: string;
        screen_resolution?: string;
    }
}

export interface APIError {
    success: boolean;
    message: string;
    code?: string;
    errors?: Record<string, string[]>;
}

export type WidgetAppearance = 'light' | 'dark' | 'auto';

export interface WidgetAgentSummary {
    name?: string;
    avatar_url?: string;
    title?: string;
}

export interface WidgetConfig {
    widget_color: string;
    welcome_title: string;
    welcome_tagline?: string;
    position?: 'bottom-right' | 'bottom-left';
    launcher_style?: 'bubble' | 'text_bubble';
    launcher_text?: string;
    show_branding?: boolean;
    radius?: number;
    appearance?: WidgetAppearance;
    agent?: WidgetAgentSummary;
    reply_time?: string;
}

export interface IdentityFieldsConfig {
    name: boolean;
    email: boolean;
}

export interface IdentityPayload {
    name: string;
    email: string;
}

export interface UIConfigResponse {
    widget_config: WidgetConfig;
    identity: {
        mode: 'optional' | 'required';
        fields: Partial<IdentityFieldsConfig> & Record<string, boolean>;
    };
    realtime?: {
        enabled: boolean;
        driver: string;
        host: string;
        port: number;
        key: string;
        scheme: string;
    };
    meta: {
        config_version: string;
        cache_ttl: number;
    };
}

export interface Contact {
    id: string;
    name: string;
    external_id?: string;
    email?: string;
}

export interface BootstrapResponse {
    session_token: string;
    conversation_id: string;
    contact: Contact;
}

export interface RefreshResponse {
    session_token: string;
    conversation_id: string;
    contact_id: string;
}

export interface MessageAttachment {
    id?: string;
    url: string;
    name?: string;
    content_type?: string;
    size?: number;
}

export interface MessageSenderSummary {
    id?: string;
    name?: string;
    avatar_url?: string;
}

export interface Message {
    id: string;
    body: string;
    type: 'visitor' | 'user' | 'system';
    created_at: string;
    sender?: MessageSenderSummary;
    attachments?: MessageAttachment[];
    pending?: boolean;
    failed?: boolean;
}

export interface ConversationSummary {
    id: string;
    subject: string;
    status: 'open' | 'pending' | 'closed';
    created_at: string;
    updated_at: string;
    last_message: {
        body: string;
        type: string;
        created_at: string;
    } | null;
    message_count: number;
}

export interface WidgetState {
    sessionToken: string | null;
    conversationId: string | null;
    config: WidgetConfig | null;
    isOpen: boolean;
    messages: Message[];
    visitorUid: string;
}

export type WidgetScreen = 'home' | 'chat';

declare global {
    interface Window {
        RelvoSettings?: RelvoSettings;
    }
}
