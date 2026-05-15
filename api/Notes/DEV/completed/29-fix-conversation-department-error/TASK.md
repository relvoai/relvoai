# Fix Conversation Department Error

## Description
User reports `Call to undefined relationship [department] on model [App\Models\Conversation]`.

## Checklist
- [x] Locate the erroneous eager load in Controllers (Done)
    - Found in `Admin\ConversationController` `index` and `show`.
- [x] Verify if `Conversation` should have a `department` (Done)
    - `conversations` table DOES NOT have `department_id` column.
- [x] Apply fix (Done)
    - Removed `department` from `with()` calls.
    - Commented out logic attempting to update `department_id`.
