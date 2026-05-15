<?php

namespace App\Services\Telegram;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TelegramService
{
    private const BASE_URL = 'https://api.telegram.org/bot';

    /**
     * Send a text message to a Telegram chat.
     */
    public function sendMessage(string $botToken, string $chatId, string $text): bool
    {
        $response = Http::post(self::BASE_URL.$botToken.'/sendMessage', [
            'chat_id' => $chatId,
            'text' => $text,
            'parse_mode' => 'HTML',
        ]);

        if ($response->failed()) {
            Log::error('Telegram sendMessage failed', [
                'chat_id' => $chatId,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return false;
        }

        return true;
    }

    /**
     * Register a webhook URL with the Telegram Bot API.
     */
    public function setWebhook(string $botToken, string $webhookUrl): bool
    {
        $response = Http::post(self::BASE_URL.$botToken.'/setWebhook', [
            'url' => $webhookUrl,
            'allowed_updates' => ['message'],
        ]);

        return $response->successful() && ($response->json('ok') === true);
    }

    /**
     * Remove the webhook from the Telegram Bot API.
     */
    public function deleteWebhook(string $botToken): bool
    {
        $response = Http::post(self::BASE_URL.$botToken.'/deleteWebhook');

        return $response->successful();
    }

    /**
     * Verify a bot token by calling getMe.
     *
     * @return array{ok: bool, username?: string, first_name?: string}
     */
    public function getMe(string $botToken): array
    {
        $response = Http::get(self::BASE_URL.$botToken.'/getMe');

        if ($response->failed() || $response->json('ok') !== true) {
            return ['ok' => false];
        }

        $result = $response->json('result');

        return [
            'ok' => true,
            'username' => $result['username'] ?? null,
            'first_name' => $result['first_name'] ?? null,
        ];
    }
}
