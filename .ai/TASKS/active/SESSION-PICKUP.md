---
slug: session-pickup
type: handover
created: 2026-05-15
status: active
read_order: 1
---

# Session pickup — Relvo AI (public OSS)

> **You are picking up the public Relvo AI OSS app. Read this file END TO END before any other action. The project manager AI hands you the active task; until then this file is the source of truth for "where things stand right now."**

## First actions, in order

1. Invoke `/dev-guideline` skill. **Mandatory.**
2. Read this file fully (you're doing it now).
3. Read `.ai/memory.md` (wrong-call lessons + engineering invariants).
4. Read the most recent completion records under `.ai/TASKS/completed/` for any architectural context you need (Groups 0–5 are all complete).

## Repository state at pickup

- **Local path:** `/Users/benny/Documents/products/relvoai`
- **Remote:** `https://github.com/relvoai/relvoai` (PUBLIC, MIT)
- **Branch:** `main`
- **Commits:** **1** — `feat: initial release scaffold` (history was squashed after Groups 0–5 landed; the engineering records under `.ai/TASKS/completed/` document what's inside that commit).
- **Author:** `ichie-benjamin <benjamin@queek.com.ng>`
- **CI:** GitHub Actions, last run green (`api — Pest + Pint` + `admin — tsc`).
- **Branch protection on `main`:** required CI green + 1 review + no force-push.
- **Working tree:** may have a couple of untracked `.ai/docs/*.md` planning notes — harmless.

## Layout (flat monorepo)

```
.
├── api/              Laravel 12 backend (MIT) — Pest tests, Sanctum, Reverb, Telescope
├── admin/            React 18 + Vite 6 admin dashboard (MIT) — Tailwind v4, TanStack Query
├── enterprise/       proprietary, license-keyed (see enterprise/LICENSE)
├── plugins/          example reference plugin + bays for community plugins
├── packages/         widget bundle bay (deferred)
├── docker/           Dockerfile.api, Dockerfile.admin, nginx.conf
├── docker-compose.yml + docker-compose.prod.yml
├── Makefile          setup, dev, test, lint, build, fresh, clean
├── README.md         60-second install + comparison table
├── LICENSE           MIT
├── CONTRIBUTING.md, SECURITY.md, CODE_OF_CONDUCT.md
└── .github/workflows/ci.yml
```

## Paired Cloud overlay

The proprietary multi-tenant overlay lives in a **separate** repo + folder:

- **Local path:** `/Users/benny/Documents/products/relvocloud`
- **Remote:** `https://github.com/relvoai/cloud` (PRIVATE)

That repo pulls this OSS at a pinned tag into its `./oss/` directory and applies overlay code on top. **Never edit Cloud code from this session** — file an OSS PR if Cloud needs an OSS-side change.

This OSS exposes two seams Cloud relies on (both already shipped):
1. `App\Models\Workspace::setResolvedCurrent($workspace)` — subdomain middleware uses this.
2. `App\Enterprise\LicenseManager::setRemoteValidator(callable)` — Cloud installs the validator.

## What's completed (audit via `.ai/TASKS/completed/`)

| Group | Headline outcome |
|---|---|
| 0 — monorepo bootstrap | Flat layout, Makefile, Dockerfiles, CI, MIT LICENSE, agent docs |
| 1 — no-legacy + workspace_id | `workspaces` table + `BelongsToWorkspace` trait on 29 models, 28 base migrations carry `workspace_id`, observer-centralized broadcasting, arch test |
| 2 — plugin architecture | `App\Plugins\PluginManager` + `PluginRepository`, FE slot registry + dynamic loader, reference plugin |
| 3 — enterprise carve-out | `App\Enterprise\` PSR-4, `LicenseManager`, 402 license-gated middleware, admin license endpoint |
| 4 — custom AI tools | First paid Enterprise feature: DB-backed tool registry, sandboxing (rate/size/timeout), audit log, admin UI |
| 5 — pre-launch hygiene | env-guard on `dev:token`, per-conversation AI rate limit, OpenAI moderation pass, split CORS, DemoSeeder |

`+` rename pass (LiveDesk → Relvo AI) baked into the squashed initial commit.

## Founder-blocked groups (do NOT start)

- `group-6-trademark.md` — IP counsel, outside engineering
- `group-7-cloud-bootstrap.md` — partially started in `relvoai/cloud`; finish there, not here
- `group-8-launch.md` — Show HN / Product Hunt / blog launch, founder-driven

## Engineering invariants — preserve these

These came from Group 1 and were reinforced throughout. Don't regress.

1. **`Workspace::current()` static cache.** `clearResolvedCurrent()` must be called at start AND end of `WorkspaceSeeder::run()` and in `Tests\TestCase::setUp()`. Without it, single-process `migrate:fresh --seed` can FK-violate.
2. **`BelongsToWorkspace::initializeBelongsToWorkspace`.** Resolves `workspace_id` at instance construction time. The DB lookup is wrapped in try/catch so `Model::observe(...)` paths during `AppServiceProvider::boot` don't crash when DB isn't reachable yet (CI before .env / DB are wired).
3. **`static::creating` backstop.** Saves still default `workspace_id` if `initialize` skipped it.
4. **Factories default workspace_id.** Survives `Event::fake()` paths.
5. **Raw `DB::table('x')->insert($rows)` paths MUST set `workspace_id` explicitly.** The trait doesn't catch these. See `ChannelController::domains`.
6. **`AiCreditBalance` is per-workspace.** `firstOrCreate(['workspace_id' => $wsid], ...)`.
7. **Pest arch test** `Tests\Feature\Architecture\BelongsToWorkspaceArchTest` walks both `app/Models` and `enterprise/src`. Any model with `workspace_id` column without the trait fails it.

## Engineering conventions

- **Pint policy:** always `vendor/bin/pint` (fixer) to clean up; never `--test` to fix. `make lint` uses `--test` correctly (CI mode).
- **Frontend work spawns a sub-agent** with cwd inside `admin/`. The backend session does not edit frontend files.
- **Laravel Boost MCP** (`mcp__laravel-boost__*`) before any Laravel-specific code. Don't substitute memory for Boost.
- **Form Requests + Policies + API envelope** — `{ success, data, message }` for success; `{ success: false, message, errors }` for errors.
- **UUIDs everywhere** — `HasUuids` trait. FKs as `$table->foreignUuid('x_id')->constrained()->cascadeOnDelete()` or `nullOnDelete()` per intent.
- **No new patch migrations.** New columns into base migrations or fresh migrations. No backward-compat shims.
- **Conventional commits** on the public repo. Each PR has clear scope; CI must be green before merge.

## Git identity

- Global config: `user.email=benjamin@queek.com.ng`, `user.name=ichie-benjamin`.
- All commits attribute to this identity. Never use `codingmanager.ratio@gmail.com` — that links to a different GitHub account.

## Quick reference — file locations

- Workspace plumbing: `api/app/Models/Workspace.php`, `api/app/Concerns/BelongsToWorkspace.php`, `api/database/seeders/WorkspaceSeeder.php`, `api/database/migrations/0000_01_01_000000_create_workspaces_table.php`.
- Arch test: `api/tests/Feature/Architecture/BelongsToWorkspaceArchTest.php`.
- Observer: `api/app/Observers/MessageObserver.php`, registered in `api/app/Providers/AppServiceProvider.php::boot`.
- Plugins: `api/app/Plugins/*`, `api/app/Providers/PluginsServiceProvider.php`.
- Enterprise: `enterprise/src/*`, registered via `api/bootstrap/providers.php`.
- License middleware alias `license`: defined in `api/bootstrap/app.php`.
- AI middleware: `api/app/Ai/Middleware/{DebitCredits,PerConversationRateLimit,VisitorMessageModerator}.php`.
- CORS split: `api/config/cors.php` (`admin_allowed_origins`) + `api/app/Http/Middleware/RestrictAdminOrigin.php`.

## When to stop and report

Stop and write the report template when:

1. The task assigned by the project manager AI is complete (gate passed).
2. You need a corresponding Cloud-side change — surface it, file it as a Cloud TODO, don't try to do it from here.
3. You hit a `BLOCKED:` state on any sub-step.

## Final report template

```
- Local path: /Users/benny/Documents/products/relvoai
- Branch: {branch}
- Commits added: {git log --oneline since starting point}
- Test result: {make test tail}
- Pint result: {vendor/bin/pint --test}
- Files changed: {git diff --stat against starting point}
- Outstanding: {bullets}
- GATE: PASS/FAIL
```
