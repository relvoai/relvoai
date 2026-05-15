<?php

namespace App\Http\Controllers\Api\V1\Widget;

use App\Http\Controllers\Api\ApiController;
use App\Http\Resources\WidgetMessageResource;
use App\Jobs\Ai\HandleVisitorMessageJob;
use App\Models\Ai\AiAgent;
use App\Models\Ai\AiConversation;
use App\Models\Ai\AiCreditBalance;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\WidgetSession;
use App\Notifications\NewConversationMessage;
use Illuminate\Http\Request;

class WidgetMessageController extends ApiController
{
    /**
     * List Messages
     *
     * Retrieve a paginated list of messages for the active conversation.
     * Requires a valid session token.
     */
    public function index(Request $request)
    {
        // 1. Authenticate Session
        $session = $this->authenticateSession($request);
        if (! $session) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
        }

        // 2. Fetch Messages
        $messages = $session->conversation->messages()
            ->with('user') // Eager load sender if agent
            ->latest()
            ->paginate(50);

        return $this->success(WidgetMessageResource::collection($messages));
    }

    /**
     * Send Message
     *
     * Send a new message from the visitor to the conversation.
     * Requires a valid session token.
     */
    public function store(Request $request)
    {
        $request->validate([
            'body' => 'required|string|max:10000',
        ]);

        // 1. Authenticate Session
        $session = $this->authenticateSession($request);
        if (! $session) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
        }

        // 2. Refresh Expiry
        $session->update(['expires_at' => now()->addDays(7)]);

        // 3. Create Message
        $message = Message::create([
            'conversation_id' => $session->conversation_id,
            'user_id' => null, // Visitor message
            'visitor_id' => $session->conversation->visitor_id, // Resolve from session conversation
            'body' => $request->input('body'),
            'message_type' => 'visitor',
            'format' => 'text',
        ]);

        // Let's use that for now.

        // Update Conversation Last Message
        $session->conversation->update([
            'last_message_at' => now(),
            'last_message_id' => $message->id,
            'last_message_by' => 'visitor',
        ]);
        if (! $this->dispatchAiReply($session->conversation, $message)) {
            $this->notifyAssignee($session->conversation, $message);
        }

        return $this->success(new WidgetMessageResource($message), 'Message sent', 201);
    }

    /**
     * Dispatch the AI reply pipeline when the channel has a primary active agent
     * AND account credits are available AND the conversation is not already
     * handed off to a human. Returns true when the AI will handle this turn
     * (human notification should be skipped).
     */
    private function dispatchAiReply(Conversation $conversation, Message $message): bool
    {
        $aiConversation = AiConversation::where('conversation_id', $conversation->id)->first();
        if ($aiConversation?->handed_off_at) {
            return false;
        }

        $channelId = $conversation->channel_id;

        $aiAgent = AiAgent::query()
            ->whereHas('channels', fn ($q) => $q->where('channels.id', $channelId)->where('ai_agent_channel.is_primary', true))
            ->where('is_active', true)
            ->first();
        if (! $aiAgent) {
            return false;
        }

        if (AiCreditBalance::current()->balance <= 0) {
            return false;
        }

        HandleVisitorMessageJob::dispatch(
            $conversation->id,
            $aiAgent->id,
            $message->id,
        );

        return true;
    }

    /**
     * Notify the conversation's assignee (if any) about the incoming visitor message.
     */
    private function notifyAssignee(Conversation $conversation, Message $message): void
    {
        $assignee = $conversation->assignedTo;
        if ($assignee) {
            $assignee->notify(new NewConversationMessage($message));
        }
    }

    /**
     * Authenticate the widget session using the bearer token.
     *
     * @return WidgetSession|null
     */
    private function authenticateSession(Request $request)
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
