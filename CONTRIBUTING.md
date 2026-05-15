# Contributing to Relvo AI

Thanks for considering a contribution. The basics:

## Quick start

```bash
git clone https://github.com/relvoai/relvoai
cd relvoai
make setup   # bootstraps api + admin
make dev     # starts everything
make test    # backend Pest + admin tsc must stay green
```

## Repo layout

- `api/` — Laravel 12 backend. App-specific rules in `api/AGENTS.md`.
- `admin/` — React + Vite admin. App-specific rules in `admin/AGENTS.md`.
- `enterprise/` — proprietary; do not contribute community PRs here.
- `packages/widget/` — embeddable widget (placeholder).

## House rules

1. **Tests must pass.** Every PR keeps `make test` green. Behavior changes ship with tests.
2. **Lint clean.** `make lint` (Pint + tsc) must pass. CI enforces.
3. **No legacy / no patches.** New columns go into base migrations, not patch migrations. Backward-compat shims get rejected.
4. **One thing per PR.** Refactors separate from features.
5. **Use Form Requests for validation** and Policies for authorization on the backend.
6. **API responses** follow the envelope `{ "success": true, "data": ..., "message": null }`.
7. **No `env()` outside `config/`** — read config keys via `config('foo.bar')`.

## Commit format

Conventional commits, e.g. `feat(api): add custom AI tool registry`. Squash on
merge.

## Reporting bugs

Open an issue from `.github/ISSUE_TEMPLATE/bug_report.md`.

## Code of Conduct

By participating you agree to [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
