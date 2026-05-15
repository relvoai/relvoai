# Fix Missing Department User Table

## Description
The user reported "Base table or view not found: 1146 Table 'livechat.department_user' doesn't exist". This is the pivot table for the Many-to-Many relationship between Departments and Users.

## Checklist
- [x] Check if `create_department_user_table` migration exists
- [x] If missing, create the migration file
- [x] Run migration to create the table
- [x] Verify table exists
