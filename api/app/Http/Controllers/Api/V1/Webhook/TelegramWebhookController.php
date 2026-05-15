<?php

namespace App\Http\Controllers\Api\V1\Webhook;

use App\Http\Controllers\Api\ApiController;
use App\Models\Channel;
use App\Models\Contact;
use App\Models\Conversation;
use App\Models\Visitor;
use App\Services\ChannelType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class TelegramWebhookController extends ApiController
{
    /**
     * Handle Telegram Webhook
     *
     * Receives incoming updates from the Telegram Bot API.
     */
    public function __invoke(Request $request, string $channelKey): JsonResponse
    {
        $channel = Channel::where('channel_key', $channelKey)
            ->where('type', ChannelType::TELEGRAM)
            ->where('is_active', true)
            ->first();

        if (! $channel) {
            return $this->notFound('Channel not found.');
        }

        $update = $request->all();

        // Only handle message updates
        if (! isset($update['message'])) {
            return $this->success(null, 'Update ignored.');
        }

        $telegramMessage = $update['message'];
        $chat = $telegramMessage['chat'] ?? null;
        $from = $telegramMessage['from'] ?? null;
        $text = $telegramMessage['text'] ?? null;

        if (! $chat || ! $from) {
            return $this->error('Invalid update payload.', null, 422);
        }

        // Only handle private chats for now
        if (($chat['type'] ?? '') !== 'private') {
            return $this->success(null, 'Non-private chat ignored.');
        }

        if (! $text) {
            return $this->success(null, 'Non-text message ignored.');
        }

        $telegramUserId = (string) $from['id'];
        $senderName = trim(($from['first_name'] ?? '').' '.($from['last_name'] ?? ''));
        $senderUsername = $from['username'] ?? null;
        $chatId = (string) $chat['id'];

        // Resolve or create Contact
        $contact = Contact::firstOrCreate(
            ['external_id' => 'telegram:'.$telegramUserId],
            [
                'name' => $senderName ?: $senderUsername ?: 'Telegram User',
            ]
        );

        // Update contact name if it was a placeholder
        if ($senderName && $contact->name === 'Telegram User') {
            $contact->update(['name' => $senderName]);
        }

        // Resolve or create Visitor
        $visitor = Visitor::firstOrCreate(
            ['channel_id' => $channel->id, 'uid' => 'telegram:'.$telegramUserId],
            [
                'contact_id' => $contact->id,
                'first_seen_at' => now(),
                'last_seen_at' => now(),
            ]
        );

        $visitor->update(['last_seen_at' => now()]);

        // Link visitor to contact if not already linked
        if (! $visitor->contact_id) {
            $visitor->update(['contact_id' => $contact->id]);
        }

        // Find or create conversation
        $conversation = Conversation::where('channel_id', $channel->id)
            ->where('visitor_id', $visitor->id)
            ->whereIn('status', ['open', 'pending'])
            ->latest('updated_at')
            ->first();

        if (! $conversation) {
            $conversation = Conversation::create([
                'inbox_id' => $channel->inbox_id,
                'channel_id' => $channel->id,
                'visitor_id' => $visitor->id,
                'contact_id' => $contact->id,
                'status' => 'open',
                'priority' => 'normal',
                'subject' => mb_substr($text, 0, 100),
                'last_message_at' => now(),
                'last_message_by' => 'visitor',
            ]);
        }

        // Store chat_id in conversation meta for outbound replies
        $meta = $conversation->meta ?? [];
        $meta['telegram_chat_id'] = $chatId;
        $conversation->update(['meta' => $meta]);

        // Create message
        $message = $conversation->messages()->create([
            'visitor_id' => $visitor->id,
            'message_type' => 'visitor',
            'body' => $text,
            'format' => 'text',
            'client_message_id' => 'tg:'.($telegramMessage['message_id'] ?? uniqid()),
        ]);

        // Update conversation timestamps
        $conversation->update([
            'last_message_at' => now(),
            'last_message_id' => $message->id,
            'last_message_by' => 'visitor',
        ]);
        Log::info('Telegram message received', [
            'channel_id' => $channel->id,
            'conversation_id' => $conversation->id,
            'message_id' => $message->id,
        ]);

        return $this->success(null, 'Message received.');
    }
}
