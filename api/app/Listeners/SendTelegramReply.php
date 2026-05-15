<?php

namespace App\Listeners;

use App\Events\MessageCreated;
use App\Services\ChannelType;
use App\Services\Telegram\TelegramService;
use Illuminate\Support\Facades\Log;

class SendTelegramReply
{
    public function __construct(private TelegramService $telegramService) {}

    public function handle(MessageCreated $event): void
    {
        $message = $event->message;

        // Only send for agent messages (not notes, system, or visitor messages)
        if ($message->message_type !== 'agent') {
            return;
        }

        $conversation = $message->conversation;
        $channel = $conversation->channel;

        // Only for Telegram channels
        if ($channel->type !== ChannelType::TELEGRAM) {
            return;
        }

        $chatId = $conversation->meta['telegram_chat_id'] ?? null;
        $botToken = $channel->config['bot_token'] ?? null;

        if (! $chatId || ! $botToken) {
            Log::warning('SendTelegramReply: Missing chat_id or bot_token', [
                'conversation_id' => $conversation->id,
                'has_chat_id' => (bool) $chatId,
                'has_bot_token' => (bool) $botToken,
            ]);

            return;
        }

        $sent = $this->telegramService->sendMessage($botToken, $chatId, $message->body);

        if (! $sent) {
            Log::error('SendTelegramReply: Failed to send message', [
                'conversation_id' => $conversation->id,
                'message_id' => $message->id,
            ]);
        }
    }
}
