# Fix Department Permissions

## Description
The user reported that `permission:departments.view` is failing with "User does not have any of the necessary access rights." This indicates that Department-related permissions are missing from the `Permissions` constants and the database.

## Checklist
- [x] Check `app/Constants/Permissions.php` for Department permissions
- [x] Add missing Department permissions (`index`, `view`, `create`, `update`, `delete`, `view_any`??)
- [x] Reseed permissions
- [x] Verify `departments.view` exists in DB
