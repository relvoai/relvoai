# Implementation Record

## Date
2026-01-15

## Summary
Enriched `AdminConversationResource` to support detailed UI requirements.
- Added `contact_extensive` object:
    - `location`: ip, country, city, timezone (from visitor meta)
    - `browser`: user_agent, platform (from visitor meta)
    - `custom_attributes`: from contact
- Added `labels` (mapped from tags).
- Updated `ConversationController` to eager load `contact`.
