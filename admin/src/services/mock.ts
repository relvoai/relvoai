import { 
  MOCK_CONVERSATIONS, 
  MOCK_DEPARTMENTS, 
  MOCK_USERS, 
  MOCK_WIDGETS,
  MOCK_CONTACTS,
  MOCK_CANNED_REPLIES,
  MOCK_LOGS,
  CURRENT_USER,
  MOCK_ROLES,
  MOCK_RATINGS,
  MOCK_BOT_RULES,
  MOCK_BLACKLIST
} from '../mocks/data';
import { AdminConversationResource, MessageResource } from '../types';

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const ConversationService = {
  list: async () => {
    await delay(300);
    return [...MOCK_CONVERSATIONS];
  },
  getById: async (id: string) => {
    await delay(200);
    return MOCK_CONVERSATIONS.find(c => c.id === id);
  },
  sendMessage: async (conversationId: string, body: string, isInternal: boolean = false) => {
    await delay(300);
    const newMessage: MessageResource = {
      id: `m_${Date.now()}`,
      message_type: 'text',
      body,
      is_internal: isInternal,
      created_at: new Date().toISOString(),
      sender: {
        type: 'agent',
        id: CURRENT_USER.id,
        name: `${CURRENT_USER.first_name} ${CURRENT_USER.last_name}`,
        avatar: CURRENT_USER.avatar_url
      }
    };
    return newMessage;
  },
  updateStatus: async (id: string, status: string) => {
    await delay(200);
    return true;
  }
};

export const DepartmentService = {
  list: async () => {
    await delay(200);
    return [...MOCK_DEPARTMENTS];
  }
};

export const WidgetService = {
  list: async () => {
    await delay(200);
    return [...MOCK_WIDGETS];
  },
  getByKey: async (key: string) => {
     await delay(200);
     return MOCK_WIDGETS.find(w => w.widget_key === key);
  }
};

export const UserService = {
  list: async () => {
    await delay(200);
    return [...MOCK_USERS];
  },
  me: async () => {
    await delay(100);
    return CURRENT_USER;
  }
};

export const RoleService = {
  list: async () => {
    await delay(150);
    return [...MOCK_ROLES];
  }
}

export const ContactService = {
  list: async () => {
    await delay(200);
    return [...MOCK_CONTACTS];
  }
};

export const ProductivityService = {
  listCannedReplies: async () => {
    await delay(200);
    return [...MOCK_CANNED_REPLIES];
  }
};

export const AnalyticsService = {
  getRatings: async () => {
    await delay(250);
    return [...MOCK_RATINGS];
  }
}

export const AutomationService = {
  listBotRules: async () => {
    await delay(200);
    return [...MOCK_BOT_RULES];
  },
  listBlacklist: async () => {
    await delay(200);
    return [...MOCK_BLACKLIST];
  }
}

export const SystemService = {
  getLogs: async () => {
    await delay(300);
    return [...MOCK_LOGS];
  }
}