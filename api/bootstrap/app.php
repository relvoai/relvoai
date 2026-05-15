<?php

use App\Enterprise\Http\Middleware\RequireValidLicense;
use App\Http\Middleware\DevTokenMiddleware;
use App\Http\Middleware\RestrictAdminOrigin;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->prependToGroup('api', DevTokenMiddleware::class);
        $middleware->prependToGroup('api', RestrictAdminOrigin::class);
        $middleware->alias([
            'license' => RequireValidLicense::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
