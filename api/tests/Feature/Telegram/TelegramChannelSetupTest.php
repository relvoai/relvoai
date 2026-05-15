<?php

use App\Models\Channel;
use App\Models\Inbox;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);
    $this->user = User::factory()->create();
    $this->user->addRole('admin');
    $this->actingAs($this->user, 'sanctum');
    $this->inbox = Inbox::factory()->create();
});

it('creates a telegram channel with valid bot token', function () {
    Http::fake([
        'api.telegram.org/bot*/getMe' => Http::response([
            'ok' => true,
            'result' => [
                'id' => 123456789,
                'is_bot' => true,
                'first_name' => 'Relvo AI Bot',
                'username' => 'relvoai_bot',
            ],
        ]),
        'api.telegram.org/bot*/setWebhook' => Http::response(['ok' => true]),
    ]);

    $response = $this->postJson("/api/v1/inboxes/{$this->inbox->id}/channels", [
        'type' => 'telegram',
        'name' => 'My Telegram Bot',
        'config' => [
            'bot_token' => 'valid-bot-token',
        ],
    ]);

    $response->assertCreated();
    $response->assertJsonPath('success', true);

    $channel = Channel::where('inbox_id', $this->inbox->id)->where('type', 'telegram')->first();
    expect($channel)->not->toBeNull();
    expect($channel->config['bot_username'])->toBe('relvoai_bot');
    expect($channel->config['bot_name'])->toBe('Relvo AI Bot');
    expect($channel->webhook_url)->toContain('/api/v1/webhooks/telegram/');
});

it('rejects invalid bot token', function () {
    Http::fake([
        'api.telegram.org/bot*/getMe' => Http::response([
            'ok' => false,
            'error_code' => 401,
            'description' => 'Unauthorized',
        ], 401),
    ]);

    $response = $this->postJson("/api/v1/inboxes/{$this->inbox->id}/channels", [
        'type' => 'telegram',
        'name' => 'Bad Bot',
        'config' => [
            'bot_token' => 'invalid-token',
        ],
    ]);

    $response->assertStatus(422);
    $response->assertJsonPath('success', false);
    $response->assertJsonPath('message', 'Invalid Telegram bot token.');
});

it('rejects telegram channel without bot token', function () {
    $response = $this->postJson("/api/v1/inboxes/{$this->inbox->id}/channels", [
        'type' => 'telegram',
        'name' => 'No Token Bot',
        'config' => [],
    ]);

    $response->assertStatus(422);
    $response->assertJsonPath('message', 'Bot token is required for Telegram channels.');
});

it('removes webhook when telegram channel is deleted', function () {
    Http::fake([
        'api.telegram.org/bot*/getMe' => Http::response([
            'ok' => true,
            'result' => [
                'id' => 123,
                'is_bot' => true,
                'first_name' => 'Bot',
                'username' => 'test_bot',
            ],
        ]),
        'api.telegram.org/bot*/setWebhook' => Http::response(['ok' => true]),
        'api.telegram.org/bot*/deleteWebhook' => Http::response(['ok' => true]),
    ]);

    // Create channel first
    $response = $this->postJson("/api/v1/inboxes/{$this->inbox->id}/channels", [
        'type' => 'telegram',
        'name' => 'Delete Me Bot',
        'config' => ['bot_token' => 'some-token'],
    ]);

    $channelId = $response->json('data.id');

    // Delete
    $deleteResponse = $this->deleteJson("/api/v1/channels/{$channelId}");
    $deleteResponse->assertSuccessful();

    Http::assertSent(function ($request) {
        return str_contains($request->url(), '/deleteWebhook');
    });
});
