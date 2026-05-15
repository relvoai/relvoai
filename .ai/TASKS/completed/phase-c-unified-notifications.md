---
slug: phase-c-unified-notifications
created: 2026-04-18
updated: 2026-04-18
completed: 2026-04-18
status: completed
---

## Outcome — GATE: PASS

Full suite: **142 passed / 363 assertions**. Phase C adds 14 new tests (5 notification + 9 Me endpoints). Zero regressions.

### Shipped
- [2026_04_18_174024_create_notifications_table.php](database/migrations/2026_04_18_174024_create_notifications_table.php) — Laravel's default notifications table with `uuidMorphs` (User is UUID-keyed).
- [2026_04_18_174043_add_telegram_to_users_table.php](database/migrations/2026_04_18_174043_add_telegram_to_users_table.php) — `telegram_bot_token` (encrypted text) + `telegram_chat_id` (64).
- [User.php](app/Models/User.php) — fillable + hidden + `encrypted` cast + `routeNotificationForTelegram()` returning `['bot_token', 'chat_id']` or `null`.
- [TelegramChannel.php](app/Notifications/Channels/TelegramChannel.php) — custom channel that reuses the existing `TelegramService`; silently skips when route is `null`.
- [NewConversationMessage.php](app/Notifications/NewConversationMessage.php) — queued notification with `toMail`, `toArray`, `toTelegram`; channels = `mail + database + broadcast` (+ `TelegramChannel` when configured).
- Dispatch hooks in [WidgetMessageController.php](app/Http/Controllers/Api/V1/Widget/WidgetMessageController.php) and [WidgetAttachmentController.php](app/Http/Controllers/Api/V1/Widget/WidgetAttachmentController.php) — fire only when `conversation.assignedTo` exists.
- [MeController.php](app/Http/Controllers/Api/MeController.php) with 5 self-service endpoints:
  - `GET  /api/v1/me/notification-settings`
  - `PUT  /api/v1/me/notification-settings` (validates the bot token against Telegram's `getMe` before saving)
  - `GET  /api/v1/me/notifications`
  - `POST /api/v1/me/notifications/{id}/read`
  - `POST /api/v1/me/notifications/read-all`

### Key design decisions (why, not what)
- **No community Telegram package pulled in.** The existing `TelegramService::sendMessage()` already wraps Telegram Bot API for webhooks; wrapping it in a one-method custom channel keeps the dep list lean and avoids config/publish overhead.
- **Per-user bot, not global.** User spec: "users can setup their telegram add bot token and chat id". Each user supplies their own bot + chat — `routeNotificationForTelegram()` returns that pair; `TelegramChannel` respects it.
- **Broadcast is automatic.** Laravel broadcasts DB notifications on `App.Models.User.{id}` private channel with zero extra wiring. Frontend bell UI (future work) subscribes via Echo.
- **Notification is `ShouldQueue`.** Runs async in prod (`QUEUE_CONNECTION=database` in env.example); no email or Telegram latency blocks the visitor's message POST response.
- **Bot token is encrypted at rest** via Eloquent's `encrypted` cast + hidden from serialization.

### Self-Review Gate
1. Tests pass — 142/142 green ✓
2. Boost + dev-guideline invoked; 13.x docs fetched for routing + custom channel patterns ✓
3. No new composer deps ✓
4. No over-engineering — only one notification class shipped; extension path documented ✓
5. Scratch clean, Pint clean ✓

**GATE: PASS**
---

# Phase C — Unified Notifications (email + in-app + telegram)

## Why
User spec: "Notification is email + telegram, telegram very important, users can setup their telegram add bot token and chat id, to get any message that goes to email. in app is good, using laravel Notification properly so we can extend from their".

## Design (confirmed via Laravel Boost / Laravel 13 notifications docs)

**Channels**
- `mail` (first-party)
- `database` (first-party) — persists to `notifications` table for in-app feed
- `broadcast` (first-party) — Laravel auto-broadcasts DB notifications on `App.Models.User.{id}` private channel; frontend subscribes and lights up the bell in real time. No extra work beyond declaring `broadcast` in `via()`.
- Custom `telegram` channel — uses the **existing** `App\Services\Telegram\TelegramService::sendMessage($botToken, $chatId, $text)`. No new composer package. Per-user bot token + chat id (user brings their own bot, as specified).

**Per-user routing**
- `routeNotificationForTelegram()` on `User` returns `['bot_token' => ..., 'chat_id' => ...]` or `null` when not configured. Our custom `TelegramChannel` skips silently when `null`.
- `routeNotificationForMail()` uses existing `email` column.

**User settings shape**
- `users.telegram_bot_token` — encrypted cast (stored as encrypted text)
- `users.telegram_chat_id` — string
- Managed via a new `PUT /api/v1/me/notifications` endpoint (self-service; no admin permission required).

**First notification shipped**
- `NewConversationMessageNotification` — fired when a visitor message arrives in a conversation that has an assignee (`assigned_to_user_id`). Channels: `['mail', 'database', 'broadcast']` + `'telegram'` when the user has configured it. Payload contains conversation id, visitor name, truncated message body, link to the conversation.

**Extension path**
- Each future event (new conversation, transfer, rating, etc.) becomes its own `App\Notifications\*` class — they all ride the same four channels. That's why we use Laravel's first-party Notification system: per user's "using laravel Notification properly so we can extend from their".

## Checklist
- [ ] Migration — `notifications` table (Laravel make:notifications-table, with UUID morphs)
- [ ] Migration — add `telegram_bot_token` + `telegram_chat_id` to `users` table
- [ ] User model — cast `telegram_bot_token` as `encrypted`; add `routeNotificationForTelegram()` + `routeNotificationForMail()` if needed
- [ ] `App\Notifications\Channels\TelegramChannel` — custom channel using existing `TelegramService`
- [ ] `App\Notifications\NewConversationMessage` — fires via mail + database + broadcast + telegram
- [ ] Hook — dispatch from `WidgetMessageController::store` (and attachment controller) when conversation has an assignee
- [ ] Self-service settings endpoint — `PUT /api/v1/me/notifications` + validation form request
- [ ] In-app feed endpoints — `GET /api/v1/me/notifications` + `POST /api/v1/me/notifications/{id}/read` + `POST /api/v1/me/notifications/read-all`
- [ ] Tests — notification dispatched, channels selected correctly, mail assertion, database persisted, telegram called, user settings round-trip, feed endpoints
- [ ] Full Pest suite green
- [ ] Self-review gate → move to `completed/`

## Scope boundaries (no over-engineering)
- One notification class shipped now. Other events (transfer, rating, new conversation without assignee, etc.) are NOT built in this phase — they're trivial to add once infrastructure is in place.
- No frontend bell UI in this phase — backend only; frontend agent work would be Phase C2 if user wants.
- No push notifications (browser / mobile) — out of scope per user's "email + telegram, in-app" spec.

## Files Changed
(tracked as we go)
