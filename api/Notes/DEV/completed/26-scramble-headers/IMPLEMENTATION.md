# Implementation Record

## Date
2026-01-15

## Summary
Added `dedoc/scramble` attributes to document required headers.
- `BootstrapController`: Added `X-Channel-Key` and `X-Visitor-Uid` headers.
- `WidgetRefreshController`: Added `X-Channel-Key` and `X-Visitor-Uid` headers.
- `WidgetConfigController`: Added optional `X-Channel-Key` header (if not in query).
