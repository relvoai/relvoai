---
slug: group-7-cloud-bootstrap
type: group-task
created: 2026-05-15
status: blocked
blocker: requires private GitHub repo `relvoai/cloud` to exist + access
parent: upgrade-plan
---

# Group 7 — Private `cloud/` repo bootstrap

**Reference:** `.ai/docs/upgrade.md §2 (private Cloud repo)`

## Scope

Stand up the private repo with the subdomain middleware, Stripe stub, signup placeholder. Cloud goes live AFTER OSS public launch.

## Checklist

- [ ] Create private GitHub repo `relvoai/cloud` (founder action — engineering agent has no GitHub write access).
- [ ] Scaffold: subdomain middleware, signup flow placeholder, Stripe webhook stub, provisioning script.
- [ ] Cloud deployment pulls `api/` + `admin/` + `enterprise/` from the public repo at the release tag, then applies `cloud/` overlay.
- [ ] Document the Cloud deployment runbook in `cloud/README.md`.

## Completion gate

```bash
# In private cloud/ repo:
make setup-cloud-local
curl -sS http://acme.localhost/api/v1/up    # 200, resolves to workspace=acme
curl -sS http://other.localhost/api/v1/up   # 200, resolves to workspace=other
```

## BLOCKED

**requires private GitHub repo to exist + access**

This group cannot start until the founder creates the private GitHub repository
`relvoai/cloud` and grants engineering access. Once the repo exists and the
engineering agent has push access, this task can be unblocked.

Foundation for it is in place after Group 1:
- `workspaces` table + `Workspace::current()` resolver
- `BelongsToWorkspace` trait + arch test guards future drift

Cloud subdomain middleware will plug in via `Workspace::current()` swap.
