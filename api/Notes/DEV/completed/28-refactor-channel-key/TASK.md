# Refactor Channel Key Generation

## Description
User wants a custom unique "widget key" format instead of UUID for `channel_key`, using a `do-while` loop for uniqueness check.

## Checklist
- [x] Inspect existing generation logic (Done)
- [x] Implement `generateUniqueKey` method on `Channel` model (Done)
    - Format: `wd_{random(24)}`
    - Logic: `do-while` loop checking `exists()`.
- [x] Update `booted` or controller to use this generator (Done)
    - Updated `ChannelController::store`.
- [x] Verify creation of new channel uses new format (Code verified)
