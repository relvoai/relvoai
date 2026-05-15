<?php

/*
|--------------------------------------------------------------------------
| Cross-Origin Resource Sharing (CORS) Configuration
|--------------------------------------------------------------------------
|
| Two origin lists are merged for `paths` because Laravel's CORS config only
| accepts a single allowed_origins list. To enforce different policies for
| public widget endpoints (which need `*`) and admin endpoints (which should
| be locked to known origins), an HTTP middleware enforces the admin-side
| origin check; this file's allowed_origins keeps the widget-permissive
| baseline. See `App\Http\Middleware\RestrictAdminOrigin`.
*/

return [

    'paths' => ['api/*', 'broadcasting/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => array_values(array_filter(array_map('trim', explode(',', (string) env('CORS_ALLOWED_ORIGINS', '*'))))),

    'allowed_origins_patterns' => array_values(array_filter(array_map('trim', explode(',', (string) env('CORS_ALLOWED_ORIGINS_PATTERNS', ''))))),

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,

    /*
    |--------------------------------------------------------------------------
    | Admin allowed origins
    |--------------------------------------------------------------------------
    |
    | Comma-separated list of origins permitted to call admin endpoints
    | (anything not under /api/v1/public/widget/* nor /api/v1/webhooks/*).
    | Empty list means same-origin only. Enforced by RestrictAdminOrigin.
    */

    'admin_allowed_origins' => array_values(array_filter(array_map('trim', explode(',', (string) env('CORS_ADMIN_ALLOWED_ORIGINS', ''))))),
];
