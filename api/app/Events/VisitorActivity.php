<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class VisitorActivity implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public $visitor,
        public string $activityType = 'heartbeat'
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('admin.visitors'),
        ];
    }

    public function broadcastWith(): array
    {
        return [
            'visitor' => [
                'id' => $this->visitor->id,
                'name' => $this->visitor->name ?? 'Visitor #'.substr($this->visitor->id, 0, 8),
                'avatar_url' => $this->visitor->avatar_url,
                'last_seen_at' => $this->visitor->last_seen_at,
                'last_seen_url' => $this->visitor->last_seen_url,
            ],
            'type' => $this->activityType,
        ];
    }
}
