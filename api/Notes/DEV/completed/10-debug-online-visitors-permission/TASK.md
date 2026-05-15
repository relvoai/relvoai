# Debug Online Visitors Permission

## Description
User reported "User does not have any of the necessary access rights" on `api/v1/admin/visitors/online`.

## Checklist
- [x] Identify controller and permission (`ActiveVisitorController`)
- [x] Check DB for permission (Mismatch: `visitors.view_online` vs `visitors.view_any`)
- [x] Fix issue (Updated Controller to use `VISITORS_VIEW_ANY`)
- [x] Verify (Admin has `visitors.view_any`)
