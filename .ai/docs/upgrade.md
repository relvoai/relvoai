# LiveDesk — Open-Source Direction & Upgrade Plan

> Strategic reference. Authoritative source for license, architecture, pricing, and execution order. Every decision below is grounded in what successful open-core companies actually do, not theory.

---

## 1. License & legal moat

| Decision | Detail |
|---|---|
| **Core license** | **MIT** — maximum adoption velocity; enterprise legal teams accept it by default. Pattern Chatwoot ran on for 6 years to ~$5M ARR. |
| **Enterprise license** | Proprietary, separate file under `enterprise/LICENSE` — proprietary code visible in the public repo but requires a paid license key to run. |
| **Cloud-only code** | Lives in a separate **private repo** (`livedesk/cloud`) — never published. Contains billing, provisioning, signup, subdomain routing, anti-abuse. |
| **Trademark** | Register the product name. MIT allows forks; trademark stops forks from using your brand. |

### The five-layer lock against SaaS resale (no AGPL needed)

1. **Trademark** on product name — forks must rebrand to avoid infringement.
2. **Proprietary Enterprise plugin** under `enterprise/` — license-keyed, validates ONE workspace per install. Pirate forks lose every paid feature (custom AI tools, simulator, SSO, etc.).
3. **Private `cloud/` repo** — signup, billing, provisioning, anti-abuse. A self-hoster building competing SaaS has to rebuild ~3 months of work from scratch.
4. **Brand + Cloud quality + support + ecosystem** — the real, durable moats.
5. **License-key check + telemetry** on Enterprise plugin — pirated keys detected; takedowns issued.

**What this explicitly does NOT do (and why that's fine):**
A determined bad actor with MIT can technically clone, rebrand, and host. Chatwoot has experienced this for 6 years; it has not meaningfully damaged their business. Rebranders target customers who would never have paid us anyway. The adoption velocity gained from MIT is worth more than the marginal protection AGPL would add.

**Verified pattern:** Chatwoot (2017–2023 MIT), PostHog (Years 0–5 MIT), Sentry (Years 0–10 BSD). All started permissive, tightened only at $5M+ ARR scale. Loosening later is impossible; tightening later is normal.

---

## 2. Repo & build architecture — monorepo

**Single public monorepo containing backend, admin frontend, widget, and `enterprise/`.** Industry standard for OSS livechat / B2B (Chatwoot, Cal.com, PostHog, n8n, Mautic, GitLab, Sentry — all monorepos). One-command setup is the #1 predictor of OSS adoption; two-repo setups break this immediately.

```
livedesk/livedesk                 (PUBLIC monorepo)
├── api/                          Laravel backend (MIT)
├── admin/                        React + Vite admin frontend (MIT)
├── packages/
│   └── widget/                   embeddable chat widget bundle (MIT)
├── enterprise/                   Proprietary, license-keyed
│   ├── AdvancedAi/               custom tools, simulator, eval, auto-improve, long-term memory, multi-step
│   ├── Auth/                     SSO/SAML
│   ├── Audit/                    audit log export, advanced RBAC
│   └── Branding/                 white-label removal
├── docker/
│   ├── Dockerfile.api
│   ├── Dockerfile.admin
│   └── nginx.conf
├── docker-compose.yml            local dev — boots Postgres + Reverb + api + admin
├── docker-compose.prod.yml       production reference
├── Makefile                      `make setup`, `make dev`, `make test`, `make build`
├── README.md
├── LICENSE                       MIT (covers api/ + admin/ + packages/)
├── CONTRIBUTING.md
├── SECURITY.md
└── .github/workflows/            CI: tests + Pint + tsc on every PR

livedesk/cloud                    (PRIVATE repo, never published)
├── Tenancy/                      subdomain middleware, workspace switching, provisioning
├── Billing/                      Stripe, invoices, dunning
├── Signup/                       onboarding flow
└── AntiAbuse/                    rate limits, ban hammer, support tooling
```

### One-command setup — the adoption lever

**Docker (recommended for OSS adopters):**
```bash
git clone https://github.com/livedesk/livedesk
cd livedesk
cp .env.example .env
docker compose up
# Postgres + pgvector + Reverb + Laravel api + Vite admin + queue worker all boot.
# open http://localhost:8000
```

**Non-Docker (for contributors):**
```bash
git clone https://github.com/livedesk/livedesk
cd livedesk
make setup    # composer install + npm install in both + migrate + seed
make dev      # starts everything concurrently
make test     # backend Pest + frontend tsc + lint
```

### Three deployment modes from one codebase

| Mode | Build | Active workspaces | Who runs it |
|---|---|---|---|
| Single-tenant self-host (free Community) | `api/` + `admin/` + `packages/` only | exactly 1 (singleton row, id=1) | Self-hosters |
| Single-tenant self-host (paid Pro/Enterprise) | `api/` + `admin/` + `packages/` + `enterprise/` | exactly 1 (license-key enforced) | Self-hosters with paid plugin |
| Multi-tenant cloud | `api/` + `admin/` + `packages/` + `enterprise/` + `cloud/` | N | Us only |

**Pattern verified by:** GitLab (`ee/` directory + private `.com` infra), Chatwoot (monorepo + `enterprise/` + private Cloud), Cal.com (monorepo + Enterprise Edition + Cloud), n8n (monorepo + paid enterprise + Cloud).

### One-time migration to the monorepo (~6 hours)

| Step | Effort |
|---|---|
| Create new monorepo root, init git | 5 min |
| Move current backend into `api/` via `git subtree --rejoin` (preserves history) | 30 min |
| Move current `livedesk-admin` into `admin/` via `git subtree --rejoin` | 30 min |
| Update `CLAUDE.md` cross-references to relative paths | 15 min |
| Write `Makefile` (setup/dev/test/build) | 1 hour |
| Write `docker-compose.yml` orchestrating Postgres + Reverb + api + admin | 2 hours |
| Write `docker-compose.prod.yml` reference | 1 hour |
| Update CI workflows for new layout (PHP + Node in one workflow) | 1 hour |
| Verify all 167+ tests pass + admin dev server starts in new layout | 30 min |

**Deferred until later:** moving `admin/src/widget/` out into `packages/widget/`. Move first, refactor later.

---

## 3. Multi-tenancy — single DB + `workspace_id`

**Single Postgres database, `workspace_id` on every model, Eloquent global scope.** Industry standard (Chatwoot, GitLab, Slack, Notion, Linear, Forge).

### How it works

```
HTTP request → Subdomain middleware (private cloud/) → sets current_workspace()
                                                     ↓
                          Global Eloquent scope auto-applies
                          where workspace_id = current_workspace()->id
                                                     ↓
                          Queries return only this workspace's data
```

**Single-tenant code path** (free + paid self-host): the middleware is a no-op; `current_workspace()` returns the seeded singleton (id=1). Owner never sees workspace settings.

**Multi-tenant code path** (our Cloud only): the subdomain middleware (from private `cloud/`) resolves `acme.livedesk.app` → workspace=acme → sets context. Same code, different middleware stack.

### Retrofit plan (folds into the "no legacy" migration pass)

| Change | Where |
|---|---|
| `workspaces` table | New base migration |
| `workspace_id` FK on every domain table | Folded into each table's base migration |
| `BelongsToWorkspace` trait → Eloquent global scope | New trait, applied to every model |
| `Workspace::current()` helper | New service |
| Subdomain middleware | Private `cloud/` repo only |
| Sanctum token carries `workspace_id` | Token model + middleware |
| Reverb channels namespaced (`workspace.{id}.conversations.{id}`) | Channel auth update |
| Pest arch test: every model uses `BelongsToWorkspace` | Test class — prevents future drift |
| Seeded singleton workspace on install | `WorkspaceSeeder` |

### Why single DB beat per-tenant DB for our scale

| | Single DB + `workspace_id` (chosen) | Per-tenant DB |
|---|---|---|
| Migration | One command, one DB | N commands across N DBs; drift risk |
| Backups | Standard | N times the operational complexity |
| Cross-tenant admin queries | Trivial | Requires federation |
| Data leak risk | Mitigated by global scope + Pest arch test | Physically impossible — but at the cost of all above |
| Operational sanity at 500+ tenants | ✅ Standard SaaS | ❌ Real headache |

---

## 4. Framework decision

| Question | Answer |
|---|---|
| Stay on Laravel? | **Yes.** Framework isn't what determines OSS success. |
| Stay on Postgres + pgvector? | **Yes.** Industry standard for RAG. |
| Stay on React + Vite admin? | **Yes.** |
| Reverb for websockets? | **Yes.** Adequate at our scale. |

**Verified Laravel OSS at scale:** Faveo Helpdesk, Bagisto, BookStack, Pterodactyl, Cachet, Snipe-IT, Krayin CRM.

---

## 5. Plugin architecture (BE + FE)

### Backend plugins

- **Convention:** `plugins/{slug}/` folder. Each ships a `plugin.json` manifest.
- **Manifest declares:** name, version, requires (PHP/Laravel/core versions), capabilities (`routes`, `migrations`, `views`, `service-provider`, `tools`, `permissions`), frontend bundle URL.
- **No runtime composer.** A custom `PluginManager` service loads enabled plugins on boot, runs their service provider, registers routes/middleware/views/migrations.
- **Verified pattern:** Statamic addons, Bagisto packages, WordPress plugins, Pterodactyl extensions.

### Frontend plugins

- **Approach:** Slot/contribution registry (NOT Vite Module Federation — too coupled to build versions).
- **Host defines slots:** `sidebar.section`, `conversation.tab`, `settings.section`, `widget.message-renderer`, `ai.tool`.
- **Plugins ship a JS bundle (UMD/ESM)** loaded dynamically. They call `window.LiveDesk.register({ slot, component, when })`.
- **Verified pattern:** Backstage (Spotify), Atlassian Forge, WordPress Gutenberg blocks.

### Web-based install (Dokploy/WordPress style — done safely)

| Step | Why |
|---|---|
| Upload signed zip | Maintainer signature verified before extraction |
| Manifest declares permissions up front | Admin sees consent prompt (this plugin wants to: read users, add 3 routes, register an AI tool) |
| Staged install | Extract to `plugins/{slug}.staging/`, run pre-install checks, atomic rename, enable. Reversible |
| Privileged worker user owns `plugins/` — NOT web user | WordPress' biggest mistake. Real fix: separate system user |
| DB + filesystem snapshot before every install/update | One-click rollback |
| Plugin's tests run in staging before activation | Block bad updates |
| Per-plugin kill switch (disable without uninstalling) | Bad plugin can't brick the admin |
| Audit log for every plugin event | Operator can debug |
| Emergency-disable signal pushed to all installs | When a plugin gets pwned, kill it everywhere |

**Verified safe pattern:** Cloudron, YunoHost. **Don't copy:** WordPress (web user owns its own code = persistent compromise).

---

## 6. Pricing — refined after benchmarking Chatwoot

### Cloud SaaS (multi-tenant, per-agent — industry standard)

| Plan | Price | Agents | Conversations | AI agents | Custom AI tools | SSO | Notes |
|---|---|---|---|---|---|---|---|
| **Free** | $0 | 2 | 500/mo | 1 | ✗ | ✗ | "Powered by" footer |
| **Starter** | $15/agent/mo | unlimited | Unlimited | 1 + 300 LLM credits | ✗ | ✗ | All channels, help center |
| **Growth** | $35/agent/mo | unlimited | Unlimited | 3 + 500 credits | ✓ | ✗ | Teams, automation, simulator, eval |
| **Scale** | $89/agent/mo | unlimited | Unlimited | unlimited + 1000 credits | ✓ | ✓ | White-label, audit logs |
| **Enterprise** | custom | unlimited | unlimited | unlimited | ✓ | ✓ | DPA, SLA |

**Anchor points:** Chatwoot $19/$39/$99, LiveChat $20–41/seat.

### Self-host (per-agent license)

| Edition | Price | Includes | Anchor |
|---|---|---|---|
| **Community Edition** | $0 (MIT) | Full livechat + 1 AI agent + training + handoff + citations + BYO LLM + 5 seats + "Powered by" footer | Chatwoot CE = much weaker (no AI) |
| **Pro Edition** | ~$19/agent/mo billed annually | + Unlimited seats + unlimited AI agents + **custom AI tools** + simulator + eval + auto-improve + white-label | Chatwoot Premium $19/agent/mo |
| **Enterprise Edition** | ~$99/agent/mo billed annually | + SSO/SAML + audit log export + advanced RBAC + SLA + priority support | Chatwoot EE $99/agent/mo |

**Our key wedge:** Chatwoot self-host **does not include AI** at any tier without paying. Our **free Community Edition includes AI**. That alone is enough to win the OSS "AI livechat" slot.

---

## 7. Feature split — what's free vs paid

| Feature | Core (free) | Pro | Enterprise | Why this line |
|---|---|---|---|---|
| Livechat + widget + channels | ✓ | ✓ | ✓ | Core product |
| Up to 5 human agents (self-host) / 2 (cloud free) | ✓ | unlimited | unlimited | Standard seat-based gate |
| 1 AI agent | ✓ | unlimited | unlimited | Most owners only run 1; unlimited unlocks multi-brand |
| RAG training (PDF/text/URL) | ✓ | ✓ | ✓ | Without it, AI hallucinates — must be free |
| Handoff (tool, keyword, low-confidence) | ✓ | ✓ | ✓ | Trust signal — must be free |
| Citations in bot replies | ✓ | ✓ | ✓ | Trust signal — must be free; unique vs Chatwoot |
| BYO LLM key (OpenAI, Anthropic, etc.) | ✓ | ✓ | ✓ | Always |
| Streaming replies, dark mode, modern widget | ✓ | ✓ | ✓ | Table stakes for modern UX |
| 25 knowledge sources per agent / 100 MB | ✓ | unlimited | unlimited | Generous free limit |
| "Powered by LiveDesk" footer | shown | removable | removable | Branding lever |
| Basic reports | ✓ | ✓ | ✓ | Table stakes |
| **— upgrade trigger line —** | | | | |
| 🔑 **Custom AI tools** (AI executes refunds, lookups, cancellations) | ✗ | ✓ | ✓ | **Biggest upgrade reason.** Intercom Fin charges $0.99/resolution for this |
| 🔑 Conversation simulator + A/B test instructions | ✗ | ✓ | ✓ | Removes deployment fear |
| 🔑 Eval framework + auto-improve loop | ✗ | ✓ | ✓ | Closed-loop AI quality |
| 🔑 Long-term visitor memory | ✗ | ✓ | ✓ | Cross-conversation context |
| 🔑 Multi-step agent planning | ✗ | ✓ | ✓ | True "agentic" behavior |
| Skills-based routing + advanced rules | round-robin | ✓ | ✓ | Team productivity |
| Advanced analytics + CSAT/NPS | basic | ✓ | ✓ | Team productivity |
| Email support | community | ✓ | priority SLA | Standard |
| SSO / SAML | ✗ | ✗ | ✓ | Enterprise compliance |
| Audit log export + advanced RBAC | ✗ | ✗ | ✓ | Enterprise compliance |
| Per-tenant data residency, DPA | ✗ | ✗ | ✓ | Enterprise procurement |

---

## 8. Honest risk grading — what's actually hard

| Piece | Risk | Real effort |
|---|---|---|
| Migration consolidation + comment sweep | ✅ De-risked | ~1 day |
| MIT + trademark + license-key check on Enterprise plugin | ✅ De-risked | ~1 week |
| AI in core (training/RAG/handoff/citations) | ✅ **Already shipped + smoke-tested live with OpenAI** | done |
| OSS hygiene (LICENSE, CONTRIBUTING, CI, README, DemoSeeder) | ✅ De-risked | ~1 week |
| **Workspace_id retrofit** (every model, every query, scoping tests) | ⚠️ **Real engineering** | 4–6 weeks careful work + comprehensive tests |
| Backend plugin manager (manifest loader, service provider registration) | ⚠️ Medium | 2–3 weeks |
| **Frontend slot registry + dynamic JS bundle loading** | ⚠️ Medium-high | 3–4 weeks v1; ongoing as plugins exercise it |
| Custom AI tools (paid feature, the wedge) | ⚠️ Medium | 2–3 weeks framework + ongoing docs |
| Conversation simulator + eval framework + auto-improve | ⚠️ Medium | 4–6 weeks combined |
| Long-term visitor memory | ⚠️ Low-medium | 1–2 weeks |
| Multi-step planning | ✅ Mostly free | ~1 week — Laravel AI SDK supports `MaxSteps` |
| **Web-based install (safe)** | ⚠️ **High** | 4–6 weeks; one CVE here destroys trust |
| **Cloud SaaS (Stripe + signup + provisioning + anti-abuse)** | ⚠️ High | 6–10 weeks; small startup on its own |
| Plugin marketplace (later) | ⚠️ High | 3–6 months; whole product |

### Total real effort, calibrated
- **Solo developer, full-time, no surprises:** 9–12 months to launch with Cloud.
- **Solo, full-time, with realistic surprises:** 14–18 months.
- **2-person team:** 5–7 months.
- **Just OSS launch (no Cloud yet):** 3–4 months solo.

### Failure modes ranked
| Failure mode | Real probability | Mitigation |
|---|---|---|
| **Founder burnout** | **highest** — kills more OSS than anything | Ship in milestones, take breaks, find a co-maintainer by month 6 |
| Workspace-scoping bugs leak data between workspaces | high if rushed | Mandatory Pest arch test fails any model query missing the scope |
| Plugin install CVE | medium | Don't skip signed-package + privileged-worker steps |
| Plugin ecosystem doesn't materialize | medium | Marketplace is post-launch; doesn't block v1 |
| Chatwoot ships native AI before us | medium | Move now; window is real |
| OpenAI changes pricing/access | low (Laravel AI SDK abstracts providers) | Multi-provider failover already in place |

---

## 9. Realistic trajectory — verified vs comparable OSS

| Period | Honest expectation | Reference |
|---|---|---|
| Months 0–3 | Ship v1, write docs, get to 500 stars | Plausible Year 0 |
| Months 3–12 | 1,000–3,000 stars, first paying customers ($1–10k MRR) | Cal.com Year 1 |
| Year 2–3 | 5–15k stars, $50k–500k ARR if Cloud + Pro plugin ship | Chatwoot Year 2–3 |
| Year 4–5 | $1M–$5M ARR if you survive and ship consistently | Chatwoot today (~$5–10M ARR) |
| Tail risk: Sentry/PostHog-tier ($25M+ ARR) | low single digits | n=2 in this niche |

**Best probability multiplier:** ship a working AI-first OSS livechat with one-command install before any competitor in 2026. The slot is open.

---

## 10. Pre-launch hygiene (must ship before going public)

### Code

- [ ] Sweep every `// Wait`, `// Note`, scaffolding comment from controllers and migrations
- [ ] Normalize `App\Models` namespace nesting (decide flat vs nested, apply consistently)
- [ ] Move `App\Jobs\SummarizeConversationJob` into `App\Jobs\Ai\` for consistency
- [ ] Centralize `broadcast(new MessageCreated(...))` — currently called from 4 places; move to a model observer
- [ ] First-class columns for over-used `meta` junk drawer (specifically `ai_handoff` on conversations)
- [ ] Consolidate `AGENTS.md` / `CLAUDE.md` / `GEMINI.md` — pick one canonical file
- [ ] Gitignore `.ai/` except `guidelines/`

### Migrations (no legacy — fold patches into base + add `workspace_id`)

- [ ] Add `workspaces` table migration
- [ ] Add `workspace_id` FK to every domain table — in each table's base migration, not as a patch
- [ ] Fold `add_missing_columns_to_contacts_table` + `add_external_id_to_contacts_table` into `create_contacts_table`
- [ ] Fold `update_visitors_and_indices_for_widget` into `create_visitors_table`
- [ ] Fold `add_telegram_to_users_table` into `create_users_table`
- [ ] Delete the patch migration files
- [ ] `php artisan migrate:fresh --seed` once to confirm green
- [ ] Re-run full test suite green (167+ assertions)

### OSS hygiene

- [ ] `LICENSE` at root (**MIT** text)
- [ ] `enterprise/LICENSE` (proprietary text — start with the "LiveDesk Enterprise License" template)
- [ ] `CONTRIBUTING.md`
- [ ] `CODE_OF_CONDUCT.md` (Contributor Covenant)
- [ ] `SECURITY.md` with disclosure email
- [ ] `.github/workflows/` running tests + Pint on every PR
- [ ] `ISSUE_TEMPLATE/` + `PULL_REQUEST_TEMPLATE.md`
- [ ] `README.md` rewrite — screenshots, 60-sec install, comparison table vs Chatwoot/Tawk, architecture diagram
- [ ] `DemoSeeder` — one command produces a populated demo (admin + agent + inbox + AI agent with sample knowledge + sample conversations)
- [ ] Public roadmap (GitHub Projects)

### Security

- [ ] Content moderation pass on visitor messages before they reach the LLM (OpenAI's free moderation endpoint)
- [ ] Rate-limit AI replies per conversation (cost-bombing defense)
- [ ] Env-guard `dev:token` artisan command — refuse to run in `APP_ENV=production`
- [ ] Split CORS: widget endpoints `*`, admin endpoints same-origin only
- [ ] Plugin install: signed packages + privileged worker + snapshots + kill switch (don't copy WordPress)
- [ ] Trademark search + filing for product name

---

## 11. Execution order

When user gives a "go", run these in sequence. Each one ends with a green test suite + Pint clean + task file in `completed/`.

0. **Monorepo consolidation** — move backend → `api/`, admin → `admin/`, add root `Makefile` + `docker-compose.yml` + `.github/workflows/`. Every subsequent step assumes the new layout. ~6 hours.
1. **Migration consolidation + workspace_id retrofit + comment sweep + OSS hygiene baseline** (the "no legacy" pass)
2. **Plugin architecture** — BE manifest loader + FE slot registry + one reference plugin
3. **Move Pro/Enterprise features into `enterprise/`** + proprietary license file + license-key check
4. **Ship first paid feature under `enterprise/`** — Custom AI Tools (the biggest paid wedge)
5. **Pre-launch hygiene** — LICENSE (MIT), CONTRIBUTING, SECURITY, README rewrite, DemoSeeder, CI
6. **Trademark search + filing** for product name
7. **Private `cloud/` repo bootstrap** — subdomain middleware, Stripe stub, signup placeholder (Cloud comes after public OSS launch)
8. **Public launch** — Show HN, Product Hunt, Twitter, comparison post vs Chatwoot

---

## 12. Open decisions still owed by founder

- **Product name** (for trademark search before launch).
- **Domain** for marketing site and Cloud (e.g. `livedesk.app` / `livedesk.io`).
- **Confirm MIT** (vs Apache 2.0, BSL — MIT is recommended above).
- **Pricing anchors confirmed** (Chatwoot $19/$99 anchors adopted — confirm).
- **First-launch market focus** (SMB? Indie SaaS? Specific vertical?).
- **OpenAI/provider key strategy on Cloud** (resell LLM credits, or pass-through?).

---

## Document status

Last updated: 2026-05-15. Verified against Chatwoot Cloud + self-host pricing screenshots. License model revised from AGPL → MIT after weighing adoption velocity vs SaaS-resale protection (MIT chosen; trademark + proprietary plugin + private Cloud repo cover the lock). Multi-tenancy model revised from per-tenant DB → single DB + `workspace_id` after weighing operational cost at scale. Repository layout revised to monorepo (`api/` + `admin/` + `packages/widget/` + `enterprise/`) to match Chatwoot/Cal.com/PostHog/n8n pattern and enable one-command setup. Monorepo consolidation added as Step 0 of execution order.
