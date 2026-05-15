<?php

namespace App\Ai\Agents;

use App\Models\Conversation;
use Laravel\Ai\Attributes\UseCheapestModel;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Promptable;

/**
 * Cheap one-shot agent that writes a 1–2 sentence summary of a closed
 * conversation for the admin dashboard. Uses the cheapest available
 * model since summaries are throwaway and non-customer-facing.
 */
#[UseCheapestModel]
class ConversationSummarizer implements Agent
{
    use Promptable;

    public function __construct(public Conversation $conversation) {}

    public function instructions(): string
    {
        return 'You summarize a customer-support conversation transcript into 1–2 short sentences for the admin dashboard. Focus on the visitor\'s intent and the outcome. Plain prose only, no bullet points, no preamble.';
    }

    /**
     * Build the transcript on demand so the job can call
     * $summarizer->prompt($summarizer->transcript()).
     */
    public function transcript(): string
    {
        return $this->conversation
            ->messages()
            ->latest()
            ->limit(50)
            ->get()
            ->reverse()
            ->map(function ($m) {
                $speaker = match ($m->message_type) {
                    'visitor' => 'Visitor',
                    'agent' => 'Agent',
                    'bot' => 'AI',
                    default => 'System',
                };

                return $speaker.': '.trim((string) $m->body);
            })
            ->implode("\n");
    }
}
