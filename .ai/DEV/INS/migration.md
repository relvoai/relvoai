# UPDATED DB STRUCTURE (V1) — LiveChat API (UUID-first)

# Core app tables

## users
• id uuid (PK)  
• first_name varchar(255)  
• last_name varchar(255)  
• email varchar(255) unique  
• username varchar(255) unique  
• email_verified_at timestamp nullable  
• password varchar(255)  
• is_active boolean default true  
• last_login_at timestamp nullable  
• locale varchar(10) nullable  
• timezone varchar(50) nullable  
• remember_token varchar(100) nullable  
• created_at timestamp  
• updated_at timestamp  
• deleted_at timestamp nullable

---

## settings (for one-click language + global system config)
• id uuid (PK)  
• key varchar(100) unique  (e.g. app.locale, ai.enabled, ai.provider, ai.model)  
• value longtext nullable  
• type varchar(20) default 'string' (string|json|bool|int)  
• created_at timestamp  
• updated_at timestamp

---

## widgets
• id uuid (PK)  
• name varchar(255)  
• widget_key varchar(64) unique  
• is_active boolean default true

Widget config (single source of truth: columns)
• welcome_title varchar(255) nullable  
• welcome_message text nullable  
• language varchar(10) nullable  
• theme_color varchar(32) nullable  
• position varchar(20) default 'bottom-right'  
• launcher_text varchar(255) nullable  
• domain_policy varchar(20) default 'allow_all' (allow_all | restrict)  
• business_hours_enabled boolean default false  
• business_hours json nullable  
• offline_mode varchar(20) default 'form' (form | message | hide)  
• offline_message text nullable  
• default_priority varchar(20) default 'normal' (low|normal|high|urgent)

• created_at timestamp  
• updated_at timestamp  
• deleted_at timestamp nullable

---

## widget_domains (only if widgets.domain_policy = restrict)
• id uuid (PK)  
• widget_id uuid (FK → widgets.id, cascade)  
• domain varchar(255)  (host only e.g. example.com)  
• created_at timestamp  
• updated_at timestamp  
(Unique: widget_id + domain)

---

## departments
• id uuid (PK)  
• name varchar(255)  
• is_active boolean default true  
• created_at timestamp  
• updated_at timestamp  
• deleted_at timestamp nullable

---

## department_user
• department_id uuid (FK → departments.id, cascade)  
• user_id uuid (FK → users.id, cascade)  
• role varchar(20) default 'agent' (agent|lead)  
• created_at timestamp  
• updated_at timestamp  
(Unique/PK: department_id + user_id)

---

## department_widget
• department_id uuid (FK → departments.id, cascade)  
• widget_id uuid (FK → widgets.id, cascade)  
• is_default boolean default false  
• created_at timestamp  
• updated_at timestamp  
(Unique/PK: department_id + widget_id)

---

## contacts
• id uuid (PK)  
• name varchar(255) nullable  
• email varchar(255) nullable (unique where not null)  
• phone varchar(32) nullable  
• tags json nullable  
• internal_notes text nullable  
• merged_into_contact_id uuid nullable (FK → contacts.id, set null)  
• created_at timestamp  
• updated_at timestamp  
• deleted_at timestamp nullable

---

## visitors
• id uuid (PK)  ← stored in localStorage.visitor_id  
• contact_id uuid nullable (FK → contacts.id, set null)

Lifecycle
• first_seen_at timestamp nullable  
• last_seen_at timestamp nullable

Last known context
• last_seen_url text nullable  
• last_referrer text nullable  
• last_ip varchar(64) nullable  
• user_agent text nullable  
• locale varchar(10) nullable  
• timezone varchar(50) nullable  
• meta json nullable

• created_at timestamp  
• updated_at timestamp  
• deleted_at timestamp nullable

---

## visitor_sessions (for “Live Online Visitors”)
• id uuid (PK)  
• widget_id uuid (FK → widgets.id, cascade)  
• visitor_id uuid (FK → visitors.id, cascade)  
• session_started_at timestamp  
• last_activity_at timestamp  
• entry_url text nullable  
• referrer text nullable  
• ip varchar(64) nullable  
• user_agent text nullable  
• country varchar(2) nullable  
• city varchar(100) nullable  
• meta json nullable  
• created_at timestamp  
• updated_at timestamp

---

## conversations
• id uuid (PK)  
• widget_id uuid (FK → widgets.id, cascade)  
• visitor_id uuid (FK → visitors.id, cascade)  
• contact_id uuid nullable (FK → contacts.id, set null)  
• department_id uuid nullable (FK → departments.id, set null)

Assignment
• assigned_to_user_id uuid nullable (FK → users.id, set null)  
• assigned_at timestamp nullable  
• assigned_by_user_id uuid nullable (FK → users.id, set null)

Status
• status varchar(20) default 'open' (open|pending|closed)  
• priority varchar(20) default 'normal' (low|normal|high|urgent)  
• tags json nullable  
• subject varchar(255) nullable  
• summary text nullable

Bot control (auto answers until pickup)
• bot_enabled boolean default true  
• bot_disabled_at timestamp nullable

Inbox performance pointers
• last_message_id uuid nullable (FK → messages.id, set null)  
• last_message_by varchar(20) nullable (visitor|agent|system)  
• last_message_at timestamp nullable  
• first_response_at timestamp nullable  
• closed_at timestamp nullable

• meta json nullable  
• created_at timestamp  
• updated_at timestamp  
• deleted_at timestamp nullable

---

## conversation_participants (Group Chat: operators join/leave)
• id uuid (PK)  
• conversation_id uuid (FK → conversations.id, cascade)  
• user_id uuid (FK → users.id, cascade)  
• joined_at timestamp  
• left_at timestamp nullable  
• is_owner boolean default false  
• created_at timestamp  
• updated_at timestamp

---

## conversation_transfers (Transfer Clients)
• id uuid (PK)  
• conversation_id uuid (FK → conversations.id, cascade)  
• from_user_id uuid nullable (FK → users.id, set null)  
• to_user_id uuid nullable (FK → users.id, set null)  
• transferred_by_user_id uuid nullable (FK → users.id, set null)  
• note text nullable  
• created_at timestamp  
• updated_at timestamp

---

## messages
• id uuid (PK)  
• conversation_id uuid (FK → conversations.id, cascade)

• message_type varchar(20) (visitor|agent|system|note)  
• user_id uuid nullable (FK → users.id, set null)  
• visitor_id uuid nullable (FK → visitors.id, set null)  ← IMPORTANT: NOT cascade

• body text nullable  
• format varchar(20) default 'text' (text|html|markdown)  
• has_attachments boolean default false

Client dedupe (important for retries)
• client_message_id varchar(100) nullable

• delivered_at timestamp nullable  
• read_at timestamp nullable  
• meta json nullable

• created_at timestamp  
• updated_at timestamp  
• deleted_at timestamp nullable

---

## message_attachments
• id uuid (PK)  
• message_id uuid (FK → messages.id, cascade)  
• disk varchar(50) default 'public'  
• path text  
• original_name varchar(255) nullable  
• mime_type varchar(100) nullable  
• size_bytes bigint unsigned default 0  
• is_image boolean default false  
• checksum varchar(128) nullable  
• meta json nullable  
• created_at timestamp  
• updated_at timestamp

---

## message_stars (Starred Messages)
• id uuid (PK)  
• message_id uuid (FK → messages.id, cascade)  
• user_id uuid (FK → users.id, cascade)  
• created_at timestamp  
• updated_at timestamp  
(Unique: message_id + user_id)

---

## canned_replies (Responses / macros)
• id uuid (PK)  
• user_id uuid nullable (FK → users.id, cascade)  (null = shared)  
• title varchar(255)  
• shortcut varchar(50) nullable  
• content text  
• is_shared boolean default false  
• created_at timestamp  
• updated_at timestamp  
• deleted_at timestamp nullable

---

## bot_rules (Chat-Bot auto answers until pickup)
• id uuid (PK)  
• widget_id uuid nullable (FK → widgets.id, cascade)  (null = global)  
• department_id uuid nullable (FK → departments.id, set null)  
• trigger varchar(20) default 'contains' (contains|regex|equals|starts_with)  
• pattern text  
• reply text  
• priority int default 0  
• is_active boolean default true  
• created_at timestamp  
• updated_at timestamp

---

## blocked_urls (URL Blacklist)
• id uuid (PK)  
• widget_id uuid nullable (FK → widgets.id, cascade)  (null = global)  
• pattern varchar(500)  
• match_type varchar(20) default 'wildcard' (wildcard|regex|contains|exact)  
• is_active boolean default true  
• reason varchar(255) nullable  
• created_at timestamp  
• updated_at timestamp

---

## ratings (Feedback / CSAT)
• id uuid (PK)  
• conversation_id uuid (FK → conversations.id, cascade) unique  
• widget_id uuid (FK → widgets.id, cascade)  
• visitor_id uuid nullable (FK → visitors.id, set null)  ← IMPORTANT: NOT cascade  
• score tinyint unsigned (1–5)  
• comment text nullable  
• submitted_at timestamp nullable  
• created_at timestamp  
• updated_at timestamp

---

## report_metrics (Fancy statistics aggregates)
• id uuid (PK)  
• metric_date date  
• scope varchar(20) (global|widget|user|widget_user|department|widget_department)  
• widget_id uuid nullable (FK → widgets.id, cascade)  
• user_id uuid nullable (FK → users.id, cascade)  
• department_id uuid nullable (FK → departments.id, cascade)  
• metrics json  
• created_at timestamp  
• updated_at timestamp  
(Unique: metric_date + scope + widget_id + user_id + department_id)

---

## audit_logs (Logs: logins, chats, online visitors, locations)
• id uuid (PK)  
• actor_type varchar(50) (user|system)  
• actor_id uuid nullable  
• action varchar(50)  
• subject_type varchar(50) nullable  
• subject_id uuid nullable  
• ip varchar(64) nullable  
• user_agent text nullable  
• meta json nullable  
• created_at timestamp  
• updated_at timestamp

---

## user_devices (Push/Desktop notification tokens)
• id uuid (PK)  
• user_id uuid (FK → users.id, cascade)  
• provider varchar(20) (fcm|apns|webpush)  
• token text  
• device_name varchar(255) nullable  
• last_seen_at timestamp nullable  
• created_at timestamp  
• updated_at timestamp

---

## ai_requests (optional, Prism-powered AI actions)
• id uuid (PK)  
• user_id uuid nullable (FK → users.id, set null)  
• conversation_id uuid nullable (FK → conversations.id, cascade)  
• action varchar(30) (draft|summary|tags|translate|bot_reply)  
• provider varchar(50) nullable  
• model varchar(80) nullable  
• status varchar(20) default 'success' (success|failed|pending)  
• prompt_tokens int unsigned default 0  
• completion_tokens int unsigned default 0  
• cost decimal(10,4) nullable  
• input json nullable  
• output json nullable  
• error text nullable  
• created_at timestamp  
• updated_at timestamp

---

# Auth + System tables

## personal_access_tokens (Sanctum)
(use the package migration, ensure UUID keys)

---

## notifications (Laravel DB notifications)
(use the package migration, ensure UUID keys)

---

# Laratrust tables (roles/permissions)
Laratrust creates:
(use the package migration)

IMPORTANT:
• Ensure morph keys align to UUID via `Schema::morphUsingUuids()`.

---
