<?php

use App\Models\BlockedUrl;
use App\Models\Channel;
use Illuminate\Testing\TestResponse;

use function Pest\Laravel\postJson;

function bootstrap(Channel $channel, ?string $pageUrl): TestResponse
{
    $payload = [];
    if ($pageUrl !== null) {
        $payload['client'] = ['page_url' => $pageUrl];
    }

    return postJson('/api/v1/public/widget/bootstrap', $payload, [
        'X-Channel-Key' => $channel->channel_key,
        'X-Visitor-Uid' => fake()->uuid(),
    ]);
}

test('blocked wildcard url prevents bootstrap', function () {
    $channel = Channel::factory()->create();
    BlockedUrl::create([
        'channel_id' => $channel->id,
        'url_pattern' => '*/checkout*',
        'match_type' => 'wildcard',
        'is_active' => true,
        'reason' => 'no chat on checkout',
    ]);

    bootstrap($channel, 'https://shop.example.com/checkout/step-2')
        ->assertForbidden()
        ->assertJsonPath('errors.code', 'URL_BLOCKED');
});

test('exact match blacklist blocks only exact url', function () {
    $channel = Channel::factory()->create();
    BlockedUrl::create([
        'channel_id' => $channel->id,
        'url_pattern' => 'https://shop.example.com/admin',
        'match_type' => 'exact',
        'is_active' => true,
    ]);

    bootstrap($channel, 'https://shop.example.com/admin')->assertForbidden();
    bootstrap($channel, 'https://shop.example.com/admin/users')->assertSuccessful();
});

test('inactive blacklist entries are ignored', function () {
    $channel = Channel::factory()->create();
    BlockedUrl::create([
        'channel_id' => $channel->id,
        'url_pattern' => '*/checkout*',
        'match_type' => 'wildcard',
        'is_active' => false,
    ]);

    bootstrap($channel, 'https://shop.example.com/checkout')->assertSuccessful();
});

test('blacklist is scoped to the channel', function () {
    $channelA = Channel::factory()->create();
    $channelB = Channel::factory()->create();

    BlockedUrl::create([
        'channel_id' => $channelA->id,
        'url_pattern' => '*/checkout*',
        'match_type' => 'wildcard',
        'is_active' => true,
    ]);

    bootstrap($channelA, 'https://shop.example.com/checkout')->assertForbidden();
    bootstrap($channelB, 'https://shop.example.com/checkout')->assertSuccessful();
});

test('bootstrap succeeds when no page_url is provided', function () {
    $channel = Channel::factory()->create();
    BlockedUrl::create([
        'channel_id' => $channel->id,
        'url_pattern' => '*',
        'match_type' => 'wildcard',
        'is_active' => true,
    ]);

    bootstrap($channel, null)->assertSuccessful();
});
