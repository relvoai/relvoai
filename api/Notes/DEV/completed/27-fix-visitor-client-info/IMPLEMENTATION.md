# Implementation Record

## Date
2026-01-15

## Summary
Fixed missing `client` data saving in `BootstrapController`.
- Mapped `client.page_url` to `visitors.last_seen_url`.
- Mapped `client.referrer` to `visitors.last_referrer`.
- Stored `user_agent`, `timezone`, `language`, `screen_resolution`, `page_title` in `visitors.meta` JSON column.
