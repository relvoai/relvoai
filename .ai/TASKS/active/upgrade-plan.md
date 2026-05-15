---
slug: upgrade-plan
type: master-task
created: 2026-05-15
status: in_progress
authoritative_reference: .ai/docs/upgrade.md
---

# Master Upgrade Plan — Execution Task

> **This is the authoritative execution document.** It exists to take the strategy in `.ai/docs/upgrade.md` and turn it into a sequence of testable, auditable engineering groups. **No work happens outside one of the groups below.** No work happens without a green completion gate.
>
> Strategy lives in [.ai/docs/upgrade.md](../../docs/upgrade.md). Execution lives here.

---

## Discipline rules — read first, applies to every group

These are not suggestions. Every group below inherits them.

### Rule 1 — Definition of Done is binary, not narrative

A group is **DONE** only when every checkbox in its checklist is checked AND every gate command below it returns the expected green output. There is no partial completion, no "mostly done", no "will fix in follow-up". If any item fails, the group stays in `active/`.

### Rule 2 — No legacy, no patches, no migrations-on-migrations

Per the founder's explicit direction: anything not needed gets removed. Patch migrations get folded into base migrations and deleted. Code that exists for "backward compatibility" gets deleted. Commented-out blocks get deleted. `// TODO`, `// Wait`, `// Note` scaffolding comments get deleted. No exceptions.

### Rule 3 — One group at a time, no parallel execution

Only one group may be `in_progress` at any moment. Trying to do two groups in parallel produces drift and breaks the completion gate. If a group is blocked, the blocker becomes a new group or gets resolved before continuing.

### Rule 4 — Each group has its own task file

Before starting a group, copy its section from this file into a new file at `.ai/TASKS/active/{group-slug}.md`. Work the checklist there. On completion (Rule 1), move to `.ai/TASKS/completed/{group-slug}.md` with the completion record appended.

### Rule 5 — Tests are not optional

Every group ends with `make test` (or its current equivalent) green. Every behavior change has a test added before merge. Failing tests are never "noted for later".

### Rule 6 — `dev-guideline` skill at start and end

Per project CLAUDE.md, every group's developer invokes `/dev-guideline` once at start (lifecycle), once at end (self-review gate). The self-review gate output is appended to the group's task file before move-to-completed.

### Rule 7 — Boost MCP for any Laravel work

Any group touching Laravel/Sanctum/Reverb/Broadcasting/Notifications/Prism/Pest/Telescope/Laratrust/Scramble/Tailwind code MUST consult Laravel Boost (`mcp__laravel-boost__search-docs`) before writing. Memory does not replace boost.

### Rule 8 — Frontend work spawns a frontend agent

Any group touching `admin/` is delegated to a dedicated agent operating with cwd inside that folder, reading the frontend CLAUDE.md, invoking its own `dev-guideline` skill. Backend session never edits frontend files directly.

### Rule 9 — Pint clean

Every group ends with `vendor/bin/pint --dirty` clean. No "Pint says these files need formatting, fix later."

### Rule 10 — Self-review gate is verbatim, not paraphrased

Each group's completion record includes the literal output of the self-review gate:
- 5 project rules listed
- PASS / FAIL per rule with 1-line evidence
- Final line: `GATE: PASS` or `GATE: FAIL`

If FAIL, the group does NOT move to completed.

---

## Completion record template — append this to each group's task file before move-to-completed

```
## Completion Record — {group-slug}

- **Completed at:** YYYY-MM-DD HH:MM (timezone)
- **Commit hash:** {git rev-parse HEAD}
- **Branch:** {git branch --show-current}
- **Test result:** {paste tail of `make test` output, 10 lines}
- **Pint result:** {paste `vendor/bin/pint --dirty` output}
- **Files changed:** {git diff --stat against starting point, full list}
- **Deviations from plan:** {bullets, or "none"}

### Self-Review Gate

Rules checked (max 5):
1. {rule} — PASS/FAIL — {1-line evidence}
2. ...
3. ...
4. ...
5. ...

**GATE: PASS**
```

If `GATE: FAIL`, fix what failed, stay in `active/`, re-run.

---

# Groups

The groups below mirror the execution order in `.ai/docs/upgrade.md §11`. Each group is one focused task with a binary completion gate.

---

## Group 0 — Monorepo consolidation (in-place restructure)

**Reference:** `.ai/docs/upgrade.md §2 — Repo & build architecture`

### Scope

Restructure **in place**: the current backend folder at `/Users/benny/Documents/products/laravel/livechat` becomes the monorepo root. Move its current contents into `api/`. Copy the React admin from `/Users/benny/Documents/react/relvoai-admin` into `admin/`. Add the root-level scaffolding (`Makefile`, `docker-compose.yml`, `LICENSE`, etc.). **No new parent folder created. No git history preservation. Fresh git init at the end. Frontend source folder remains untouched (founder may delete it later).** The whole monorepo can be moved to any path after the founder is satisfied — every internal reference is relative.

### Target layout (must match exactly)

```
{monorepo-root}/
├── apps/
│   ├── api/                  ← contents of the current Laravel backend
│   └── admin/                ← contents of the current relvoai-admin
├── packages/
│   └── widget/               ← (deferred — leave empty placeholder OR omit folder)
├── enterprise/               ← (created empty placeholder with LICENSE inside)
├── docker/
│   ├── Dockerfile.api
│   ├── Dockerfile.admin
│   └── nginx.conf
├── docker-compose.yml
├── docker-compose.prod.yml
├── Makefile
├── README.md
├── LICENSE                   ← MIT
├── CONTRIBUTING.md
├── SECURITY.md
└── .github/
    └── workflows/
        └── ci.yml
```

### Checklist

- [ ] Working directory is `/Users/benny/Documents/products/laravel/livechat` for the entire group — this folder IS the monorepo root.
- [ ] Delete the existing `.git` folder. `git init` fresh. Set default branch to `main`.
- [ ] Stash `.ai/` somewhere temporary; it gets put back at the monorepo root after the move.
- [ ] Create `api/`. `mv` every top-level backend file/folder INTO `api/` EXCEPT: `.git` (already gone), `.ai/` (already stashed), nothing else gets to stay at root.
- [ ] Inside `api/`, scrub: `node_modules/`, `vendor/`, `storage/logs/*`, `storage/framework/cache/*`, `storage/framework/sessions/*`, `storage/framework/views/*`, `public/build/`, `.env`. Keep `.env.example`. Keep `composer.lock`, `package-lock.json`.
- [ ] Restore stashed `.ai/` to the monorepo root.
- [ ] Copy `/Users/benny/Documents/react/relvoai-admin` working tree into `admin/` (cp -R, no `.git`). Do NOT copy `node_modules/`, `dist/`, `dist-widget/`, `.env.local`. Keep `.env.example` if present, else create one.
- [ ] **Do not modify the frontend source folder** at `/Users/benny/Documents/react/relvoai-admin`. Leave it alone; founder will delete it later.
- [ ] Update both `.env.example` files to use relative-to-monorepo paths where needed.
- [ ] Sync the canonical AI-guidance files. Place ONE `CLAUDE.md` at the monorepo root that points contributors to `api/AGENTS.md` and `admin/AGENTS.md`. Delete the redundant `GEMINI.md`. Keep one `AGENTS.md` per app for the agent rules that already exist.
- [ ] Move the existing `.ai/docs/upgrade.md` to `{monorepo-root}/.ai/docs/upgrade.md`. Move task files under `.ai/TASKS/active/` and `completed/` likewise. Move skill folders, guidelines, etc.
- [ ] Write root `Makefile` exposing: `setup`, `dev`, `test`, `build`, `lint`, `fresh`. Detailed targets below.
- [ ] Write `docker-compose.yml` orchestrating: Postgres 17 + pgvector, Reverb, Laravel api, Vite admin, queue worker.
- [ ] Write `docker-compose.prod.yml` as a reference (env-driven, no hardcoded ports).
- [ ] Write `docker/Dockerfile.api` (multi-stage, PHP 8.3 + Composer + production-ready).
- [ ] Write `docker/Dockerfile.admin` (multi-stage, Node 22 + Vite build → nginx serve).
- [ ] Write `docker/nginx.conf` proxying `/api/*` to the api container and serving the admin SPA elsewhere.
- [ ] Write `LICENSE` at root with full MIT text. Copyright line: `Copyright (c) 2026 Relvo AI contributors`.
- [ ] Write `enterprise/LICENSE` with a proprietary license placeholder (founder confirms exact text later).
- [ ] Write `README.md` with: 1-paragraph pitch, screenshots placeholder, `docker compose up` quickstart, `make setup` quickstart, comparison-vs-Chatwoot stub.
- [ ] Write `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md` (Contributor Covenant 2.1).
- [ ] Write `.github/workflows/ci.yml` running: `make lint`, `make test`. Must run on every PR and on push to `main`.
- [ ] Update `api/CLAUDE.md` paired-repo reference from the old absolute path to `../admin`.
- [ ] Update `admin/CLAUDE.md` paired-repo reference from the old absolute path to `../api`.
- [ ] Commit on `main`: one squashed initial commit titled `chore: monorepo bootstrap`.

### Makefile targets — must do exactly these

```make
setup:         # composer install + npm install + cp .env.example .env + key:generate + migrate --seed
dev:           # concurrent: php artisan serve, php artisan queue:listen, php artisan reverb:start, vite dev (admin)
test:          # cd api && php artisan test; cd admin && npx tsc --noEmit
lint:          # cd api && vendor/bin/pint --test; cd admin && eslint or tsc
build:         # cd admin && npm run build; cd admin && npm run build:widget
fresh:         # cd api && php artisan migrate:fresh --seed --force
```

### Completion gates — all must pass

```bash
# From monorepo root
git log --oneline | head -3       # must show 1 commit (or 2: empty init + bootstrap)
ls api admin docker     # must exist
test -f LICENSE && head -1 LICENSE | grep -q "MIT"           # MIT license present
test -f Makefile                                              # Makefile present
test -f docker-compose.yml                                    # docker-compose present
test -f .github/workflows/ci.yml                              # CI present
make setup                          # one command sets up everything from clean
make test                           # ALL backend tests green (≥167 passing)
make lint                           # Pint clean + admin tsc clean
docker compose up -d                # boots Postgres + Reverb + api + admin
sleep 30 && curl -sS -o /dev/null -w "%{http_code}\n" http://localhost:8000/up        # must return 200
curl -sS -o /dev/null -w "%{http_code}\n" http://localhost:3000                       # must return 200 (admin)
docker compose down                 # tears down cleanly
```

### Deliverables

- New monorepo at confirmed path
- Working `docker compose up` end-to-end
- Working `make setup && make dev` end-to-end
- All existing backend Pest tests pass
- Admin `npx tsc --noEmit` clean
- This task file moved to `completed/` with completion record appended

---

## Group 1 — "No legacy" pass: migration consolidation + `workspace_id` retrofit + comment sweep + OSS hygiene

**Reference:** `.ai/docs/upgrade.md §3 (Multi-tenancy)` and `§10 (Pre-launch hygiene)`

### Scope

Fold patch migrations into base migrations. Add `workspace_id` to every domain table inside its base migration (NOT as a patch). Sweep LLM scaffolding comments. Normalize namespaces. Standardize broadcast emission. Ship OSS hygiene baseline.

### Checklist

- [ ] Add `workspaces` table base migration (UUID PK, name, slug, is_active, created_at, updated_at). Seed one singleton row (`id` resolved at seed time, name='Default', is_active=true).
- [ ] Add `workspace_id` FK (cascade-on-delete) to every domain table by editing the base migration, not adding a patch:
  - users, inboxes, channels, channel_domains, pre_chat_forms, settings, contacts, visitors, visitor_sessions, conversations, messages, message_attachments, conversation_participants, conversation_transfers, canned_replies, conversation_ratings, message_stars, blocked_urls, bot_rules, departments, notes, widget_sessions, audit_logs, ai_agents, ai_knowledge_sources, ai_knowledge_chunks, ai_conversations, ai_credit_balance, ai_credit_ledger.
- [ ] Delete every patch migration:
  - `add_missing_columns_to_contacts_table.php` — fold into base
  - `add_external_id_to_contacts_table.php` — fold into base
  - `update_visitors_and_indices_for_widget.php` — fold into base
  - `add_telegram_to_users_table.php` — fold into base
- [ ] Create `App\Models\Workspace` model + `App\Concerns\BelongsToWorkspace` trait that applies a global Eloquent scope.
- [ ] Apply `BelongsToWorkspace` to every model that has `workspace_id`.
- [ ] Create `Workspace::current()` resolver — returns the seeded singleton in single-tenant mode; resolved from middleware otherwise.
- [ ] Add Pest **arch test** that fails if any Eloquent model with `workspace_id` is missing the trait.
- [ ] Update every existing test to seed a workspace before any factory call OR have factories default to the seeded workspace.
- [ ] Sweep `// Wait`, `// Note`, `// Simplification based on requirements`, `// TODO` scaffolding comments from `api/app/**`.
- [ ] Sweep similar scaffolding/inline-narrative comments from `api/database/migrations/**`.
- [ ] Move `App\Jobs\SummarizeConversationJob` → `App\Jobs\Ai\SummarizeConversationJob`. Update all references.
- [ ] Centralize `broadcast(new MessageCreated(...))` into a `MessageObserver` (a single source). Remove the 4 scattered calls.
- [ ] Add `LICENSE` at monorepo root (MIT) — confirmed in Group 0; verify still present.
- [ ] Add `enterprise/LICENSE` (proprietary placeholder) — confirmed in Group 0; verify still present.
- [ ] Confirm `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`, `.github/workflows/ci.yml` from Group 0 are still in place.
- [ ] `php artisan migrate:fresh --seed` runs clean.
- [ ] Full Pest suite green.

### Completion gates

```bash
make fresh                          # migrate:fresh --seed clean
make test                           # all tests green, including the new arch test
make lint                           # Pint clean
grep -rE "// Wait|// Note|// Simplification" api/app api/database | wc -l   # must be 0
grep -rE "// Wait|// Note|// Simplification" api/app api/database          # empty output
ls api/database/migrations/ | grep -E "add_missing|add_external|add_telegram|update_visitors_and_indices"   # empty output (patches deleted)
```

### Deliverables

- All domain tables carry `workspace_id` via their base migration
- Seeded singleton workspace
- BelongsToWorkspace trait + arch test
- Patch migrations deleted
- LLM scaffolding comments deleted
- Single observer-based MessageCreated broadcast
- Full test suite green on `migrate:fresh --seed`

---

## Group 2 — Plugin architecture (BE manifest loader + FE slot registry + reference plugin)

**Reference:** `.ai/docs/upgrade.md §5`

### Scope

Backend `PluginManager` + manifest loader. Frontend slot/contribution registry + dynamic bundle loader. One reference plugin exercising both ends.

### Checklist

- [ ] Define `plugin.json` schema (name, version, slug, requires, capabilities, frontend bundle path, service provider class, routes file, migrations dir, permissions, tools).
- [ ] `App\Plugins\PluginManager` service — loads enabled plugins from `plugins/*/plugin.json` on boot, runs their service provider, registers routes/views/migrations.
- [ ] `App\Plugins\PluginRepository` — DB-backed enabled/disabled state per workspace.
- [ ] Frontend slot registry — `src/core/plugins/registry.ts` exposing slots: `sidebar.section`, `conversation.tab`, `settings.section`, `widget.message-renderer`, `ai.tool`.
- [ ] Frontend dynamic loader — fetches plugin manifest from `/api/admin/plugins`, loads each plugin's JS bundle URL via `<script>` injection, plugin calls `window.Relvo.register({ slot, component, when })`.
- [ ] One reference plugin in `plugins/example-sidebar-widget/` demonstrating the full BE+FE flow.
- [ ] Tests: backend plugin lifecycle (enable, disable, install migrations, register tool). Frontend registry tests (mount component, slot dispatch).

### Completion gates

```bash
make test
ls plugins/example-sidebar-widget/plugin.json   # exists
make dev    # start everything; manually verify the reference plugin renders in the admin sidebar
```

### Deliverables

- Plugin manifest schema + docs
- BE PluginManager + repository + admin routes for enable/disable
- FE slot registry + dynamic bundle loader
- Reference plugin (BE + FE) shipping in the repo
- Tests green

---

## Group 3 — Move Pro/Enterprise features into `enterprise/` + proprietary license + license-key check

**Reference:** `.ai/docs/upgrade.md §2, §6, §7`

### Scope

Carve out which existing AI features stay free and which move to `enterprise/`. Implement a license-key check that gates Enterprise features at load.

### Checklist

- [ ] Define which AI features move to `enterprise/AdvancedAi/` per `.ai/docs/upgrade.md §7`:
  - Custom AI tools (registry + admin UI)
  - Conversation simulator
  - Eval framework
  - Auto-improve loop
  - Long-term visitor memory
  - Multi-step agent planning
- [ ] Define which compliance features go to `enterprise/`:
  - `Auth/` — SSO/SAML
  - `Audit/` — audit log export + advanced RBAC
  - `Branding/` — white-label removal
- [ ] Implement `App\Enterprise\LicenseManager` — reads `RELVO_LICENSE_KEY` env var, validates against license server, caches result.
- [ ] `enterprise/EnterpriseServiceProvider` registers all Enterprise features ONLY when license valid.
- [ ] Add license-check middleware to enterprise routes (returns 402 Payment Required when key invalid).
- [ ] Write `enterprise/LICENSE` final proprietary text (founder confirms text).
- [ ] Update `api/composer.json` autoload to include `enterprise/` namespace.
- [ ] Update `admin/` to fetch `/api/admin/license` on boot and conditionally render Enterprise UI.
- [ ] Tests: license valid → features available; license invalid → 402; license missing → free-tier behavior.

### Completion gates

```bash
make test
RELVO_LICENSE_KEY="" php artisan tinker --execute="echo app(App\Enterprise\LicenseManager::class)->isValid() ? 'YES' : 'NO';"   # NO
RELVO_LICENSE_KEY="test-dev-key" php artisan tinker --execute="echo app(App\Enterprise\LicenseManager::class)->isValid() ? 'YES' : 'NO';"   # YES (dev mode allows test keys)
```

---

## Group 4 — Custom AI Tools (first paid feature under `enterprise/`)

**Reference:** `.ai/docs/upgrade.md §6, §7 (the biggest paid wedge)`

### Scope

Let owners register backend endpoints the AI can call (refunds, lookups, cancellations, schedule, update CRM, etc.).

### Checklist

- [ ] `enterprise/AdvancedAi/AiToolRegistry` — DB-backed registry of owner-defined tools.
- [ ] Tool definition shape: name, description, JSON Schema for parameters, HTTP endpoint, auth method, rate limit.
- [ ] Admin UI under `admin/` (rendered only when license valid): create/edit/test custom tools.
- [ ] Plug into `App\Ai\Agents\SupportAgent` — when license valid, append owner's custom tools to the agent's `tools()`.
- [ ] Tool execution sandboxing: per-tool rate limit, response size limit, timeout.
- [ ] Audit log every tool invocation.
- [ ] Tests: owner registers a tool → AI invokes it → response feeds back to AI → next turn uses the data.

### Completion gates

```bash
make test
# Manual: enable Enterprise license locally, create a custom tool via admin UI,
# verify in a real conversation that AI calls it and uses the response.
```

---

## Group 5 — Pre-launch hygiene completion

**Reference:** `.ai/docs/upgrade.md §10`

### Scope

Close every remaining hygiene checkbox.

### Checklist

- [ ] `README.md` rewrite: screenshots, 60-second install, comparison vs Chatwoot/Tawk, architecture diagram, "what is Relvo AI", "quickstart", "self-host vs cloud" tables.
- [ ] `DemoSeeder` — one command produces fully populated demo (admin, 2 agents, 1 inbox, 1 web channel, 1 AI agent with sample knowledge, 5 sample conversations in various states).
- [ ] `ISSUE_TEMPLATE/bug_report.md`, `ISSUE_TEMPLATE/feature_request.md`, `PULL_REQUEST_TEMPLATE.md`.
- [ ] Public roadmap on GitHub Projects.
- [ ] Content moderation pass on visitor messages before LLM (OpenAI free moderation endpoint).
- [ ] Rate-limit AI replies per conversation (cost-bombing defense).
- [ ] Env-guard `dev:token` artisan command — refuse in `APP_ENV=production`.
- [ ] Split CORS: widget endpoints `*`, admin endpoints same-origin only.

### Completion gates

```bash
make test
ls .github/ISSUE_TEMPLATE/bug_report.md .github/ISSUE_TEMPLATE/feature_request.md .github/PULL_REQUEST_TEMPLATE.md
php artisan db:seed --class=DemoSeeder   # exits clean and produces 5+ conversations
APP_ENV=production php artisan dev:token  # refuses (non-zero exit)
```

---

## Group 6 — Trademark search + filing

**Scope**

External, lawyer-driven. Confirms the product name is registrable in target jurisdictions.

### Checklist

- [ ] Run preliminary trademark searches in target jurisdictions (US, EU, founder's home jurisdiction).
- [ ] Engage IP counsel.
- [ ] File initial application (founder action, not engineering).
- [ ] Receive filing receipt; record reference number in this file.

### Completion gates

- Filing receipt reference recorded.

---

## Group 7 — Private `cloud/` repo bootstrap

**Reference:** `.ai/docs/upgrade.md §2 (private Cloud repo)`

### Scope

Stand up the private repo with the subdomain middleware, Stripe stub, signup placeholder. Cloud goes live AFTER OSS public launch.

### Checklist

- [ ] Create private GitHub repo `relvoai/cloud`.
- [ ] Scaffold: subdomain middleware, signup flow placeholder, Stripe webhook stub, provisioning script.
- [ ] Cloud deployment pulls `api/` + `admin/` + `enterprise/` from the public repo at the release tag, then applies `cloud/` overlay.
- [ ] Document the Cloud deployment runbook in `cloud/README.md`.

### Completion gates

```bash
# In private cloud/ repo:
make setup-cloud-local  # boots Postgres + Reverb + api + admin + Stripe stub locally with multi-tenant on
curl -sS http://acme.localhost/api/v1/up  # 200, resolves to workspace=acme
curl -sS http://other.localhost/api/v1/up  # 200, resolves to workspace=other
```

---

## Group 8 — Public launch

### Scope

Show HN, Product Hunt, comparison post vs Chatwoot, Twitter.

### Checklist

- [ ] Show HN post drafted, scheduled.
- [ ] Product Hunt listing prepared (logo, screenshots, gallery, tagline).
- [ ] Comparison-vs-Chatwoot blog post published.
- [ ] Founder Twitter thread drafted.
- [ ] Press kit folder in public repo: `assets/press/`.
- [ ] Discord or Slack community link in README.
- [ ] Cloud signup waitlist live (Cloud product comes online post-launch).

### Completion gates

- Show HN posted; URL recorded here.
- Product Hunt URL recorded.
- Blog post URL recorded.

---

## How a developer agent runs ONE group

1. **Invoke `/dev-guideline`** skill once at start.
2. **Copy this group's section** into `.ai/TASKS/active/{group-slug}.md`.
3. **Work the checklist** in order. Do not skip ahead.
4. **Run the gate commands** below the checklist. Every one must produce the expected output.
5. **Invoke `/dev-guideline`** again for the self-review gate.
6. **Append the Completion Record** template (above) to the group's task file.
7. If `GATE: PASS`, move the file to `.ai/TASKS/completed/{group-slug}.md`.
8. If `GATE: FAIL`, fix what failed, stay in `active/`, run the gate again. Do not move forward.

---

## How completion is audited

Anyone — founder, reviewer, future maintainer — can audit by:

```bash
ls .ai/TASKS/completed/                   # one file per finished group
cat .ai/TASKS/completed/group-0-monorepo-consolidation.md | tail -40   # Completion Record visible
git log --grep="^chore(group-0)"          # one commit (or one merge) per group
```

The discipline is: **if it's not in `completed/` with a green Completion Record, it's not done.**
