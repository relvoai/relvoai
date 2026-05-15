# Implementation Record

## Date
2026-01-15

## Summary
Cleaned up legacy API endpoints.
- Removed deprecated `public/channels/{channel_key}` routes from `routes/api.php`.
- Deleted unused `PublicChannelController.php`.
- Updated `ScrambleConfig.php` to remove the obsolete tag mapping.
