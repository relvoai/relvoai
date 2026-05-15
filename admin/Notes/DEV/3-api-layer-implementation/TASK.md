# API Layer Implementation

## Description
Implement the core HTTP layer + TanStack Query integration as per `.ai/contracts/update.json` contract. Replace mock services with proper API calls using the endpoints defined in `.ai/contracts/api.json`.

## Checklist

### Core Infrastructure
- [x] Install required packages (axios, @tanstack/react-query, zustand)
- [x] Create `src/core/http/axios.ts` - Axios instance with interceptors
- [x] Create `src/core/http/endpoints.ts` - Central endpoint definitions
- [x] Create `src/core/http/client.ts` - Typed request helpers
- [x] Create `src/core/query/queryClient.ts` - TanStack Query client
- [x] Create `src/core/auth/authStore.ts` - Zustand auth store

### Feature API Hooks
- [x] Create `src/features/auth/api.ts` - Login, logout, me
- [x] Create `src/features/inboxes/api.ts` - Inbox CRUD + agents
- [x] Create `src/features/channels/api.ts` - Channel CRUD + extras
- [x] Create `src/features/conversations/api.ts` - Conversation operations
- [x] Create `src/features/departments/api.ts` - Department CRUD
- [x] Create `src/features/users/api.ts` - User CRUD
- [x] Create `src/features/cannedReplies/api.ts` - Canned replies
- [x] Create `src/features/widgets/api.ts` - Widget CRUD
- [x] Create `src/features/visitors/api.ts` - Online visitors
- [x] Create `src/features/settings/api.ts` - Settings
- [x] Create `src/features/reports/api.ts` - Reports

### App Integration
- [x] Update `App.tsx` with QueryClientProvider and real auth
- [x] Update Login page to use real auth flow
- [ ] Verify build compiles successfully (requires `yarn install`)
