<?php

namespace App\Http\Controllers\Api;

use App\Services\Telegram\TelegramService;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class MeController extends ApiController
{
    public function __construct(private TelegramService $telegram) {}

    /**
     * Get Notification Settings
     *
     * Returns the current user's notification routing configuration.
     * The bot token is never returned.
     */
    public function notificationSettings(Request $request)
    {
        $user = $request->user();

        return $this->success([
            'telegram' => [
                'chat_id' => $user->telegram_chat_id,
                'configured' => (bool) ($user->telegram_bot_token && $user->telegram_chat_id),
            ],
            'email' => $user->email,
        ]);
    }

    /**
     * Update Notification Settings
     *
     * Configure the user's Telegram bot token + chat id. Both must be
     * provided together (paired credentials). Pass both as null to clear.
     * The bot token is encrypted at rest.
     */
    public function updateNotificationSettings(Request $request)
    {
        $data = $request->validate([
            'telegram_bot_token' => 'nullable|string|max:200',
            'telegram_chat_id' => 'nullable|string|max:64',
        ]);

        $user = $request->user();

        $clearing = ($data['telegram_bot_token'] ?? null) === null
            && ($data['telegram_chat_id'] ?? null) === null;

        if ($clearing) {
            $user->update([
                'telegram_bot_token' => null,
                'telegram_chat_id' => null,
            ]);

            return $this->success(null, 'Telegram notifications disabled.');
        }

        if (empty($data['telegram_bot_token']) || empty($data['telegram_chat_id'])) {
            throw ValidationException::withMessages([
                'telegram_bot_token' => 'Both telegram_bot_token and telegram_chat_id are required.',
            ]);
        }

        $botInfo = $this->telegram->getMe($data['telegram_bot_token']);
        if (! ($botInfo['ok'] ?? false)) {
            throw ValidationException::withMessages([
                'telegram_bot_token' => 'Invalid Telegram bot token.',
            ]);
        }

        $user->update([
            'telegram_bot_token' => $data['telegram_bot_token'],
            'telegram_chat_id' => $data['telegram_chat_id'],
        ]);

        return $this->success([
            'telegram' => [
                'chat_id' => $user->telegram_chat_id,
                'configured' => true,
                'bot' => [
                    'username' => $botInfo['username'] ?? null,
                    'first_name' => $botInfo['first_name'] ?? null,
                ],
            ],
        ], 'Telegram notifications enabled.');
    }

    /**
     * List In-App Notifications
     */
    public function notifications(Request $request)
    {
        $notifications = $request->user()
            ->notifications()
            ->paginate((int) $request->get('per_page', 20));

        return $this->success($notifications);
    }

    /**
     * Mark One Notification Read
     */
    public function markNotificationRead(Request $request, string $id)
    {
        $notification = $request->user()->notifications()->where('id', $id)->firstOrFail();
        $notification->markAsRead();

        return $this->success(null, 'Notification marked as read.');
    }

    /**
     * Mark All Notifications Read
     */
    public function markAllNotificationsRead(Request $request)
    {
        $request->user()->unreadNotifications->markAsRead();

        return $this->success(null, 'All notifications marked as read.');
    }
}
