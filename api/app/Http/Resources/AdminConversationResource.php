<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminConversationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'status' => $this->status,
            'priority' => $this->priority,
            'subject' => $this->subject,
            'visitor' => new VisitorResource($this->whenLoaded('visitor')),
            'contact' => array_merge(
                $this->contact ? (new ContactResource($this->contact))->resolve($request) : [
                    'id' => null,
                    'name' => $this->visitor->name ?? 'Anonymous', // Fallback if no contact
                    'email' => null,
                    'phone' => null,
                    'avatar_url' => null,
                    'custom_attributes' => null,
                    'tags' => [],
                ],
                [
                    'location' => [
                        'ip' => $this->visitor->ip_address ?? null,
                        'country' => $this->visitor->meta['country'] ?? null,
                        'city' => $this->visitor->meta['city'] ?? null,
                        'timezone' => $this->visitor->meta['timezone'] ?? null,
                    ],
                    'browser' => [
                        'user_agent' => $this->visitor->meta['user_agent'] ?? null,
                        'platform' => $this->visitor->meta['platform'] ?? null,
                    ],
                ]
            ),
            'labels' => $this->tags ?? [],
            'messages' => MessageResource::collection($this->whenLoaded('messages')),
            'assigned_to' => new UserResource($this->whenLoaded('assignedTo')),
            // 'department' => new DepartmentResource($this->whenLoaded('department')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'meta' => $this->meta,
        ];
    }
}
