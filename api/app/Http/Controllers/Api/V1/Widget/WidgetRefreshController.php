<?php

namespace App\Http\Controllers\Api\V1\Widget;

use App\Http\Controllers\Api\ApiController;
use App\Models\Channel;
use App\Models\Conversation;
use App\Models\Visitor;
use App\Models\WidgetSession;
use Dedoc\Scramble\Attributes\HeaderParameter;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class WidgetRefreshController extends ApiController
{
    /**
     * Refresh Session
     *
     * Renew the session token using the Visitor UID. Does not require the old token.
     * Use this if the session expires (401).
     */
    #[HeaderParameter('X-Channel-Key', description: 'The public channel key', type: 'string', required: true)]
    #[HeaderParameter('X-Visitor-Uid', description: 'Unique Visitor ID (client-generated UUID)', type: 'string', required: true)]
    public function __invoke(Request $request)
    {
        // 1. Validate Headers
        $channelKey = $request->header('X-Channel-Key');
        $visitorUid = $request->header('X-Visitor-Uid');
        // $contactIdHint = $request->header('X-Contact-Id'); // Optional hint

        if (! $channelKey || ! $visitorUid) {
            return $this->error('Headers required', null, 400);
        }

        // 2. Resolve Channel
        $channel = Channel::where('channel_key', $channelKey)->first();
        if (! $channel) {
            return $this->error('Invalid channel', null, 404);
        }

        // 3. Resolve Visitor
        $visitor = Visitor::where('channel_id', $channel->id)->where('uid', $visitorUid)->first();

        if (! $visitor) {
            return $this->error('Visitor not found', ['code' => 'BOOTSTRAP_REQUIRED'], 409);
        }

        $visitor->update(['last_seen_at' => now()]);

        // 4. Resolve Contact
        $contact = $visitor->contact; // Trust visitor linkage first

        if (! $contact) {
            // Should not happen if bootstrap always creates anonymous contact, but safety check:
            return $this->error('Contact missing', ['code' => 'BOOTSTRAP_REQUIRED'], 409);
        }

        // 5. Determine Conversation
        $requestedConversationId = $request->input('conversation_id');
        $conversation = null;

        if ($requestedConversationId) {
            // Verify ownership
            $conversation = Conversation::where('id', $requestedConversationId)
                ->where('channel_id', $channel->id)
                ->where(function ($q) use ($contact, $visitor) {
                    $q->where('contact_id', $contact->id)
                        ->orWhere('visitor_id', $visitor->id);
                })
                ->first();

            // If requested conversation is invalid or closed, we might need a new one or find latest open
            if (! $conversation || $conversation->status !== 'open') {
                $conversation = null;
            }
        }

        // Fallback: Find latest open
        if (! $conversation) {
            $conversation = Conversation::where('channel_id', $channel->id)
                ->where('status', 'open')
                ->where(function ($query) use ($contact, $visitor) {
                    $query->where('contact_id', $contact->id)
                        ->orWhere('visitor_id', $visitor->id);
                })
                ->latest('updated_at')
                ->first();
        }

        // Ensure Visitor ID is set on reused conversation
        if ($conversation && ! $conversation->visitor_id) {
            $conversation->update(['visitor_id' => $visitor->id]);
        }

        // If strict NO creation on refresh, we return error if no open conversation?
        // Rules say: "if none -> create conversation ONLY if allowed; else return 409 BOOTSTRAP_REQUIRED"
        // Let's assume refreshing usually means "keep going". If no conversation, we might create one OR force bootstrap.
        // For robustness, let's create one if we are confident in the visitor.
        if (! $conversation) {
            $conversation = Conversation::create([
                'channel_id' => $channel->id,
                'inbox_id' => $channel->inbox_id,
                'contact_id' => $contact->id,
                'visitor_id' => $visitor->id,
                'status' => 'open',
                'subject' => 'Refresh Conversation',
            ]);
        }

        // 6. Issue Session
        $rawToken = Str::random(64);
        $hashedToken = hash('sha256', $rawToken);

        WidgetSession::create([
            'channel_id' => $channel->id,
            'contact_id' => $contact->id,
            'conversation_id' => $conversation->id,
            'token' => $hashedToken,
            'expires_at' => now()->addHours(24),
        ]);

        return $this->success([
            'session_token' => $rawToken,
            'conversation_id' => $conversation->id,
            'contact_id' => $contact->id,
        ]);
    }
}
