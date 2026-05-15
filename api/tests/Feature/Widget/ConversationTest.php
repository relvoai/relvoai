<?php

use App\Models\Channel;

use function Pest\Laravel\getJson;
use function Pest\Laravel\postJson;

test('bootstrap creates a conversation', function () {
    $channel = Channel::factory()->create();

    $response = postJson('/api/v1/public/widget/bootstrap', [
        'user' => ['name' => 'Test Visitor'],
    ], [
        'X-Channel-Key' => $channel->channel_key,
        'X-Visitor-Uid' => fake()->uuid(),
    ]);

    $response->assertSuccessful();

    $this->assertDatabaseCount('conversations', 1);
    $this->assertDatabaseHas('conversations', [
        'channel_id' => $channel->id,
        'status' => 'open',
    ]);
});

test('visitor can send message via session token', function () {
    $channel = Channel::factory()->create();

    $bootstrap = postJson('/api/v1/public/widget/bootstrap', [], [
        'X-Channel-Key' => $channel->channel_key,
        'X-Visitor-Uid' => fake()->uuid(),
    ]);

    $bootstrap->assertSuccessful();
    $sessionToken = $bootstrap->json('data.session_token');

    $response = postJson('/api/v1/public/widget/messages', [
        'body' => 'Hello Support',
    ], [
        'Authorization' => "Bearer {$sessionToken}",
    ]);

    $response->assertCreated();
    $this->assertDatabaseHas('messages', [
        'body' => 'Hello Support',
        'message_type' => 'visitor',
    ]);
});

test('message sending fails without session token', function () {
    postJson('/api/v1/public/widget/messages', [
        'body' => 'Hello',
    ])->assertUnauthorized();
});

test('visitor can list their conversations', function () {
    $channel = Channel::factory()->create();
    $uid = fake()->uuid();

    $bootstrap = postJson('/api/v1/public/widget/bootstrap', [
        'user' => ['name' => 'History Visitor'],
    ], [
        'X-Channel-Key' => $channel->channel_key,
        'X-Visitor-Uid' => $uid,
    ]);

    $sessionToken = $bootstrap->json('data.session_token');

    $response = getJson('/api/v1/public/widget/conversations', [
        'Authorization' => "Bearer {$sessionToken}",
    ]);

    $response->assertSuccessful();
    $response->assertJsonStructure(['data' => [['id', 'subject', 'status', 'created_at', 'updated_at', 'last_message', 'message_count']]]);
});

test('visitor can start a new conversation', function () {
    $channel = Channel::factory()->create();
    $uid = fake()->uuid();

    $bootstrap = postJson('/api/v1/public/widget/bootstrap', [], [
        'X-Channel-Key' => $channel->channel_key,
        'X-Visitor-Uid' => $uid,
    ]);

    $sessionToken = $bootstrap->json('data.session_token');

    // Should have 1 conversation from bootstrap
    $this->assertDatabaseCount('conversations', 1);

    // Create a new one
    $response = postJson('/api/v1/public/widget/conversations', [], [
        'Authorization' => "Bearer {$sessionToken}",
    ]);

    $response->assertCreated();
    $response->assertJsonPath('data.status', 'open');
    $this->assertDatabaseCount('conversations', 2);
});

test('visitor can select a conversation', function () {
    $channel = Channel::factory()->create();
    $uid = fake()->uuid();

    $bootstrap = postJson('/api/v1/public/widget/bootstrap', [], [
        'X-Channel-Key' => $channel->channel_key,
        'X-Visitor-Uid' => $uid,
    ]);

    $sessionToken = $bootstrap->json('data.session_token');
    $conversationId = $bootstrap->json('data.conversation_id');

    // Create a second conversation
    $newConv = postJson('/api/v1/public/widget/conversations', [], [
        'Authorization' => "Bearer {$sessionToken}",
    ]);
    $newConvId = $newConv->json('data.id');

    // Select the original conversation
    $response = postJson("/api/v1/public/widget/conversations/{$conversationId}/select", [], [
        'Authorization' => "Bearer {$sessionToken}",
    ]);

    $response->assertSuccessful();
    $response->assertJsonPath('data.id', $conversationId);
});

test('visitor cannot select another visitors conversation', function () {
    $channel = Channel::factory()->create();

    // Visitor 1
    $bootstrap1 = postJson('/api/v1/public/widget/bootstrap', [], [
        'X-Channel-Key' => $channel->channel_key,
        'X-Visitor-Uid' => fake()->uuid(),
    ]);
    $conv1Id = $bootstrap1->json('data.conversation_id');

    // Visitor 2
    $bootstrap2 = postJson('/api/v1/public/widget/bootstrap', [], [
        'X-Channel-Key' => $channel->channel_key,
        'X-Visitor-Uid' => fake()->uuid(),
    ]);
    $token2 = $bootstrap2->json('data.session_token');

    // Visitor 2 tries to select Visitor 1's conversation
    $response = postJson("/api/v1/public/widget/conversations/{$conv1Id}/select", [], [
        'Authorization' => "Bearer {$token2}",
    ]);

    $response->assertNotFound();
});

test('conversation list requires auth', function () {
    getJson('/api/v1/public/widget/conversations')->assertUnauthorized();
});

test('visitor can list messages via session token', function () {
    $channel = Channel::factory()->create();
    $uid = fake()->uuid();

    $bootstrap = postJson('/api/v1/public/widget/bootstrap', [], [
        'X-Channel-Key' => $channel->channel_key,
        'X-Visitor-Uid' => $uid,
    ]);

    $sessionToken = $bootstrap->json('data.session_token');

    // Send a message first
    postJson('/api/v1/public/widget/messages', [
        'body' => 'Test message',
    ], [
        'Authorization' => "Bearer {$sessionToken}",
    ])->assertCreated();

    // List messages
    $response = getJson('/api/v1/public/widget/messages', [
        'Authorization' => "Bearer {$sessionToken}",
    ]);

    $response->assertSuccessful();
});
