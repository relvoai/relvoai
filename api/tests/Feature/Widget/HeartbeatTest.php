<?php

use App\Models\Channel;
use App\Models\Visitor;

use function Pest\Laravel\postJson;

beforeEach(function () {
    $this->channel = Channel::factory()->create();

    $bootstrap = postJson('/api/v1/public/widget/bootstrap', [], [
        'X-Channel-Key' => $this->channel->channel_key,
        'X-Visitor-Uid' => fake()->uuid(),
    ]);

    $this->sessionToken = $bootstrap->json('data.session_token');
});

test('heartbeat upserts a visitor_session row', function () {
    $response = postJson('/api/v1/public/widget/sessions/heartbeat', [
        'page_url' => 'https://example.com/pricing',
    ], [
        'Authorization' => "Bearer {$this->sessionToken}",
    ]);

    $response->assertSuccessful();
    $this->assertDatabaseCount('visitor_sessions', 1);
    $this->assertDatabaseHas('visitor_sessions', [
        'channel_id' => $this->channel->id,
    ]);
});

test('heartbeat refreshes last_activity_at on existing session', function () {
    postJson('/api/v1/public/widget/sessions/heartbeat', [], [
        'Authorization' => "Bearer {$this->sessionToken}",
    ])->assertSuccessful();

    postJson('/api/v1/public/widget/sessions/heartbeat', [], [
        'Authorization' => "Bearer {$this->sessionToken}",
    ])->assertSuccessful();

    $this->assertDatabaseCount('visitor_sessions', 1);
});

test('heartbeat updates visitor last_seen_at for online list', function () {
    Visitor::query()->update(['last_seen_at' => now()->subHour()]);

    postJson('/api/v1/public/widget/sessions/heartbeat', [], [
        'Authorization' => "Bearer {$this->sessionToken}",
    ])->assertSuccessful();

    expect(Visitor::first()->last_seen_at->diffInMinutes(now()))->toBeLessThan(1);
});

test('heartbeat requires session token', function () {
    postJson('/api/v1/public/widget/sessions/heartbeat', [])->assertUnauthorized();
});
