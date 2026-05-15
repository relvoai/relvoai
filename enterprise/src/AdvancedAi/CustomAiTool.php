<?php

namespace App\Enterprise\AdvancedAi;

use App\Enterprise\AdvancedAi\Models\AiCustomTool;
use App\Models\AuditLog;
use Illuminate\Cache\RateLimiter;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Facades\Http;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Throwable;

/**
 * Adapter that turns an owner-defined AiCustomTool DB row into a Laravel AI
 * Tool the agent can invoke. Enforces three sandboxing rules on every call:
 *
 *   1. Rate limit — bucketed by workspace+tool name; hit ⇒ short-circuits.
 *   2. Timeout — HTTP request bound by the row's `timeout_seconds`.
 *   3. Response size — body truncated to `response_size_limit` bytes.
 *
 * Every invocation (success, rate-limited, or error) writes an AuditLog row
 * with `event = ai.custom_tool.invoked` so owners can trace what the AI did.
 */
class CustomAiTool implements Tool
{
    public function __construct(public AiCustomTool $tool) {}

    public function name(): string
    {
        return preg_replace('/[^A-Za-z0-9_-]/', '_', $this->tool->name) ?: 'custom_tool';
    }

    public function description(): string
    {
        return (string) $this->tool->description;
    }

    public function schema(JsonSchema $schema): array
    {
        $built = [];

        foreach ((array) $this->tool->parameter_schema as $key => $definition) {
            $type = (string) ($definition['type'] ?? 'string');
            $description = (string) ($definition['description'] ?? $key);

            $node = match ($type) {
                'integer', 'int' => $schema->integer(),
                'number', 'float' => $schema->number(),
                'boolean', 'bool' => $schema->boolean(),
                default => $schema->string(),
            };

            $node = $node->description($description);

            if (! empty($definition['required'])) {
                $node = $node->required();
            }

            $built[$key] = $node;
        }

        return $built;
    }

    public function handle(Request $request): string
    {
        /** @var RateLimiter $limiter */
        $limiter = app(RateLimiter::class);
        $bucket = 'ai-custom-tool:'.$this->tool->workspace_id.':'.$this->tool->id;
        $rateLimit = (int) ($this->tool->rate_limit_per_minute ?: 30);
        $responseLimit = (int) ($this->tool->response_size_limit ?: 8192);
        $timeout = (int) ($this->tool->timeout_seconds ?: 10);

        if ($limiter->tooManyAttempts($bucket, $rateLimit)) {
            $this->audit('rate_limited', null);

            return 'Tool is temporarily rate-limited. Please try again shortly.';
        }

        $limiter->hit($bucket, 60);

        $payload = $this->payloadFromRequest($request);

        try {
            $http = Http::timeout($timeout)->acceptJson();

            if ($this->tool->auth_type === 'bearer' && filled($this->tool->auth_value)) {
                $http = $http->withToken((string) $this->tool->auth_value);
            } elseif ($this->tool->auth_type === 'header' && filled($this->tool->auth_value)) {
                [$name, $value] = array_pad(explode(':', (string) $this->tool->auth_value, 2), 2, '');
                $http = $http->withHeaders([trim($name) => trim($value)]);
            }

            $method = strtoupper($this->tool->http_method ?: 'POST');
            $response = $method === 'GET'
                ? $http->get($this->tool->endpoint, $payload)
                : $http->send($method, $this->tool->endpoint, ['json' => $payload]);

            $body = (string) $response->body();
            $truncated = substr($body, 0, max(0, $responseLimit));

            $this->audit('invoked', [
                'status' => $response->status(),
                'truncated' => strlen($body) > strlen($truncated),
                'response_excerpt' => substr($truncated, 0, 256),
            ]);

            if (! $response->successful()) {
                return "Tool returned HTTP {$response->status()}. Response: {$truncated}";
            }

            return $truncated !== '' ? $truncated : '(empty response)';
        } catch (Throwable $e) {
            $this->audit('error', ['message' => $e->getMessage()]);

            return 'Tool call failed: '.$e->getMessage();
        }
    }

    /**
     * @return array<string,mixed>
     */
    protected function payloadFromRequest(Request $request): array
    {
        $out = [];

        foreach ((array) $this->tool->parameter_schema as $key => $definition) {
            $type = (string) ($definition['type'] ?? 'string');
            $value = match ($type) {
                'integer', 'int' => $request->integer($key),
                'number', 'float' => (float) $request->string($key),
                'boolean', 'bool' => $request->boolean($key),
                default => (string) $request->string($key),
            };
            $out[$key] = $value;
        }

        return $out;
    }

    /**
     * @param  array<string,mixed>|null  $payload
     */
    protected function audit(string $outcome, ?array $payload): void
    {
        try {
            AuditLog::create([
                'workspace_id' => $this->tool->workspace_id,
                'user_id' => null,
                'event' => 'ai.custom_tool.'.$outcome,
                'auditable_type' => AiCustomTool::class,
                'auditable_id' => $this->tool->id,
                'new_values' => $payload,
                'tags' => ['ai', 'custom_tool', $this->tool->name],
            ]);
        } catch (Throwable $e) {
            report($e);
        }
    }
}
