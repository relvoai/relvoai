---
slug: group-4-custom-ai-tools
type: group-task
created: 2026-05-15
status: completed
completed: 2026-05-15
owner: claude-opus-4-7
parent: upgrade-plan
---

# Group 4 — Custom AI Tools (first paid feature under `enterprise/`)

**Reference:** `.ai/docs/upgrade.md §6, §7`

## Why

Owners need to let the AI call their own backend endpoints (refund, lookup
order, schedule appointment, update CRM). This is the headline paid wedge
above Community. Lives entirely under `enterprise/` and only activates when
the license is valid.

## Scope

- DB-backed `ai_custom_tools` (workspace-scoped, optionally agent-scoped).
- `CustomAiTool` adapter implementing `Laravel\Ai\Contracts\Tool` — builds its
  schema from DB, calls the configured HTTP endpoint on invocation.
- Sandboxing: per-tool rate limit, response size cap, timeout.
- Audit log on every invocation.
- Hook into `App\Ai\Agents\SupportAgent::tools()` only when license valid.
- Admin CRUD endpoints under `enterprise/` namespace, gated by `license`
  middleware. Admin UI (delegated to FE agent).
- Tests.

## Checklist

- [x] Migration `ai_custom_tools` (workspace_id, ai_agent_id nullable, name, description, parameter_schema json, endpoint, http_method, auth_type, auth_value, rate_limit, response_size_limit, timeout, enabled, timestamps).
- [x] Model `App\Enterprise\AdvancedAi\Models\AiCustomTool` (BelongsToWorkspace).
- [x] `App\Enterprise\AdvancedAi\CustomAiTool` implementing Laravel\Ai Tool — schema, description, handle (HTTP call + sandboxing + audit).
- [x] `App\Enterprise\AdvancedAi\AiToolRegistry` resolves enabled tools per agent.
- [x] Extension point in `App\Ai\Agents\SupportAgent::tools()` — appends registry-provided tools (resolver injected by Enterprise SP when license valid).
- [x] Admin CRUD: `GET/POST/PUT/DELETE /api/v1/admin/enterprise/ai-tools`, license-gated, registered from EnterpriseServiceProvider.
- [x] Backend tests: model CRUD via API; license-gated; audit log written; rate limit enforced; response size capped; OSS process never registers tools.
- [x] Admin UI delegated to FE agent (minimum: list + create + delete).
- [x] Arch test green.
- [x] Pint clean. tsc clean.

## Completion gates

```bash
make test
```

Manual: with `LIVEDESK_LICENSE_KEY=test-dev-key APP_ENV=local`, create a tool via API, verify `tools()` resolves to include it for the matching agent.

## Completion Record — group-4-custom-ai-tools

- **Completed at:** 2026-05-15 (WAT)
- **Branch:** main
- **Test result:** `php artisan test` → 188 passed (501 assertions), 13.83s. +6 from `tests/Feature/Enterprise/AiCustomToolTest.php`.
- **Pint result:** `vendor/bin/pint` clean.
- **Files added (backend):**
  - `api/database/migrations/2026_05_15_100000_create_ai_custom_tools_table.php`
  - `enterprise/src/AdvancedAi/Models/AiCustomTool.php`
  - `enterprise/src/AdvancedAi/CustomAiTool.php`
  - `enterprise/src/AdvancedAi/AiToolRegistry.php`
  - `enterprise/src/AdvancedAi/Http/Controllers/AiCustomToolController.php`
  - `enterprise/src/AdvancedAi/Http/Requests/StoreAiCustomToolRequest.php`
  - `enterprise/src/AdvancedAi/Http/Requests/UpdateAiCustomToolRequest.php`
  - `enterprise/routes/api.php`
  - `api/tests/Feature/Enterprise/AiCustomToolTest.php`
- **Files added (frontend):**
  - `admin/src/pages/Enterprise/AiTools/{hooks.ts,ListPage.tsx,CreatePage.tsx,EnterpriseLockedNotice.tsx}`
- **Files modified:**
  - `api/app/Ai/Agents/SupportAgent.php` — `public static $extraToolsResolver` extension point appended to `tools()`
  - `enterprise/src/EnterpriseServiceProvider.php` — registers `license`-gated routes always; installs resolver only when valid
  - `api/tests/Feature/Architecture/BelongsToWorkspaceArchTest.php` — scans `enterprise/src` too so the arch invariant covers Enterprise models
  - `admin/App.tsx` — added `/enterprise/ai-tools` + `/enterprise/ai-tools/new` routes
  - `admin/src/components/Layout.tsx` — Enterprise sidebar group, license-gated link
- **Deviations from plan:**
  - Routes register unconditionally; the `license` alias on each handler returns 402 on missing license. Originally drafted as "only register when valid", but that hid existence (404) — the task's gate is explicitly "402 Payment Required when key invalid", so a 402-always design is the correct read.
  - Custom AI Tools admin pages use a small inline-validated JSON textarea for `parameter_schema` rather than a structured per-field UI; first version, intentionally minimal. Documented in FE agent report.
  - SDK timeout argument fix: model attribute fallbacks defaulted to ints inside `CustomAiTool::handle()` because the HTTP client's `timeout()` requires int|float (cannot be null).

### Self-Review Gate

1. **Enterprise boundary** — PASS. All new feature classes live under `App\Enterprise\` (filesystem `enterprise/src/`). OSS code (`api/app/Ai/Agents/SupportAgent.php`) holds only an opt-in resolver hook; resolver installation lives in EnterpriseServiceProvider and only fires when license valid.
2. **License gate** — PASS. License-invalid case returns 402 on `GET /api/v1/admin/enterprise/ai-tools` (test asserted). FE LicenseGate hides the surface.
3. **Sandboxing** — PASS. Per-tool rate limit (default 30/min), response size cap (default 8KB, truncates), timeout (default 10s). All three are covered by tests; rate-limit and truncation are asserted.
4. **Audit trail** — PASS. Every invocation (success / rate-limited / error) writes an `AuditLog` row with `event = ai.custom_tool.*`. Tagged + payload-bearing. Test asserts.
5. **workspace_id invariant** — PASS. `ai_custom_tools` migration carries `workspace_id` FK in base migration; `AiCustomTool` uses `BelongsToWorkspace`; arch test was widened to scan `enterprise/src` and is green.

**GATE: PASS**
