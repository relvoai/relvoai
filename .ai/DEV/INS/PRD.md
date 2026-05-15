Backend PRD — LiveChat API (Laravel 12, UUID, Laratrust, Prism)

1) Product Summary

Build a self-hosted Live Chat + Helpdesk backend that is purely API-based. One installation runs on a single domain (e.g. support.company.com) and can generate unlimited chat widgets embeddable on any external websites. All conversations are managed through APIs for operators/admins, and public widget APIs for visitors.

2) Goals
   •	Provide a complete REST API backend for:
   •	Widget embed runtime (public endpoints)
   •	Operator/admin management (protected endpoints)
   •	Realtime event delivery (websocket broadcasting)
   •	Support: departments, group chat, transfers, online visitors, bot auto replies, multi-language, logs, notifications, feedback, reporting foundations.
   •	Ship CodeCanyon-ready backend: stable, secure, well-documented, test-covered.

3) Non-Goals (V1)
   •	No UI work of any kind (no web views, no frontend).
   •	No SaaS multi-tenancy / billing.
   •	No heavy external integrations required (Slack, etc). Keep extensible.

4) Users, Roles, Permissions
   •	Admin: full control (users, roles/permissions, widgets, departments, settings, blacklists, bot rules, reports).
   •	Agent/Operator: handle conversations/messages/notes/transfers, manage personal macros, star messages.

RBAC:
•	Use Laratrust with roles admin, agent, plus granular permissions (20+).
•	All protected endpoints must enforce permissions using middleware/policies.

5) Technical Standards
   •	Laravel 12
   •	UUID-first everywhere (including morph columns).
   •	Sanctum personal access tokens for protected API authentication.
   •	CORS + Rate limiting for public widget endpoints.
   •	Realtime: Laravel Broadcasting + Reverb.
   •	AI module: implement via PrismPHP (optional feature; must not break if disabled).

6) Data Model

Use the final updated DB structure we agreed:
•	users, settings, widgets, widget_domains
•	departments, department_user, department_widget
•	contacts, visitors, visitor_sessions
•	conversations, conversation_participants, conversation_transfers
•	messages, message_attachments, message_stars
•	canned_replies, bot_rules, blocked_urls
•	ratings, report_metrics
•	audit_logs, user_devices
•	ai_requests
•	Laratrust tables, Sanctum tokens (UUID tokenable_id), notifications (UUID)

7) Core Workflows

7.1 Visitor identity & widget bootstrap
•	Public identify endpoint ensures a visitor_id (UUID) and stores metadata.
•	Enforces:
•	widget exists + active
•	domain restriction policy
•	URL blacklist
•	Returns widget runtime config + optional active conversation.

7.2 Conversation create/resume
•	Create conversation on first message or explicit start.
•	Resume logic: by visitor_id + widget_id with an open/pending conversation.

7.3 Messaging
•	Visitor sends messages via public endpoint.
•	Agents send messages via protected endpoint.
•	Message types: visitor | agent | system | note.
•	Support file uploads via message_attachments.
•	Prevent duplicate messages using client_message_id dedupe.

7.4 Assignment, transfers, group chat
•	Conversations have a current assignee (assigned_to_user_id) and assignment timestamps.
•	Group chat: multiple agents join/leave via conversation_participants.
•	Transfer: record history in conversation_transfers, update current assignee, emit event + log.

7.5 Live online visitors
•	Heartbeat endpoint creates/updates visitor_sessions.
•	“Online now” derived from sessions where last_activity_at is within configured window.

7.6 Bot auto answers until pickup
•	Bot rules can auto reply to visitor messages until an agent joins/picks up.
•	Bot replies stored as system messages with metadata indicating trigger and rule.

7.7 One-click language change
•	Default language stored in settings (app.locale).
•	Admin updates it via API; clients retrieve it via settings/config endpoints.

7.8 Feedback (CSAT)
•	After conversation closure, visitor submits rating (1–5) + optional comment.

7.9 Logs & audit trail
•	Persist important actions in audit_logs: login, message events, assignments, transfers, blacklist blocks, bot triggers, etc.

7.10 AI Assist (PrismPHP)
•	Optional endpoints:
•	draft reply
•	summarize conversation
•	suggest tags/priority
•	translate
•	All AI calls logged in ai_requests.
•	AI config stored in settings (enabled/provider/model/key).

8) API Surface (V1)

8.1 Protected API (Sanctum + Laratrust)
•	Auth:
•	GET /api/v1/me
•	(optional) POST /api/v1/auth/login, POST /api/v1/auth/logout
•	Users + permissions (admin):
•	manage users, roles, permissions
•	Settings (admin):
•	get/update settings, including language
•	Widgets (admin):
•	CRUD widgets, rotate widget_key, manage widget_domains
•	Departments (admin):
•	CRUD departments, assign users/widgets
•	Inbox:
•	list/filter conversations
•	view conversation details (messages, participants, contact/visitor snapshot)
•	assign/unassign
•	join/leave participant
•	transfer
•	close/reopen
•	add note
•	star/unstar messages
•	Canned replies:
•	CRUD + search
•	Bot rules + URL blacklist:
•	CRUD
•	Reports:
•	read metrics + export-ready JSON

8.2 Public Widget API (CORS + rate-limited)
•	POST /api/v1/public/widgets/{widget_key}/identify
•	POST /api/v1/public/widgets/{widget_key}/sessions/heartbeat
•	POST /api/v1/public/widgets/{widget_key}/conversations (create/resume)
•	GET  /api/v1/public/widgets/{widget_key}/conversations/{id}
•	GET  /api/v1/public/widgets/{widget_key}/conversations/{id}/messages
•	POST /api/v1/public/widgets/{widget_key}/conversations/{id}/messages
•	POST /api/v1/public/widgets/{widget_key}/conversations/{id}/attachments
•	POST /api/v1/public/widgets/{widget_key}/conversations/{id}/ratings

Public security rules:
•	Must verify visitor_id belongs to conversation.
•	Apply domain policy + blacklist.
•	Rate-limit by widget_key + IP (+ visitor_id where possible).

9) Realtime Events (Broadcast)

Emit/broadcast:
•	MessageCreated
•	ConversationUpdated (status, assignment, transfer)
•	ParticipantJoined / ParticipantLeft
•	VisitorSessionUpdated (optional, if you want realtime online list)

Channels restricted to authenticated staff.

10) Security Requirements
    •	Policies + Laratrust permission checks for protected endpoints.
    •	FormRequest validation everywhere.
    •	Strict CORS and rate limiting on public endpoints.
    •	File uploads: mime allowlist, size limits, storage abstraction.
    •	Avoid destructive cascades for visitor-linked message history (visitor_id should be nullOnDelete in messages/ratings).

11) Deliverables
    •	Laravel 12 API project with:
    •	migrations matching final DB spec
    •	Laratrust setup + seeders (roles + admin)
    •	Sanctum token auth + qa:token command for quick testing
    •	all endpoints implemented + documented
    •	broadcasting configured + events emitted
    •	full feature tests (smoke + auth + critical flows)
    •	installation documentation (env keys, queue, reverb, cors, seeding)

12) Acceptance Criteria
    •	Seeded admin exists and can authenticate via token.
    •	Admin can create widgets + set domain policy + departments.
    •	Public identify returns stable visitor identity and config.
    •	Visitor can create/resume conversation and send messages reliably (dedupe safe).
    •	Agent can reply, note, join/leave, transfer, assign, close/reopen.
    •	Online visitors list is accurate via heartbeat/session logic.
    •	URL blacklist blocks chat initiation when matched.
    •	Bot rules auto reply until pickup, then stop.
    •	Ratings can be submitted after closure.
    •	Logs recorded for key actions.
    •	Tests pass (php artisan test).

⸻

Milestone Tasklist (Backend Delivery Plan)

M0 — Foundation & Tooling
•	Laravel 12 project init
•	UUID rules enforced (models + morphs)
•	Install Sanctum + configure
•	Install Laratrust + configure
•	Setup broadcasting/reverb
•	Create qa:token artisan command
•	Create seeders: roles + admin
•	Create base response format + exception handler standard

M1 — Core Data & Auth APIs
•	Run migrations for: users, settings, widgets, widget_domains, departments + pivots
•	Protected endpoints: me, settings CRUD, user management basics
•	Permission middleware/policies established
•	Tests: auth + permissions

M2 — Public Widget Core (Identity + Conversations + Messages)
•	Migrations: contacts, visitors, visitor_sessions, conversations, messages, attachments
•	Public endpoints: identify, heartbeat, create/resume conversation, send message, fetch messages
•	Domain restriction + blacklist checks
•	Message dedupe via client_message_id
•	Tests: full visitor → conversation → message flow

M3 — Operator Conversation Ops (Assignment/Transfer/Group/Notes)
•	Migrations: conversation_participants, conversation_transfers
•	Protected endpoints: list/filter conversations, view, assign, close/reopen
•	Join/leave participant + system messages events
•	Transfer flow + logging
•	Tests: assign, transfer, group join/leave

M4 — Productivity Features
•	Migrations: canned_replies, message_stars, ratings
•	Endpoints: macros CRUD/search, star/unstar, submit rating
•	Operator history foundations: audit_logs endpoints
•	Tests: starred messages, ratings

M5 — Bot + Online Visitors + Reporting + AI (Optional)
•	Migrations: bot_rules, blocked_urls, report_metrics, user_devices, ai_requests
•	Bot rule execution on incoming visitor messages
•	Online visitors queries from visitor_sessions
•	Reports endpoints (aggregated reads; write jobs optional)
•	AI endpoints using PrismPHP + settings config + ai_requests logging
•	Tests: bot auto replies, blacklist blocks, online sessions, AI disabled path
