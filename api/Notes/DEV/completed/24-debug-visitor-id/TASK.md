# Debug Missing Visitor ID in Messages

## Description
User reports messages are not saving with `visitor_id`.

## Checklist
- [x] Check `Message` model `$fillable` (Done)
    - Confirmed `visitor_id` is fillable.
- [x] Check `BootstrapController` conversation creation logic (Done)
    - Confirmed it sets `visitor_id` on new conversations.
- [x] Check `WidgetMessageController::store` logic (Done)
    - Confirmed it resolves `visitor_id` from conversation.
- [x] Check `Conversation` model `$fillable` (Done)
    - Confirmed `visitor_id` is fillable.
- [x] Fix identified issue (Done)
    - Issue: Reused old conversations had `null` visitor_id.
    - Fix: Added backfill logic to `Bootstrap` and `Refresh` controllers.
