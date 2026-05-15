# LiveChat Backend

A real-time Live Chat & Helpdesk backend built with **Laravel 12**, featuring Reverb broadcasting, AI summarization, and a robust API for widget integration.

## 🚀 Key Features

- **Real-time Messaging**: Powered by **Laravel Reverb** (WebSockets).
- **Widget API**: Dedicated endpoints for public chat widgets (`/api/v1/widget`).
- **AI Integration**: Auto-summarization of conversations using **Prism**.
- **Role-Based Access**: Granular permissions via Laratrust.
- **Analytics**: Built-in reporting for conversations and response times.

## 🛠 Setup

1. **Install Dependencies**
   ```bash
   composer run setup
   ```
   This command installs Composer/NPM dependencies, sets up `.env`, generates keys, and runs migrations.

2. **Start the Server**
   ```bash
   composer run dev
   ```
   Starts Laravel, Reverb, Queue Worker, and Vite.

## 📖 API Documentation

The API is fully documented using **Scramble**.

**View Docs**: `http://livechat.test/docs/api`

The documentation includes:
- **Public Widget API**: Endpoints for visitors (`identify`, `heartbeat`, `conversations`).
- **Admin/Agent API**: Endpoints for dashboard ops (`reply`, `close`, `reports`).
- **Schemas**: Request/Response JSON structures.

## 🔐 Authentication

### Admin & Agents
Uses **Laravel Sanctum**. Include the token in the `Authorization` header:
```http
Authorization: Bearer <your-token>
```

**Generate Dev Token**:
```bash
php artisan dev:token email@example.com
```

### Public Widget
Uses **API Keys** (`X-Widget-Key`) and session headers (`X-Visitor-Id`).
- **X-Widget-Key**: UUID of the widget (found in Admin > Widgets).
- **X-Visitor-Id**: Returned by the `/widget/identify` endpoint.

## 📡 Real-time Events

This project uses **Laravel Reverb**.

- **Channel**: `conversations.{id}`
- **Events**:
  - `MessageCreated`: New message.
  - `ParticipantJoined`: Agent/Visitor joins.
  - `ClientWhisper`: Typing indicators.

## 🤖 Testing

Run the test suite with Pest:
```bash
php artisan test
```
