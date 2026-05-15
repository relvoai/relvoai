# Widget Session & Bootstrap Support

## Description
Enabled web chat widget support for dev/prod, auto-identification, and sessions.

## Checklist
- [x] Create `widget_sessions` table (migration) (Created `2026_01_15_110500_create_widget_sessions_table.php`)
- [x] Check `contacts` table for `external_id` (Confirmed missing)
- [x] Add `external_id` to `contacts` (migration) (Created `2026_01_15_110000_add_external_id_to_contacts_table.php`)
- [x] Create `WidgetSession` model (Created)
- [x] Update `Contact` model (Added `external_id`)
- [x] Implement `POST /api/public/widget/bootstrap` (Created `BootstrapController`)
- [x] Implement `WidgetMessageController` (Created)
- [x] Update Routes (Added in `api.php`)
- [x] Verify Endpoints (Verified via Tinker)
