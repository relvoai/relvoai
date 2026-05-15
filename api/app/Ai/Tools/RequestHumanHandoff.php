<?php

namespace App\Ai\Tools;

use App\Models\Conversation;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;

/**
 * Tool the AI agent invokes when it cannot or should not continue the
 * conversation itself. Records the request on the conversation; the
 * message handler reads this flag after the agent returns and performs
 * the actual re-assignment to a human.
 */
class RequestHumanHandoff implements Tool
{
    public function __construct(public Conversation $conversation) {}

    public function description(): string
    {
        return 'Hand the conversation off to a human agent. Invoke this whenever the visitor explicitly asks for a human, you are uncertain, or the question is out of scope for customer support.';
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'reason' => $schema->string()
                ->description('One-line reason for the handoff (e.g. "visitor requested a human", "pricing question not in knowledge base").')
                ->required(),
            'summary' => $schema->string()
                ->description('Two-line recap of the visitor\'s need so the human agent can pick up without reading the full transcript.')
                ->required(),
        ];
    }

    public function handle(Request $request): string
    {
        $reason = (string) $request->string('reason');
        $summary = (string) $request->string('summary');

        // Stash on conversation meta so the pipeline can act on it after the agent call returns.
        $meta = $this->conversation->meta ?? [];
        $meta['ai_handoff'] = [
            'reason' => $reason,
            'summary' => $summary,
            'requested_at' => now()->toIso8601String(),
        ];
        $this->conversation->forceFill(['meta' => $meta])->save();

        return 'Handoff requested. A human agent will continue.';
    }
}
