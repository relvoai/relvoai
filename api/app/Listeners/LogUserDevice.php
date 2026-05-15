<?php

namespace App\Listeners;

use App\Models\UserDevice;
use Illuminate\Auth\Events\Login;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Request;

class LogUserDevice implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * Create the event listener.
     */
    public function __construct()
    {
        //
    }

    /**
     * Handle the event.
     */
    public function handle(Login $event): void
    {
        if (! $event->user) {
            return;
        }

        $ip = Request::ip();
        $userAgent = Request::userAgent();
        // Simple distinct device key based on IP+UA if no device_id header
        $deviceIdKey = Request::header('X-Device-Id') ?? md5($ip.$userAgent);

        UserDevice::updateOrCreate(
            [
                'user_id' => $event->user->id,
                'device_id' => $deviceIdKey,
            ],
            [
                'name' => $userAgent, // Store full UA or parse
                'ip_address' => $ip,
                'last_active_at' => now(),
            ]
        );
    }
}
