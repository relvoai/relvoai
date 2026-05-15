<?php

use App\Models\Channel;

use function Pest\Laravel\postJson;

test('visitor can rate a conversation', function () {
    $channel = Channel::factory()->create();

    $bootstrap = postJson('/api/v1/public/widget/bootstrap', [], [
        'X-Channel-Key' => $channel->channel_key,
        'X-Visitor-Uid' => fake()->uuid(),
    ]);

    $bootstrap->assertSuccessful();
    $sessionToken = $bootstrap->json('data.session_token');
    $conversationId = $bootstrap->json('data.conversation_id');

    $response = postJson('/api/v1/public/widget/ratings', [
        'conversation_id' => $conversationId,
        'rating' => 5,
        'comment' => 'Excellent support!',
    ], [
        'Authorization' => "Bearer {$sessionToken}",
    ]);

    $response->assertStatus(201);
    $response->assertJsonPath('data.rating', 5);
    $this->assertDatabaseHas('conversation_ratings', [
        'conversation_id' => $conversationId,
        'rating' => 5,
        'comment' => 'Excellent support!',
    ]);
});

test('visitor cannot rate same conversation twice', function () {
    $channel = Channel::factory()->create();

    $bootstrap = postJson('/api/v1/public/widget/bootstrap', [], [
        'X-Channel-Key' => $channel->channel_key,
        'X-Visitor-Uid' => fake()->uuid(),
    ]);

    $sessionToken = $bootstrap->json('data.session_token');
    $conversationId = $bootstrap->json('data.conversation_id');

    // First rating
    postJson('/api/v1/public/widget/ratings', [
        'conversation_id' => $conversationId,
        'rating' => 5,
    ], ['Authorization' => "Bearer {$sessionToken}"])->assertStatus(201);

    // Duplicate
    postJson('/api/v1/public/widget/ratings', [
        'conversation_id' => $conversationId,
        'rating' => 3,
    ], ['Authorization' => "Bearer {$sessionToken}"])->assertStatus(409);
});

test('rating requires authentication', function () {
    $response = postJson('/api/v1/public/widget/ratings', [
        'conversation_id' => fake()->uuid(),
        'rating' => 5,
    ]);

    $response->assertStatus(401);
});
