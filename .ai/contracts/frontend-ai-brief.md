# Frontend AI Brief 🤖

This document serves as the **master context** for building the frontend application for the LiveChat system.

## 🌍 Backend Connectivity

- **Base URL**: `http://livechat.test` (Local)
- **API Prefix**: `/api/v1`
- **CORS**: Enabled for `localhost` ports.

## 🔐 Authentication

1.  **Admin/Agents (Dashboard)**
    - **Mechanism**: Laravel Sanctum (Stateful or Token-based).
    - **Login**: `POST /api/v1/login` -> Returns `{ token, user }`.
    - **Header**: `Authorization: Bearer <token>`
    - **User Object**: Contains `roles` (admin, agent) and `permissions`.

2.  **Widget (Visitors)**
    - **Mechanism**: Custom Headers.
    - **Headers**:
        - `X-Widget-Key`: UUID of the widget configuration.
        - `X-Visitor-Id`: UUID returned from `POST /api/v1/widget/identify`.

## 📡 Realtime (WebSockets)

- **Driver**: Laravel Reverb (Pusher Compatible).
- **Client**: `laravel-echo` + `pusher-js`.
- **Config**:
    - `broadcaster`: 'reverb'
    - `key`: (Check `.env` `VITE_REVERB_APP_KEY`)
    - `host`: `livechat.test`
    - `port`: 8080
    - `scheme`: 'http'
- **Channels**:
    - `conversations.{id}`: Private channel for chat messages.
    - `visitors.online`: Presence channel (Admins only).

## 📂 Documentation Resources

- **[> Frontend Contract](./frontend-contract.md)**: **Strict** TypesScript interfaces and API Endpoint definitions. Use this for data fetching layers.
- **[> Project Flow](./project-flow.md)**: Logic flows for Visitor Journey and Agent Lifecycle.

## 🏗 Key Components to Build

1.  **Chat Widget**:
    - Embeddable (Iframe or Shadow DOM).
    - Handling `identify` on load.
    - Reverb listener for `MessageCreated`.
    - Optimistic UI for sending messages.

2.  **Admin Dashboard**:
    - **Inbox**: List conversations (filter by status).
    - **Chat Window**: Real-time message list, "Agent is typing" indicators.
    - **Settings**: Manage Departments, Widgets, Canned Replies.
