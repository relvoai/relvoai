<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VisitorResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'first_seen_at' => $this->first_seen_at,
            'last_seen_at' => $this->last_seen_at,
            'last_seen_url' => $this->last_seen_url,
            'last_referrer' => $this->last_referrer,
            'meta' => $this->meta,
            'contact' => $this->whenLoaded('contact'),
        ];
    }
}
