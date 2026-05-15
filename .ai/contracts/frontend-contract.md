# Frontend Contract

> [!NOTE]
> Refactored for Inbox + Channels Architecture.

## InboxResource
```typescript
interface InboxResource {
  id: string;
  name: string;
  is_active: boolean;
  auto_assignment_enabled: boolean;
  auto_assignment_limit?: number;
  timezone?: string;
  business_hours_enabled: boolean;
  business_hours?: any;
  unavailable_message?: string;
  csat_enabled: boolean;
  csat_message?: string;
  csat_allow_comment: boolean;
  config?: any;
  created_at: string;
  updated_at: string;
  channels_count?: number;
  agents_count?: number;
  channels?: ChannelResource[];
  agents?: UserResource[];
}
```

## ChannelResource
```typescript
interface ChannelResource {
  id: string;
  inbox_id: string;
  type: 'web_chat' | 'telegram' | 'whatsapp' | 'email' | 'api';
  name: string;
  channel_key: string;
  is_active: boolean;
  avatar_path?: string;
  theme_color?: string;
  greeting_enabled: boolean;
  greeting_message?: string;
  lock_to_single_conversation: boolean;
  domain_policy?: 'allow_all' | 'restrict';
  config?: any;
  domains?: { id: string, domain: string }[];
  created_at: string;
  updated_at: string;
}
```

## UserResource
```typescript
interface UserResource {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  is_active: boolean;
  roles: string[];
  permissions: string[];
}
```

## Permissions Reference
> [!NOTE]
> Defines all available permissions in the system.

### System
- `system.settings.index`, `system.settings.view`, `system.settings.update`, `system.logs.view`

### Users & Roles
- `users.index`, `users.view_any`, `users.create`, `users.update`, `users.delete`, `users.deactivate`
- `roles.index`, `roles.view_any`, `roles.manage`, `permissions.assign`

### Inboxes
- `inboxes.index`, `inboxes.view_any`, `inboxes.view_own`
- `inboxes.create`, `inboxes.update`, `inboxes.delete`, `inboxes.manage_agents`

### Channels
- `channels.index`, `channels.view_any`, `channels.manage`, `channels.api_keys.manage`

### Conversations
- `conversations.index`, `conversations.view_any`, `conversations.view_own`
- `conversations.create`, `conversations.reply`, `conversations.note`
- `conversations.assign`, `conversations.transfer`, `conversations.resolve`, `conversations.reopen`
- `conversations.manage_tags`, `conversations.delete_messages`

### Visitors & Contacts (CRM)
- `visitors.index`, `visitors.view_any`
- `contacts.index`, `contacts.view_any`, `contacts.create`, `contacts.update`, `contacts.delete`

### Canned Replies
- `canned_replies.index`, `canned_replies.view_any`, `canned_replies.view_own`
- `canned_replies.create`, `canned_replies.update`, `canned_replies.delete`
- `canned_replies.manage_shared`

### Reports
- `reports.index`, `reports.view_all`, `reports.export`

### Automations & Bot
- `automations.index`, `automations.manage`, `bot_rules.manage`

### Security & Compliance
- `security.index`, `blocked_urls.manage`, `audit_logs.view`

## Endpoints

### Application API (`/api/v1`)

#### Inboxes
- `GET /inboxes`: List Inboxes -> `InboxResource[]`
- `POST /inboxes`: Create Inbox (`{ name: string }`) -> `InboxResource`
- `GET /inboxes/{id}`: Get Inbox -> `InboxResource`
- `PUT /inboxes/{id}`: Update Inbox -> `InboxResource`
- `DELETE /inboxes/{id}`: Delete Inbox
- `PUT /inboxes/{id}/agents`: Update Agents (`{ agent_ids: string[] }`) -> `InboxResource`

#### Channels
- `POST /inboxes/{inbox}/channels`: Create Channel (`{ type, name }`) -> `ChannelResource`
- `GET /channels/{id}`: Get Channel -> `ChannelResource`
- `PUT /channels/{id}`: Update Channel -> `ChannelResource`
- `DELETE /channels/{id}`: Delete Channel

#### Web Channel Specific
- `GET /channels/{id}/embed-script`: Get Embed HTML -> `{ script: string }`
- `PUT /channels/{id}/domains`: Update Domains (`{ domains: string[] }`) -> `ChannelResource`
- `PUT /channels/{id}/pre-chat-form`: Update Pre-chat -> `PreChatFormResource`
- `POST /channels/{id}/rotate-identity-token`: Rotate Token -> `ChannelResource`

#### Channel Types
- `GET /channel-types`: List types -> `{ data: [{ type, name, logo }] }`

### Public Widget API (`/api/v1/public/channels/{channel_key}`)

- `POST /identify`: Identify Visitor -> `{ visitor: { id, token } }`
- `POST /sessions/heartbeat`: Heartbeat -> `void`
- `POST /conversations`: Create Conversation -> `{ id: string }`
- `GET /conversations/{id}/messages`: List Messages
- `POST /conversations/{id}/messages`: Send Message
- `POST /conversations/{id}/attachments`: Upload Attachment
- `POST /conversations/{id}/ratings`: Submit Rating

> [!NOTE]
> AUTO-GENERATED from OpenAPI. Do not edit manually.

## AdminConversationResource
```typescript
interface AdminConversationResource {
  id: string;
  status: string;
  priority: string;
  subject: string;
  widget?: WidgetResource;
  visitor?: VisitorResource;
  messages?: MessageResource[];
  assigned_to?: UserResource;
  department?: DepartmentResource;
  created_at: string;
  updated_at: string;
}
```

## CannedReplyResource
```typescript
interface CannedReplyResource {
  id: string;
  shortcut: string;
  content: string;
  is_shared: boolean;
  user_id: any;
  created_at: any;
  updated_at: any;
}
```

## Contact
```typescript
interface Contact {
  id: string;
  name: any;
  email: any;
  phone: any;
  tags: any;
  internal_notes: any;
  merged_into_contact_id: any;
  created_at: any;
  updated_at: any;
  deleted_at: any;
}
```

## ConversationResource
```typescript
interface ConversationResource {
  id: string;
  status: string;
  subject: any;
  created_at: any;
  updated_at: any;
  messages?: MessageResource[];
  last_message?: MessageResource;
}
```

## DepartmentResource
```typescript
interface DepartmentResource {
  id: string;
  name: string;
  is_active: boolean;
  created_at: any;
  updated_at: any;
  users_count?: number;
}
```

## IdentifyVisitorRequest
```typescript
interface IdentifyVisitorRequest {
  uuid?: any;
  email?: any;
  name?: any;
  phone?: any;
  meta?: any;
  referrer?: any;
  entry_url?: any;
}
```

## MessageResource
```typescript
interface MessageResource {
  id: string;
  message_type: string;
  body: any;
  client_message_id: any;
  created_at: any;
  sender: Record<string, any>;
}
```

## SettingResource
```typescript
interface SettingResource {
  id: string;
  key: string;
  value: any;
  type: string;
  updated_at: any;
}
```

## StoreAgentReplyRequest
```typescript
interface StoreAgentReplyRequest {
  body: string;
  attachments?: any;
  is_note?: boolean;
}
```

## StoreCannedReplyRequest
```typescript
interface StoreCannedReplyRequest {
  shortcut: string;
  content: string;
  is_shared?: boolean;
}
```

## StoreConversationRequest
```typescript
interface StoreConversationRequest {
  subject?: any;
  priority?: any;
  department_id?: any;
  initial_message: string;
  meta?: any;
}
```

## StoreDepartmentRequest
```typescript
interface StoreDepartmentRequest {
  name: string;
  is_active?: boolean;
}
```

## StoreMessageRequest
```typescript
interface StoreMessageRequest {
  body?: any;
  client_message_id?: any;
  attachments?: any;
}
```

## StoreRatingRequest
```typescript
interface StoreRatingRequest {
  rating: number;
  comment?: any;
}
```

## StoreUserRequest
```typescript
interface StoreUserRequest {
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  password: string;
  is_active?: boolean;
  locale?: any;
  timezone?: any;
  password_confirmation: string;
  roles?: string[];
  departments?: string[];
}
```

## StoreWidgetRequest
```typescript
interface StoreWidgetRequest {
  name: string;
  domains?: any;
}
```

## TransferConversationRequest
```typescript
interface TransferConversationRequest {
  to_user_id?: any;
  to_department_id?: any;
  note?: any;
}
```

## UpdateDepartmentRequest
```typescript
interface UpdateDepartmentRequest {
  name?: string;
  is_active?: boolean;
}
```

## UpdateSettingRequest
```typescript
interface UpdateSettingRequest {
  value?: any;
}
```

## UpdateUserRequest
```typescript
interface UpdateUserRequest {
  first_name?: string;
  last_name?: string;
  email?: string;
  username?: string;
  password?: string;
  is_active?: boolean;
  locale?: any;
  timezone?: any;
  password_confirmation?: string;
  roles?: string[];
  departments?: string[];
}
```

## UpdateWidgetRequest
```typescript
interface UpdateWidgetRequest {
  name?: string;
  widget_key?: string;
  is_active?: boolean;
  welcome_title?: any;
  welcome_message?: any;
  language?: any;
  theme_color?: any;
  position?: string;
  launcher_text?: any;
  domain_policy?: string;
  business_hours_enabled?: boolean;
  business_hours?: any;
  offline_mode?: string;
  offline_message?: any;
  domains?: string[];
}
```

## UserResource
```typescript
interface UserResource {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  is_active: boolean;
  last_login_at: any;
  locale: any;
  timezone: any;
  created_at: any;
  updated_at: any;
  roles: any[];
  permissions: any[];
  departments?: DepartmentResource[];
}
```

## VisitorResource
```typescript
interface VisitorResource {
  id: string;
  first_seen_at: any;
  last_seen_at: any;
  last_seen_url: any;
  last_referrer: any;
  meta: any;
  contact?: Contact;
}
```

## WidgetResource
```typescript
interface WidgetResource {
  id: string;
  name: string;
  widget_key: string;
  is_active: boolean;
  config: Record<string, any>;
  domains: any[];
  created_at: any;
  updated_at: any;
}
```


## Endpoints

### Admin API (`/api/v1/admin`)

#### Authentication
- `POST /login`: Login (`LoginRequest`) -> `{ token: string, user: UserResource }`
- `GET /me`: Get current user -> `UserResource`
- `POST /logout`: Logout

#### Users
- `GET /users`: List users -> `UserResource[]`
- `POST /users`: Create user (`StoreUserRequest`) -> `UserResource`
- `GET /users/{id}`: Get user -> `UserResource`
- `PUT /users/{id}`: Update user (`UpdateUserRequest`) -> `UserResource`
- `DELETE /users/{id}`: Delete user

#### Widgets
- `GET /widgets`: List widgets -> `WidgetResource[]`
- `POST /widgets`: Create widget (`StoreWidgetRequest`) -> `WidgetResource`
- `GET /widgets/{id}`: Get widget -> `WidgetResource`
- `PUT /widgets/{id}`: Update widget (`UpdateWidgetRequest`) -> `WidgetResource`
- `DELETE /widgets/{id}`: Delete widget

#### Departments
- `GET /departments`: List departments -> `DepartmentResource[]`
- `POST /departments`: Create department (`StoreDepartmentRequest`) -> `DepartmentResource`
- `GET /departments/{id}`: Get department -> `DepartmentResource`
- `PUT /departments/{id}`: Update department (`UpdateDepartmentRequest`) -> `DepartmentResource`
- `DELETE /departments/{id}`: Delete department

#### Conversations
- `GET /conversations`: List conversations -> `AdminConversationResource[]`
- `GET /conversations/{id}`: Get conversation -> `AdminConversationResource`
- `POST /conversations/{id}/reply`: Reply (`StoreAgentReplyRequest`) -> `void`
- `POST /conversations/{id}/join`: Join conversation -> `void`
- `POST /conversations/{id}/leave`: Leave conversation -> `void`
- `POST /conversations/{id}/transfer`: Transfer (`TransferConversationRequest`) -> `void`
- `POST /conversations/{id}/close`: Close conversation -> `void`

#### Canned Replies
- `GET /canned-replies`: List replies -> `CannedReplyResource[]`
- `POST /canned-replies`: Create reply (`StoreCannedReplyRequest`) -> `CannedReplyResource`
- `DELETE /canned-replies/{id}`: Delete reply

#### Reports
- `GET /reports`: Get dashboard reports

#### Settings
- `GET /settings`: List settings -> `SettingResource[]`
- `PUT /settings/{key}`: Update setting (`UpdateSettingRequest`) -> `SettingResource`

#### Visitors
- `GET /visitors/online`: List online visitors -> `VisitorResource[]`

---

### Widget API (`/api/v1/widget`)

#### Visitor
- `POST /identify`: Identify/Create Visitor (`IdentifyVisitorRequest`) -> `VisitorResource`
- `POST /heartbeat`: Send heartbeat (Presence) -> `void`

#### Conversations
- `POST /conversations`: Start conversation (`StoreConversationRequest`) -> `ConversationResource`
- `POST /conversations/{id}/messages`: Send message (`StoreMessageRequest`) -> `MessageResource`
- `POST /conversations/{id}/rating`: Rate conversation (`StoreRatingRequest`) -> `void`
- `POST /conversations/{id}/typing`: Send typing indicator -> `void`
