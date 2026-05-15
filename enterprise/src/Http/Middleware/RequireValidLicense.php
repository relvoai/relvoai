<?php

namespace App\Enterprise\Http\Middleware;

use App\Enterprise\LicenseManager;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RequireValidLicense
{
    public function __construct(protected LicenseManager $license) {}

    public function handle(Request $request, Closure $next): Response
    {
        if (! $this->license->isValid()) {
            return new JsonResponse([
                'success' => false,
                'message' => 'A valid Enterprise license is required to access this resource.',
                'errors' => null,
            ], 402);
        }

        return $next($request);
    }
}
