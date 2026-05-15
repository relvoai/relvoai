<?php

namespace App\Ai\Agents;

use App\Ai\Middleware\DebitCredits;
use App\Ai\Middleware\PerConversationRateLimit;
use App\Ai\Middleware\VisitorMessageModerator;
use App\Ai\Tools\RequestHumanHandoff;
use App\Models\Ai\AiAgent;
use App\Models\Ai\AiKnowledgeChunk;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Setting;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\Conversational;
use Laravel\Ai\Contracts\HasMiddleware;
use Laravel\Ai\Contracts\HasTools;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Messages\Message as AiMessage;
use Laravel\Ai\Messages\MessageRole;
use Laravel\Ai\Promptable;
use Laravel\Ai\Tools\SimilaritySearch;

/**
 * The runtime agent for a single conversation turn.
 *
 * Composition rules:
 * - `instructions()` = app-level system prompt (autoloaded) + identity_persona + custom_instructions
 *   (app prompt first so its guardrails are non-overridable).
 * - `messages()` = last 30 messages from the livechat conversation, mapped to the SDK's
 *   user/assistant roles. We do not use the SDK's agent_conversations table — our own
 *   messages table is the single source of truth for the transcript.
 * - `tools()` = scoped RAG over this agent's own chunks + handoff tool bound to the conversation.
 */
class SupportAgent implements Agent, Conversational, HasMiddleware, HasTools
{
    use Promptable;

    /**
     * Resolver injected by EnterpriseServiceProvider when the license is valid.
     * Returns extra Tools the agent should expose for a given AiAgent.
     *
     * @var (callable(AiAgent): iterable<Tool>)|null
     */
    public static $extraToolsResolver = null;

    public function __construct(
        public AiAgent $agent,
        public Conversation $conversation,
    ) {}

    public function instructions(): string
    {
        return collect([
            Setting::query()->where('key', 'ai.system_instruction')->value('value'),
            $this->agent->identity_persona,
            $this->agent->custom_instructions,
        ])
            ->filter(fn ($part) => filled($part))
            ->map(fn ($part) => trim((string) $part))
            ->implode("\n\n");
    }

    /**
     * @return iterable<AiMessage>
     */
    public function messages(): iterable
    {
        return $this->conversation
            ->messages()
            ->latest()
            ->limit(30)
            ->get()
            ->reverse()
            ->map(fn (Message $m) => $this->toSdkMessage($m))
            ->filter()
            ->values()
            ->all();
    }

    /**
     * @return iterable<Tool>
     */
    public function tools(): iterable
    {
        $agentId = $this->agent->id;

        $base = [
            SimilaritySearch::usingModel(
                AiKnowledgeChunk::class,
                column: 'embedding',
                minSimilarity: 0.5,
                limit: 6,
                query: fn ($query) => $query->where('ai_agent_id', $agentId),
            )->withDescription('Search this agent\'s knowledge base for passages relevant to the visitor\'s question.'),

            new RequestHumanHandoff($this->conversation),
        ];

        if (is_callable(self::$extraToolsResolver)) {
            foreach (call_user_func(self::$extraToolsResolver, $this->agent) as $extra) {
                $base[] = $extra;
            }
        }

        return $base;
    }

    /**
     * @return array<int, object>
     */
    public function middleware(): array
    {
        return [
            new VisitorMessageModerator($this->conversation),
            new PerConversationRateLimit($this->conversation),
            new DebitCredits($this->agent, $this->conversation),
        ];
    }

    private function toSdkMessage(Message $message): ?AiMessage
    {
        $role = match ($message->message_type) {
            'visitor' => MessageRole::User,
            'agent', 'bot' => MessageRole::Assistant,
            default => null, // skip system + note
        };

        if ($role === null) {
            return null;
        }

        $body = trim((string) $message->body);
        if ($body === '') {
            return null;
        }

        return new AiMessage($role, $body);
    }
}
