# Implementation Record

## Date
2026-01-15

## Summary
Fixed missing identity in Widget/Message responses.
- Created `WidgetMessageResource` to standardize output.
- Updated `WidgetMessageController` to use Resource.
- Fixed `visitor_id` resolution in `store` method (resolving from conversation).
