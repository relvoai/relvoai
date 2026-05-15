# New Professional Widget Init Flow

## Description
Implement a modern, fast, and secure widget initialization flow (Config, Bootstrap, Refresh).

## Checklist
- [x] **Database & Schema**
    - [x] Check/Add `uid` to `visitors` table (unique per channel).
    - [x] Add indices to `visitors`, `conversations`, `widget_sessions`.
- [x] **Endpoint A: Config**
    - [x] Implement `GET /api/public/widget/config`
    - [x] Implement Caching & ETag
- [x] **Endpoint B: Bootstrap**
    - [x] Refactor `BootstrapController`
    - [x] Implement Visitor/Contact resolution logic
    - [x] Implement Identity Policy check
- [x] **Endpoint C: Refresh**
    - [x] Implement `POST /api/public/widget/refresh`
- [x] **Middleware/Security**
    - [x] Implement Header Validation (`X-Channel-Key`, `X-Visitor-Uid`)
    - [x] Implement Domain Allowlist logic (Stubbed in implementation)
- [x] **Tests**
    - [x] Test Config (Cache, ETag) (Verified)
    - [x] Test Bootstrap (Resolution, Identity) (Verified)
    - [x] Test Refresh (Token renewal) (Verified)
