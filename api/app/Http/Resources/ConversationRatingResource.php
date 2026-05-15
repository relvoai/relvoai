<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ConversationRatingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'conversation_id' => $this->conversation_id,
            'rating' => $this->rating,
            'comment' => $this->comment,
            'customer_name' => $this->visitor?->contact?->name ?? 'Visitor',
            'agent_name' => $this->conversation?->assignedTo
                ? trim($this->conversation->assignedTo->first_name.' '.$this->conversation->assignedTo->last_name)
                : 'Unassigned',
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
