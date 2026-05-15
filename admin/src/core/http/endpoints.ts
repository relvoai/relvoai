/**
 * Central endpoint definitions from .ai/contracts/api.json
 * ALL endpoint paths are defined here - no component may use raw strings.
 */
export const ENDPOINTS = {
    auth: {
        login: '/login',
        me: '/me',
        logout: '/logout',
    },

    inboxes: {
        list: '/inboxes',
        create: '/inboxes',
        show: (id: string) => `/inboxes/${id}`,
        update: (id: string) => `/inboxes/${id}`,
        delete: (id: string) => `/inboxes/${id}`,
        agents: (id: string) => `/inboxes/${id}/agents`,
        channels: (id: string) => `/inboxes/${id}/channels`,
    },

    channels: {
        show: (id: string) => `/channels/${id}`,
        update: (id: string) => `/channels/${id}`,
        delete: (id: string) => `/channels/${id}`,
        embedScript: (id: string) => `/channels/${id}/embed-script`,
        rotateHmacSecret: (id: string) => `/channels/${id}/rotate-hmac-secret`,
        domains: (id: string) => `/channels/${id}/domains`,
    },

    setup: {
        channelTypes: '/channel-types',
    },

    conversations: {
        list: '/admin/conversations',
        show: (id: string) => `/admin/conversations/${id}`,
        messages: (id: string) => `/admin/conversations/${id}/messages`,
        reply: (id: string) => `/admin/conversations/${id}/reply`,
        join: (id: string) => `/admin/conversations/${id}/join`,
        leave: (id: string) => `/admin/conversations/${id}/leave`,
        transfer: (id: string) => `/admin/conversations/${id}/transfer`,
        close: (id: string) => `/admin/conversations/${id}/close`,
    },

    departments: {
        list: '/admin/departments',
        create: '/admin/departments',
        show: (id: string) => `/admin/departments/${id}`,
        update: (id: string) => `/admin/departments/${id}`,
        delete: (id: string) => `/admin/departments/${id}`,
    },

    users: {
        list: '/admin/users',
        create: '/admin/users',
        show: (id: string) => `/admin/users/${id}`,
        update: (id: string) => `/admin/users/${id}`,
        delete: (id: string) => `/admin/users/${id}`,
    },

    contacts: {
        list: '/admin/contacts',
        create: '/admin/contacts',
        show: (id: string) => `/admin/contacts/${id}`,
        update: (id: string) => `/admin/contacts/${id}`,
        delete: (id: string) => `/admin/contacts/${id}`,
        conversations: (id: string) => `/admin/contacts/${id}/conversations`,
        notes: (id: string) => `/admin/contacts/${id}/notes`,
        merge: (id: string) => `/admin/contacts/${id}/merge`,
    },

    cannedReplies: {
        list: '/admin/canned-replies',
        create: '/admin/canned-replies',
        delete: (id: string) => `/admin/canned-replies/${id}`,
    },

    widgets: {
        list: '/admin/widgets',
        create: '/admin/widgets',
        show: (id: string) => `/admin/widgets/${id}`,
        update: (id: string) => `/admin/widgets/${id}`,
        delete: (id: string) => `/admin/widgets/${id}`,
    },

    visitors: {
        online: '/admin/visitors/online',
    },

    messages: {
        star: (id: string) => `/admin/messages/${id}/star`,
    },

    settings: {
        list: '/admin/settings',
        update: (key: string) => `/admin/settings/${key}`,
    },

    reports: {
        list: '/admin/reports',
    },

    botRules: {
        list: '/admin/bot-rules',
        create: '/admin/bot-rules',
        update: (id: string) => `/admin/bot-rules/${id}`,
        delete: (id: string) => `/admin/bot-rules/${id}`,
    },

    auditLogs: {
        list: '/admin/audit-logs',
    },

    ratings: {
        list: '/admin/ratings',
    },

    roles: {
        list: '/admin/roles',
        show: (id: string) => `/admin/roles/${id}`,
    },

    aiAgents: {
        list: '/admin/ai-agents',
        create: '/admin/ai-agents',
        show: (id: string) => `/admin/ai-agents/${id}`,
        update: (id: string) => `/admin/ai-agents/${id}`,
        delete: (id: string) => `/admin/ai-agents/${id}`,
        attachChannel: (agentId: string, channelId: string) =>
            `/admin/ai-agents/${agentId}/channels/${channelId}`,
        detachChannel: (agentId: string, channelId: string) =>
            `/admin/ai-agents/${agentId}/channels/${channelId}`,
        knowledgeList: (agentId: string) => `/admin/ai-agents/${agentId}/knowledge`,
        knowledgeCreate: (agentId: string) => `/admin/ai-agents/${agentId}/knowledge`,
        knowledgeShow: (agentId: string, sourceId: string) =>
            `/admin/ai-agents/${agentId}/knowledge/${sourceId}`,
        knowledgeDelete: (agentId: string, sourceId: string) =>
            `/admin/ai-agents/${agentId}/knowledge/${sourceId}`,
        knowledgeReindex: (agentId: string, sourceId: string) =>
            `/admin/ai-agents/${agentId}/knowledge/${sourceId}/reindex`,
    },

    aiCredits: {
        show: '/admin/ai-credits',
        grant: '/admin/ai-credits/grant',
    },
} as const;
