---
slug: phase-d2-ai-admin-ui
created: 2026-04-19
updated: 2026-04-19
completed: 2026-04-19
status: completed
---

## Outcome — GATE: PASS

Frontend agent delivered an admin UI for the entire AI layer. See frontend task file at `/Users/benny/Documents/react/livedesk-admin/.ai/TASKS/completed/ai-admin-ui.md`.

### Shipped (frontend repo)
- `src/features/ai-agents/` — typed API layer + TanStack Query hooks + 7 feature components (`AgentCard`, `AgentForm`, `AgentChannelAttachments`, `HandoffPolicyEditor`, `ProviderModelPicker`, `KnowledgeUploader`, `KnowledgeTable`)
- 4 new pages routed into the admin app — `AiAgents`, `AiAgentDetails` (5 tabs: Overview / Instructions / Channels / Training / Handoff), `AiCredits`, `AiSystemInstruction`
- `usePermissions` hook reading `/me.permissions[]`, sidebar menu gated per permission
- Design language carried from the widget redesign: rounded-2xl cards, emerald/rose/slate status badges, hero balance with glow, drag-drop file zone, auto-polling while sources are `processing`
- `tsc --noEmit` clean; dev server on port 3004 verified against live Herd backend then killed

### Backend follow-ups — 2 fixed, 2 dismissed

1. **FIXED — knowledge upload returned 500 under sync queue** when embedding provider errored. Wrapped `KnowledgeIndexer::index()` in a top-level try/catch inside `IndexKnowledgeSourceJob` — the indexer already records `status=failed` + `last_error`, so swallowing the exception means (a) sync queue doesn't bubble it to the HTTP response, (b) failed sources surface through status not retry loops. Owner clicks Reindex to retry. File: [IndexKnowledgeSourceJob.php](app/Jobs/Ai/IndexKnowledgeSourceJob.php).
2. **FIXED — `composer setup` skipped seeding** so fresh installs lacked `ai.system_instruction` (and every other seeded setting). Added `@php artisan db:seed --force` to the `setup` script in [composer.json](composer.json).
3. **DISMISSED — no global `/admin/channels` list endpoint.** The agent aggregates channels from `/inboxes` which scales fine for the expected per-install agent counts. Not worth a new endpoint.
4. **DISMISSED — `knowledgeSources` vs `knowledge_sources` key drift.** Agent already normalizes client-side. Backend is canonical (`knowledgeSources` via the relation eager-load).

### Self-Review Gate
- Frontend CLAUDE.md + `/dev-guideline` obeyed by the delegated agent ✓
- Zero backend files touched from the frontend session ✓
- 2 real backend bugs fixed here ✓
- Backend full suite: 167 tests / 435 assertions green after the fixes ✓

**GATE: PASS**

---

# Phase D2 — AI Admin UI (delegated to frontend agent)

## Why
Phase D landed the AI backend. Owners now need a UI to create agents, attach them to channels, upload training material, and view the credit ledger. Per `CLAUDE.md` rules frontend work happens inside `/Users/benny/Documents/react/livedesk-admin`, driven by a dedicated agent reading that repo's own `CLAUDE.md` first.

## Backend contract (frozen — do not change from the frontend)

All endpoints require `Authorization: Bearer <sanctum_token>`. Responses follow the envelope `{ success, data, message }`.

### Agents
- `GET /api/v1/admin/ai-agents` → list with `channels:[{id,name, pivot.is_primary}]`
- `POST /api/v1/admin/ai-agents` — `{ name, identity_persona?, welcome_message?, custom_instructions?, provider?, model?, temperature?, is_active?, handoff_policy? }`
- `GET /api/v1/admin/ai-agents/{agent}` → includes `channels` + `knowledgeSources`
- `PUT /api/v1/admin/ai-agents/{agent}` — partial update
- `DELETE /api/v1/admin/ai-agents/{agent}` — soft delete
- `POST /api/v1/admin/ai-agents/{agent}/channels/{channel}` — `{ is_primary: bool }` (only one primary per channel enforced server-side; others demoted automatically)
- `DELETE /api/v1/admin/ai-agents/{agent}/channels/{channel}` — detach

Recommended length caps (server-enforced):
- `custom_instructions` ≤ 4000 chars
- `identity_persona` ≤ 500 chars
- `welcome_message` ≤ 300 chars

### Knowledge (training)
- `GET /api/v1/admin/ai-agents/{agent}/knowledge` → list sources with `status` (`processing|ready|failed`), `chunk_count`, `token_count`, `last_indexed_at`, `last_error`
- `POST /api/v1/admin/ai-agents/{agent}/knowledge` — **multipart** when `type=pdf`, otherwise JSON.
  - `{ name, type: 'pdf'|'text'|'url' }` plus one of:
    - `file` (pdf, ≤ 20 MB) when type=pdf
    - `raw_text` (up to 500k chars) when type=text
    - `source_url` (http(s)) when type=url
- `GET /api/v1/admin/ai-agents/{agent}/knowledge/{source}` → single source detail
- `DELETE /api/v1/admin/ai-agents/{agent}/knowledge/{source}` — removes source + chunks
- `POST /api/v1/admin/ai-agents/{agent}/knowledge/{source}/reindex` — re-queues indexing, resets status

### Credits
- `GET /api/v1/admin/ai-credits` → `{ balance: int, monthly_refill: int, last_refilled_at, ledger: [...] }`
- `POST /api/v1/admin/ai-credits/grant` — `{ amount: int > 0, note?: string }`

### App-level system instruction (global, autoloaded into every agent prompt)
- `GET /api/v1/admin/settings` → the full list; filter on `key === 'ai.system_instruction'`.
- `PUT /api/v1/admin/settings/{key}` — `{ value: string }`. Key to use: `ai.system_instruction`.

### Permissions
Users need `ai.agents.manage`, `ai.knowledge.manage`, `ai.credits.manage` (and `system.settings.update` for the global instruction). Already granted to admin role; agent role will see 403.

## Smoke-test requirement
Spin up the Vite dev server on port 3004, run through: create agent → attach to channel as primary → upload a text training source → see status flip via polling / refresh → view credit balance → grant credits → edit the global system instruction. Kill the dev server after.

## Frontend agent output
This file will be updated with the agent's summary, files-changed list, and gate result once it reports back.
