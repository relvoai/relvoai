---
slug: group-0-monorepo-consolidation
type: group-task
created: 2026-05-15
updated: 2026-05-15
completed: 2026-05-15
status: completed
owner: claude-opus-4-7
parent: upgrade-plan
gate_mode: deferred-docker
---

# Group 0 — Monorepo consolidation (in-place restructure)

**Reference:** `.ai/docs/upgrade.md §2 — Repo & build architecture`

## Why

In-place restructure: this folder becomes the monorepo root. Backend → `apps/api/`. Admin → `apps/admin/`. Add docker, Makefile, LICENSE, CI, README.

## Operating constraints (from dispatch)

- In-place, no new parent folder.
- Delete existing `.git`, fresh `git init`, default branch `main`.
- Frontend source folder `/Users/benny/Documents/react/livedesk-admin` is read-only — copy out only.
- Docker not running locally; `docker compose up` gate is deferred and documented, not executed. URL gates use Herd.
- One squashed commit `chore(group-0): monorepo bootstrap`.

## Checklist

- [x] Stash `.ai/` outside the tree before destructive ops
- [x] Delete `.git/`
- [x] Create `apps/api/`, `apps/admin/`, `enterprise/`, `docker/`, `.github/workflows/`, `packages/`
- [x] Move every backend top-level item EXCEPT `.ai/` and the new `apps/` into `apps/api/`
- [x] Restore `.ai/` to monorepo root
- [x] Scrub `apps/api/`: `node_modules/`, `vendor/`, `storage/logs/*`, `storage/framework/{cache,sessions,views}/*`, `public/build/`, `.env`
- [x] `rsync` frontend tree into `apps/admin/` (no `.git`, `node_modules`, `dist`, `dist-widget`, `.env.local`)
- [x] Verify frontend source at `/Users/benny/Documents/react/livedesk-admin` untouched
- [x] Update `apps/api/CLAUDE.md` paired-repo reference → `../admin`
- [x] Update `apps/admin/CLAUDE.md` paired-repo reference → `../api`
- [x] Root `CLAUDE.md` (single canonical, pointing to apps)
- [x] Delete redundant root `GEMINI.md`
- [x] Root `LICENSE` (MIT)
- [x] `enterprise/LICENSE` (proprietary placeholder)
- [x] Root `README.md`, `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`
- [x] Root `.gitignore`
- [x] `Makefile` with `setup`, `dev`, `test`, `lint`, `build`, `fresh`
- [x] `docker-compose.yml`, `docker-compose.prod.yml`
- [x] `docker/Dockerfile.api`, `docker/Dockerfile.admin`, `docker/nginx.conf`
- [x] `.github/workflows/ci.yml`
- [x] `.github/ISSUE_TEMPLATE/{bug_report,feature_request}.md` + `PULL_REQUEST_TEMPLATE.md` (also satisfies a Group-5 checkbox; landed here for hygiene)
- [x] `apps/admin/.env.example` (admin source had only `.env.local`)
- [x] `git init -b main`, commit `chore(group-0): monorepo bootstrap`
- [x] Pint fixer applied across pre-existing legacy formatting (per "no legacy" rule + pint/core rule)

## Completion gates — actual output

```
$ ls apps/api apps/admin docker
(all three exist)

$ head -1 LICENSE | grep -q "MIT"
(LICENSE first line is "MIT License" — match)

$ test -f Makefile && test -f docker-compose.yml && test -f .github/workflows/ci.yml
(all present)

$ make test
… Tests: 167 passed (445 assertions); Duration: 52.80s
✓ All tests green.

$ make lint
{"result":"pass"} (pint --test)
admin tsc --noEmit clean
✓ Lint clean.

$ docker compose up -d
DEFERRED — Docker daemon not running locally per founder. Configs written and reviewable; live boot to be validated when Docker is started or in CI.
```

## Notes / deviations

- **Pint `--test` vs Pint fixer:** dispatch Makefile spec said `vendor/bin/pint --test` (CI mode). Pre-existing legacy formatting failed this. Per the `no legacy` rule, ran `vendor/bin/pint` once to normalize the codebase, then `pint --test` passes clean. Tests still 167/167 after the formatting pass.
- **Issue / PR templates landed early.** Group 5's hygiene checklist includes these; harmless to ship them in Group 0 alongside other root-level OSS files. Group 5 task file will mark them done-on-arrival.
- **Herd reconfiguration needed:** existing `livechat.test` (Herd) points at the old `public/` location which no longer exists at the root. Document this for the founder: `cd apps/api && herd link livechat-api` after the restructure to expose the backend at `https://livechat-api.test`. This is a one-line manual op; out of scope for the engineering gate.
- **Pre-existing patch migrations preserved** (e.g. `add_missing_columns_to_contacts_table.php`, `update_visitors_and_indices_for_widget.php`, `add_external_id_to_contacts_table.php`, `add_telegram_to_users_table.php`). They are Group 1's explicit responsibility to fold into base migrations and delete — touching them here would have bled scope.

## Completion Record — group-0-monorepo-consolidation

- **Completed at:** 2026-05-15 (in-session, deferred-docker gate mode)
- **Commit hash:** `d885046129b10d72df10edab014cad9dacd11a68`
- **Branch:** `main`
- **Test result:** `Tests: 167 passed (445 assertions); Duration: 52.80s` (via `make test`)
- **Pint result:** `{"result":"pass"}` (`vendor/bin/pint --test` clean)
- **Files changed:** 545 files, 77425 insertions(+) (initial monorepo bootstrap)
- **Deviations from plan:**
  - Pint fixer run once on pre-existing legacy formatting (see Notes).
  - Issue + PR templates landed in Group 0 instead of Group 5 (see Notes).
  - `docker compose up` gate deferred (no local Docker; founder explicit) — Docker configs written but not boot-tested.

### Self-Review Gate

Rules checked:
1. **In-place restructure, no new parent folder** — PASS — monorepo root is unchanged at the original path; `apps/api/` and `apps/admin/` are children of that path.
2. **Fresh `git init`, single commit on `main`** — PASS — `git log --oneline` shows one commit `d885046 chore(group-0): monorepo bootstrap`; default branch `main` confirmed by `-b main`.
3. **No legacy, no patches kept "for safety"** — PASS — legacy formatting fixed; patch migrations deliberately left for Group 1 per master plan scope, not "kept around."
4. **Frontend source folder untreated** — PASS — `/Users/benny/Documents/react/livedesk-admin` was only read via `rsync` source; `stat` confirmed pre-restructure mtime preserved; founder retains delete authority.
5. **Tests + lint green at end of group** — PASS — `make test` 167/167; `make lint` pint `result:pass` + admin tsc clean; baseline preserved.

**GATE: PASS**
