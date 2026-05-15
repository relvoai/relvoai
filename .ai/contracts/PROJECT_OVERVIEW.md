# Project Overview & Manager Contract

**Project Name:** Live Chat + Helpdesk Backend
**Framework:** Laravel 12.x
**Date:** 2026-01-15

## 1. Executive Summary
We are building a **CodeCanyon-ready Live Chat & Helpdesk System**. The goal is a high-performance, self-hosted solution that can be installed by customers. It features a real-time widget for website visitors and a comprehensive Admin Panel for agents/admins to manage conversations.

## 2. Technical Stack
The system is built on **Laravel 12** with a focus on using first-party ecosystem tools.

- **PHP:** 8.2+ (Targeting 8.3 features)
- **Framework:** Laravel 12.0
- **Database:** MySQL 8.0+ (Strict usage of UUIDs for all primary keys)
- **Realtime:** Laravel Reverb (Websockets)
- **Authentication:** Laravel Sanctum (SPA & Mobile ready)
- **Authorization:** Laratrust (Role-based access control)
- **Documentation:** Dedoc Scramble (OpenAPI auto-generation)
- **Testing:** Pest PHP 4.0 (Feature-focused testing)
- **Frontend (Admin):** React (Inertia/SPA - separate repo/build)
- **Widget:** Generic JS SDK (communicates via Widget API)
- **AI:** Echolabsdev/Prism (LLM integration ready)

## 3. System Architecture

The application is divided into three distinct API zones:

### A. Admin API (`/api/v1/admin/*`)
- **Audience:** Authenticated Agents and Admins.
- **Auth:** Sanctum (Bearer Token).
- **Features:** Manage Inboxes, Users, Departments, Settings, Reporting, and full Conversation history.
- **Permissions:** Granular permissions via Laratrust (e.g., `conversations.view`, `settings.update`).

### B. Public Channel API (`/api/v1/public/channels/*`)
- **Audience:** Legacy/Direct Integration.
- **Auth:** `channel_key` required.
- **Features:** Sending messages, basic identification.

### C. Widget SDK API (`/api/v1/public/widget/*`) **[NEW]**
- **Audience:** The Web Chat Widget.
- **Auth:** Session-based (Bootstrap -> Session Token).
- **Workflow:**
    1.  **Bootstrap:** Widget POSTs `channel_key` + `user` (optional) to `/bootstrap`.
    2.  **Session:** Server validates origin, resolves contact, creates `widget_session`, returns `session_token`.
    3.  **Messaging:** Widget uses `Authorization: Bearer <session_token>` to list/send messages.

## 4. Key Data Models (Schema)

All models use **UUIDs**.

- **User:** Agents/Admins. Belongs to Departments.
- **Contact:** The end-user/customer. Identified by `email` or `external_id`.
    - Has Many: `Conversations`, `Notes` (internal), `Visitors`.
- **Visitor:** Tracking entity for a specific browser session/device.
- **Inbox:** Container for channels (e.g., "Support", "Sales").
- **Channel:** Entry point (e.g., "Website Widget A", "Email Support").
- **Conversation:** Thread of messages between a Contact and Agents.
    - Status: `open`, `closed`, `pending`.
    - Priority: `low`, `medium`, `high`.
- **Message:** Individual text/attachment.
    - Type: `visitor`, `user`, `system`.
- **Note:** Internal comments on a Contact (Polymorphic).
- **WidgetSession:** Secure session tracking for the widget.

## 5. Development Workflows

We follow a strict "Task-Based" development workflow to ensure context is never lost.

### Task Management (`Notes/DEV/*`)
1.  **Start:** Create a folder `Notes/DEV/{index}-{slug}/` and `TASK.md` with a checklist.
2.  **Work:** Update `TASK.md` as items are completed.
3.  **Finish:** Create `IMPLEMENTATION.md` summarizing the work.
4.  **Archive:** Move folder to `Notes/DEV/completed/`.
5.  **Log:** Update `Notes/DEV/TASKS.md` with the completed item.

### Documentation (`.ai/contracts/*`)
- **`api.json`**: Generated via `php artisan scramble:export`. **Do not edit manually.**
- **`contacts-api.md`**: Specification for specific complex domains.
- **`project-overview.md`**: This document.

## 6. Current Roadmap Status (as of 2026-01-15)

- [x] **Core:** Setup, Auth, Migrations, Models.
- [x] **Admin API:** Users, Departments, Inboxes, Channels, Settings fully implemented.
- [x] **Contact Management:** CRUD, History, Notes, Merge functionality complete.
- [x] **Widget Backend:** Bootstrap & Session messaging implemented.
- [x] **Realtime:** Reverb configured (events broadcasting).
- [ ] **Frontend Widget SDK:** JavaScript implementation (Pending).
- [ ] **AI Integration:** Prism installed, features TBD.
- [ ] **Email Channel:** Inbound/Outbound parsing (Pending).

## 7. Operational Notes for PM
- **Deployments:** Standard Laravel deployment (Forge/Envoyer). Requires Reverb server running.
- **Environment:** `dev` (Localhost allowed for widget), `production` (Strict domain checks).
- **Quality:** 100% Feature test coverage required for new endpoints.
