# Menu and Forms Implementation

## Description
Align the navigation menu and create forms/flows to match the `.ai/contracts/update.json` routes and `.ai/contracts/api.json` endpoints.

## Checklist

### Menu/Navigation Updates
- [x] Update `Layout.tsx` navigation to match contract routes
- [x] Update `App.tsx` routes to match contract

### New Pages & Components
- [x] Create `InboxList.tsx` - List inboxes (GET /inboxes)
- [x] Create `InboxCreate.tsx` - Create inbox wizard (3 steps)
- [x] Create `InboxDetails.tsx` - Inbox settings (GET/PUT /inboxes/:id)
- [x] Create `ChannelDetails.tsx` - Channel settings (GET/PUT /channels/:id)
- [x] Create `ConversationList.tsx` - List conversations

### Existing Page Updates
- [x] Update `Departments.tsx` to use API hooks
- [ ] Update `Users.tsx` to use API hooks
- [x] Update `Visitors.tsx` to use online visitors API
- [x] Update `Settings.tsx` to use settings API
- [x] Update `Productivity.tsx` (Canned Replies) to use API hooks

### Verification
- [ ] Test all navigation links
- [ ] Verify build compiles
