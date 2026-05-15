<?php

namespace App\Http\Controllers\Api\V1\Widget;

use App\Http\Controllers\Api\ApiController;
use App\Models\Visitor;
use App\Models\VisitorSession;
use App\Models\WidgetSession;
use Illuminate\Http\Request;

class HeartbeatController extends ApiController
{
    /**
     * Visitor Heartbeat
     *
     * Upsert a visitor_session row and refresh last_activity_at so the
     * admin "online now" list stays accurate. Called by the widget on a
     * timer while the visitor has the page open.
     */
    public function __invoke(Request $request)
    {
        $token = $request->bearerToken();
        if (! $token) {
            return $this->error('Unauthorized', null, 401);
        }

        $session = WidgetSession::where('token', hash('sha256', $token))
            ->where('expires_at', '>', now())
            ->with('conversation')
            ->first();

        if (! $session || ! $session->conversation) {
            return $this->error('Unauthorized', null, 401);
        }

        $data = $request->validate([
            'page_url' => 'nullable|string|max:2048',
            'referrer' => 'nullable|string|max:2048',
        ]);

        $visitorId = $session->conversation->visitor_id;
        if (! $visitorId) {
            return $this->error('No visitor linked to session', null, 422);
        }

        $visitorSession = VisitorSession::where('channel_id', $session->channel_id)
            ->where('visitor_id', $visitorId)
            ->where('last_activity_at', '>=', now()->subMinutes(30))
            ->latest('last_activity_at')
            ->first();

        if ($visitorSession) {
            $visitorSession->update([
                'last_activity_at' => now(),
                'ip' => $request->ip(),
                'user_agent' => (string) $request->userAgent(),
            ]);
        } else {
            $visitorSession = VisitorSession::create([
                'channel_id' => $session->channel_id,
                'visitor_id' => $visitorId,
                'session_started_at' => now(),
                'last_activity_at' => now(),
                'entry_url' => $data['page_url'] ?? null,
                'referrer' => $data['referrer'] ?? null,
                'ip' => $request->ip(),
                'user_agent' => (string) $request->userAgent(),
            ]);
        }

        Visitor::where('id', $visitorId)->update([
            'last_seen_at' => now(),
            'last_seen_url' => $data['page_url'] ?? null,
        ]);

        return $this->success([
            'session_id' => $visitorSession->id,
            'last_activity_at' => $visitorSession->last_activity_at,
        ]);
    }
}
