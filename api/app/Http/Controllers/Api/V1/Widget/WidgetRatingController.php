<?php

namespace App\Http\Controllers\Api\V1\Widget;

use App\Http\Controllers\Api\ApiController;
use App\Models\Conversation;
use App\Models\ConversationRating;
use App\Models\WidgetSession;
use Illuminate\Http\Request;

class WidgetRatingController extends ApiController
{
    /**
     * Submit Conversation Rating
     *
     * Allows a visitor to rate a conversation via their session token.
     */
    public function store(Request $request)
    {
        $session = $this->authenticateSession($request);
        if (! $session) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
        }

        $validated = $request->validate([
            'conversation_id' => 'required|uuid|exists:conversations,id',
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
        ]);

        $conversation = Conversation::where('id', $validated['conversation_id'])
            ->where('id', $session->conversation_id)
            ->first();

        if (! $conversation) {
            return $this->notFound('Conversation not found.');
        }

        // Prevent duplicate ratings
        $existing = ConversationRating::where('conversation_id', $conversation->id)->first();
        if ($existing) {
            return $this->error('Conversation already rated.', null, 409);
        }

        $rating = ConversationRating::create([
            'conversation_id' => $conversation->id,
            'inbox_id' => $conversation->inbox_id,
            'channel_id' => $conversation->channel_id,
            'visitor_id' => $session->conversation->visitor_id ?? null,
            'rating' => $validated['rating'],
            'comment' => $validated['comment'] ?? null,
        ]);

        return $this->success([
            'id' => $rating->id,
            'rating' => $rating->rating,
        ], 'Thank you for your feedback.', 201);
    }

    private function authenticateSession(Request $request): ?WidgetSession
    {
        $token = $request->bearerToken();
        if (! $token) {
            return null;
        }

        return WidgetSession::where('token', hash('sha256', $token))
            ->where('expires_at', '>', now())
            ->with('conversation')
            ->first();
    }
}
