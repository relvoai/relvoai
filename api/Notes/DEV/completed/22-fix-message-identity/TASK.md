# Fix Message Response Identity

## Description
User reports missing `visitor_id` and identity checks in message responses.

## Checklist
- [x] Investigate current response format (Done)
- [x] Create `WidgetMessageResource` (Created)
    - [x] Include `id`, `body`, `type`
    - [x] Include `visitor_id` (Verified)
    - [x] Include `sender` (Verified)
- [x] Update `WidgetMessageController@index` (Done)
- [x] Update `WidgetMessageController@store` (Done)
- [x] Verify Response via Tinker (Verified)
