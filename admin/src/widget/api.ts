import { BootstrapResponse, ConversationSummary, Message, RefreshResponse, RelvoSettings, UIConfigResponse } from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
const BASE_URL = `${API_BASE_URL}/public/widget`;

class WidgetApiClient {
    private channelKey: string = '';
    private visitorUid: string = '';
    private sessionToken: string | null = null;

    private onTokenRefreshed?: (newToken: string) => void;

    configure(channelKey: string, visitorUid: string, sessionToken: string | null = null) {
        this.channelKey = channelKey;
        this.visitorUid = visitorUid;
        this.sessionToken = sessionToken;
    }

    setTokenRefreshedCallback(callback: (token: string) => void) {
        this.onTokenRefreshed = callback;
    }

    private async request<T>(endpoint: string, options: RequestInit = {}, retrying = false): Promise<T> {
        const url = `${BASE_URL}${endpoint}`;

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Channel-Key': this.channelKey,
            'X-Visitor-Uid': this.visitorUid,
            ...(options.headers as Record<string, string>),
        };

        if (this.sessionToken) {
            headers['Authorization'] = `Bearer ${this.sessionToken}`;
        }

        const response = await fetch(url, { ...options, headers });

        if (response.status === 401 && !retrying) {
            try {
                const refreshData = await this.refreshSession();
                this.sessionToken = refreshData.session_token;
                if (this.onTokenRefreshed) {
                    this.onTokenRefreshed(refreshData.session_token);
                }
                return this.request<T>(endpoint, options, true);
            } catch {
                throw new Error('Session expired');
            }
        }

        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(errorBody.message || `Request failed: ${response.status}`);
        }

        const json = await response.json();
        return json.data;
    }

    async getConfig(): Promise<UIConfigResponse> {
        return this.request<UIConfigResponse>('/config', { method: 'GET' });
    }

    async bootstrap(user?: RelvoSettings['user'], client?: RelvoSettings['client']): Promise<BootstrapResponse> {
        return this.request<BootstrapResponse>('/bootstrap', {
            method: 'POST',
            body: JSON.stringify({ user, client }),
        });
    }

    async refreshSession(currentConversationId?: string): Promise<RefreshResponse> {
        const url = `${BASE_URL}/refresh`;
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Channel-Key': this.channelKey,
            'X-Visitor-Uid': this.visitorUid,
        };

        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify({ conversation_id: currentConversationId }),
        });

        if (!response.ok) throw new Error('Failed to refresh session');
        const json = await response.json();
        return json.data;
    }

    // Conversations
    async getConversations(): Promise<ConversationSummary[]> {
        return this.request<ConversationSummary[]>('/conversations', { method: 'GET' });
    }

    async createConversation(): Promise<ConversationSummary> {
        return this.request<ConversationSummary>('/conversations', { method: 'POST' });
    }

    async selectConversation(conversationId: string): Promise<void> {
        await this.request(`/conversations/${conversationId}/select`, { method: 'POST' });
    }

    // Messages
    async getMessages(): Promise<Message[]> {
        try {
            const data = await this.request<{ data: Message[]; meta: any }>('/messages', { method: 'GET' });
            return data.data || [];
        } catch {
            return [];
        }
    }

    async sendMessage(body: string): Promise<Message> {
        return this.request<Message>('/messages', {
            method: 'POST',
            body: JSON.stringify({ body }),
        });
    }
}

export const widgetApi = new WidgetApiClient();
