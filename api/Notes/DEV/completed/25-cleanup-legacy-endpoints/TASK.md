# Cleanup Legacy Endpoints

## Description
Remove old/deprecated endpoints to ensure Scramble documentation is clean.

## Checklist
- [x] Inspect `routes/api.php` for legacy routes (Done)
    - Removed `public/channels/{channel_key}` group.
- [x] Remove legacy widget routes (Done)
- [x] Remove unused controllers (Done)
    - Deleted `PublicChannelController.php`.
- [x] Verify Scramble config remains valid (Done)
    - Removed `Public Channel API` tag rule.
