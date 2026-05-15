<?php

use App\Models\Channel;

use function Pest\Laravel\getJson;
use function Pest\Laravel\postJson;

beforeEach(function () {
    $this->channel = Channel::factory()->create();
});

it('returns widget config by channel key header', function () {
    $response = getJson('/api/v1/public/widget/config', [
        'X-Channel-Key' => $this->channel->channel_key,
    ]);

    $response->assertSuccessful()
        ->assertJsonStructure([
            'data' => [
                'widget_config' => ['widget_color', 'welcome_title', 'welcome_tagline'],
                'identity' => ['mode', 'fields'],
                'meta' => ['config_version', 'cache_ttl'],
            ],
        ]);
});

it('returns widget config by query param fallback', function () {
    getJson('/api/v1/public/widget/config?channel_key='.$this->channel->channel_key)
        ->assertSuccessful();
});

it('returns 400 when channel key is missing', function () {
    getJson('/api/v1/public/widget/config')->assertStatus(400);
});

it('returns 404 for an unknown channel key', function () {
    getJson('/api/v1/public/widget/config', [
        'X-Channel-Key' => 'wd_does_not_exist',
    ])->assertNotFound();
});

it('responds 304 when If-None-Match matches the ETag', function () {
    $first = getJson('/api/v1/public/widget/config', [
        'X-Channel-Key' => $this->channel->channel_key,
    ])->assertSuccessful();

    $etag = $first->headers->get('ETag');
    expect($etag)->not->toBeNull();

    getJson('/api/v1/public/widget/config', [
        'X-Channel-Key' => $this->channel->channel_key,
        'If-None-Match' => $etag,
    ])->assertStatus(304);
});

it('refresh issues a new session token for an existing visitor', function () {
    $uid = fake()->uuid();

    $bootstrap = postJson('/api/v1/public/widget/bootstrap', [], [
        'X-Channel-Key' => $this->channel->channel_key,
        'X-Visitor-Uid' => $uid,
    ])->assertSuccessful();

    $firstToken = $bootstrap->json('data.session_token');

    $refresh = postJson('/api/v1/public/widget/refresh', [], [
        'X-Channel-Key' => $this->channel->channel_key,
        'X-Visitor-Uid' => $uid,
    ]);

    $refresh->assertSuccessful();
    expect($refresh->json('data.session_token'))->not->toBe($firstToken);
    expect($refresh->json('data.conversation_id'))->toBe($bootstrap->json('data.conversation_id'));
});

it('refresh returns 409 BOOTSTRAP_REQUIRED when visitor is unknown', function () {
    $response = postJson('/api/v1/public/widget/refresh', [], [
        'X-Channel-Key' => $this->channel->channel_key,
        'X-Visitor-Uid' => fake()->uuid(),
    ]);

    $response->assertStatus(409);
    $response->assertJsonPath('errors.code', 'BOOTSTRAP_REQUIRED');
});

it('refresh rejects missing headers', function () {
    postJson('/api/v1/public/widget/refresh', [])->assertStatus(400);
});
