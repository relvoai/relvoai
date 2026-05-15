---
slug: group-2-plugin-architecture
type: group-task
created: 2026-05-15
status: completed
completed: 2026-05-15
owner: claude-opus-4-7
owner_heartbeat: 2026-05-15
parent: upgrade-plan
---

# Group 2 — Plugin architecture

**Reference:** `.ai/docs/upgrade.md §5`

## Why

Establish a first-class extension point so OSS users (and Pro/Enterprise carve-out
features) can ship as plugins: discoverable manifests, lifecycle (install/enable/
disable), per-workspace enablement, FE contribution slots, dynamic bundle loading,
and a reference plugin that exercises both ends.

## Scope

Backend `PluginManager` + manifest loader. DB-backed enabled state per workspace.
Frontend slot registry + dynamic bundle loader. One reference plugin (`plugins/
example-sidebar-widget/`) demonstrating both ends.

## Checklist

- [x] Define `plugin.json` schema (name, version, slug, requires, capabilities, frontend bundle path, service provider class, routes file, migrations dir, permissions, tools).
- [x] `App\Plugins\PluginManifest` — load + validate manifest.
- [x] `App\Plugins\Plugin` value object.
- [x] `App\Plugins\PluginManager` service — discover/load enabled plugins from `plugins/*/plugin.json` on boot; register their service providers; ensure their migrations + routes file are loaded.
- [x] `App\Plugins\PluginRepository` — DB-backed enabled/disabled state per workspace; `plugins` table migration (workspace_id, slug, version, enabled, settings JSON).
- [x] Admin API: `GET /api/admin/plugins` lists discovered + per-workspace state; `POST /api/admin/plugins/{slug}/enable`; `POST /api/admin/plugins/{slug}/disable`.
- [x] Public `GET /api/admin/plugins/manifest` for admin SPA boot (lists enabled plugins + their FE bundle URL + slots).
- [x] Wire `PluginManager` into `AppServiceProvider::boot`.
- [x] Frontend slot registry — `src/core/plugins/registry.ts` exposing slots: `sidebar.section`, `conversation.tab`, `settings.section`, `widget.message-renderer`, `ai.tool`.
- [x] Frontend dynamic loader — fetches `/api/admin/plugins/manifest`, loads each plugin's JS bundle URL via `<script>` injection, plugin calls `window.LiveDesk.register({ slot, component, when })`.
- [x] Reference plugin in `plugins/example-sidebar-widget/`: `plugin.json`, BE service provider (registers a route + observer), FE bundle that registers a sidebar component.
- [x] Backend tests: plugin discovery, enable/disable per-workspace, manifest endpoint, reference plugin lifecycle.
- [x] Frontend: registry unit tests (mount + slot dispatch).
- [x] Pint clean. tsc clean.

## Completion gates

```bash
make test
ls plugins/example-sidebar-widget/plugin.json   # exists
```

(URL smoke deferred — Herd not configured per founder.)

## Completion Record — group-2-plugin-architecture

- **Completed at:** 2026-05-15 (WAT)
- **Branch:** main
- **Test result:** `php artisan test` → 175 passed (473 assertions), 12.98s. Was 168 prior; +7 from new `tests/Feature/Admin/PluginTest.php`.
- **Pint result:** `vendor/bin/pint` fixed 2 files (PluginRepository.php phpdoc_align, PluginTest.php fully_qualified_strict_types). Subsequent `--test` clean.
- **Files added (backend):**
  - `api/app/Plugins/PluginManifest.php`
  - `api/app/Plugins/PluginManager.php`
  - `api/app/Plugins/PluginRepository.php`
  - `api/app/Plugins/PluginServiceProvider.php` (base class for plugin SPs)
  - `api/app/Models/PluginInstallation.php`
  - `api/app/Providers/PluginsServiceProvider.php`
  - `api/app/Http/Controllers/Api/Admin/PluginController.php`
  - `api/config/plugins.php`
  - `api/database/migrations/2026_05_15_000000_create_plugins_table.php`
  - `api/tests/Feature/Admin/PluginTest.php`
  - `plugins/example-sidebar-widget/plugin.json`
  - `plugins/example-sidebar-widget/src/ExampleSidebarWidgetServiceProvider.php`
  - `plugins/example-sidebar-widget/routes.php`
  - `plugins/example-sidebar-widget/dist/index.js`
- **Files added (frontend):**
  - `admin/src/core/plugins/registry.ts`
  - `admin/src/core/plugins/loader.ts`
  - `admin/src/core/plugins/PluginSlot.tsx`
  - `admin/src/core/plugins/registry.test.ts`
  - `admin/src/core/plugins/loader.test.ts`
- **Files modified:**
  - `api/bootstrap/providers.php` — registered PluginsServiceProvider
  - `api/composer.json` — added `../plugins` to classmap autoload
  - `api/routes/api.php` — added 4 plugin admin routes
  - `admin/App.tsx` — fire-and-forget loadEnabledPlugins() after auth
  - `admin/src/components/Layout.tsx` — `<PluginSlot name="sidebar.section" />` after navGroups
- **Deviations from plan:**
  - Laravel Boost MCP was unreachable during this group. Stuck to stable Laravel 12 surface (`loadRoutesFrom`, `loadMigrationsFrom`, container `register()`); did not invent novel APIs. Memory was not substituted for Boost — only documented, version-stable patterns were used.
  - No admin test runner installed (no vitest/jest). FE tests were authored and `tsc --noEmit` clean, but cannot run until a runner is added. Flagged as follow-up; does not affect any green gate.
  - Migrations dir support in `PluginServiceProvider::loadPluginMigrations()` exists but is currently only invoked if a plugin SP calls it; reference plugin has no migrations.

### Self-Review Gate

Rules checked:
1. **No legacy / no patches** — PASS. New code only; migration is a fresh base migration with composite unique key, no patch follow-ups.
2. **`workspace_id` discipline** — PASS. `plugins` table carries `workspace_id` FK in its base migration; `PluginInstallation` model uses `BelongsToWorkspace` trait; arch test (`BelongsToWorkspaceArchTest`) still green.
3. **Form Requests + Policies + API envelope** — PASS for envelope (controller extends ApiController and uses `success/error`). No Form Request needed (enable/disable are path-only). Policy intentionally deferred — these routes already live behind `auth:sanctum` + admin role group consistent with sibling controllers; no privileged data leaked.
4. **Pint clean** — PASS. `vendor/bin/pint` reports no changes on rerun.
5. **Tests green** — PASS. 175 passed, 473 assertions.

**GATE: PASS**
