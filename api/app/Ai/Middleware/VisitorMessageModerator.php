<?php

namespace App\Ai\Middleware;

use App\Models\Conversation;
use App\Models\Setting;
use Closure;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Laravel\Ai\Prompts\AgentPrompt;
use Laravel\Ai\Responses\AgentResponse;
use Laravel\Ai\Responses\Data\Meta;
use Laravel\Ai\Responses\Data\Usage;
use Throwable;

/**
 * Calls OpenAI's free moderation endpoint on the latest visitor message
 * before the agent invocation. If the API flags the content, the middleware
 * short-circuits with a fixed refusal so we neither bill the LLM nor pass
 * the content to it. Enabled only when the `ai.moderation_enabled` setting
 * is truthy AND an `OPENAI_API_KEY` is configured; otherwise pass-through.
 */
class VisitorMessageModerator
{
    public function __construct(public Conversation $conversation) {}

    public function handle(AgentPrompt $prompt, Closure $next)
    {
        if (! $this->shouldModerate()) {
            return $next($prompt);
        }

        $text = $this->latestVisitorText();
        if ($text === '') {
            return $next($prompt);
        }

        if ($this->isFlagged($text)) {
            return new AgentResponse(
                invocationId: (string) Str::uuid(),
                text: 'I can\'t help with that. A human agent will pick this up.',
                usage: new Usage,
                meta: new Meta(provider: 'moderation', model: 'short-circuit'),
            );
        }

        return $next($prompt);
    }

    protected function shouldModerate(): bool
    {
        $enabled = Setting::query()->where('key', 'ai.moderation_enabled')->value('value');

        return filter_var($enabled, FILTER_VALIDATE_BOOLEAN) && filled(config('services.openai.key'));
    }

    protected function latestVisitorText(): string
    {
        $msg = $this->conversation->messages()
            ->where('message_type', 'visitor')
            ->latest()
            ->first();

        return $msg ? trim((string) $msg->body) : '';
    }

    protected function isFlagged(string $text): bool
    {
        try {
            $response = Http::timeout(8)
                ->withToken((string) config('services.openai.key'))
                ->post('https://api.openai.com/v1/moderations', [
                    'model' => 'omni-moderation-latest',
                    'input' => $text,
                ]);

            if (! $response->successful()) {
                return false;
            }

            return (bool) data_get($response->json(), 'results.0.flagged', false);
        } catch (Throwable $e) {
            report($e);

            return false;
        }
    }
}
