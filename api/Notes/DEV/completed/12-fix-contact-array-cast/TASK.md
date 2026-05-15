# Fix Array Conversion Error

## Description
User reported `Array to string conversion` when creating a contact. Likely missing casts on JSON columns.

## Checklist
- [x] Check `Contact` model casts (Missing `custom_attributes`)
- [x] Add casts for `custom_attributes` (Added)
- [x] Verify fix (Confirmed via Tinker)
