<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MessageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $isNote = $this->message_type === 'note';
        $senderType = match (true) {
            $isNote => 'agent',
            $this->message_type === 'system' => 'system',
            (bool) $this->user_id => 'agent',
            default => 'visitor',
        };

        return [
            'id' => $this->id,
            'message_type' => $isNote ? 'text' : $this->message_type,
            'body' => $this->body,
            'client_message_id' => $this->client_message_id,
            'is_internal' => $isNote,
            'created_at' => $this->created_at,
            'sender' => [
                'type' => $senderType,
                'id' => $this->user_id ?? $this->visitor_id,
                'name' => $this->user_id ? ($this->user->first_name ?? 'Agent') : 'Visitor',
                'avatar' => $this->whenLoaded('user', fn () => $this->user?->avatar_url),
            ],
        ];
    }
}
