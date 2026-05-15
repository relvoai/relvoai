You are building a CodeCanyon-ready Live Chat + Helpdesk Inbox backend in **Laravel 12**.

BEFORE STARTING UPDATE THE EXISTING TABLES TO USE UUID 

NON-NEGOTIABLE TECH RULES
1) Framework: Laravel 12.x only. Use first-party features where possible (Sanctum, Broadcasting, Reverb, Queues, Notifications).  [oai_citation:0‡Laravel](https://laravel.com/docs/12.x/sanctum?utm_source=chatgpt.com)
7) Security: Always use `protected $fillable` in models. Do NOT use `protected $guarded`.
8) IDs: Use UUIDs across the system. Models must use `HasUuids` (ordered UUIDs).  [oai_citation:1‡Laravel](https://laravel.com/docs/12.x/eloquent?utm_source=chatgpt.com)
3) Foreign keys: always use:
    - `$table->foreignUuid('x_id')->constrained()->cascadeOnDelete();`
      (or `->deleteOnCascade()` if that’s the project’s preferred alias)
      Use Laravel 12 migrations best practice.  [oai_citation:2‡Laravel](https://laravel.com/docs/12.x/migrations?utm_source=chatgpt.com)
4) API Auth: Use **Laravel Sanctum personal access tokens** for API authentication (Bearer token).  [oai_citation:3‡Laravel](https://laravel.com/docs/12.x/sanctum?utm_source=chatgpt.com)
5) Realtime: Use Laravel Broadcasting + Reverb for websocket updates.  [oai_citation:4‡Laravel](https://laravel.com/docs/12.x/reverb?utm_source=chatgpt.com)
6) CodeCanyon packaging: Include English documentation (HTML or PDF) with install + usage steps.  [oai_citation:5‡Envato Author Support](https://help.author.envato.com/hc/en-us/articles/360000471583-Code-Item-Preparation-Technical-Requirements?utm_source=chatgpt.com)

PROJECT STRUCTURE RULES
A) Keep domain logic organized:
- app/Models (Eloquent models only)
- app/Domain/<Area>/ (Services, Actions, DTOs)
- app/Http/Controllers/Api (thin controllers)
- app/Events + app/Listeners (broadcast & internal events)
- app/Policies (authorization)

B) IMPORTANT: Maintain **Model Tasklists**:
- Create folder: `.ai/DEV/TASKS/{model}/_tasks/`
- For EACH model create a markdown file:
  `.ai/DEV/TASKS/{model}/_tasks/{task_title}.md`
- Each file must contain:
    - Purpose (1–2 lines)
    - API endpoints touching this model
    - Events emitted
    - Open tasks checklist
- Whenever you create/modify anything that touches a model (migration, policy, controller, tests, events),
  you MUST update that model’s task file.

TOKEN GENERATION + ENDPOINT TESTING RULES (must be automated)
1) Create an artisan command:
    - `php artisan dev:token {email?}`
      Behavior:
    - Ensures a Dev Admin user exists (create if missing).
    - Issues a Sanctum token for that user.
    - Prints:
        - the token
        - a ready-to-run curl example with `Authorization: Bearer <token>`

2) Create a reusable helper method (one place only), e.g.:
    - `app/Support/AuthToken.php` with:
        - `static function issueTokenFor(User $user, string $name='dev'): string`
        - `static function authHeaders(string $token): array`

3) For EVERY API endpoint you build:
    - Add/extend a Feature test that:
        - calls `dev:token` logic (or directly uses the helper) to get a token
        - hits the endpoint using Bearer auth
        - asserts 200/201 + JSON shape + authorization behavior
    - Run `php artisan test` and fix failures before proceeding.

API RESPONSE STANDARD
- Use consistent JSON envelopes:
  `{ "success": true, "data": ..., "message": null }`
  Errors:
  `{ "success": false, "message": "...", "errors": {...} }`

SECURITY BASELINES
- Use Policies for model access.
- Validate inputs using Form Requests.
- For widget public endpoints: strict CORS + rate limiting.
- Store uploaded files via Laravel Storage (public/private as needed).

DELIVERABLES
- Working Laravel 12 backend + tests
- Websocket broadcasting working (Reverb)
