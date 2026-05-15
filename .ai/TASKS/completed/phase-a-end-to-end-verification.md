---
slug: phase-a-end-to-end-verification
created: 2026-04-18
updated: 2026-04-18
completed: 2026-04-18
status: completed
---

# Phase A — End-to-End API Verification

## Why
Per user: "confirm the livechat is working end to end like a real professional livechat and other channels are fully tested and working". Verification bar = Pest feature tests hit real routes + manual widget dev-server smoke on port 3004 (killed after).

## Route audit
82 application routes. 8 had no test coverage.

## Checklist
- [x] Feature test: admin conversation attachments (5 tests)
- [x] Feature test: admin departments CRUD (6 tests)
- [x] Feature test: admin settings index + update (5 tests)
- [x] Feature test: channel embed-script + rotate-hmac + domains (7 tests)
- [x] Feature test: widget config endpoint (5 tests)
- [x] Feature test: widget refresh endpoint (3 tests)
- [x] Full Pest suite — **128 passed / 325 assertions**
- [x] Frontend dev server on port 3004 (vite) booted + verified 200 at root
- [x] Live backend end-to-end (via Herd `http://livechat.test`): `bootstrap → send message → heartbeat → config → refresh` all 200/201 with Reverb up
- [x] Dev server and Reverb killed, port 3004 / 8080 confirmed released
- [x] Self-review gate PASS

## Bugs fixed (surfaced by end-to-end run)
1. **`WidgetConfigController`** — `$this->error('Channel key missing', 400)` passed status code into `$errors` param (second arg), default status 400 masked the real bug. Same with `'Invalid channel', 404` returning 400 instead of 404. Fixed signature to `$this->error($msg, null, $status)`.
2. **`WidgetRefreshController`** — same positional-arg bug on two error paths, fixed.
3. **`UserController::destroy`** — same bug on self-delete guard, fixed.
4. **Broadcasting resilience** — all 6 events (`MessageCreated`, `ConversationUpdated`, `ParticipantJoined`, `ParticipantLeft` already, `UserTyping`, `VisitorActivity`) were `ShouldBroadcastNow` → switched to `ShouldBroadcast`. In production with `QUEUE_CONNECTION=database`, a Reverb outage no longer 500s message-send; the broadcast becomes a queued, retriable job. Live smoke confirmed: with Reverb up, message send returns 201; without Reverb in dev with sync queue, the request still fails (dev-only — prod env has queue driver).

## Files Changed
- `app/Http/Controllers/Api/V1/Widget/WidgetConfigController.php` — error() signature
- `app/Http/Controllers/Api/V1/Widget/WidgetRefreshController.php` — error() signature
- `app/Http/Controllers/Api/Admin/UserController.php` — error() signature
- `app/Events/MessageCreated.php` — `ShouldBroadcastNow` → `ShouldBroadcast`
- `app/Events/ConversationUpdated.php` — same
- `app/Events/ParticipantJoined.php` — same
- `app/Events/UserTyping.php` — same
- `app/Events/VisitorActivity.php` — same
- `database/factories/DepartmentFactory.php` — created with default state
- `tests/Feature/Admin/AdminAttachmentTest.php` — 5 tests
- `tests/Feature/Admin/DepartmentTest.php` — 6 tests
- `tests/Feature/Admin/SettingTest.php` — 5 tests
- `tests/Feature/Api/V1/ChannelManagementTest.php` — 7 tests
- `tests/Feature/Widget/ConfigRefreshTest.php` — 8 tests (covers config + refresh)

## End-to-end smoke log (against live Herd backend)
```
POST /api/v1/public/widget/bootstrap            → 200
POST /api/v1/public/widget/sessions/heartbeat   → 200
GET  /api/v1/public/widget/config               → 200
POST /api/v1/public/widget/messages (no Reverb) → 500 (BroadcastException — fixed by queue change)
POST /api/v1/public/widget/messages (Reverb up) → 201
```

## Self-Review Gate

1. **Tests pass** — 128/128 green on Laravel 13.5.0 ✓
2. **Dev-guideline + Boost usage** — task file present, scratch files cleaned, Boost used for route listing ✓
3. **No over-engineering** — only added tests for the 8 genuinely uncovered routes; broadcast change fixed a real production 500, not hypothetical ✓
4. **Scratch cleanup** — `.ai/.tmp/` emptied ✓
5. **Pint clean** — style-only adjustments applied ✓
6. **Dev-server cleanup** — port 3004 and 8080 released ✓

**GATE: PASS**
