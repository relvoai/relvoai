# Fix Visitor Client Info Saving

## Description
User reports `client` object (user agent, timezone, etc.) sent in bootstrap is not being saved.

## Checklist
- [x] Inspect `BootstrapController` (Done)
- [x] Inspect `Visitor` model `$fillable` (Done)
- [x] Update `BootstrapController` to map `client` data to visitor columns (Done)
    - Mapped `page_url` -> `last_seen_url`
    - Mapped `referrer` -> `last_referrer`
    - Mapped others -> `meta`
- [x] Verify if columns exist in `visitors` table (Confirmed via model)
- [x] Verify fix (Code implementation)
