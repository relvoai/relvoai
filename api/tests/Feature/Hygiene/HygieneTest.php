<?php

use App\Ai\Middleware\PerConversationRateLimit;
use App\Ai\Middleware\VisitorMessageModerator;
use App\Models\Channel;
use App\Models\Conversation;
use App\Models\Inbox;
use App\Models\Message;
use App\Models\Setting;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Http;
use Laravel\Ai\Prompts\AgentPrompt;
use Laravel\Ai\Responses\AgentResponse;
use Laravel\Ai\Responses\Data\Meta;
use Laravel\Ai\Responses\Data\Usage;

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);
});

it('refuses dev:token in production', function () {
    config(['app.env' => 'production']);

    $code = Artisan::call('dev:token', ['email' => 'demo-owner@example.com']);

    expect($code)->not->toBe(0);
});

it('allows dev:token in non-production', function () {
    config(['app.env' => 'local']);

    $code = Artisan::call('dev:token', ['email' => 'demo-owner@example.com']);

    expect($code)->toBe(0);
});

it('per-conversation rate limit short-circuits after the cap', function () {
    $conversation = Conversation::factory()->create();
    $visitor = $conversation->visitor;

    $middleware = new PerConversationRateLimit($conversation, perHour: 2);

    $next = fn () => new AgentResponse('test', 'real-reply', new Usage, new Meta);
    $prompt = Mockery::mock(AgentPrompt::class);

    $first = $middleware->handle($prompt, $next);
    $second = $middleware->handle($prompt, $next);
    $third = $middleware->handle($prompt, $next);

    expect($first->text)->toBe('real-reply');
    expect($second->text)->toBe('real-reply');
    expect($third->text)->toContain('answered a lot');
});

it('visitor message moderator passes through when disabled', function () {
    Setting::query()->updateOrCreate(['key' => 'ai.moderation_enabled'], ['type' => 'string', 'value' => '0']);
    $conversation = Conversation::factory()->create();
    $visitor = $conversation->visitor;
    Message::create(['conversation_id' => $conversation->id, 'message_type' => 'visitor', 'body' => 'hello', 'visitor_id' => $visitor->id]);

    $hit = false;
    $next = function () use (&$hit) {
        $hit = true;

        return new AgentResponse('x', 'ok', new Usage, new Meta);
    };

    (new VisitorMessageModerator($conversation))->handle(Mockery::mock(AgentPrompt::class), $next);

    expect($hit)->toBeTrue();
});

it('visitor message moderator short-circuits when flagged', function () {
    Setting::query()->updateOrCreate(['key' => 'ai.moderation_enabled'], ['type' => 'string', 'value' => '1']);
    config(['services.openai.key' => 'sk-test']);
    Http::fake(['api.openai.com/*' => Http::response(['results' => [['flagged' => true]]], 200)]);

    $conversation = Conversation::factory()->create();
    $visitor = $conversation->visitor;
    Message::create(['conversation_id' => $conversation->id, 'message_type' => 'visitor', 'body' => 'bad words', 'visitor_id' => $visitor->id]);

    $hit = false;
    $next = function () use (&$hit) {
        $hit = true;

        return new AgentResponse('x', 'ok', new Usage, new Meta);
    };

    $result = (new VisitorMessageModerator($conversation))->handle(Mockery::mock(AgentPrompt::class), $next);

    expect($hit)->toBeFalse();
    expect($result->text)->toContain("can't help");
});

it('demo seeder produces a complete demo dataset', function () {
    Artisan::call('db:seed', ['--class' => 'DemoSeeder', '--force' => true]);

    expect(Inbox::query()->where('name', 'Demo Support')->exists())->toBeTrue();
    expect(Conversation::query()->count())->toBeGreaterThanOrEqual(5);
    expect(Channel::query()->where('name', 'Demo Website')->exists())->toBeTrue();
});

it('restricts admin origin to configured allowlist', function () {
    config(['cors.admin_allowed_origins' => ['https://admin.example.com']]);

    $allowed = $this->withHeaders(['Origin' => 'https://admin.example.com'])->getJson('/api/v1/me');
    $denied = $this->withHeaders(['Origin' => 'https://evil.example.com'])->getJson('/api/v1/me');
    $widget = $this->withHeaders(['Origin' => 'https://evil.example.com'])->getJson('/api/v1/public/widget/config');

    // /api/v1/me is unauthenticated → 401 (or wherever it lands), but NOT 403 from our middleware.
    expect($allowed->status())->not->toBe(403);
    $denied->assertStatus(403);
    expect($widget->status())->not->toBe(403);
});
