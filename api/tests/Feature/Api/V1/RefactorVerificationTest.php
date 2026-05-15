<?php

use App\Models\Channel;
use App\Models\User;

use function Pest\Laravel\actingAs;

test('lists channel types', function () {
    $user = User::factory()->create();

    actingAs($user)
        ->getJson('/api/v1/channel-types')
        ->assertOk()
        ->assertJsonFragment(['type' => 'web_chat'])
        ->assertJsonFragment(['type' => 'telegram']);
});

test('creates inbox with web channel atomically', function () {
    $user = User::factory()->create();

    $payload = [
        'inbox' => [
            'name' => 'New Support',
            'timezone' => 'UTC',
        ],
        'channel' => [
            'type' => 'web_chat',
            'name' => 'My Website',
            'config' => ['website_url' => 'https://example.com'],
        ],
    ];

    $response = actingAs($user)
        ->postJson('/api/v1/inboxes', $payload)
        ->assertStatus(201)
        ->assertJsonPath('success', true);

    // Verify DB
    $inboxId = $response->json('data.inbox.id');
    $this->assertDatabaseHas('inboxes', ['id' => $inboxId, 'name' => 'New Support']);
    $this->assertDatabaseHas('channels', [
        'inbox_id' => $inboxId,
        'type' => 'web_chat',
        'name' => 'My Website',
    ]);

    // Check key generation
    $channel = Channel::where('inbox_id', $inboxId)->first();
    expect($channel->channel_key)->not->toBeNull();
});

test('creates inbox with api channel and secrets', function () {
    $user = User::factory()->create();

    $payload = [
        'inbox' => ['name' => 'API Inbox'],
        'channel' => [
            'type' => 'api',
            'name' => 'External App',
        ],
    ];

    $response = actingAs($user)
        ->postJson('/api/v1/inboxes', $payload)
        ->assertStatus(201);

    // Verify DB
    $inboxId = $response->json('data.inbox.id');
    $this->assertDatabaseHas('inboxes', ['id' => $inboxId]);
    $channel = Channel::where('inbox_id', $inboxId)->first();

    expect($channel->inbox_identifier)->not->toBeNull()
        ->and($channel->hmac_mandatory)->toBeTrue()
        ->and($channel->hmac_secret)->not->toBeNull();
});
