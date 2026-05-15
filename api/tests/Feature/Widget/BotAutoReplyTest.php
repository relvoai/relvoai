<?php

use App\Models\Channel;
use App\Models\Conversation;
use App\Models\Inbox;
use App\Services\BotService;
use Illuminate\Support\Carbon;

use function Pest\Laravel\postJson;

test('bot sends welcome message if inbox greeting is configured', function () {
    $inbox = Inbox::factory()->create([
        'greeting_enabled' => true,
        'greeting_message' => 'Hello there!',
    ]);
    $channel = Channel::factory()->create(['inbox_id' => $inbox->id]);

    // Bootstrap creates a conversation
    $bootstrap = postJson('/api/v1/public/widget/bootstrap', [], [
        'X-Channel-Key' => $channel->channel_key,
        'X-Visitor-Uid' => fake()->uuid(),
    ]);

    $bootstrap->assertSuccessful();
    $conversationId = $bootstrap->json('data.conversation_id');

    // Manually trigger bot service (bootstrap doesn't auto-trigger it)
    $conversation = Conversation::find($conversationId);
    $botService = app(BotService::class);
    $botService->handleNewConversation($conversation);

    $this->assertDatabaseHas('messages', [
        'conversation_id' => $conversationId,
        'message_type' => 'bot',
        'body' => 'Hello there!',
    ]);
});

test('bot sends offline message when outside business hours', function () {
    Carbon::setTestNow(Carbon::parse('next Sunday 12:00:00'));

    $inbox = Inbox::factory()->create([
        'working_hours_enabled' => true,
        'working_hours' => [
            'monday' => [['start' => '09:00', 'end' => '17:00']],
        ],
        'out_of_office_message' => 'We are closed.',
        'timezone' => 'UTC',
    ]);
    $channel = Channel::factory()->create(['inbox_id' => $inbox->id]);

    $bootstrap = postJson('/api/v1/public/widget/bootstrap', [], [
        'X-Channel-Key' => $channel->channel_key,
        'X-Visitor-Uid' => fake()->uuid(),
    ]);

    $bootstrap->assertSuccessful();
    $conversationId = $bootstrap->json('data.conversation_id');

    $conversation = Conversation::find($conversationId);
    $botService = app(BotService::class);
    $botService->handleNewConversation($conversation);

    $this->assertDatabaseHas('messages', [
        'conversation_id' => $conversationId,
        'message_type' => 'bot',
        'body' => 'We are closed.',
    ]);
});
