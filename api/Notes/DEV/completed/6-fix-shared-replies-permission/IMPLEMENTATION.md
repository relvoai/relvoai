# Feature Implementation

## Date
2026-01-14

## Summary
Fixed "Unauthorized to create shared replies" error by correcting a typo in `CannedReplyController.php`. It was checking for `canned_replies.shared.manage` instead of the correct `canned_replies.manage_shared` constant.
