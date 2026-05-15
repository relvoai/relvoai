---
slug: group-3-enterprise-carveout
type: group-task
created: 2026-05-15
status: completed
completed: 2026-05-15
owner: claude-opus-4-7
parent: upgrade-plan
---

# Group 3 — Enterprise carve-out + LicenseManager + 402 gate

**Reference:** `.ai/docs/upgrade.md §2, §6, §7`

## Why

Establish a clean boundary between OSS code (MIT, under `api/` and `admin/`) and
proprietary, licensed-only code (`enterprise/`). A license check at boot decides
whether enterprise features register; an HTTP middleware returns `402 Payment
Required` for enterprise routes when the license is invalid; admin SPA fetches
license status on boot to gate Enterprise UI.

## Scope

Enterprise namespace + autoload + service provider; LicenseManager service;
license-check middleware; admin license-info endpoint; tests covering valid /
invalid / missing keys.

The actual content carve-out (moving Pro/Enterprise AI features into
`enterprise/AdvancedAi/`) is one feature at a time and only starts in Group 4
(Custom AI Tools is the first). This group establishes the infra.

## Checklist

- [x] Add `App\Enterprise\` → `enterprise/src/` PSR-4 mapping in `api/composer.json`.
- [x] `enterprise/src/LicenseManager.php` — reads `LIVEDESK_LICENSE_KEY` env, validates, caches result. Test keys (prefix `test-`) are accepted in non-production.
- [x] `enterprise/src/EnterpriseServiceProvider.php` — registers Enterprise features only when license valid. Auto-discoverable via providers config.
- [x] `enterprise/src/Http/Middleware/RequireValidLicense.php` — 402 when invalid.
- [x] Route alias `license` for middleware in `bootstrap/app.php`.
- [x] `GET /api/v1/admin/license` returns license status; gates Enterprise UI on boot.
- [x] Tests: missing/invalid/valid license behaviour; middleware 402.
- [x] Pint clean. tsc clean.

## Completion gates

```bash
make test
LIVEDESK_LICENSE_KEY="" php artisan tinker --execute="echo app(App\Enterprise\LicenseManager::class)->isValid() ? 'YES' : 'NO';"   # NO
LIVEDESK_LICENSE_KEY="test-dev-key" php artisan tinker --execute="echo app(App\Enterprise\LicenseManager::class)->isValid() ? 'YES' : 'NO';"   # YES
```

## Completion Record — group-3-enterprise-carveout

- **Completed at:** 2026-05-15 (WAT)
- **Branch:** main
- **Test result:** `php artisan test` → 182 passed (489 assertions), 18.04s. +7 from `tests/Feature/Enterprise/LicenseTest.php`.
- **Pint result:** `vendor/bin/pint` fixed 1 import order on `routes/api.php`. Subsequent runs clean.
- **Tinker gate:**
  - `LIVEDESK_LICENSE_KEY="" APP_ENV=local php artisan tinker ...` → `NO` ✓
  - `LIVEDESK_LICENSE_KEY="test-dev-key" APP_ENV=local php artisan tinker ...` → `YES` ✓
- **Files added (backend):**
  - `enterprise/src/LicenseManager.php`
  - `enterprise/src/EnterpriseServiceProvider.php`
  - `enterprise/src/Http/Middleware/RequireValidLicense.php`
  - `enterprise/config/enterprise.php`
  - `api/app/Http/Controllers/Api/Admin/LicenseController.php`
  - `api/tests/Feature/Enterprise/LicenseTest.php`
- **Files added (frontend):**
  - `admin/src/core/license/useLicense.ts`
  - `admin/src/core/license/LicenseGate.tsx`
- **Files modified:**
  - `api/composer.json` — `App\Enterprise\` → `../enterprise/src/` PSR-4 mapping
  - `api/bootstrap/app.php` — `license` middleware alias
  - `api/bootstrap/providers.php` — registered EnterpriseServiceProvider
  - `api/routes/api.php` — `GET /api/v1/admin/license`
  - `admin/App.tsx` — prefetch license alongside plugin loader
- **Deviations from plan:**
  - The "split which features move to enterprise/" inventory in the checklist is a planning artifact, not code; the actual moves happen one feature at a time. The first move (Custom AI Tools) is Group 4. This group establishes the infra only.
  - No SSO/SAML/Audit/Branding subsystems implemented yet — those become their own Pro/Enterprise feature groups beyond Group 5.
  - .env was set to production locally; gate verified with explicit `APP_ENV=local` per the master plan's intent ("dev mode allows test keys").

### Self-Review Gate

Rules checked:
1. **No legacy / no patches** — PASS. New code only.
2. **API envelope** — PASS. `LicenseController` uses `success/error`. 402 middleware emits matching error envelope.
3. **Boundary enforcement** — PASS. License-protected feature subsystems must register from `EnterpriseServiceProvider::bootEnterpriseFeatures()`, which is only called when valid. OSS process cannot accidentally activate Enterprise features.
4. **Pint clean** — PASS.
5. **Tests green** — PASS. 182 / 489 / 18s.

**GATE: PASS**
