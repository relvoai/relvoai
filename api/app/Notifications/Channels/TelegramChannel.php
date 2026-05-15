<?php

namespace App\Notifications\Channels;

use App\Services\Telegram\TelegramService;
use Illuminate\Notifications\Notification;

/**
 * Custom notification channel that sends a Telegram message via the
 * per-user bot + chat id returned by the notifiable's
 * `routeNotificationForTelegram()` method.
 *
 * Silently skips when the notifiable has no telegram route configured.
 */
class TelegramChannel
{
    public function __construct(private TelegramService $telegram) {}

    public function send(object $notifiable, Notification $notification): void
    {
        if (! method_exists($notification, 'toTelegram')) {
            return;
        }

        $route = $notifiable->routeNotificationFor('telegram', $notification);
        if (! is_array($route) || empty($route['bot_token']) || empty($route['chat_id'])) {
            return;
        }

        $text = (string) $notification->toTelegram($notifiable);
        if ($text === '') {
            return;
        }

        $this->telegram->sendMessage($route['bot_token'], $route['chat_id'], $text);
    }
}
