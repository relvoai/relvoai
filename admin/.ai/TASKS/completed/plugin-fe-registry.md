---
slug: plugin-fe-registry
created: 2026-05-15
updated: 2026-05-15
status: in_progress
owner: claude-admin
next_step: Implement registry, loader, PluginSlot, boot wiring, tests
---

## Why
Group 2 of upgrade plan: enable the admin SPA to discover and boot enabled plugins from backend manifest, exposing slot contributions in the UI.

## Checklist
- [ ] src/core/plugins/registry.ts — singleton + window.LiveDesk
- [ ] src/core/plugins/loader.ts — fetch manifest + inject scripts
- [ ] src/core/plugins/PluginSlot.tsx — render contributions (DOM appendChild)
- [ ] Boot integration in App.tsx after auth
- [ ] <PluginSlot name="sidebar.section" /> in Layout sidebar
- [ ] Tests under src/core/plugins/*.test.ts(x)
- [ ] tsc clean

## Files Changed
(to fill)
