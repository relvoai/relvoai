# Implement Contact Features

## Description
Implement History, Notes, and Merge features for Contacts.

## Checklist
- [x] Create `Note` model & migration (Created `Note` model, `2026_01_15_061500_create_notes_table.php`)
- [x] Update `Contact` model relationships (Added `notes()` relation)
- [x] Update `ContactController` (Added `conversations`, `notes`, `storeNote`, `merge`)
- [x] Add routes (Added in `routes/api.php`)
- [x] Verify endpoints (Verified via Tinker)
