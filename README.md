# Relvo AI

> Open-source, AI-first livechat and helpdesk inbox. Laravel + React. Self-host in minutes; upgrade to paid Pro / Enterprise when you need more.

![Screenshots placeholder](docs/screenshots/hero.png)

## What is Relvo AI

A modern customer-support platform that ships AI-out-of-the-box in the free
edition: training on your docs, citations, low-confidence handoff, and a
streaming-reply widget. Pair it with custom AI tools (paid) to let the bot
issue refunds, look up orders, schedule appointments, and more.

## 60-second install

### Docker (recommended)

```bash
git clone https://github.com/relvoai/relvoai
cd relvoai
cp api/.env.example api/.env
docker compose up -d
# Postgres + pgvector + Reverb + Laravel API + Vite admin all boot.
# Admin: http://localhost:3000   API: http://localhost:8000
```

### Non-Docker (contributors)

```bash
git clone https://github.com/relvoai/relvoai
cd relvoai
make setup    # composer install + npm install + .env + key:generate + migrate --seed
make dev      # starts api + queue + reverb + admin Vite concurrently
make test     # backend Pest + admin tsc
```

## Repository layout

```
.
├── api/              Laravel 12 backend (MIT)
├── admin/            React 18 + Vite 6 admin dashboard (MIT)
├── packages/
│   └── widget/       embeddable chat widget bundle — coming soon (MIT)
├── enterprise/       proprietary, license-keyed; see enterprise/LICENSE
├── docker/           Dockerfiles + nginx for compose stack
├── docker-compose.yml
├── docker-compose.prod.yml
├── Makefile
└── .github/workflows/ci.yml
```

## How Relvo AI compares

| | Relvo AI Community (free) | Chatwoot CE | Tawk |
|---|---|---|---|
| AI agent (training, RAG, citations, handoff) | ✓ | ✗ (paid only) | ✗ |
| BYO LLM key (OpenAI, Anthropic, etc.) | ✓ | n/a | n/a |
| Self-host | ✓ | ✓ | ✗ (SaaS only) |
| One-command install | ✓ | ✓ | n/a |
| MIT license | ✓ | ✓ | ✗ |

## Architecture

```
                ┌────────────┐
                │  Visitor   │   embedded widget on any site
                └──────┬─────┘
                       ▼
┌──────────────────────────────────────────────┐
│  admin/  (React + Vite)                      │  ← agents, owners
└──────────────────────────────────────────────┘
                       ▲
                       │  HTTPS + Sanctum Bearer
                       ▼
┌──────────────────────────────────────────────┐
│  api/    (Laravel 12 + Reverb websockets)    │
└─────────┬────────────────────────────────────┘
          ▼
   Postgres + pgvector (RAG) + Redis (queues, cache)
```

## Editions

| Edition | License | Includes |
|---|---|---|
| Community | MIT | Full livechat + 1 AI agent + RAG + handoff + citations + BYO LLM, up to 5 seats |
| Pro       | Proprietary (`enterprise/`) | + Unlimited seats + custom AI tools + simulator + eval + auto-improve + white-label |
| Enterprise| Proprietary (`enterprise/`) | + SSO/SAML + audit log export + advanced RBAC + SLA |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Quick-start:

```bash
make setup
make dev
```

See `api/AGENTS.md` and `admin/AGENTS.md` for app-specific
conventions enforced by automation and reviewers.

## Security

See [SECURITY.md](SECURITY.md).

## License

- Application code under `api/`, `admin/`, and `packages/`: [MIT](LICENSE).
- Code under `enterprise/`: proprietary, requires a paid Enterprise license
  key to run. See [enterprise/LICENSE](enterprise/LICENSE).
