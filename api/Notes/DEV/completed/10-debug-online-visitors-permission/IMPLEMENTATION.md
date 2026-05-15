# Feature Implementation

## Date
2026-01-14

## Summary
Fixed "User does not have any of the necessary access rights" error for `visitors/online`.
The `ActiveVisitorController` was using a non-existent permission `visitors.view_online`.
Updated it to use `Permissions::VISITORS_VIEW_ANY` which matches the database seeds.
