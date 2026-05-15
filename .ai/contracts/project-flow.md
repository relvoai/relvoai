# Project Modules & Flow

## Modules

### 1. Authentication & Users
- **Admin/Agent**: Uses Sanctum (Bearer Token).
- **Visitor**: Uses `X-Widget-Key` and `X-Visitor-Id`.
- **RBAC**: Role-based access (Admin vs Agent) determines access to settings, widgets, and reports.

### 2. Widget (Public Facing)
- **Embeddable**: Designed to be embedded on external sites via `test-widget.html`.
- **State**: Tracks Visitor Identity and Session.
- **Realtime**: Listens to `conversations.{id}` channels.

### 3. Conversation Operations (Admin/Agent)
- **Inbox**: Centralized view of all open conversations.
- **Workflow**:
    - **Pick Up**: Agent joins a conversation.
    - **Reply**: Agent sends messages.
    - **Transfer**: Move to another department/agent.
    - **Close**: resolving the ticket (triggers AI Summary).

### 4. Productivity Tools
- **Canned Replies**: Quick shortcuts (`/hi`, `/bye`) for agents.
- **Typing Indicators**: Real-time "Agent is typing..." signals.
- **Message Stars**: Bookmark important messages.

### 5. Analytics & Monitoring
- **Online Visitors**: Real-time list of visitors currently on the site (via Heartbeat).
- **Reports**: Daily volume and response time metrics.

---

## Key User Flows

### A. The Visitor Journey
1. **Load**: Visitor loads page with Widget. 
2. **Identify**: Widget calls `POST /widget/identify` to get `visitor_id`.
3. **Connect**: Widget connects to WebSocket (Reverb) channel `conversations.{id}` (if existing) or private user channel.
4. **Start Chat**: Visitor sends first message -> `POST /widget/conversations`.
5. **Realtime**: Visitor listens for `MessageCreated` (Agent replies).

### B. The Agent Lifecycle
1. **Login**: Agent logs in -> `POST /api/v1/login`.
2. **Dashboard**: Loads Inbox (`GET /conversations`).
3. **Monitor**: Listens for `ConversationCreated` (new chats) or updates.
4. **Engage**:
    - Opens a conversation.
    - Calls `POST .../join` to become a participant.
    - Types reply (broadcasting `ClientWhisper`).
    - Sends reply (`POST .../reply`).
5. **Resolve**: Agent closes conversation (`POST .../close`) -> System generates transcript summary.

### C. Realtime Architecture
- **Driver**: Laravel Reverb.
- **Channels**:
    - `conversations.{id}`: Private channel for message exchange.
    - `admin.conversations`: Private channel for Inbox updates (new convo, status change).
    - `visitors.online`: Presence channel (or virtual presence via API polling) for tracking active users.
- **Events**:
    - `MessageCreated`: New message payload.
    - `ParticipantJoined`: System/User joined.
    - `ConversationUpdated`: Status change (Open/Closed).
    - `ClientWhisper`: Typing events.
