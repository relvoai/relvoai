<?php

namespace App\Http\Controllers\Api\V1\Widget;

use App\Http\Controllers\Api\ApiController;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\WidgetSession;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class WidgetConversationController extends ApiController
{
    /**
     * List Conversations
     *
     * Returns all conversations for the authenticated visitor, ordered by most recent activity.
     * Includes last message preview and unread count.
     */
    public function index(Request $request)
    {
        $session = $this->authenticateSession($request);
        if (! $session) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
        }

        $conversations = Conversation::where('channel_id', $session->channel_id)
            ->where('contact_id', $session->contact_id)
            ->with(['lastMessage'])
            ->orderByDesc('updated_at')
            ->get()
            ->map(fn (Conversation $conv) => [
                'id' => $conv->id,
                'subject' => $conv->subject,
                'status' => $conv->status,
                'created_at' => $conv->created_at,
                'updated_at' => $conv->updated_at,
                'last_message' => $conv->lastMessage ? [
                    'body' => Str::limit($conv->lastMessage->body, 80),
                    'type' => $conv->lastMessage->message_type,
                    'created_at' => $conv->lastMessage->created_at,
                ] : null,
                'message_count' => $conv->messages()->count(),
            ]);

        return $this->success($conversations);
    }

    /**
     * Start New Conversation
     *
     * Creates a new conversation for the visitor, regardless of existing open ones.
     * Updates the session to point to the new conversation.
     */
    public function store(Request $request)
    {
        $session = $this->authenticateSession($request);
        if (! $session) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
        }

        $session->load('channel');

        $conversation = Conversation::create([
            'channel_id' => $session->channel_id,
            'inbox_id' => $session->channel->inbox_id,
            'contact_id' => $session->contact_id,
            'visitor_id' => $session->conversation->visitor_id,
            'status' => 'open',
            'subject' => 'New Conversation',
        ]);

        // Update session to point to new conversation
        $session->update(['conversation_id' => $conversation->id]);

        return $this->success([
            'id' => $conversation->id,
            'subject' => $conversation->subject,
            'status' => $conversation->status,
            'created_at' => $conversation->created_at,
        ], 'Conversation created', 201);
    }

    /**
     * Select Conversation
     *
     * Switch the session's active conversation so subsequent message calls use it.
     */
    public function select(Request $request, string $conversationId)
    {
        $session = $this->authenticateSession($request);
        if (! $session) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
        }

        // Verify the conversation belongs to this visitor/contact
        $conversation = Conversation::where('id', $conversationId)
            ->where('channel_id', $session->channel_id)
            ->where('contact_id', $session->contact_id)
            ->first();

        if (! $conversation) {
            return $this->notFound('Conversation not found.');
        }

        $session->update(['conversation_id' => $conversation->id]);

        return $this->success([
            'id' => $conversation->id,
            'status' => $conversation->status,
        ]);
    }

    private function authenticateSession(Request $request): ?WidgetSession
    {
        $token = $request->bearerToken();
        if (! $token) {
            return null;
        }

        $hashedToken = hash('sha256', $token);

        return WidgetSession::where('token', $hashedToken)
            ->where('expires_at', '>', now())
            ->with('conversation')
            ->first();
    }
}
