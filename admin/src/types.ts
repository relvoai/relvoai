

export interface AdminConversationResource {
  id: string;
  status: 'open' | 'closed' | 'pending';
  priority: 'low' | 'medium' | 'high';
  subject: string;
  widget?: WidgetResource;
  visitor?: VisitorResource;
  messages?: MessageResource[];
  assigned_to?: UserResource;
  department?: DepartmentResource;
  created_at: string;
  updated_at: string;
  unread_count?: number;
}

export interface CannedReplyResource {
  id: string;
  shortcut: string;
  content: string;
  is_shared: boolean;
  tags?: string[];
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  tags: string[];
  internal_notes?: string;
  created_at: string;
  last_seen_at?: string;
  avatar_url?: string;
  conversations_count: number;
}

export interface DepartmentResource {
  id: string;
  name: string;
  is_active: boolean;
  users_count: number;
}

export interface MessageResource {
  id: string;
  message_type: 'text' | 'image' | 'file' | 'system';
  body: string;
  client_message_id?: string;
  created_at: string;
  sender: {
    type: 'visitor' | 'agent' | 'system' | 'bot';
    id: string;
    name: string;
    avatar?: string;
  };
  attachments?: any[];
  is_internal?: boolean;
}

export interface UserResource {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  avatar_url?: string;
  status?: 'online' | 'offline' | 'busy';
  is_active: boolean;
  last_login_at?: string | null;
  locale?: string | null;
  timezone?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  roles?: string[];
  permissions?: string[];
}

export interface RoleResource {
  id: string;
  name: string;
  description: string;
  permissions_count: number;
  users_count: number;
}

export interface PermissionResource {
  id: string;
  module: string;
  action: string;
  description: string;
}

export interface VisitorResource {
  id: string;
  first_seen_at: string;
  last_seen_at: string;
  last_seen_url: string;
  last_referrer?: string;
  meta?: any;
  contact?: Contact;
  ip_address?: string;
  browser?: string;
  os?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface BusinessHours {
  enabled: boolean;
  timezone: string;
  schedule: Record<string, { open: string; close: string; is_closed: boolean }>;
}

export interface WidgetConfig {
  theme_color: string;
  logo_url?: string;
  welcome_title?: string;
  welcome_message: string;
  language?: string;
  position?: 'bottom-right' | 'bottom-left';
  launcher_style?: 'bubble' | 'text_bubble';
  launcher_text?: string;
  domain_policy?: 'allow_all' | 'restrict';
  offline_mode?: 'form' | 'message' | 'hide';
  offline_message?: string;
  business_hours?: BusinessHours;
  bot_enabled?: boolean;
  font_size?: 'small' | 'medium' | 'large';
  radius?: number;
  show_branding?: boolean;
}

export interface WidgetResource {
  id: string;
  name: string;
  widget_key: string;
  is_active: boolean;
  config: WidgetConfig;
  domains: string[];
}

export interface AuditLog {
  id: string;
  action: string;
  user_name: string;
  details: string;
  created_at: string;
  ip_address?: string;
}

export interface DashboardMetrics {
  active_conversations: number;
  online_visitors: number;
  avg_response_time: string;
  satisfaction_score: number;
}

export interface RatingResource {
  id: string;
  score: number; // 1-5
  comment?: string;
  customer_name: string;
  agent_name: string;
  created_at: string;
}

export interface BotRuleResource {
  id: string;
  name: string;
  trigger: string;
  action: string;
  is_active: boolean;
}

export interface BlacklistResource {
  id: string;
  url_pattern: string;
  reason: string;
  created_at: string;
}