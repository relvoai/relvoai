---
slug: group-5-prelaunch-hygiene
type: group-task
created: 2026-05-15
status: completed
completed: 2026-05-15
owner: claude-opus-4-7
parent: upgrade-plan
---

# Group 5 — Pre-launch hygiene completion

**Reference:** `.ai/docs/upgrade.md §10`

## Why

Close every remaining hygiene checkbox so the public OSS launch hits with all
guardrails in place: cost-bombing defenses, env-guard on dev tokens, split
CORS, public README, demo data seeder, ISSUE / PR templates.

## Scope (per master plan + dispatch brief)

- README rewrite (already partially shipped in Group 0). Verify content; tweak if needed.
- `DemoSeeder` for one-command populated demo data.
- ISSUE / PR templates — verify presence (shipped in Group 0).
- Content moderation pass on visitor messages before LLM.
- Per-conversation AI rate limit (cost-bombing defense).
- Env-guard on `dev:token` (refuse in `APP_ENV=production`).
- Split CORS (widget endpoints `*`, admin endpoints same-origin only).

## Checklist

- [x] Env-guard on `DevTokenCommand` — non-zero exit when `app.env === 'production'`.
- [x] `App\Ai\Middleware\PerConversationRateLimit` — caps AI replies per conversation (default 30/hour, configurable). Tested.
- [x] `App\Ai\Middleware\VisitorMessageModerator` — calls `Setting` config; if `ai.moderation_enabled` true AND `OPENAI_API_KEY` present, hits OpenAI moderations endpoint; flag returns short-circuit; off → pass-through. Tested with Http::fake.
- [x] Wire moderator + rate limiter into SupportAgent middleware stack.
- [x] Split CORS: widget paths get `*`; admin paths get `CORS_ALLOWED_ORIGINS_ADMIN` (defaults to same-origin closed list).
- [x] `DemoSeeder` — owner + 2 agents + 1 inbox + 1 web channel + 1 AI agent w/ sample knowledge + 5 sample conversations across states.
- [x] Verify ISSUE / PR templates from Group 0 (just re-check they exist and content is reasonable).
- [x] README — verify; minor wording fixes only.
- [x] Pint clean. Tests green.

## Completion gates

```bash
make test
ls .github/ISSUE_TEMPLATE/bug_report.md .github/ISSUE_TEMPLATE/feature_request.md .github/PULL_REQUEST_TEMPLATE.md
php artisan db:seed --class=DemoSeeder
APP_ENV=production php artisan dev:token   # refuses (non-zero exit)
```

## Completion Record — group-5-prelaunch-hygiene

- **Completed at:** 2026-05-15 (WAT)
- **Branch:** main
- **Test result:** `php artisan test` → 195 passed (516 assertions), 13.87s. +7 from `tests/Feature/Hygiene/HygieneTest.php`.
- **Pint result:** `vendor/bin/pint` clean.
- **CLI gates:**
  - `APP_ENV=production php artisan dev:token` → exits 1 with message "dev:token is disabled in production." ✓
  - `php artisan db:seed --class=DemoSeeder --force` → idempotent, exits clean, produces 5 conversations + channel + AI agent. ✓
  - `.github/ISSUE_TEMPLATE/bug_report.md`, `.github/ISSUE_TEMPLATE/feature_request.md`, `.github/PULL_REQUEST_TEMPLATE.md` all present (from Group 0).
- **Files added:**
  - `api/app/Ai/Middleware/PerConversationRateLimit.php`
  - `api/app/Ai/Middleware/VisitorMessageModerator.php`
  - `api/app/Http/Middleware/RestrictAdminOrigin.php`
  - `api/database/seeders/DemoSeeder.php`
  - `api/tests/Feature/Hygiene/HygieneTest.php`
- **Files modified:**
  - `api/app/Ai/Agents/SupportAgent.php` — wires moderator + rate-limit into middleware()
  - `api/app/Console/Commands/DevTokenCommand.php` — env guard
  - `api/bootstrap/app.php` — RestrictAdminOrigin prepended to api group
  - `api/config/ai.php` — new `per_conversation_rate_limit` key
  - `api/config/cors.php` — `admin_allowed_origins` list + explanatory header
  - `README.md` — corrected `apps/` → `api/, admin/` path reference
- **Deviations from plan:**
  - Per-conversation rate limit lives inline as AI middleware (not a separate HTTP middleware) — fits the existing `SupportAgent::middleware()` pipeline that already houses `DebitCredits`. Same behaviour, cleaner integration.
  - Admin CORS enforcement is an in-app middleware that returns 403 on Origin mismatch rather than relying on `cors` config alone, because `config('cors')` only accepts a single allowed_origins list. This is the right architectural shape: widget endpoints stay permissive (`*`), admin endpoints check Origin explicitly.
  - README rewrite from the master plan checklist was already shipped in Group 0 — verified and corrected one stale path reference. No new screenshots; placeholder still present (founder owns assets).
  - DemoSeeder idempotent via `firstOrCreate` + role guards; same command can be re-run safely.

### Self-Review Gate

1. **dev:token env guard** — PASS. Exits non-zero in production; tested two ways (Pest config flip + actual `APP_ENV=production` CLI invocation).
2. **Per-conversation AI rate limit** — PASS. Short-circuits at the configured cap, falls back to a fixed handoff reply, never bills the LLM.
3. **Content moderation** — PASS. Off by default (no setting + no API key). When enabled + key present, calls OpenAI moderations; flagged content gets a refusal short-circuit without invoking the agent.
4. **Split CORS** — PASS. Widget origins remain `*`; admin endpoints reject foreign Origin headers via `RestrictAdminOrigin` with a structured 403 envelope.
5. **Demo seeder + templates** — PASS. `db:seed --class=DemoSeeder` produces a complete dataset; all three GitHub templates exist on disk.

**GATE: PASS**
