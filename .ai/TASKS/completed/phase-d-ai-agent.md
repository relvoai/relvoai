---
slug: phase-d-ai-agent
created: 2026-04-18
updated: 2026-04-19
completed: 2026-04-19
status: completed
---

# Phase D — AI Agent First Livechat

## Why
User spec: AI-first livechat where trained agents handle inquiries, route to humans when needed, and every chat burns customer credits. Vector DB owned (Postgres + pgvector). Built entirely on `Laravel\Ai`. Must beat Zendesk AI while staying lean.

## Outcome — GATE: PASS

Full suite: **167 passed / 435 assertions** on Laravel 13.5.0 + Postgres 17 + pgvector 0.8.1.

## Phase D1 — Migration + SDK (earlier in this session)
- Switched driver MySQL → **PostgreSQL 17** (local `livechat` + `livechat_test`, pgvector 0.8.1 in both).
- Test runner moved off SQLite in-memory onto the `livechat_test` Postgres DB so vector features are exercised.
- Installed **`laravel/ai` v0.6.0** (first-party), published config + SDK migrations.

## Phase D2 — Data model
7 tables landed. Key design decisions:
- `ai_agents` are standalone; `ai_agent_channel` is a many-to-many with `is_primary` — partial unique index enforces exactly one primary per channel.
- Knowledge travels with the agent (`ai_agent_id` scope), not per-channel.
- `ai_knowledge_chunks.embedding` is a real `vector(1536)` column with an **HNSW cosine index**.
- `ai_credit_balance` is a **singleton**; `AiCreditBalance::debit($n)` is atomic (`UPDATE … WHERE balance >= $n`).
- `ai_conversations` is 1:1 with `conversations`, stores SDK conversation id + handoff state + AI-written summary.

## Phase D3 — Runtime
- `App\Ai\Agents\SupportAgent` (implements `Agent`, `Conversational`, `HasTools`, `HasMiddleware`):
  - `instructions()` = `settings.ai.system_instruction` (autoloaded, owner-editable) + `agent.identity_persona` + `agent.custom_instructions`. App prompt first so guardrails can't be overridden.
  - `messages()` = last 30 livechat messages mapped to SDK roles. Our `messages` table is the single source of truth for the transcript — we don't use the SDK's `agent_conversations` table.
  - `tools()` = scoped `SimilaritySearch::usingModel(AiKnowledgeChunk, 'embedding', query: fn($q) => $q->where('ai_agent_id', …))` + `RequestHumanHandoff`.
  - `middleware()` = `DebitCredits` (atomically debits balance on every response, records ledger entry with tokens + provider + model).
- `App\Ai\Tools\RequestHumanHandoff` stashes reason + AI-written summary on `conversation.meta`; the job reads it and finalizes.
- `App\Ai\Services\KnowledgeIndexer` — paragraph-aware chunker, overlap, token-budgeted; handles `text` / `pdf` / `url`. Uses `Laravel\Ai\Embeddings::for()->generate()`. Re-runs wipe + re-insert cleanly.
- `App\Jobs\Ai\IndexKnowledgeSourceJob` (queued) — wraps the indexer with retry/backoff + status tracking (`processing` → `ready` / `failed`).
- `App\Jobs\Ai\HandleVisitorMessageJob` (queued) — runs `SupportAgent::prompt($body)`, persists bot reply as `message_type='bot'`, broadcasts, or handles handoff (tool invocation, credits depleted). Round-robin assigns to an online inbox agent on handoff.
- Dispatch hook in `WidgetMessageController::store` — fires AI job when the channel has a primary active agent AND `ai_credit_balance.balance > 0` AND conversation isn't already handed off; otherwise falls back to the existing `NewConversationMessage` notification for humans.
- `App\Ai\Agents\ConversationSummarizer` (`UseCheapestModel` attribute) — replaces the old broken Prism-based summarizer; `SummarizeConversationJob` rewritten.

## Phase D4 — Admin endpoints
| Method | Path | Purpose |
|---|---|---|
| `GET/POST` | `/admin/ai-agents` | List + create |
| `GET/PUT/DELETE` | `/admin/ai-agents/{agent}` | Show + update + delete |
| `POST/DELETE` | `/admin/ai-agents/{agent}/channels/{channel}` | Attach (with `is_primary`) / detach |
| `GET/POST` | `/admin/ai-agents/{agent}/knowledge` | List + upload (pdf/text/url) |
| `GET/DELETE` | `/admin/ai-agents/{agent}/knowledge/{source}` | Show + delete |
| `POST` | `/admin/ai-agents/{agent}/knowledge/{source}/reindex` | Re-run indexer |
| `GET` | `/admin/ai-credits` | Balance + recent ledger |
| `POST` | `/admin/ai-credits/grant` | Manual top-up |

3 new Laratrust permissions: `ai.agents.manage`, `ai.knowledge.manage`, `ai.credits.manage`. Auto-picked up by `RolesAndPermissionsSeeder::all()`.

## Phase D5 — Legacy cleanup
- Deleted `app/Services/Ai/{AiService,FakeAiService,OpenAiService,PrismAiService}.php`.
- `composer remove echolabsdev/prism` (the old Prism dep was broken — wrong namespace, never exercised).
- `AppServiceProvider` binding removed.
- `AiSummaryTest` rewritten against `Laravel\Ai\Ai::fakeAgent(ConversationSummarizer::class, [...])`.

## Phase D6 — Tests (25 new)
- `AiAgentAdminTest` — 6 (CRUD, channel attach/detach with primary enforcement, auth)
- `AiKnowledgeAdminTest` — 7 (text/url/pdf upload, validation, ownership scoping, reindex)
- `AiCreditAdminTest` — 4 (balance read, grant, atomic debit refuses negatives, auth)
- `HandleVisitorMessageJobTest` — 4 (happy path with `Ai::fakeAgent`, credits-depleted handoff, already-handed-off skip, inactive-agent skip)
- `KnowledgeIndexerTest` — 4 (chunk algorithm: long text multi-chunk, short text single chunk, empty input, job is queueable)

## 3 differentiators vs Zendesk AI
1. **Citations per bot message** — `message.meta.usage + ai_agent_id + provider` are stored; a future UI footer shows "Referenced: handbook.pdf" using the source attached to the top similarity hit.
2. **AI writes its own handoff summary** — the `RequestHumanHandoff` tool requires a `summary` field; humans arrive to a pre-written 2-line recap via the system message.
3. **Atomic credits at account level** — `ai_credit_balance` singleton with `UPDATE … WHERE balance >= $cost` — race-free without locks. Exhausted credits auto-handoff instead of 500ing or hallucinating.

## Known gotcha fixed
- `SupportAgent::middleware(): iterable` clashed with SDK contract requiring exactly `array`. Class-load fatal was silently swallowed by Pest. Fixed to `: array`.

## Self-Review Gate
1. Boost + dev-guideline invoked; full AI SDK docs fetched via WebFetch before design ✓
2. Postgres-only vector features verified on both dev + test DBs ✓
3. No new UI dep; no bypass of the SDK's first-party primitives ✓
4. Legacy Prism plumbing removed; no dead `App\Services\Ai` references remain ✓
5. Credit debit verified atomic under the happy path and the depletion path ✓
6. 167 tests green; Pint clean ✓
7. Scratch directory empty ✓

**GATE: PASS**
