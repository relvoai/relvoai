<?php

use App\Models\User;
use App\Services\Telegram\TelegramService;

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->actingAs($this->user, 'sanctum');
});

it('returns notification settings without leaking the bot token', function () {
    $this->user->update([
        'telegram_bot_token' => 'secret-bot-token',
        'telegram_chat_id' => '42',
    ]);

    $response = $this->getJson('/api/v1/me/notification-settings');

    $response->assertSuccessful()
        ->assertJsonPath('data.telegram.chat_id', '42')
        ->assertJsonPath('data.telegram.configured', true)
        ->assertJsonPath('data.email', $this->user->email);

    // Bot token must NOT be present anywhere in the response.
    expect(json_encode($response->json()))->not->toContain('secret-bot-token');
});

it('saves telegram credentials after validating the bot token', function () {
    $fake = Mockery::mock(TelegramService::class);
    $fake->shouldReceive('getMe')
        ->once()
        ->with('good-token')
        ->andReturn(['ok' => true, 'username' => 'HelpBot', 'first_name' => 'Help']);
    app()->instance(TelegramService::class, $fake);

    $this->putJson('/api/v1/me/notification-settings', [
        'telegram_bot_token' => 'good-token',
        'telegram_chat_id' => '42',
    ])->assertSuccessful()
        ->assertJsonPath('data.telegram.configured', true)
        ->assertJsonPath('data.telegram.bot.username', 'HelpBot');

    expect($this->user->fresh()->telegram_chat_id)->toBe('42');
});

it('rejects an invalid telegram bot token', function () {
    $fake = Mockery::mock(TelegramService::class);
    $fake->shouldReceive('getMe')->once()->andReturn(['ok' => false]);
    app()->instance(TelegramService::class, $fake);

    $this->putJson('/api/v1/me/notification-settings', [
        'telegram_bot_token' => 'bad',
        'telegram_chat_id' => '42',
    ])->assertStatus(422)
        ->assertJsonPath('errors.telegram_bot_token.0', 'Invalid Telegram bot token.');

    expect($this->user->fresh()->telegram_chat_id)->toBeNull();
});

it('rejects a partial submission (one field without the other)', function () {
    $this->putJson('/api/v1/me/notification-settings', [
        'telegram_bot_token' => 'only-token',
    ])->assertStatus(422);
});

it('clears telegram credentials when both are null', function () {
    $this->user->update([
        'telegram_bot_token' => 'something',
        'telegram_chat_id' => 'somewhere',
    ]);

    $this->putJson('/api/v1/me/notification-settings', [
        'telegram_bot_token' => null,
        'telegram_chat_id' => null,
    ])->assertSuccessful();

    $fresh = $this->user->fresh();
    expect($fresh->telegram_bot_token)->toBeNull();
    expect($fresh->telegram_chat_id)->toBeNull();
});

it('lists in-app notifications for the current user', function () {
    $this->user->notifications()->create([
        'id' => fake()->uuid(),
        'type' => 'conversation.message.new',
        'data' => ['preview' => 'Hello'],
    ]);

    $response = $this->getJson('/api/v1/me/notifications')->assertSuccessful();

    // Top-level envelope: { success, data: [...items], message, meta, links }.
    $response->assertJsonPath('data.0.type', 'conversation.message.new');
    $response->assertJsonStructure(['success', 'data', 'meta' => ['current_page', 'last_page', 'per_page', 'total']]);
});

it('marks a single notification as read', function () {
    $id = fake()->uuid();
    $this->user->notifications()->create([
        'id' => $id,
        'type' => 'conversation.message.new',
        'data' => ['preview' => 'Hello'],
    ]);

    $this->postJson("/api/v1/me/notifications/{$id}/read")->assertSuccessful();

    expect($this->user->notifications()->first()->read_at)->not->toBeNull();
});

it('marks all notifications as read', function () {
    foreach (range(1, 3) as $_) {
        $this->user->notifications()->create([
            'id' => fake()->uuid(),
            'type' => 'conversation.message.new',
            'data' => ['preview' => 'Hello'],
        ]);
    }

    $this->postJson('/api/v1/me/notifications/read-all')->assertSuccessful();

    expect($this->user->unreadNotifications()->count())->toBe(0);
});

it('notification endpoints require auth', function () {
    auth()->forgetGuards();
    $this->app['auth']->forgetGuards();

    $this->withHeaders(['Accept' => 'application/json'])
        ->getJson('/api/v1/me/notification-settings')
        ->assertUnauthorized();
});
