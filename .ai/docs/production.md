# RelvoAI — Production endpoints & domain map

> Single source of truth for production-facing domains, hosts, URLs, and the routing patterns built on top of them. Any environment, CORS, OAuth callback, license server, or webhook configuration that needs a public hostname reads from this file.

Last updated: 2026-05-15.

---

## Domain assignments

| Domain | Purpose | Repo serving it | Tech |
|---|---|---|---|
| `relvoai.com` | Marketing site, landing pages, pricing, blog | private Cloud repo → `web/` | Next.js (App Router) |
| `docs.relvoai.com` | Public product docs, API reference, install guide | private Cloud repo → `web/docs` (or a Docusaurus/Mintlify deploy) | Next.js or Mintlify |
| `app.relvoai.com` | Cloud SaaS — the authenticated product | public repo → `admin/` (Vite SPA) + private Cloud overlay on `api/` | React 18 + Vite 6 |
| `app.relvoai.com/api/v1/*` | Cloud API endpoint | public repo → `api/` (Laravel) + Cloud overlay | Laravel 13 |
| `app.relvoai.com/reverb/*` | Cloud websocket endpoint | public repo → Reverb | Laravel Reverb |
| `cdn.relvoai.com` *(optional)* | Embeddable widget bundle delivery | published from `admin/src/widget/` | static IIFE bundle (`relvo.js`) |

Self-hosters use their own domain. Nothing in the codebase hard-codes a relvoai.com host — every reference reads from env vars.

---

## URL patterns (Cloud only)

### Marketing site
```
https://relvoai.com/
https://relvoai.com/pricing
https://relvoai.com/blog/{slug}
https://relvoai.com/customers/{slug}
https://relvoai.com/signup           → POST signup → redirect to app.relvoai.com/workspace/{id}
https://relvoai.com/login             → redirects to app.relvoai.com/login
```

### Docs site
```
https://docs.relvoai.com/
https://docs.relvoai.com/{section}/{page}
https://docs.relvoai.com/api          → Scramble-generated API reference
```

### Cloud SaaS — authenticated product
```
https://app.relvoai.com/login
https://app.relvoai.com/workspaces                                   list of workspaces this user belongs to
https://app.relvoai.com/workspace/{id}                               dashboard for workspace {id}
https://app.relvoai.com/workspace/{id}/conversations
https://app.relvoai.com/workspace/{id}/conversations/{convId}
https://app.relvoai.com/workspace/{id}/ai-agents
https://app.relvoai.com/workspace/{id}/ai-agents/{agentId}/training
https://app.relvoai.com/workspace/{id}/channels
https://app.relvoai.com/workspace/{id}/settings/{section}
```

Path-based, NOT subdomain-based. Single domain, single SSL cert, single set of cookies. No DNS automation needed per tenant.

### Cloud API
```
https://app.relvoai.com/api/v1/me
https://app.relvoai.com/api/v1/admin/conversations             requires X-Workspace-Id header
https://app.relvoai.com/api/v1/admin/ai-agents                 requires X-Workspace-Id header
https://app.relvoai.com/api/v1/public/widget/bootstrap         no workspace header; workspace resolved via channel_key
```

The Cloud Tenancy middleware (in the private overlay) reads `X-Workspace-Id` on every admin API call OR extracts it from the JWT/session if added to the auth payload. Public widget endpoints resolve workspace via the channel's owning workspace, not a header.

### Reverb (websocket)
```
wss://app.relvoai.com/reverb
```

Channel naming includes workspace id:
```
private-workspace.{id}.conversations.{convId}
private-workspace.{id}.admin.visitors
private-workspace.{id}.admin.conversations
```

---

## Workspace IDs

- Type: `bigint`
- Postgres sequence: `START 10000`
- Self-host singleton workspace id: `10000`
- Cloud tenants: `10001, 10002, 10003, ...`

URL format `app.relvoai.com/workspace/10037` is the canonical user-facing reference. Internal API references use `X-Workspace-Id: 10037` header or `workspace_id=10037` body param.

---

## CORS configuration (Cloud)

| Origin | Allowed for |
|---|---|
| `https://relvoai.com` | Public widget endpoints (bootstrap, message, etc.) when embedded on relvoai.com itself — usually irrelevant |
| `https://app.relvoai.com` | Admin API endpoints. Same-origin, but explicit for clarity. |
| `*` (any) | Public widget endpoints (`/api/v1/public/widget/*`) — the widget loads on customers' sites |
| `https://*.{customer-domain}` per channel | Per-channel `config.allowed_domains` allowlist if set (production strict mode) |

Implementation: `widget-cors` middleware + per-channel domain validation in `BootstrapController` (already shipped).

---

## SSL / certificates

- `relvoai.com`, `app.relvoai.com`, `docs.relvoai.com`, `cdn.relvoai.com` — issued via Let's Encrypt (or Cloudflare-managed) with auto-renew.
- **No wildcard cert needed** since we are not using subdomain-per-tenant.

---

## Authentication / cookies

- Sanctum Bearer tokens for API calls.
- Session cookies, if used by Next.js `web/` for signed-in marketing experience, are scoped to `.relvoai.com` so `app.relvoai.com` and `relvoai.com` share auth state on the Cloud signup → app handoff.
- CSRF protection enabled on `web/` signup endpoints; Sanctum API tokens are stateless and don't carry CSRF concerns.

---

## OAuth callbacks (placeholder)

| Provider | Callback URL |
|---|---|
| Google (if added) | `https://app.relvoai.com/auth/oauth/google/callback` |
| GitHub (if added) | `https://app.relvoai.com/auth/oauth/github/callback` |
| Slack (channel integration) | `https://app.relvoai.com/api/v1/webhooks/slack` |

---

## License server (for self-host Pro/Enterprise activation)

- Endpoint: `https://app.relvoai.com/api/v1/license/validate` (or a dedicated `license.relvoai.com` if separated later)
- Public-key signed responses, 24-hour cache, online activation per workspace.

---

## Webhook endpoints (Cloud only)

| Webhook | URL | Source |
|---|---|---|
| Stripe events | `https://app.relvoai.com/api/v1/webhooks/stripe` | private Cloud overlay |
| Telegram (per channel) | `https://app.relvoai.com/api/v1/webhooks/telegram/{channelKey}` | existing public api |
| Provider AI status | `https://app.relvoai.com/api/v1/webhooks/ai/{provider}` *(future)* | private Cloud overlay |

---

## What stays self-host-friendly

Every URL above is owned by RelvoAI Cloud. Self-hosters configure their own:
- `APP_URL` (their host)
- `APP_NAME` (their brand)
- CORS allowlist
- Reverb host
- License key (Pro/Enterprise) → activates against `app.relvoai.com/api/v1/license/validate`

Self-host code never assumes any relvoai.com hostname; this file is purely for the Cloud product.

---

## Cross-references

- Strategy → `.ai/docs/upgrade.md`
- Locked architecture decisions → `.ai/docs/upgrade-update.md`
- Execution plan → `.ai/TASKS/active/upgrade-plan.md`
