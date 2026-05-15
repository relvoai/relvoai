<?php

namespace App\Notifications;

use App\Models\Message;
use App\Notifications\Channels\TelegramChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class NewConversationMessage extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Message $message) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        $channels = ['mail', 'database', 'broadcast'];

        if ($notifiable->routeNotificationForTelegram()) {
            $channels[] = TelegramChannel::class;
        }

        return $channels;
    }

    public function toMail(object $notifiable): MailMessage
    {
        [$title, $preview, $url] = $this->contextFor($this->message);

        return (new MailMessage)
            ->subject("New message from {$title}")
            ->greeting("Hi {$notifiable->first_name},")
            ->line("{$title} sent a new message:")
            ->line("\"{$preview}\"")
            ->action('Open conversation', $url)
            ->line('Reply promptly to keep the conversation moving.');
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        [$title, $preview, $url] = $this->contextFor($this->message);

        return [
            'type' => 'conversation.message.new',
            'conversation_id' => $this->message->conversation_id,
            'message_id' => $this->message->id,
            'from' => $title,
            'preview' => $preview,
            'url' => $url,
        ];
    }

    public function toTelegram(object $notifiable): string
    {
        [$title, $preview, $url] = $this->contextFor($this->message);

        return "💬 *New message from {$title}*\n\n{$preview}\n\n{$url}";
    }

    /**
     * @return array{0: string, 1: string, 2: string}
     */
    private function contextFor(Message $message): array
    {
        $conversation = $message->conversation;
        $visitorName = $conversation?->contact?->name
            ?? $conversation?->visitor?->uid
            ?? 'Visitor';

        $body = (string) ($message->body ?? '');
        $preview = mb_strlen($body) > 140 ? mb_substr($body, 0, 140).'…' : $body;
        if ($preview === '') {
            $preview = '[Attachment]';
        }

        $url = rtrim(config('app.url'), '/')."/conversations/{$message->conversation_id}";

        return [$visitorName, $preview, $url];
    }
}
