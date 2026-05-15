# Feature Implementation

## Date
2026-01-15

## Summary
Implemented missing Contact features requested by user.
1.  **History:** Added `GET /contacts/{id}/conversations` to list past conversations.
2.  **Notes:** Created `Note` model and `notes` table (polymorphic). Added `GET /contacts/{id}/notes` and `POST /contacts/{id}/notes` to manage internal notes.
3.  **Merge:** Added `POST /contacts/{id}/merge` to merge a contact into another, moving all history and notes, and deleting the source contact.
