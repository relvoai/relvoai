<?php

use App\Models\Channel;

use function Pest\Laravel\postJson;

test('bootstrap succeeds with valid channel key', function () {
    $channel = Channel::factory()->create();

    postJson('/api/v1/public/widget/bootstrap', [], [
        'X-Channel-Key' => $channel->channel_key,
        'X-Visitor-Uid' => fake()->uuid(),
    ])->assertSuccessful();
});

test('bootstrap fails with invalid channel key', function () {
    postJson('/api/v1/public/widget/bootstrap', [], [
        'X-Channel-Key' => 'wd_invalid_key_here',
        'X-Visitor-Uid' => fake()->uuid(),
    ])->assertNotFound();
});

test('bootstrap fails with missing headers', function () {
    postJson('/api/v1/public/widget/bootstrap', [])
        ->assertStatus(400);
});

test('bootstrap fails with inactive channel', function () {
    $channel = Channel::factory()->create(['is_active' => false]);

    postJson('/api/v1/public/widget/bootstrap', [], [
        'X-Channel-Key' => $channel->channel_key,
        'X-Visitor-Uid' => fake()->uuid(),
    ])->assertNotFound();
});
