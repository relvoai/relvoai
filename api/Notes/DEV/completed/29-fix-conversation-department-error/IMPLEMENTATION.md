# Implementation Record

## Date
2026-01-15

## Summary
Fixed `RelationNotFoundException` for `department` on Conversation model.
- Identified that `conversations` table has no `department_id` column.
- Removed invalid `with('department')` eager loading in `Api\Admin\ConversationController`.
- Disabled invalid `department_id` update logic in `transfer` method.
