# Project memory — Relvo AI (public OSS)

> Wrong-call lessons + non-obvious invariants captured during execution. Read on every new session before touching tenancy, tests, seeders, or the build pipeline. Keep under 120 lines.

## Identity + layout

- Product name is **Relvo AI** (renamed from "LiveDesk" on 2026-05-15). Slug `relvoai`; PHP namespace `RelvoAi\Plugins\`; env var `RELVO_LICENSE_KEY`; JS global `window.Relvo`.
- Local path: `/Users/benny/Documents/products/relvoai`. Remote: `relvoai/relvoai` (public, MIT).
- Cloud overlay lives in a **separate** repo at `/Users/benny/Documents/products/relvocloud` (private, proprietary). Never edit Cloud code from this session — file an OSS PR if Cloud needs an OSS change.
- Monorepo is FLAT: `api/`, `admin/`, `enterprise/`, `plugins/`, `packages/` all at the root.
- Git history was squashed after Groups 0–5 landed. Single initial commit `feat: initial release scaffold`. Branch protection on `main` requires CI green + 1 review + no force-push.

## Git identity

- Global `user.email=benjamin@queek.com.ng`, `user.name=ichie-benjamin`.
- Never use `codingmanager.ratio@gmail.com` — it links to a separate GitHub account and pollutes contributor history.

## Tenancy (Group 1 outcomes — do not regress)

- `Workspace::current()` has a static cache `$resolvedCurrent`. It MUST be cleared at the start AND end of `WorkspaceSeeder::run()` and in `Tests\TestCase::setUp()`. Without it, single-process `migrate:fresh --seed` can FK-violate because the cache holds a UUID whose row was dropped.
- **`BelongsToWorkspace::initializeBelongsToWorkspace` wraps the DB lookup in try/catch.** `Model::observe(...)` calls `new static` during `AppServiceProvider::boot`, which fires the initialize hook before `.env` / DB are wired (CI failure mode found 2026-05-15). Silent failure is safe because the `static::creating` listener still defaults `workspace_id` at save time.
- `creating` is dispatcher-bound and `Event::fake()` silently blocks it. `initialize{TraitName}` runs at instance construction, bypassing the dispatcher. Keep both — `initialize` primary, `creating` backstop.
- Factories default `workspace_id` to `Workspace::current()->id`. Survives `Event::fake()` paths.
- Raw `DB::table('x')->insert($rows)` paths bypass the trait. New code MUST set `workspace_id` explicitly; see `ChannelController::domains` for the pattern. Arch test does NOT catch this — known limitation.
- `AiCreditBalance` is per-workspace (not the original global singleton). `current()` is `firstOrCreate(['workspace_id' => $wsid], …)`; `debit`/`credit` raw SQL filters by workspace.
- Pest arch test `Tests\Feature\Architecture\BelongsToWorkspaceArchTest` walks both `app/Models` AND `enterprise/src`. Any model with `workspace_id` column missing the trait fails it.

## Plugins (Group 2)

- `App\Plugins\PluginsServiceProvider` defers activation to `app->booted` and guards on `Schema::hasTable('plugins')`. Errors are swallowed in console contexts so `key:generate` / `package:discover` can run without a DB.
- Plugin manifests at `plugins/*/plugin.json`. Service provider class loaded via `classmap` autoload in `api/composer.json`.

## Enterprise (Group 3)

- `App\Enterprise\` PSR-4 → `enterprise/src/`.
- Enterprise routes register **always**; the `license` middleware returns 402 when invalid. Existence visible, access denied (vs hidden 404).
- `LicenseManager::setRemoteValidator(callable)` is the seam Cloud uses to install a network-backed validator. OSS without a validator only accepts `test-*` keys in non-production.

## AI middleware (Group 5)

- `SupportAgent::middleware()` chains: `VisitorMessageModerator` → `PerConversationRateLimit` → `DebitCredits`.
- Moderator is off by default (requires both `ai.moderation_enabled` setting AND `OPENAI_API_KEY` env).
- Per-conversation rate limit is `AI_PER_CONVERSATION_RATE_LIMIT` (default 30/hour). Bucket key is `ai-conv:{conversation_id}`.

## CI policy

- PHP 8.4 (Symfony 8 lockfile requirement).
- Composer install uses `--no-scripts`; `package:discover` runs after `.env` is written with DB credentials.
- Tests: 195 passing on the squashed initial state.

## Pint policy

Always run `vendor/bin/pint` (the fixer). NEVER run `vendor/bin/pint --test` as the way to "fix" — `--test` is verification only (CI mode). The Makefile's `make lint` uses `--test` correctly.

## Frontend work

Anything under `admin/` is delegated to a sub-agent with cwd inside `admin/`, reading that app's CLAUDE.md, invoking its own `/dev-guideline`. The backend session never edits frontend files.

## Boost MCP

Use `mcp__laravel-boost__search-docs` before any Laravel-specific code. Pass an array of broad topic-based queries (e.g. `["rate limiting", "broadcasting"]`). Do NOT pass package names — Boost filters by installed versions automatically. If unreachable, document the deviation and prefer stable documented Laravel 12 surface only.

## Docker + Herd

- Docker configs written but `docker compose up` boot is deferred per founder. URL smoke tests use Herd when available.
- Herd: old `livechat.test` site is stale (public/ is now under `api/public/`). Tests don't need Herd. If URL smoke needed, founder runs `cd api && herd link relvoai-api` (or similar).

## Commit cadence

Conventional commits on the public repo. Each PR clear-scoped; CI must be green; branch protection requires 1 review. The Group 0–5 engineering history was squashed into the initial commit — the records under `.ai/TASKS/completed/` document what's inside.

## Master plan pickup

`.ai/TASKS/active/SESSION-PICKUP.md` is the agent handover. Read it first on every new session. It links to `upgrade-plan.md` (the authoritative execution document, now mostly historical) and `.ai/docs/upgrade.md` (strategy reference).
