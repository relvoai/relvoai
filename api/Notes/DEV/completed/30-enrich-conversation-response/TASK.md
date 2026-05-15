# Enrich Conversation API Response

## Description
User requested extensive data for `GET /conversations/{id}` based on a UI screenshot.

## Checklist
- [x] Analyze requirements from screenshot (Done)
- [x] Update `AdminConversationResource` (Done)
    - Added `contact_extensive` with location, browser, custom attributes.
    - Added `labels` using JSON tags.
- [x] Update `ConversationController::show` to eager load `contact` (Done)
- [x] Update `ConversationController::index` to eager load `contact` (Done)
- [x] Verify response structure (Code implementation)
