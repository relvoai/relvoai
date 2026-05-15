<?php

use App\Models\Channel;
use App\Models\Conversation;
use App\Models\Inbox;
use App\Models\Message;

beforeEach(function () {
    $this->inbox = Inbox::factory()->create();
    $this->channel = Channel::factory()->telegram()->create([
        'inbox_id' => $this->inbox->id,
        'channel_key' => 'tg_test_key_123',
        'config' => [
            'bot_token' => 'fake-bot-token',
            'bot_username' => 'test_bot',
        ],
    ]);
});

it('creates a conversation from a telegram message', function () {
    $payload = makeTelegramUpdate(text: 'Hello from Telegram');

    $response = $this->postJson('/api/v1/webhooks/telegram/tg_test_key_123', $payload);

    $response->assertSuccessful();

    $this->assertDatabaseHas('contacts', [
        'external_id' => 'telegram:12345',
    ]);

    $this->assertDatabaseHas('visitors', [
        'channel_id' => $this->channel->id,
        'uid' => 'telegram:12345',
    ]);

    $this->assertDatabaseHas('conversations', [
        'channel_id' => $this->channel->id,
        'inbox_id' => $this->inbox->id,
        'status' => 'open',
    ]);

    $this->assertDatabaseHas('messages', [
        'body' => 'Hello from Telegram',
        'message_type' => 'visitor',
    ]);
});

it('appends to existing open conversation', function () {
    // First message creates conversation
    $this->postJson('/api/v1/webhooks/telegram/tg_test_key_123', makeTelegramUpdate(text: 'First'));
    // Second message should append
    $this->postJson('/api/v1/webhooks/telegram/tg_test_key_123', makeTelegramUpdate(text: 'Second', messageId: 2));

    expect(Conversation::where('channel_id', $this->channel->id)->count())->toBe(1);
    expect(Message::where('body', 'Second')->exists())->toBeTrue();
});

it('returns 404 for invalid channel key', function () {
    $response = $this->postJson('/api/v1/webhooks/telegram/invalid_key', makeTelegramUpdate());

    $response->assertNotFound();
});

it('ignores non-message updates', function () {
    $response = $this->postJson('/api/v1/webhooks/telegram/tg_test_key_123', [
        'update_id' => 100,
        'edited_message' => ['text' => 'edited'],
    ]);

    $response->assertSuccessful();
    $this->assertDatabaseCount('messages', 0);
});

it('ignores non-private chats', function () {
    $payload = makeTelegramUpdate(chatType: 'group');

    $response = $this->postJson('/api/v1/webhooks/telegram/tg_test_key_123', $payload);

    $response->assertSuccessful();
    $this->assertDatabaseCount('messages', 0);
});

it('ignores inactive channels', function () {
    $this->channel->update(['is_active' => false]);

    $response = $this->postJson('/api/v1/webhooks/telegram/tg_test_key_123', makeTelegramUpdate());

    $response->assertNotFound();
});

it('stores telegram chat id in conversation meta', function () {
    $this->postJson('/api/v1/webhooks/telegram/tg_test_key_123', makeTelegramUpdate());

    $conversation = Conversation::where('channel_id', $this->channel->id)->first();
    expect($conversation->meta['telegram_chat_id'])->toBe('67890');
});

// Helper
function makeTelegramUpdate(
    string $text = 'Hello',
    string $chatType = 'private',
    int $userId = 12345,
    int $chatId = 67890,
    int $messageId = 1,
): array {
    return [
        'update_id' => rand(100000, 999999),
        'message' => [
            'message_id' => $messageId,
            'from' => [
                'id' => $userId,
                'is_bot' => false,
                'first_name' => 'John',
                'last_name' => 'Doe',
                'username' => 'johndoe',
            ],
            'chat' => [
                'id' => $chatId,
                'type' => $chatType,
                'first_name' => 'John',
            ],
            'date' => time(),
            'text' => $text,
        ],
    ];
}
