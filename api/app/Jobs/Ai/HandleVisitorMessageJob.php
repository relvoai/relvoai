<?php

namespace App\Jobs\Ai;

use App\Ai\Agents\SupportAgent;
use App\Models\Ai\AiAgent;
use App\Models\Ai\AiConversation;
use App\Models\Ai\AiCreditBalance;
use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Laravel\Ai\Enums\Lab;

/**
 * Runs the AI agent for one visitor turn.
 *
 * Contract:
 * - called only after the visitor's message has been persisted + broadcast.
 * - assumes the channel has a primary active AI agent (resolved at dispatch time).
 * - no-ops when the conversation is already handed off or when credits are depleted.
 */
class HandleVisitorMessageJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 2;

    public int $backoff = 10;

    public function __construct(
        public string $conversationId,
        public string $aiAgentId,
        public string $visitorMessageId,
    ) {}

    public function handle(): void
    {
        $conversation = Conversation::find($this->conversationId);
        $agent = AiAgent::find($this->aiAgentId);
        $visitorMessage = Message::find($this->visitorMessageId);

        if (! $conversation || ! $agent || ! $visitorMessage || ! $agent->is_active) {
            return;
        }

        $aiConversation = AiConversation::firstOrCreate(
            ['conversation_id' => $conversation->id],
            ['ai_agent_id' => $agent->id],
        );
        if ($aiConversation->handed_off_at !== null) {
            return;
        }

        if (AiCreditBalance::current()->balance <= 0) {
            $this->handoff($conversation, $aiConversation, 'credits_depleted', 'Credits exhausted; connecting to a human agent.');

            return;
        }

        $prompt = trim((string) $visitorMessage->body);
        if ($prompt === '') {
            return;
        }

        $response = (new SupportAgent($agent, $conversation))
            ->prompt($prompt, ...$this->providerRouting($agent));

        // The handoff tool stashes on conversation.meta when invoked. Honor it before persisting a reply.
        $conversation->refresh();
        $handoffPayload = $conversation->meta['ai_handoff'] ?? null;
        if ($handoffPayload) {
            $this->handoff(
                $conversation,
                $aiConversation,
                (string) ($handoffPayload['reason'] ?? 'ai_requested'),
                (string) ($handoffPayload['summary'] ?? ''),
            );

            return;
        }

        $text = trim((string) $response->text);
        if ($text === '') {
            return;
        }

        $botMessage = Message::create([
            'conversation_id' => $conversation->id,
            'user_id' => null,
            'visitor_id' => null,
            'message_type' => 'bot',
            'body' => $text,
            'format' => 'text',
            'meta' => [
                'ai_agent_id' => $agent->id,
                'provider' => $response->meta?->provider,
                'model' => $response->meta?->model,
                'usage' => $response->usage->toArray(),
            ],
            'delivered_at' => now(),
        ]);

        $conversation->update([
            'last_message_at' => now(),
            'last_message_id' => $botMessage->id,
            'last_message_by' => 'bot',
            'first_response_at' => $conversation->first_response_at ?? now(),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function providerRouting(AiAgent $agent): array
    {
        $args = [];
        if (filled($agent->provider) && ($lab = Lab::tryFrom((string) $agent->provider))) {
            $args['provider'] = $lab;
        }
        if (filled($agent->model)) {
            $args['model'] = $agent->model;
        }

        return $args;
    }

    private function handoff(Conversation $conversation, AiConversation $aiConversation, string $reason, string $summary): void
    {
        $aiConversation->update([
            'handed_off_at' => now(),
            'handoff_reason' => $reason,
            'handoff_summary' => $summary,
        ]);

        $systemMessage = Message::create([
            'conversation_id' => $conversation->id,
            'user_id' => null,
            'visitor_id' => null,
            'message_type' => 'system',
            'body' => trim('Connecting you to a teammate.'.($summary !== '' ? "\n\n".$summary : '')),
            'format' => 'text',
            'meta' => [
                'ai_handoff' => [
                    'reason' => $reason,
                    'agent_id' => $aiConversation->ai_agent_id,
                ],
            ],
            'delivered_at' => now(),
        ]);

        // Route to a human if unassigned — round-robin across the inbox's agents.
        $assigneeId = $conversation->assigned_to_user_id;
        if ($assigneeId === null) {
            $assigneeId = $conversation->inbox?->agents()->inRandomOrder()->value('users.id');
        }

        $meta = $conversation->meta ?? [];
        unset($meta['ai_handoff']);

        $conversation->update([
            'assigned_to_user_id' => $assigneeId,
            'assigned_at' => $assigneeId ? now() : null,
            'last_message_at' => now(),
            'last_message_id' => $systemMessage->id,
            'last_message_by' => 'system',
            'meta' => $meta,
        ]);
    }
}
