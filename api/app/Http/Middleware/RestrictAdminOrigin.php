<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Enforces tighter CORS for admin endpoints.
 *
 * `config('cors.allowed_origins')` is intentionally permissive so the
 * embeddable widget can call `/api/v1/public/widget/*` from any site. This
 * middleware applies to non-widget, non-webhook requests and rejects browser
 * cross-origin calls unless the Origin is in `cors.admin_allowed_origins`
 * (or empty/missing — same-origin requests carry no Origin header).
 */
class RestrictAdminOrigin
{
    public function handle(Request $request, Closure $next): Response
    {
        $origin = $request->headers->get('Origin');

        if ($origin === null || $origin === '') {
            return $next($request);
        }

        if ($this->isPublicPath($request->path())) {
            return $next($request);
        }

        $allowed = (array) config('cors.admin_allowed_origins', []);

        if (in_array($origin, $allowed, true)) {
            return $next($request);
        }

        return response()->json([
            'success' => false,
            'message' => 'Cross-origin request denied for admin endpoint.',
            'errors' => null,
        ], 403);
    }

    protected function isPublicPath(string $path): bool
    {
        return str_starts_with($path, 'api/v1/public/widget')
            || str_starts_with($path, 'api/v1/webhooks');
    }
}
