# Feature Implementation

## Date
2026-01-15

## Summary
Updated Scramble documentation and added message listing for Widget SDK.
1.  **API:** Added `GET /api/v1/public/widget/messages` to list session messages.
2.  **Docs:** Updated `ScrambleConfig` to group widget endpoints under "Widget SDK".
3.  **Docs:** Added proper PHPDoc annotations to `BootstrapController` and `WidgetMessageController`.
4.  **Verification:** Validated message retrieval via Tinker and successfully exported `api.json`.
