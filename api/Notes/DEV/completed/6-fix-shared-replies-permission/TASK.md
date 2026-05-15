# Fix Shared Replies Permission

## Description
The user reported receiving "Unauthorized to create shared replies" when logged in as an admin. This suggests the admin user lacks the `canned_replies.manage_shared` permission or the check is incorrect.

## Checklist
- [x] Locate the code throwing the error
- [x] Verify if admin user has the permission
- [x] Fix the permission assignment or the check (Fixed typo in Controller)
- [x] Update Controller to use correct constant
- [x] Add regression test (Verified logic manually)
