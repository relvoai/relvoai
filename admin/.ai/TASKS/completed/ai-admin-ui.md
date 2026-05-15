---
created: 2026-04-18
updated: 2026-04-18
completed: 2026-04-18
status: completed
---

# AI Admin UI — agents, training, credits, global system instruction

## Why

Backend AI layer landed; owners need an admin surface to:

- Create / edit / delete AI agents (name, identity, persona, welcome, custom_instructions, provider/model, temperature, is_active, handoff_policy)
- Attach agents to channels (with `is_primary` exclusivity per channel)
- Train agents: upload PDFs, paste text, paste URLs; view indexing status; re-index; delete sources
- View credit balance + ledger and grant manual top-ups
- Edit the app-level system instruction (Settings row `ai.system_instruction`)

## Scope (shipped)

All backend endpoints live at `/api/v1/admin/…` (Sanctum Bearer). Frontend uses the shared `client` wrapper and matches the repo's `features/{domain}/api.ts` convention.

## Files added / changed

### API layer
- `src/core/http/endpoints.ts` — added `aiAgents.*` and `aiCredits.*` endpoint groups
- `src/features/ai-agents/api.ts` — types (AiAgentResource, AiKnowledgeSourceResource, AiCreditSummary…), query keys, TanStack Query hooks for agents / knowledge / credits. Multipart POST for PDF uploads goes through `axiosInstance` directly so `Content-Type` can be overridden; all other calls use `client`.
- `src/hooks/usePermissions.ts` — new `usePermissions()` returning `can`, `canAny`, `isAdmin` driven off the persisted `/me` payload's `permissions[]`.
- `src/types.ts` — extended `UserResource` with optional `roles`, `permissions`.

### Feature components (`src/features/ai-agents/components/`)
- `AgentCard.tsx` — list card (avatar, provider/model, active pill, channel chips with primary star, delete action).
- `AgentForm.tsx` — create + edit form, RHF + inline rules, character counters for persona/welcome/instructions, temperature slider, active toggle, provider+model picker.
- `AgentChannelAttachments.tsx` — aggregates channels from all inboxes (backend has no global channel list), attach / detach / promote-to-primary.
- `HandoffPolicyEditor.tsx` — "never / on_low_confidence / on_keyword" switch, confidence slider, keyword chips, handoff message.
- `ProviderModelPicker.tsx` — provider tiles (OpenAI, Anthropic, Groq, Google) + free-text model input with suggestion chips.
- `KnowledgeUploader.tsx` — PDF drag/drop (20 MB cap), text (500k char cap), URL tabs. Validates client-side before POST.
- `KnowledgeTable.tsx` — status-badge list (processing/ready/failed, polls `useKnowledgeSources` every 5s while any source is processing), reindex + delete per row, last_error tooltip.

### Pages
- `src/pages/AiAgents.tsx` — list grid + empty state + create modal wrapping `AgentForm`.
- `src/pages/AiAgentDetails.tsx` — tabs: Overview (editable form), Instructions (editor + stack explainer), Channels, Training (uploader + table), Handoff.
- `src/pages/AiCredits.tsx` — hero balance card, ledger table, grant modal.
- `src/pages/AiSystemInstruction.tsx` — dedicated page editing Settings row `ai.system_instruction` (prepended to every agent prompt). Character counter + guardrail sidebar.

### Routing / navigation
- `App.tsx` — imported 4 new pages, registered `/ai/agents`, `/ai/agents/:id`, `/ai/credits`, `/ai/system-instruction`.
- `src/components/Layout.tsx` — added "AI" sidebar section with per-permission gating (`ai.agents.manage`, `ai.credits.manage`, `system.settings.update`). Only rendered when at least one permission is present.

## Verification (manual, run 2026-04-18)

- `tsc --noEmit` — clean (no new errors).
- `npm run dev -- --port 3004 --host 127.0.0.1` — Vite ready, all new modules hot-load without errors. Killed after test.
- Backend reachable: `curl http://livechat.test/up` → 200.
- Login as `admin@example.com` → token has `ai.agents.manage`, `ai.knowledge.manage`, `ai.credits.manage`, `system.settings.update`.
- Verified via curl each endpoint: list agents, create agent, show agent (with channels + knowledge_sources), attach channel as primary (pivot.is_primary = true), grant credits (balance 10000), update setting `ai.system_instruction`. All match the contract shapes the UI assumes.

## Backend follow-ups

1. **Settings table unseeded in dev**: `ai.system_instruction` row is missing after fresh migrate. Added manually via tinker for this test. The UI will 404 on save until the row exists. Recommend the `SettingsSeeder` always ensures this row (and any other AI rows) via `firstOrCreate`.
2. **Sync-queue + missing OpenAI key = 500 on knowledge create**: `AiKnowledgeController::store` dispatches `IndexKnowledgeSourceJob`. With `QUEUE_CONNECTION=sync` and no `OPENAI_API_KEY`, the job throws a 401 embeddings error that bubbles up *as* the controller's response. The source row IS persisted with `status=failed`, but the HTTP response is a 500 stack trace instead of 201. Options (backend):
   - Dispatch the job `afterResponse()`, OR
   - Catch `Throwable` inside the job and mark the source as failed (it already does this on `IndexKnowledgeSourceJob::failed`, but the sync-queue runs without failed-handler semantics), OR
   - Default `QUEUE_CONNECTION=database` in dev.
   The UI already renders the resulting `status=failed` row correctly once the source exists; the 500 simply prevents the optimistic UI feedback.
3. **No global channels list endpoint**: `AgentChannelAttachments` has to fan out through `GET /inboxes` (eager-loaded `channels`) to show pickable channels. If this admin surface grows, a dedicated `GET /admin/channels` would be cleaner.
4. **`GET /admin/ai-agents/{id}` key inconsistency**: Laravel's default relation snake-casing returns `knowledge_sources`, but the controller calls `->load('knowledgeSources')`, which (on Laravel 12) still serializes as `knowledge_sources`. Handled client-side via `normalizeAgent()` for both shapes to be safe.

## Self-review gate

Rules applied:
1. `No backend edits` — only seeded one Settings row via tinker for local testing; no code under `app/` changed.
2. `No new deps` — used existing packages only; avoided `@hookform/resolvers/zod` (not installed), followed repo's RHF + inline rules pattern.
3. `core/http/client + features/{domain}/api.ts` — endpoints defined in `endpoints.ts`, all reads/writes through `client` (multipart POST uses `axiosInstance` directly because `client` hard-codes JSON content-type).
4. `Server state = TanStack Query; no useEffect fetches` — every network call is a `useQuery`/`useMutation`. Polling uses `refetchInterval` option on `useKnowledgeSources`.
5. `No `any`; files under 400 lines` — largest new file (`AgentForm.tsx`) is 232 lines; `api.ts` is 340 lines; no `any` casts.

PASS / FAIL per rule:
- Rule 1 — PASS (no backend code edits; one tinker-seeded Setting row is a dev-data seed, not a code change).
- Rule 2 — PASS (no package.json change).
- Rule 3 — PASS.
- Rule 4 — PASS.
- Rule 5 — PASS (`tsc --noEmit` clean; largest file 340 lines).

**GATE: PASS**
