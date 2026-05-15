# Relvo AI monorepo — agent guidance

> **Read this once. Then read the app-specific file for whichever app you're touching.**
> This monorepo holds two apps + an enterprise carve-out. Each app has its own AGENTS.md / CLAUDE.md.
> Cross-app coordination rules below.

## Layout

```
api/            Laravel 12 backend (MIT)         — see api/AGENTS.md
admin/          React 18 + Vite 6 frontend (MIT) — see admin/AGENTS.md
packages/
└── widget/     embeddable chat widget (MIT) — placeholder
enterprise/     Proprietary, license-keyed     — see enterprise/LICENSE
docker/         Compose support
.github/        CI workflows
```

## Workflow for any task

1. **Identify which app you're touching.** `api/`, `admin/`, both, or `enterprise/`.
2. **Read that app's AGENTS.md or CLAUDE.md first.** App rules override generic monorepo rules.
3. **Invoke `/dev-guideline`** before any code change.
4. **Use Laravel Boost MCP** before any Laravel-specific decision in `api/` or `enterprise/`.
5. **Frontend work spawns a dedicated agent** with cwd inside `admin/`. The backend session never edits frontend files directly.
6. **Coordinated full-stack changes:** land the backend contract first in `api/`, then brief the frontend agent with the finalized shape.
7. **Tests stay green.** `make test` from monorepo root must pass before any commit.
8. **`enterprise/` is not for community PRs.** Proprietary code only — see `enterprise/LICENSE`.

## Monorepo commands

```bash
make setup    # full local bootstrap (composer + npm + .env + migrate --seed)
make dev      # api + queue + reverb + admin Vite concurrently
make test     # backend Pest + admin tsc
make lint     # Pint + admin tsc strict
make build    # admin production + widget bundle
make fresh    # migrate:fresh --seed --force (DB reset)
```

## Internal references — all paths are RELATIVE so the monorepo is movable

- From `api/` to admin: `../admin`
- From `admin/` to api: `../api`
- From either to enterprise: `../../enterprise`
- Never hardcode the absolute path of this monorepo anywhere.

## Active master plan

See `.ai/TASKS/active/upgrade-plan.md` for the execution sequence. Active group
task files live in `.ai/TASKS/active/`; completed ones in `.ai/TASKS/completed/`.
