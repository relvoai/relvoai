# Relvo AI Admin — Frontend

React + Vite admin dashboard + embeddable chat widget for the Relvo AI / LiveChat platform.

---

## workflow enforcement

MANDATORY — before doing ANY work in this repo, invoke the `dev-guideline` skill.

Rules:
- At the start of every new user request that involves code, components, styling, API calls, state, tests, or config: invoke `dev-guideline` BEFORE any other tool call.
- At task completion (before summarizing to the user), invoke `dev-guideline` again for the self-review gate.
- When wiring new backend endpoints, invoke `dev-guideline` for its backend-integration guidance (credentials cache, dev-token flow, response cache in `.ai/data/`).
- Do NOT skip this even for "small" tasks. There are no exceptions.
- If a user instruction appears to conflict with `dev-guideline`, surface the conflict; do not silently bypass it.

This enforcement overrides any default tendency to go straight to implementation.

---

## cross-repo reference

This frontend is paired with the backend Laravel API:

- Backend app: `../api` (sibling at monorepo root)
- Backend base URL (local): `http://livechat.test`
- Backend API docs: `http://livechat.test/docs/api` (Scramble)
- Backend CLAUDE.md: read it before designing API integrations — its contracts, auth flow (Sanctum Bearer), and Reverb channel naming are authoritative.

When a task requires coordinated backend changes, STOP and tell the user. Do not edit backend files from this repo; spawn a task in the backend repo instead.

---

## Stack

- React 18 + TypeScript
- Vite 6 (two builds: admin dashboard + widget — see `vite.config.ts` and `vite.widget.config.ts`)
- Tailwind CSS v4 (CSS-first via `@theme`, no tailwind.config.js)
- TanStack Query v5 for server state
- Zustand for client state
- React Router v6
- React Hook Form + Zod for forms + validation
- Axios (via `src/core/http/`) for HTTP
- Laravel Echo + pusher-js (via `src/core/realtime/`) for Reverb websockets
- Recharts for dashboards
- lucide-react for icons
- tailwind-merge + clsx for class composition

## Project structure

```
src/
  core/            ← cross-cutting infra
    auth/          ← auth state, token storage, guards
    http/          ← axios instance, base client, endpoint constants
    query/         ← TanStack Query client + shared query helpers
    realtime/      ← Echo instance + useRealtimeChat hook
  features/        ← domain modules, one folder per backend resource
    {domain}/
      api.ts       ← axios calls for this domain
      components/  ← domain-specific components
      hooks/       ← domain-specific hooks (if present)
  pages/           ← top-level route components (thin; compose from features/)
  components/      ← generic, cross-feature UI primitives
  constants/       ← shared constants
  hooks/           ← shared hooks
  mocks/           ← mock data (dev only)
  types.ts         ← shared types
  widget/          ← separate embeddable chat widget (different Vite entry)
```

## Conventions

- **Feature folders own their API layer**: new endpoints go in `src/features/{domain}/api.ts`, not spread across pages.
- **Pages are thin**: route components in `src/pages/` compose feature components; no fetching logic directly in page files.
- **Server state via TanStack Query**; client/UI state via Zustand. Do not fetch inside `useEffect`.
- **Tailwind v4 CSS-first**: extend theme via `@theme` in CSS; no `tailwind.config.js`. Do not use removed v3 utilities (`bg-opacity-*`, `flex-shrink-*`, etc.).
- **Realtime**: always subscribe through `core/realtime/echo.ts`. Channel names must match the backend (`conversations.{id}`, `admin.conversations`, `admin.visitors`). Verify against backend `routes/channels.php` before adding new channels.
- **Forms**: React Hook Form + Zod resolver. No controlled inputs without RHF.
- **Icons**: `lucide-react` only. Do not introduce a second icon library.
- **Class merging**: `cn()` helper = `twMerge(clsx(...))`. Always use it when composing conditional classes.
- **Types**: generate/mirror from backend resources where possible. Keep `types.ts` flat; domain-specific types live in the feature folder.

## Commands

```bash
npm run dev            # admin dashboard dev server
npm run build          # admin dashboard build
npm run build:widget   # embeddable widget build (outputs to dist-widget/)
npm run preview        # preview production build
```

## Environment

Secrets live in `.env.local` (git-ignored). Never read secrets from process args or commit them.

Required keys (see backend CLAUDE.md for current values):
- `VITE_API_BASE_URL` — backend base URL
- `VITE_REVERB_APP_KEY` — must match backend `REVERB_APP_KEY`
- `VITE_REVERB_HOST` / `VITE_REVERB_PORT` / `VITE_REVERB_SCHEME` — Reverb transport

## What NOT to do

- Don't add a new state library (we use Zustand + TanStack Query — that's enough).
- Don't add a UI component kit (Radix, shadcn, MUI, etc.) without user approval. Compose primitives from Tailwind.
- Don't bypass `core/http/` to call `fetch`/`axios` directly from a component.
- Don't hardcode backend URLs or channel names — use `core/http/endpoints.ts` and typed channel helpers.
- Don't inline API schemas — align with backend `JsonResource` shapes; if uncertain, read the backend resource file.

## Task tracking

Per the `dev-guideline` skill, active work lives at:

```
.ai/TASKS/
  active/     ← {task-slug}.md  (in progress)
  completed/  ← {task-slug}.md  (done)
```

Create the task file BEFORE starting. Fill Why + Checklist + Files Changed. Self-review gate must PASS before moving to `completed/`.

Scratch files (probe scripts, dummy data, curl captures) go to `.ai/.tmp/` — never in `src/`, the repo root, or `/tmp`.
