<?php

namespace App\Services;

use App\Models\BotRule;
use App\Models\Conversation;
use App\Models\Message;
use Carbon\Carbon;

class BotService
{
    /**
     * Handle logic for a newly created conversation.
     * Checks for welcome message and offline message status.
     */
    public function handleNewConversation(Conversation $conversation): void
    {
        $inbox = $conversation->inbox;

        if (! $inbox) {
            return;
        }

        // 1. Welcome Message
        if ($inbox->greeting_enabled && ! empty($inbox->greeting_message)) {
            $this->createBotMessage($conversation, $inbox->greeting_message);
        }

        // 2. Business Hours / Offline Message
        if ($inbox->working_hours_enabled && ! empty($inbox->working_hours)) {
            if (! $this->isWithinBusinessHours($inbox->working_hours, $inbox->timezone ?? 'UTC')) {
                if (! empty($inbox->out_of_office_message)) {
                    $this->createBotMessage($conversation, $inbox->out_of_office_message);
                }
            }
        }
    }

    /**
     * Process potential bot rules for a new message.
     */
    public function processRules(Message $message): void
    {
        if ($message->message_type !== 'visitor') {
            return;
        }

        $rules = BotRule::where('is_active', true)->get();

        foreach ($rules as $rule) {
            if ($this->ruleMatches($rule, $message->body)) {
                $this->createBotMessage($message->conversation, $rule->reply_content);
                break;
            }
        }
    }

    protected function ruleMatches(BotRule $rule, string $content): bool
    {
        $keywords = $rule->keywords ?? [];
        $type = $rule->trigger_type;

        if (empty($keywords) || empty($content)) {
            return false;
        }

        $contentLower = mb_strtolower($content);

        foreach ($keywords as $keyword) {
            $keywordLower = mb_strtolower($keyword);

            if ($type === 'exact') {
                if ($contentLower === $keywordLower) {
                    return true;
                }
            } elseif ($type === 'keyword' || $type === 'contains') {
                if (str_contains($contentLower, $keywordLower)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Create a bot message in the conversation.
     */
    protected function createBotMessage(Conversation $conversation, string $body): Message
    {
        return $conversation->messages()->create([
            'user_id' => null,
            'message_type' => 'bot',
            'body' => $body,
            'format' => 'text',
            'delivered_at' => now(),
        ]);
    }

    /**
     * Check if current time is within configured business hours.
     *
     * @param  array<string, array<int, array{start: string, end: string}>>  $hours
     */
    protected function isWithinBusinessHours(array $hours, string $timezone): bool
    {
        if (empty($hours)) {
            return true;
        }

        $now = Carbon::now($timezone);
        $day = strtolower($now->format('l'));

        if (! isset($hours[$day])) {
            return false;
        }

        $ranges = $hours[$day];

        foreach ($ranges as $range) {
            $start = Carbon::createFromTimeString($range['start'], $timezone);
            $end = Carbon::createFromTimeString($range['end'], $timezone);

            if ($now->between($start, $end)) {
                return true;
            }
        }

        return false;
    }
}
