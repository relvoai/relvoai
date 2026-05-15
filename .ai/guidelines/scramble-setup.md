# Scramble Documentation Setup Guide

This guide documents the setup and customization of `dedoc/scramble` for the LiveChat application.

## 1. Installation

```bash
composer require dedoc/scramble
```

## 2. Configuration Strategy

Instead of cluttering `AppServiceProvider`, we encapsulate all Scramble logic in a dedicated class: **`App\Docs\ScrambleConfig`**.

### `App\Docs\ScrambleConfig` Responsibilities:
- **Security Schemes**: Configuring Bearer Auth.
- **Usage Groups**: Separating "Public" (Widget) and "Auth" (Admin/Agent) endpoints.
- **Custom Headers**: Injecting required headers like `X-Widget-Key` for specific routes (now done via code attributes).

### Registration

In `App\Providers\AppServiceProvider.php`:

```php
public function boot(): void
{
    // ...
    \App\Docs\ScrambleConfig::configure();
}
```

## 3. Endpoint Titles & Descriptions

Scramble uses **PHPDoc summaries** on controller methods to generate human-readable operation titles.

**Use this format:**

```php
/**
 * List Settings             <-- This becomes the Operation Title (Summary)
 * 
 * Get a paginated list of system settings.  <-- This becomes the Description
 */
public function index(Request $request)
{
    // ...
}
```

**Do NOT use:** generic default titles like "Display a listing of the resource".

## 4. Custom Headers (e.g., X-Widget-Key)

For public endpoints that require specific headers (like the Widget API), use the `#[HeaderParameter]` attribute directly on the controller method. This is cleaner than global config hacks.

**Example in `VisitorController`:**

```php
use Dedoc\Scramble\Attributes\HeaderParameter;

class VisitorController extends ApiController
{
    /**
     * Identify Visitor
     */
    #[HeaderParameter('X-Widget-Key', description: 'The Widget UUID', type: 'string', required: true)]
    public function identify(IdentifyVisitorRequest $request)
    {
        // ...
    }
}
```

## 5. Grouping Logic

We organize endpoints into two main groups in the sidebar:
1.  **Public /**: All `V1\Widget` namespace controllers.
2.  **Auth /**: All `Admin` namespace controllers.

This logic is handled in `ScrambleConfig::resolveTags()`. It parses the API path and assigns tags accordingly (e.g., `Public / Visitor`, `Auth / Canned Replies`).

## 6. Request/Response Documentation

- **Requests**: Use Laravel `FormRequest` classes. Scramble automatically documents validation rules.
- **Responses**: Use `JsonResource` classes. Scramble infers the JSON structure from the resource.

## Debugging

If docs fail (500 Error):
1. Check `storage/logs/laravel.log`.
2. Common issue: Missing `use` statements in `ScrambleConfig` (e.g., `SecurityScheme`).
