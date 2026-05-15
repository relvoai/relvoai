<?php

namespace App\Ai\Middleware;

use App\Models\Ai\AiAgent;
use App\Models\Ai\AiCreditBalance;
use App\Models\Ai\AiCreditLedger;
use App\Models\Conversation;
use Closure;
use Laravel\Ai\Prompts\AgentPrompt;
use Laravel\Ai\Responses\AgentResponse;

/**
 * Atomically debits the singleton AI credit balance after each successful
 * agent reply, using the provider's reported token counts. Writes one
 * `chat` ledger row per call with full provider/model attribution.
 *
 * If the balance would go negative we still record the ledger row so the
 * admin dashboard can show the overspend; the gating check that prevents
 * a reply in the first place lives upstream in HandleVisitorMessageJob.
 */
class DebitCredits
{
    public function __construct(
        public AiAgent $agent,
        public Conversation $conversation,
    ) {}

    public function handle(AgentPrompt $prompt, Closure $next)
    {
        return $next($prompt)->then(function (AgentResponse $response) use ($prompt) {
            $usage = $response->usage;
            $cost = $usage->promptTokens + $usage->completionTokens;

            if ($cost > 0) {
                // Non-blocking debit; insufficient funds are not an error at this layer.
                AiCreditBalance::debit($cost);
            }

            AiCreditLedger::create([
                'ai_agent_id' => $this->agent->id,
                'conversation_id' => $this->conversation->id,
                'delta' => -$cost,
                'reason' => AiCreditLedger::REASON_CHAT,
                'tokens_prompt' => $usage->promptTokens,
                'tokens_completion' => $usage->completionTokens,
                'provider' => method_exists($prompt->provider, 'name') ? $prompt->provider->name() : null,
                'model' => $prompt->model,
                'meta' => [
                    'cache_read_input_tokens' => $usage->cacheReadInputTokens,
                    'cache_write_input_tokens' => $usage->cacheWriteInputTokens,
                    'reasoning_tokens' => $usage->reasoningTokens,
                ],
            ]);
        });
    }
}
