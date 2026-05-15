
import { 
  AdminConversationResource, 
  Contact, 
  DepartmentResource, 
  UserResource, 
  WidgetResource,
  CannedReplyResource,
  AuditLog,
  VisitorResource,
  RoleResource,
  RatingResource,
  BotRuleResource,
  BlacklistResource
} from '../types';

export const CURRENT_USER: UserResource = {
  id: 'u_1',
  first_name: 'Alex',
  last_name: 'Admin',
  email: 'alex@relvoai.com',
  username: 'alexadmin',
  roles: ['admin'],
  avatar_url: 'https://i.pravatar.cc/150?u=u_1',
  status: 'online',
  is_active: true,
  last_login_at: new Date().toISOString()
};

export const MOCK_USERS: UserResource[] = [
  CURRENT_USER,
  {
    id: 'u_2',
    first_name: 'Sarah',
    last_name: 'Agent',
    email: 'sarah@relvoai.com',
    username: 'sarahagent',
    roles: ['agent'],
    avatar_url: 'https://i.pravatar.cc/150?u=u_2',
    status: 'busy',
    is_active: true,
    last_login_at: '2023-11-20T14:30:00Z'
  },
  {
    id: 'u_3',
    first_name: 'Mike',
    last_name: 'Support',
    email: 'mike@relvoai.com',
    username: 'mikesupport',
    roles: ['agent'],
    avatar_url: 'https://i.pravatar.cc/150?u=u_3',
    status: 'offline',
    is_active: false,
    last_login_at: '2023-11-18T09:15:00Z'
  }
];

export const MOCK_ROLES: RoleResource[] = [
  { id: 'r_1', name: 'Admin', description: 'Full system access', permissions_count: 45, users_count: 1 },
  { id: 'r_2', name: 'Agent', description: 'Handle conversations and visitors', permissions_count: 12, users_count: 2 },
  { id: 'r_3', name: 'Manager', description: 'View reports and manage agents', permissions_count: 25, users_count: 0 },
];

export const MOCK_DEPARTMENTS: DepartmentResource[] = [
  { id: 'd_1', name: 'General Support', is_active: true, users_count: 3 },
  { id: 'd_2', name: 'Sales', is_active: true, users_count: 2 },
  { id: 'd_3', name: 'Technical', is_active: true, users_count: 5 },
];

export const MOCK_WIDGETS: WidgetResource[] = [
  {
    id: 'w_1',
    name: 'Main Website',
    widget_key: 'wdg_main_123',
    is_active: true,
    domains: ['example.com', 'localhost'],
    config: {
      theme_color: '#10b981', // Emerald
      welcome_message: 'Hi there! How can we help?',
      logo_url: 'https://via.placeholder.com/50'
    }
  },
  {
    id: 'w_2',
    name: 'Support Portal',
    widget_key: 'wdg_supp_456',
    is_active: true,
    domains: ['support.example.com'],
    config: {
      theme_color: '#3b82f6', // Blue
      welcome_message: 'Welcome to support!',
    }
  }
];

export const MOCK_CONTACTS: Contact[] = [
  {
    id: 'c_1',
    name: 'John Doe',
    email: 'john@gmail.com',
    tags: ['vip', 'customer'],
    created_at: '2023-10-01T10:00:00Z',
    last_seen_at: '2023-11-20T09:30:00Z',
    avatar_url: 'https://i.pravatar.cc/150?u=c_1',
    conversations_count: 12
  },
  {
    id: 'c_2',
    name: 'Jane Smith',
    email: 'jane@enterprise.com',
    tags: ['prospect', 'lead'],
    created_at: '2023-10-05T14:30:00Z',
    last_seen_at: '2023-11-21T10:05:00Z',
    avatar_url: 'https://i.pravatar.cc/150?u=c_2',
    conversations_count: 3
  },
  {
    id: 'c_3',
    name: 'Bob Johnson',
    email: 'bob@builder.com',
    phone: '+1 555-0123',
    tags: ['vendor'],
    created_at: '2023-09-15T08:00:00Z',
    last_seen_at: '2023-11-15T16:20:00Z',
    conversations_count: 1
  }
];

export const MOCK_VISITORS: VisitorResource[] = [
  {
    id: 'v_1',
    first_seen_at: '2023-11-20T08:00:00Z',
    last_seen_at: '2023-11-20T09:30:00Z',
    last_seen_url: 'https://example.com/pricing',
    contact: MOCK_CONTACTS[0],
    ip_address: '192.168.1.1',
    browser: 'Chrome 118',
    os: 'Windows 10',
    coordinates: { lat: 37.7749, lng: -122.4194 } // San Francisco
  },
  {
    id: 'v_2',
    first_seen_at: '2023-11-21T10:00:00Z',
    last_seen_at: '2023-11-21T10:05:00Z',
    last_seen_url: 'https://example.com/features',
    ip_address: '10.0.0.5',
    browser: 'Safari',
    os: 'macOS',
    coordinates: { lat: 40.7128, lng: -74.0060 } // New York
  },
  {
    id: 'v_3',
    first_seen_at: '2023-11-21T10:30:00Z',
    last_seen_at: '2023-11-21T10:35:00Z',
    last_seen_url: 'https://example.com/',
    ip_address: '172.16.0.2',
    browser: 'Firefox',
    os: 'Linux',
    coordinates: { lat: 51.5074, lng: -0.1278 } // London
  }
];

export const MOCK_CANNED_REPLIES: CannedReplyResource[] = [
  { id: 'cr_1', shortcut: '/hello', content: 'Hi there! How can I help you today?', is_shared: true },
  { id: 'cr_2', shortcut: '/price', content: 'Our pricing starts at $29/mo. You can see more details at /pricing.', is_shared: true },
  { id: 'cr_3', shortcut: '/bye', content: 'Thank you for contacting us. Have a great day!', is_shared: false },
];

export const MOCK_CONVERSATIONS: AdminConversationResource[] = [
  {
    id: 'conv_1',
    status: 'open',
    priority: 'high',
    subject: 'Pricing Question',
    visitor: MOCK_VISITORS[0],
    assigned_to: CURRENT_USER,
    department: MOCK_DEPARTMENTS[1],
    created_at: '2023-11-20T09:00:00Z',
    updated_at: '2023-11-20T09:30:00Z',
    unread_count: 1,
    messages: [
      {
        id: 'm_1',
        message_type: 'text',
        body: 'Hi, I have a question about the Enterprise plan.',
        created_at: '2023-11-20T09:00:00Z',
        sender: { type: 'visitor', id: 'v_1', name: 'John Doe', avatar: 'https://i.pravatar.cc/150?u=c_1' }
      },
      {
        id: 'm_2',
        message_type: 'text',
        body: 'Hello John! I can certainly help with that.',
        created_at: '2023-11-20T09:05:00Z',
        sender: { type: 'agent', id: 'u_1', name: 'Alex Admin', avatar: 'https://i.pravatar.cc/150?u=u_1' }
      },
      {
        id: 'm_3',
        message_type: 'text',
        body: 'Do you offer volume discounts?',
        created_at: '2023-11-20T09:10:00Z',
        sender: { type: 'visitor', id: 'v_1', name: 'John Doe', avatar: 'https://i.pravatar.cc/150?u=c_1' }
      }
    ]
  },
  {
    id: 'conv_2',
    status: 'pending',
    priority: 'medium',
    subject: 'Technical Issue',
    visitor: MOCK_VISITORS[1],
    assigned_to: undefined,
    department: MOCK_DEPARTMENTS[2],
    created_at: '2023-11-21T10:00:00Z',
    updated_at: '2023-11-21T10:00:00Z',
    unread_count: 0,
    messages: [
      {
        id: 'm_4',
        message_type: 'text',
        body: 'My widget is not loading on the staging site.',
        created_at: '2023-11-21T10:00:00Z',
        sender: { type: 'visitor', id: 'v_2', name: 'Visitor 82', avatar: '' }
      }
    ]
  },
  {
    id: 'conv_3',
    status: 'closed',
    priority: 'low',
    subject: 'Feature Request',
    visitor: { ...MOCK_VISITORS[1], id: 'v_3' },
    assigned_to: MOCK_USERS[1],
    department: MOCK_DEPARTMENTS[0],
    created_at: '2023-11-19T14:00:00Z',
    updated_at: '2023-11-19T15:00:00Z',
    messages: []
  }
];

export const MOCK_LOGS: AuditLog[] = [
  { id: 'l_1', action: 'LOGIN', user_name: 'Alex Admin', details: 'User logged in successfully', created_at: '2023-11-21T08:00:00Z', ip_address: '10.0.0.1' },
  { id: 'l_2', action: 'UPDATE_WIDGET', user_name: 'Alex Admin', details: 'Updated widget "Main Website"', created_at: '2023-11-20T16:45:00Z', ip_address: '10.0.0.1' },
  { id: 'l_3', action: 'DELETE_CONTACT', user_name: 'Sarah Agent', details: 'Deleted contact #442', created_at: '2023-11-20T11:20:00Z', ip_address: '192.168.1.55' },
  { id: 'l_4', action: 'BLOCK_IP', user_name: 'System', details: 'Blocked malicious IP 85.2.1.4', created_at: '2023-11-20T10:00:00Z', ip_address: 'System' },
];

export const MOCK_RATINGS: RatingResource[] = [
  { id: 'rt_1', score: 5, comment: 'Great service!', customer_name: 'John Doe', agent_name: 'Alex Admin', created_at: '2023-11-20T09:40:00Z' },
  { id: 'rt_2', score: 4, comment: 'Very helpful but slightly slow.', customer_name: 'Jane Smith', agent_name: 'Sarah Agent', created_at: '2023-11-19T15:30:00Z' },
];

export const MOCK_BOT_RULES: BotRuleResource[] = [
  { id: 'br_1', name: 'After Hours', trigger: 'Time outside 9-5', action: 'Send "We are closed" message', is_active: true },
  { id: 'br_2', name: 'Pricing Query', trigger: 'Message contains "price"', action: 'Assign to Sales', is_active: true },
];

export const MOCK_BLACKLIST: BlacklistResource[] = [
  { id: 'bl_1', url_pattern: 'malicious-site.com', reason: 'Spam referrer', created_at: '2023-10-10T00:00:00Z' },
];
