# Fix Permissions

## Description
The user reported that the application checks for `*.view` permissions (e.g., `users.view`) but only `*.view_any` is defined in the constants. This causes "User does not have any of the necessary access rights" errors. The goal is to update the permissions constant file to include `.view` permissions and reseed the database.

## Checklist
- [x] Analyze `app/Constants/Permissions.php` to identify missing `.view` permissions
- [x] Update `app/Constants/Permissions.php` to include `.view` permissions for relevant resources
- [x] Reseed permissions using `php artisan db:seed --class=RolesAndPermissionsSeeder`
- [x] Verify the permissions are correctly in the database
