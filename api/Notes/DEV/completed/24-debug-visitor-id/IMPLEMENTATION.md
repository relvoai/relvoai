# Implementation Record

## Date
2026-01-15

## Summary
Fixed missing `visitor_id` in messages for reused conversations.
- Identified that older conversations created before `visitor_id` tracking was implemented had `null` values.
- Updated `BootstrapController` and `WidgetRefreshController` to automatically update the conversation's `visitor_id` (backfill) when reusing an existing conversation for a verified visitor.
