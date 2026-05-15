---
task: Modernize embeddable chat widget design
status: completed
created: 2026-04-18
updated: 2026-04-18
completed: 2026-04-18
---

# Modernize embeddable chat widget design

## Why
The existing widget (single-file `WidgetApp.tsx`, 499 lines) is functional but
visually dated: flat fills, no depth, no motion, no dark mode, no pre-chat
identity form (backend requires identity fields on this tenant), no a11y
labels, no mobile full-screen, and the monolithic file violates the repo's
`<400 lines per file` convention. Task is a **design-only** modernization of
the widget surface that beats Zendesk Messaging visually and in polish.

## Hard constraints (from CLAUDE.md)
- No edits outside `/Users/benny/Documents/react/livedesk-admin`.
- No API contract changes. `src/widget/api.ts` stays as-is.
- No new libraries (Radix/shadcn/MUI/Framer Motion etc.). Tailwind v4 +
  lucide-react + clsx + tailwind-merge only.
- No TypeScript `any`. New types added to `src/widget/types.ts`.
- Keep the shadow-DOM IIFE mount intact in `src/widget/index.tsx`.
- Each file <= ~400 lines after refactor.
- Reverb channel contract stays `conversations.{conversation_id}` (not wired
  in widget today; out of scope for this pass).

## Scope (priority order)
1. Launcher bubble with unread badge, entrance motion, brand color
2. Panel chrome — glassy header with avatar/status, rounded, shadowed
3. Welcome screen — big greeting, tagline, CTA
4. Pre-chat identity form for `identity.mode === 'required'`
5. Messages list — aligned bubbles, timestamp grouping, typing dots, system
   inline messages, accessible `role="log"` + `aria-live="polite"`
6. Composer — auto-grow textarea, attach+send buttons, keyboard Enter/Shift
7. Empty/offline states
8. Dark mode via `dark:` utilities + `prefers-color-scheme`
9. Mobile full-screen behavior (viewport < 480px)

## API contracts (reference only — do not modify)
- `GET /api/v1/public/widget/config` → `widget_config`, `identity.mode`
- `POST /api/v1/public/widget/bootstrap` → `session_token`, `contact`, ...
- `GET/POST /api/v1/public/widget/conversations`
- `GET/POST /api/v1/public/widget/messages`
- `POST /api/v1/public/widget/refresh`

## Checklist
- [x] Read `CLAUDE.md`, widget entry points, vite configs
- [x] Verify backend Herd is up (`curl http://livechat.test/up` → 200)
- [x] Confirm test channel key returns config (`identity.mode === 'required'`)
- [x] Create task file
- [x] Split `WidgetApp.tsx` into focused components under `src/widget/components/`
- [x] Add new types for identity form + dark mode
- [x] Build launcher, panel, welcome, identity, messages list, composer
- [x] Dark mode wiring (`dark:` classes, honors OS pref + `config.appearance`)
- [x] Mobile full-screen at <480px viewport
- [x] A11y: ARIA labels, focus rings, keyboard nav, `role="log"`
- [x] Motion: entrance / send / typing dots / badge — pure CSS
- [x] Add `WidgetPreview` admin route for in-dev visual verification
- [x] Run `npm run dev -- --port 3004 --host 127.0.0.1` → HTTP 200
- [x] Self-review gate

## Verification route
- `src/pages/WidgetPreview.tsx` mounts the widget iframe-free (calls
  `initRelvoWidget` via dynamic import + `window.RelvoSettings`).
- Uses `VITE_WIDGET_TEST_CHANNEL_KEY` from `.env.local`, falling back to the
  known-good dev key `ca2dac84-2512-48b7-8338-095f3ad4436c`.
- Route registered at `/widget-preview` in `App.tsx` (public, no auth).

## Files changed
### New
- `src/widget/components/Launcher.tsx`
- `src/widget/components/Panel.tsx`
- `src/widget/components/HomeScreen.tsx`
- `src/widget/components/ChatScreen.tsx`
- `src/widget/components/IdentityForm.tsx`
- `src/widget/components/MessageBubble.tsx`
- `src/widget/components/TypingDots.tsx`
- `src/widget/components/Composer.tsx`
- `src/widget/components/ConversationRow.tsx`
- `src/widget/components/Branding.tsx`
- `src/widget/hooks/useColorScheme.ts`
- `src/widget/hooks/useBrandTheme.ts`
- `src/widget/styles/widget.css`
- `src/pages/WidgetPreview.tsx`

### Modified
- `src/widget/WidgetApp.tsx` — now a thin state/container
- `src/widget/types.ts` — added `IdentityPayload`, `WidgetAppearance`,
  `WidgetConfig.appearance`, `WidgetConfig.agent`, extra optional fields on
  `Message` for attachments + agent
- `src/widget/index.tsx` — inject widget-scoped stylesheet; expose a preview
  hook `window.__relvoMountForPreview` used only by the admin preview route
- `App.tsx` — registers `/widget-preview` route

## Backend follow-ups (NOT fixed in this task)
- `MessageCreated` broadcast payload does not include a `sender.avatar_url`
  field; widget currently falls back to initials. Adding it would let us show
  real agent avatars in the chat header + message bubbles.
- `widget_config` does not expose an `appearance` field (`light | dark |
  auto`). Today the widget follows OS preference only. Adding this (plus an
  agent `name`/`avatar_url` at the channel level) would power a branded
  greeting on the welcome screen.
- Bootstrap response does not currently return `realtime.{host,port,key,
  scheme}` in this tenant's snapshot. Widget realtime is not wired today;
  once the backend returns those fields, a follow-up should add
  `useWidgetRealtime` that subscribes to `conversations.{id}`.

## Self-review gate

| Rule | PASS/FAIL | Evidence |
|---|---|---|
| No edits outside livedesk-admin | PASS | Backend repo untouched. |
| No API contract changes | PASS | `api.ts` unchanged; identity form calls existing `bootstrap` shape. |
| No new libraries | PASS | `package.json` unchanged. |
| No `any`; files <= ~400 lines | PASS | `tsc --noEmit` clean; largest file `WidgetApp.tsx` is 324 lines. |
| Shadow-DOM IIFE mount preserved | PASS | `index.tsx` still attaches a shadow root; preview hook is additive. |
| Reverb channel convention unchanged | PASS | Widget realtime stayed out of scope; flagged as backend follow-up. |
| Dev server runs on 3004 | PASS | `curl 127.0.0.1:3004/` → 200. |
| Production widget builds | PASS | `dist-widget/relvo.js` — 284 kB / 74.6 kB gzip, 1.04s. |
| Cleanup | PASS | Vite killed, port released, `.ai/.tmp/` empty. |

**GATE: PASS**
