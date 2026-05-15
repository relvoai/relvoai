# Upgrade update — RelvoAI Cloud architecture lock-in

> Addendum to `.ai/docs/upgrade.md`. Where this file conflicts with `upgrade.md`, **this file wins**. Domain map lives in `.ai/docs/production.md`.

Last updated: 2026-05-15. Brand locked: **RelvoAI**.

---

## What's locked

1. **Brand:** RelvoAI. GitHub org: `relvoai`. Public + private Cloud repos are being created by the dev.
2. **Cloud frontend:** Next.js (React). Zero Blade anywhere.
3. **Multi-tenant routing:** path-based. Every tenant lives at `app.relvoai.com/workspace/{id}`. No subdomains.
4. **Workspace ID:** `bigint`, sequence starts at `10000`. Not UUID.
5. **Private Cloud repo:** sibling folder, separate GitHub repo, never published.
6. **Domain map:** in `.ai/docs/production.md`.

---

## Repository topology

```
~/Documents/products/
├── relvoai/                      PUBLIC repo (github.com/relvoai/<public-repo>)
│   ├── api/                       Laravel backend (MIT)
│   ├── admin/                     React + Vite SPA — authenticated workspace UI ONLY
│   ├── enterprise/                Proprietary, license-keyed
│   ├── docker/, Makefile, README.md, LICENSE (MIT), .ai/
│   └── ...
│
└── relvoai-cloud/                PRIVATE repo (github.com/relvoai/<cloud-repo>)
    ├── overlay/
    │   └── api/                   Cloud-only Laravel additions (composer path package)
    │       ├── Tenancy/           path workspace resolver middleware (reads /workspace/{id})
    │       ├── Billing/           Stripe service, webhooks, invoicing, dunning
    │       ├── Signup/            signup API, onboarding, workspace bootstrap
    │       └── AntiAbuse/         cross-workspace rate limits, ban worker, support tooling
    ├── web/                       Next.js — marketing + signup + pricing + docs + blog
    ├── deploy/                    infra-as-code, Docker prod compose, CI, secrets
    ├── Makefile
    └── README.md
```

Folder names on disk follow whatever the dev created. Code never hard-codes them — only relative `../` paths.

---

## Multi-tenant routing — path-based

**URL pattern (Cloud):**

```
https://app.relvoai.com/login
https://app.relvoai.com/workspaces                              list of user's workspaces
https://app.relvoai.com/workspace/10001                         dashboard
https://app.relvoai.com/workspace/10001/conversations
https://app.relvoai.com/workspace/10001/ai-agents
https://app.relvoai.com/workspace/10001/settings/team
```

**How resolution works in the Cloud overlay:**

1. `Tenancy/PathWorkspaceMiddleware` (in private Cloud overlay only) reads workspace id from the `X-Workspace-Id` header on every admin API request. The admin SPA sets this header from the URL path on every fetch.
2. Middleware verifies the authenticated user belongs to that workspace via the `workspace_user` pivot. Returns 403 if not.
3. Sets `Workspace::current()` for the request lifecycle.
4. All Eloquent queries auto-scope via the `BelongsToWorkspace` trait (already shipped in Group 1).

**Self-host stays at root.** Path-based middleware registers only when the Cloud overlay is loaded. Self-host runs at `your-domain.com/` with workspace singleton id `10000`. No `/workspace/{id}` prefix.

---

## Workspace ID change — task for the dev AI

**Required schema retrofit.** Does NOT invalidate completed Groups 0-5. Executed under the no-legacy discipline: edit base migrations in place, `migrate:fresh --seed`, no patch migrations.

### Task file

Create `.ai/TASKS/active/workspace-id-bigint-retrofit.md` in this format:

```
---
slug: workspace-id-bigint-retrofit
type: focused-task
created: 2026-05-15
status: in_progress
authoritative_reference: .ai/docs/upgrade-update.md
---

# Workspace ID retrofit — UUID → bigint sequence

## Scope
Replace workspaces.id UUID with bigint sequence starting at 10000.
Every workspace_id FK on every domain table follows.

## Checklist
- [ ] Edit api/database/migrations/<workspaces table>.php:
      $table->bigIncrements('id')->startingValue(10000);  (or explicit Postgres sequence)
- [ ] For every base migration carrying workspace_id, replace foreignUuid('workspace_id') with foreignId('workspace_id')->constrained()->cascadeOnDelete().
- [ ] Update App\Models\Workspace: drop HasUuids trait, remove $keyType / $incrementing UUID config.
- [ ] Update App\Concerns\BelongsToWorkspace: type hints for $workspace_id from string to int.
- [ ] Update Workspace::current(): return type int for ->id where applicable.
- [ ] Update Sanctum middleware that carries workspace_id: cast to int.
- [ ] Update factories, seeders touching workspace_id.
- [ ] Update enterprise/src/AdvancedAi/* if it references workspace_id type.
- [ ] Update admin TypeScript types where workspace_id appears: string → number.
- [ ] Update the Pest arch test if it asserts UUID shape on workspace_id.
- [ ] php artisan migrate:fresh --seed runs clean.
- [ ] make test green (≥195 tests).
- [ ] make lint clean.

## Completion gates
make fresh
make test                          # all green
make lint                          # pint + tsc clean
psql -U benny -d livechat -c "SELECT id FROM workspaces;"
                                   # singleton row exists with id = 10000
psql -U benny -d livechat -c "\d users" | grep workspace_id
                                   # workspace_id column is bigint, not uuid
```

Commit on `main` titled `chore: workspace ID retrofit (uuid → bigint, sequence start 10000)`.

When `GATE: PASS`, move task file to `.ai/TASKS/completed/`.

### What stays UUID

Conversations, messages, users, AI agents, channels, knowledge sources, ledger rows — all remain UUID. Only `workspaces.id` and the `workspace_id` FK columns change. Integer IDs are appropriate where they appear in URLs (workspaces do; messages don't).

---

## Three frontends, three jobs

| Frontend | Repo | Tech | URL |
|---|---|---|---|
| `admin/` | public RelvoAI | React 18 + Vite 6 + Tailwind v4 | `app.relvoai.com/workspace/{id}/...` |
| `web/` (Cloud only) | private `relvoai-cloud` | Next.js + Tailwind v4 | `relvoai.com`, `docs.relvoai.com` |
| embeddable widget | published from `admin/src/widget/` | React + Vite (IIFE) | customer sites; bundle = `relvo.js` |

Widget runtime namespace (`window.Relvo*`, bundle `relvo.js`) unchanged. Customers paste a stable runtime name into their sites.

---

## How Cloud uses core

### Local dev

```bash
git clone git@github.com:relvoai/<public-repo>.git ~/Documents/products/relvoai
git clone git@github.com:relvoai/<cloud-repo>.git ~/Documents/products/relvoai-cloud

cd ~/Documents/products/relvoai-cloud
make dev
```

`make dev` in the Cloud repo:

1. Composer path-installs `relvoai/cloud-overlay` (the `overlay/api/` folder) into `../relvoai/api`. Registers `OverlayServiceProvider`, which boots `Tenancy/PathWorkspaceMiddleware`, Billing routes, Signup endpoints, AntiAbuse worker.
2. Boots `cd ../relvoai && make dev` (api + admin + reverb + queue).
3. Boots the Next.js `web/` dev server on a separate port.
4. Sets `MULTI_TENANT=true` so the workspace middleware activates.
5. On exit, removes the path requirement and resets env. Public monorepo untouched.

### Production deploy

CI in the Cloud repo:

1. `git fetch relvoai/<public-repo>` at pinned release tag.
2. `composer require ./overlay/api` into the checked-out api.
3. Build Docker images: `api:v0.5.0` from public api + overlay; `web:cloud-{sha}` from `relvoai-cloud/web` (Next.js standalone).
4. Push, roll deployment.
5. Admin SPA = same Vite build from the public repo.
6. Next.js `web/` deploys to Vercel or its own container.

### Update flow

Public product release `v0.6.0` → Cloud `deploy/release.yaml` bumps tag → `make deploy` → Cloud's api image rebuilds against `v0.6.0`. Pure tag bump. No code merge, no cherry-pick.

---

## Group 7 — update to current truth

When the dev kicks off Group 7 (Cloud bootstrap), the master plan group description needs these corrections:

- Repo lives at `github.com/relvoai/<cloud-repo>`, not a generic `livedesk/cloud`.
- Folder: `~/Documents/products/relvoai-cloud` as sibling to public monorepo. NOT a directory inside the public repo.
- Overlay is a Laravel composer path package (`overlay/api/`), NOT a subdirectory inside the public api.
- Web frontend is Next.js, NOT Blade.
- Workspace resolver reads `X-Workspace-Id` header (set by admin SPA from the path), NOT the subdomain.
- Workspace IDs are bigint starting at 10000.

---

## Three modes testable today (no Cloud overlay needed)

| Mode | How |
|---|---|
| Self-host Community | `make fresh && make dev` in public repo, no license key. Singleton workspace at id `10000`. |
| Self-host Pro/Enterprise | Same + `RELVOAI_LICENSE_KEY=test-dev-key` in `api/.env`. Verify Enterprise UI + Custom AI Tools. |
| Multi-tenant scoping (Cloud simulation) | Tinker: create second workspace (id `10001`), switch `Workspace::current()` context, prove no leakage between workspaces. |

These are the validation gate before Group 7.

---

## Naming sweep for the dev AI

Replace across `api/`, `admin/`, `enterprise/`, `.ai/`, root docs:

| Find | Replace |
|---|---|
| `LiveDesk` | `RelvoAI` |
| `livedesk` (user-facing text) | `RelvoAI` |
| `livedesk` (code identifiers, namespaces) | `relvoai` |
| `LIVEDESK_LICENSE_KEY` | `RELVOAI_LICENSE_KEY` |
| `LiveDesk\` PHP namespaces in `enterprise/` | `RelvoAI\` |
| LICENSE copyright `2026 LiveDesk contributors` | `2026 RelvoAI contributors` |
| README pitch + comparison tables | RelvoAI branding |

**Do NOT change:**
- Widget runtime: `window.Relvo*`, `window.relvoSDK.run`, bundle `relvo.js`. These are customer-facing on third-party sites and the runtime stays as `Relvo`.
- File names that match the runtime namespace (e.g. `relvo.js`).
