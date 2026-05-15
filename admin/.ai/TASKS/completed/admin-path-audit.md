---
created: 2026-04-18
updated: 2026-04-18
completed: 2026-04-18
status: completed
---

# Admin Path Audit — comprehensive broken-flow sweep

## Why

User reports: "the frontend has lots of broken path; can't even create a channel, got stuck on assign team; and many other failing paths". Comprehensive audit + FE-side fixes.

## Flow matrix (final)

| Flow | Status | Notes |
|------|--------|-------|
| Login → Dashboard | verified | `/login` returns `{ token, user }` with `roles[]`. Login form surfaces API error. |
| `/me` → user profile + permissions | verified | Backend returns `roles[]` + `permissions[]`. FE `usePermissions` now uses `roles` (no more `user.role`). |
| Create Inbox (POST /inboxes) | **fixed** | FE expected `string` id back, backend returns `{ inbox, channel }`. Fixed `useCreateInbox` return type and `InboxCreate.tsx` to `result.inbox.id`. This was the root cause of "stuck on assign team". |
| Assign team (PUT /inboxes/:id/agents) | **fixed** | Once the inbox id is captured correctly, the PUT succeeds. Surface 422 errors inline on both the create flow and the agents tab of `InboxDetails`. |
| Add channel to existing inbox | **fixed** | `InboxDetails.handleAddChannel` now includes `config` (merged from type's `default_config`), handles `telegram.bot_token` and `api.webhook_url`, and shows the validation error from the backend (e.g. "Invalid Telegram bot token."). |
| Channel details edit | verified | `ChannelDetails.tsx` was already in good shape. |
| Conversation list + detail | verified | Backend `/admin/conversations` returns flat array. `useConversations` OK. |
| Reply to conversation | **fixed** | FE was sending `{ body, is_internal, message_type }`. Backend expects `{ body, is_note }`. Fixed `ReplyPayload` and `ConversationDetails.handleSendMessage`. |
| Transfer conversation | **fixed** | `TransferPayload` used `user_id` / `department_id`. Backend expects `to_user_id` / `to_department_id` / `note` (see `TransferConversationRequest.php`). Updated payload shape. |
| Close / join / leave conversation | verified | |
| Canned replies list/create/delete | verified (create now surfaces errors) | |
| Users CRUD | **fixed** | `Users.tsx` was still wired to the legacy `UserService` mock — never hit the API. Rewrote to use `useUsers / useCreateUser / useDeleteUser`, pull roles from `useRoles()`. Also fixed `CreateUserPayload`: backend expects `roles` (array of role **names**), `departments`, and `password_confirmation` (Laravel `confirmed` rule). Old payload used `role_ids` / `department_ids` — every create would 422. |
| Departments CRUD | verified (now surfaces errors) | |
| Bot rules list/create/delete/toggle | verified (create now surfaces errors) | |
| Ratings | verified | |
| Reports | verified | |
| AI agents list/create/delete | verified | |
| AI agent detail / channel attach / knowledge | verified | API layer matches backend contract. |
| AI credits | verified | |
| AI system instruction | verified | Reads/writes `ai.system_instruction` via settings. |
| Settings | verified | |
| Audit logs | verified | |
| Roles list | verified | |
| Contacts list/detail/notes/merge | **fixed** | Removed bogus `ContactsResponse` wrapper — backend's `success()` helper flattens paginated data to a plain array. Fixed `useCreateContact`, `useUpdateContact`, `useCreateContactNote`, `useMergeContact`, `useContactNotes`, `useContactConversations` to read `response.data` correctly. Removed `(data as any)?.meta` pagination math. |
| Visitors online | verified | |
| Widget preview | verified | |
| Blocked URLs | **backend-only route; no FE page** — logged as follow-up. |
| Notifications feed / settings | **backend route; no FE page** — logged as follow-up. |

## Files Changed (grouped)

### Core infra
- `src/core/http/error.ts` — **new** helper `extractApiError()` that pulls the first validation error / message / Axios error out of a mutation error. Used by all the mutations that now surface 422s inline.

### Auth / permissions
- `App.tsx` — `ProtectedRoute` adminOnly check now reads `user.roles` (array) instead of non-existent `user.role` string.
- `src/components/Layout.tsx` — sidebar uses `usePermissions().isAdmin`, footer shows `user.roles[0]`.
- `src/hooks/usePermissions.ts` — `isAdmin` derives from `roles.includes('admin' | 'owner')`.
- `src/types.ts` — `UserResource` aligned with backend `UserResource::toArray` (no `role` scalar; `roles[]`, `permissions[]`, plus nullable backend fields).
- `src/mocks/data.ts` — mock users now use `roles: [...]` to match the type.

### Inboxes / channels
- `src/features/inboxes/api.ts` — `useCreateInbox` returns `{ inbox, channel }` (was typed as `string`). `useCreateChannel` config typed as `Record<string, unknown>` (was `string[]`) and now invalidates the inbox list too.
- `src/pages/InboxCreate.tsx` — capture `result.inbox.id` (was assigning the whole object to `createdInboxId`, which silently broke step 3). Added `apiError` state + inline banner; added `onError` handlers for both create and assign mutations.
- `src/pages/InboxDetails.tsx` — `handleAddChannel` now merges `default_config` from the channel type registry, handles `telegram.bot_token` and `api.webhook_url`, and validates bot_token client-side. Inline error banner on the add-channel form and the agents tab. Reset field state after close.

### Conversations
- `src/features/conversations/api.ts` — reply payload: `is_note` (was `is_internal` + `message_type`, which silently broke all agent notes and made replies 422 in some configs). Transfer payload: `to_user_id` / `to_department_id` / `note` (was `user_id` / `department_id`). Reply mutation now invalidates the conversations list too.
- `src/pages/ConversationDetails.tsx` — `handleSendMessage` passes `is_note` instead of `is_internal` + hardcoded `message_type`.

### Users
- `src/pages/Users.tsx` — rewritten to use the real API (was stuck on `UserService.list()` mock). Form collects `password_confirmation`, selects role by **name** (backend validates against role names), surfaces errors, and deletes via real API.
- `src/features/users/api.ts` — `CreateUserPayload` / `UpdateUserPayload` now use `roles` (array of role names), `departments`, and `password_confirmation` per `StoreUserRequest`.

### Productivity / Automation / Departments
- `src/pages/Productivity.tsx`, `src/pages/Automation.tsx`, `src/pages/Departments.tsx` — each gets an inline `formError` banner and `onError` handler on its create/update mutations, so 422s are no longer silent.

### Contacts
- `src/features/contacts/api.ts` — dropped the incorrect `ContactsResponse` envelope; all hooks now read `response.data` (backend's `success()` already flattens). Same fix for notes / merge / conversations / create / update.
- `src/pages/Contacts.tsx` — removed `(data as any)?.meta` plumbing; pagination Next/Prev now keys off row count vs. page size.

## Backend follow-ups

Limited and surgical — the backend is mostly correct.

### 1. `AdminConversationResource.priority` enum mismatch (cosmetic)

- **FE request**: `GET /api/v1/admin/conversations`
- **Backend response** (observed): `"priority": "normal"`
- **FE type**: `priority: 'low' | 'medium' | 'high'`
- **Why it's a backend issue**: either the backend should stick to low/medium/high (which the FE assumes for styling) or the FE needs a widened enum. The FE side of this is one line but the docs / tests / seed should agree on the canonical set. Not breaking, but surfacing mixed data today.

### 2. `ChannelTypeController::index` returns a bare array instead of the standard envelope

- **FE request**: `GET /api/v1/channel-types`
- **Backend response**: `[ { type, label, ... }, ... ]` (no `{ success, data, message }`)
- **Why it's a backend issue**: every other endpoint is wrapped. FE has to special-case this one in `useChannelTypes` with an `as unknown as ChannelType[]` cast. Wrap it in `$this->success(...)` for consistency.

### 3. Admin list pagination shape is ambiguous

- **FE request**: `GET /api/v1/admin/conversations`, `GET /api/v1/admin/contacts`, `GET /api/v1/admin/canned-replies`, `GET /api/v1/admin/users`
- **Observed**: all four return `{ success, data: [...], message }` — a flat array. But the controllers all use `->paginate(20)` internally.
- **Why it's a backend issue**: `success(ResourceCollection::collection($paginator))` drops the Laravel pagination `links`/`meta` (the AnonymousResourceCollection gets serialized as an array because it's nested inside `data`). Either (a) commit to "no pagination meta on admin lists" and remove `->paginate()` in favor of `->get()`, or (b) return the pagination structure (e.g. call `->paginate(...)->toArray()` and pass that to `success`, or stop wrapping list endpoints). Right now pages like Contacts can't page past 20 safely because the FE has no way to know `last_page`. Low-severity — most lists are small — but the contract is currently a lie.

### 4. `DELETE /api/v1/admin/users/{id}` returns 400 when deleting self

- **FE request**: `DELETE /api/v1/admin/users/{own_id}`
- **Backend response**: `{"success":false,"message":"You cannot delete yourself.","errors":null}` with 400.
- **Why it's fine but noting**: the FE surfaces the message correctly now via `extractApiError`. No fix required; just flagging so the FE doesn't get a surprise when we start wiring the "deactivate" action on your own row.

## Evidence

- Direct curl against the real backend:
  - `POST /api/v1/inboxes` with `{ inbox, channel }` → 201, returns `{ inbox: { id }, channel: { id } }`. (Matches the new `CreateInboxResponse` type.)
  - `PUT /api/v1/inboxes/:id/agents` with `{ agent_ids: [...] }` → 200. (Matches the FE contract — user's initial claim that `user_ids` is required was incorrect; backend uses `agent_ids`.)
  - `POST /api/v1/inboxes/:id/channels` with `{ type: "telegram", name, config: {} }` → 422 `{"message":"Bot token is required for Telegram channels."}` — now rendered in the add-channel card instead of the button just spinning.
- `npx tsc --noEmit` clean across `src/` (remaining errors live in the prebuilt `dist/` bundle that isn't excluded by `tsconfig.json`).
- Dev server ran on `127.0.0.1:3004`, killed; `lsof -ti:3004` reports no listener.
- Scratch (`.ai/.tmp/dev-token`, `.ai/.tmp/dev.log`) cleaned up.

## Self-review gate

Project rules (top 5 that matter for this change):

1. **No backend edits** — PASS. All changes are under `/Users/benny/Documents/react/livedesk-admin/src/` + `App.tsx`. Backend findings are documented as follow-ups.
2. **All HTTP goes through `src/core/http/`** — PASS. No new `axios`/`fetch` call-sites; only new file is `src/core/http/error.ts`.
3. **TanStack Query for server state + invalidate after mutations** — PASS. Added `conversationKeys.all` invalidation on reply, `inboxKeys.all` on create channel, etc.
4. **No TypeScript `any`** — PASS in touched files. A few pre-existing `any` casts remain in `Contacts.tsx` table cells (untouched) but none were added.
5. **Files ≤ 400 lines** — PASS. `InboxDetails.tsx` is the biggest change and is still ~330 lines; `Users.tsx` is ~195 after rewrite.

**GATE: PASS**
