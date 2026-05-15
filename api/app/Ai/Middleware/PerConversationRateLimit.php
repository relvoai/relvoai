<?php

namespace App\Ai\Middleware;

use App\Models\Conversation;
use Closure;
use Illuminate\Cache\RateLimiter;
use Illuminate\Support\Str;
use Laravel\Ai\Prompts\AgentPrompt;
use Laravel\Ai\Responses\AgentResponse;
use Laravel\Ai\Responses\Data\Meta;
use Laravel\Ai\Responses\Data\Usage;

/**
 * Cost-bombing defense — caps AI replies per conversation per hour.
 *
 * When the cap is hit, the middleware short-circuits the AI call entirely
 * and returns a fixed text response. Bucket name includes the conversation
 * id so the same visitor sending the same conversation hot-spam can't keep
 * billing the workspace.
 */
class PerConversationRateLimit
{
    public function __construct(
        public Conversation $conversation,
        public ?int $perHour = null,
    ) {}

    public function handle(AgentPrompt $prompt, Closure $next)
    {
        $limit = (int) ($this->perHour ?? config('ai.per_conversation_rate_limit', 30));

        if ($limit <= 0) {
            return $next($prompt);
        }

        /** @var RateLimiter $limiter */
        $limiter = app(RateLimiter::class);
        $bucket = 'ai-conv:'.$this->conversation->id;

        if ($limiter->tooManyAttempts($bucket, $limit)) {
            return new AgentResponse(
                invocationId: (string) Str::uuid(),
                text: 'I have answered a lot in this conversation already. A human agent will follow up shortly.',
                usage: new Usage,
                meta: new Meta(provider: 'rate-limit', model: 'short-circuit'),
            );
        }

        $limiter->hit($bucket, 3600);

        return $next($prompt);
    }
}
