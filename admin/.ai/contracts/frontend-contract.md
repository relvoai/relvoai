# Frontend Contract

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
