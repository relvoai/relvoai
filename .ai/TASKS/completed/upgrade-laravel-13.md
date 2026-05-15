---
slug: upgrade-laravel-13
created: 2026-04-18
updated: 2026-04-18
completed: 2026-04-18
status: completed
---

# Upgrade to Laravel 13

## Why
Laravel 13.5.0 is the latest stable; project was on 12.44.0. Stay current so Boost docs + `Laravel\Ai` SDK are first-class. `laravel/tinker` v3 and `laravel/boost` v2 bumped in same cycle.

## Pre-flight
- Baseline: **97 passed / 253 assertions** (green, 2026-04-18).
- Grep confirmed only ONE breaking-change touch: `config/sanctum.php` `ValidateCsrfToken` alias → `PreventRequestForgery`.
- No `->upsert(` calls; no `array_first`/`array_last` conflicts; cache only stores plain arrays (no `serializable_classes` impact).

## Dependency bumps landed
| Package | From | To |
|---|---|---|
| `laravel/framework` | 12.44.0 | **13.5.0** |
| `laravel/tinker` | 2.10.2 | **3.0.2** |
| `laravel/boost` | 1.8.7 | **2.4.4** |
| `laravel/reverb` | 1.6.3 | 1.10.0 |
| `laravel/sanctum` | 4.2.1 | 4.3.1 |
| `laravel/telescope` | 5.16.0 | 5.20.0 |
| `laravel/mcp` | 0.5.1 | 0.6.7 |
| `laravel/prompts` | 0.3.8 | 0.3.16 |
| `laravel/pail` | 1.2.4 | 1.2.6 |
| `laravel/sail` | 1.51.0 | 1.57.0 |
| `laravel/pint` | 1.26.0 | 1.29.0 |
| `pestphp/pest` | 4.3.0 | 4.6.3 |
| `pestphp/pest-plugin-laravel` | 4.0.0 | 4.1.0 |

New package pulled in by framework: `laravel/sentinel` v1.1.0 (request-forgery hardening dep).

## Checklist
- [x] Baseline green
- [x] Swap `ValidateCsrfToken` → `PreventRequestForgery` in `config/sanctum.php`
- [x] Bump composer constraints (`composer.json`)
- [x] Run `composer update` — clean
- [x] Run full Pest suite — **97 passed / 253 assertions** (Laravel 13.5.0)
- [x] `vendor/bin/pint --dirty` run — style fixes only, no semantic changes
- [x] Self-review gate — PASS
- [x] Move to `completed/`

Skipped: renaming CLAUDE.md's `=== laravel/v12 rules ===` block — Boost ships `.ai/laravel/11` + `.ai/laravel/12` guidelines; no `13` folder yet, so the v12 framework-conventions guidance (directory structure, migrations, models) still applies verbatim to v13. Will re-run `boost:update` in a future session when Boost publishes v13 guidelines.

## Files Changed
- `composer.json` — bumped PHP to ^8.3, bumped 13 framework-family constraints
- `composer.lock` — updated
- `config/sanctum.php` — `ValidateCsrfToken` → `PreventRequestForgery`
- Pint ran across the tree: style-only adjustments (imports ordering, fully-qualified types in docblocks, spacing) — no behaviour changes

## Self-Review Gate

Rules checked:
1. **Tests pass** — 97/97 green on Laravel 13.5.0 ✓
2. **No `$guarded`** — unaffected ✓
3. **`search-docs` / live fetch used before changes** — fetched `laravel.com/docs/13.x/upgrade` via WebFetch (Boost doesn't index the 13.x upgrade guide yet) ✓
4. **Scratch space clean** — nothing written to repo root; `.ai/.tmp/` untouched ✓
5. **Pint clean** — ran `--dirty` ✓

**GATE: PASS**
