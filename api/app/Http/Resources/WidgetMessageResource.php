<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WidgetMessageResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'body' => $this->body,
            'type' => $this->message_type, // 'visitor', 'user', 'system'
            'visitor_id' => $this->visitor_id,
            'user_id' => $this->user_id,
            'created_at' => $this->created_at,
            'sender' => $this->whenLoaded('user', function () {
                return [
                    'name' => $this->user->name,
                    'avatar_url' => $this->user->avatar_url, // Assuming user has avatar
                ];
            }),
        ];
    }
}
