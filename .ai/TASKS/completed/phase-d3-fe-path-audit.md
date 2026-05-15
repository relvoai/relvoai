---
slug: phase-d3-fe-path-audit
created: 2026-04-19
updated: 2026-04-19
completed: 2026-04-19
status: completed
---

## Outcome — GATE: PASS

Frontend agent (cwd inside `/Users/benny/Documents/react/livedesk-admin`) audited every critical admin flow and fixed the FE-side bugs. Frontend task: `/Users/benny/Documents/react/livedesk-admin/.ai/TASKS/completed/admin-path-audit.md`.

### Root cause of "stuck on assign team"
`useCreateInbox` was typed as returning `string` (inbox id), but `POST /api/v1/inboxes` returns `{ inbox, channel }`. `InboxCreate.tsx` stored the whole object under `createdInboxId` and used it as the `:id` URL segment for `PUT /inboxes/:id/agents` — the call silently 404'd. FE now reads `result.inbox.id` and surfaces the real backend message via a new `src/core/http/error.ts` helper.

### Other FE bugs the agent fixed in place
- Conversation reply was sending `is_internal` (the backend expects `is_note`).
- Conversation transfer was sending `user_id` (backend expects `to_user_id`).
- Users page was still on the mock service; real payload required `roles: string[]` (names, not ids) + `password_confirmation`.
- Auth checks used a `user.role` string that doesn't exist on the backend — replaced with `user.roles[]` + `user.permissions[]` via the `usePermissions` hook.
- Contacts page had dead pagination plumbing that expected a `meta` key the old envelope never produced.
- Missing `onError` surfacing across Productivity / Automation / Departments.

### Verified working (no changes)
login, dashboard, channel details, conversation list + close + join + leave, canned replies, departments, bot rules, ratings, reports, AI agents + knowledge + credits + system instruction, settings, audit logs, roles, visitors, widget preview.

### Backend follow-ups — fixed here
1. **`GET /channel-types` was unwrapped** — every other endpoint uses `{ success, data, message }`; this one returned a bare array. Fixed in [ChannelTypeController.php](app/Http/Controllers/Api/V1/ChannelTypeController.php) + updated [InboxTypeTest.php](tests/Feature/Api/V1/InboxTypeTest.php) to assert the new envelope.
2. **Pagination lost its `meta` / `links`** — the old `ApiController::success()` wrapped a `ResourceCollection` under `data`, double-nesting and obscuring pagination. Rewrote [ApiController.php](app/Http/Controllers/Api/ApiController.php) to detect paginators and splice `data` / `meta` / `links` into the envelope at the top level so the FE can page past row 20. Updated [MeNotificationsTest.php](tests/Feature/Api/MeNotificationsTest.php) to assert the new shape.

### Backend follow-ups — dismissed (not real bugs)
- **`priority` enum drift**: backend schema is `low|normal|high|urgent` with `normal` default, matching the migration. FE's type `'low' | 'medium' | 'high'` is a FE-side type update — not a backend concern.
- **`DELETE /admin/users/{own_id}` returns 400 "You cannot delete yourself."**: expected guard. FE now surfaces the message correctly.

### Self-Review Gate
1. Frontend agent obeyed its CLAUDE.md, invoked `/dev-guideline`, scratch clean ✓
2. No backend files touched from the FE session ✓
3. 2 real backend follow-ups fixed here; tests updated to match ✓
4. Full suite: **167 tests / 445 assertions** (up from 435 — added pagination envelope assertions) ✓
5. Pint clean ✓

**GATE: PASS**

# Phase D3 — Frontend path audit + fixes

## Why
User report: "the frontend has lots of broken path; can't even create a channel, got stuck on assign team; and many other failing paths". Delegating a comprehensive audit + fix pass to a frontend agent inside `/Users/benny/Documents/react/livedesk-admin`.

## Backend state (authoritative)
- Laravel 13.5.0, Postgres 17, all 167 tests green.
- 82 routes under `/api/v1`, listed in [routes/api.php](routes/api.php).
- `GET /me` returns `{ data: { id, first_name, last_name, email, permissions: [...], roles: [...] } }`.
- All admin endpoints gated by Laratrust permissions (403 when missing).

## Agent output
This file will be updated with the agent's summary, files-changed list, backend follow-ups, and gate once reported.
