<?php

namespace App\Jobs\Ai;

use App\Ai\Agents\ConversationSummarizer;
use App\Models\Conversation;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Throwable;

class SummarizeConversationJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 2;

    public int $backoff = 30;

    public function __construct(public Conversation $conversation) {}

    public function handle(): void
    {
        if ($this->conversation->summary) {
            return;
        }

        try {
            $summarizer = new ConversationSummarizer($this->conversation);
            $response = $summarizer->prompt($summarizer->transcript());

            $summary = trim((string) $response->text);
            if ($summary !== '') {
                $this->conversation->update(['summary' => $summary]);
            }
        } catch (Throwable $e) {
            Log::warning('Conversation summary failed', [
                'conversation_id' => $this->conversation->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
