<?php

use App\Models\Channel;

use function Pest\Laravel\postJson;

test('bootstrap creates visitor and session', function () {
    $channel = Channel::factory()->create();

    $response = postJson('/api/v1/public/widget/bootstrap', [
        'user' => ['name' => 'Test User'],
        'client' => ['page_url' => 'https://example.com'],
    ], [
        'X-Channel-Key' => $channel->channel_key,
        'X-Visitor-Uid' => fake()->uuid(),
    ]);

    $response->assertSuccessful();
    $response->assertJsonStructure([
        'data' => ['session_token', 'conversation_id', 'contact'],
    ]);

    $this->assertDatabaseCount('visitors', 1);
});

test('bootstrap reuses existing visitor by uid', function () {
    $channel = Channel::factory()->create();
    $uid = fake()->uuid();

    // First bootstrap
    postJson('/api/v1/public/widget/bootstrap', [], [
        'X-Channel-Key' => $channel->channel_key,
        'X-Visitor-Uid' => $uid,
    ])->assertSuccessful();

    // Second bootstrap with same uid
    postJson('/api/v1/public/widget/bootstrap', [], [
        'X-Channel-Key' => $channel->channel_key,
        'X-Visitor-Uid' => $uid,
    ])->assertSuccessful();

    $this->assertDatabaseCount('visitors', 1);
});

test('bootstrap links contact if email provided', function () {
    $channel = Channel::factory()->create();

    $response = postJson('/api/v1/public/widget/bootstrap', [
        'user' => ['email' => 'test@example.com', 'name' => 'Test'],
    ], [
        'X-Channel-Key' => $channel->channel_key,
        'X-Visitor-Uid' => fake()->uuid(),
    ]);

    $response->assertSuccessful();

    $this->assertDatabaseHas('contacts', ['email' => 'test@example.com']);
});

test('bootstrap rejects invalid channel key', function () {
    postJson('/api/v1/public/widget/bootstrap', [], [
        'X-Channel-Key' => 'invalid-key',
        'X-Visitor-Uid' => fake()->uuid(),
    ])->assertNotFound();
});

test('bootstrap rejects missing headers', function () {
    postJson('/api/v1/public/widget/bootstrap', [])
        ->assertStatus(400);
});
