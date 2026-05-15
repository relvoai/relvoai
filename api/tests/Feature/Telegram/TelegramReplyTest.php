<?php

use App\Events\MessageCreated;
use App\Listeners\SendTelegramReply;
use App\Models\Channel;
use App\Models\Conversation;
use App\Models\Inbox;
use App\Models\Message;
use App\Models\User;
use App\Models\Visitor;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    $this->inbox = Inbox::factory()->create();
    $this->channel = Channel::factory()->telegram()->create([
        'inbox_id' => $this->inbox->id,
        'config' => [
            'bot_token' => 'fake-bot-token-123',
            'bot_username' => 'test_bot',
        ],
    ]);
    $this->visitor = Visitor::factory()->create(['channel_id' => $this->channel->id]);
    $this->conversation = Conversation::factory()->create([
        'inbox_id' => $this->inbox->id,
        'channel_id' => $this->channel->id,
        'visitor_id' => $this->visitor->id,
        'meta' => ['telegram_chat_id' => '67890'],
    ]);
});

it('sends agent reply to telegram', function () {
    Http::fake([
        'api.telegram.org/*' => Http::response(['ok' => true, 'result' => []], 200),
    ]);

    $user = User::factory()->create();
    $message = Message::create([
        'conversation_id' => $this->conversation->id,
        'user_id' => $user->id,
        'message_type' => 'agent',
        'body' => 'Hello from agent!',
        'format' => 'text',
    ]);

    $listener = app(SendTelegramReply::class);
    $listener->handle(new MessageCreated($message));

    Http::assertSent(function ($request) {
        return str_contains($request->url(), '/sendMessage')
            && $request['chat_id'] === '67890'
            && $request['text'] === 'Hello from agent!';
    });
});

it('does not send for internal notes', function () {
    Http::fake();

    $user = User::factory()->create();
    $message = Message::create([
        'conversation_id' => $this->conversation->id,
        'user_id' => $user->id,
        'message_type' => 'note',
        'body' => 'Internal note',
        'format' => 'text',
    ]);

    $listener = app(SendTelegramReply::class);
    $listener->handle(new MessageCreated($message));

    Http::assertNothingSent();
});

it('does not send for non-telegram channels', function () {
    Http::fake();

    $webChannel = Channel::factory()->create([
        'inbox_id' => $this->inbox->id,
        'type' => 'web_chat',
    ]);
    $visitor = Visitor::factory()->create(['channel_id' => $webChannel->id]);
    $conversation = Conversation::factory()->create([
        'inbox_id' => $this->inbox->id,
        'channel_id' => $webChannel->id,
        'visitor_id' => $visitor->id,
    ]);

    $user = User::factory()->create();
    $message = Message::create([
        'conversation_id' => $conversation->id,
        'user_id' => $user->id,
        'message_type' => 'agent',
        'body' => 'Reply to web chat',
        'format' => 'text',
    ]);

    $listener = app(SendTelegramReply::class);
    $listener->handle(new MessageCreated($message));

    Http::assertNothingSent();
});

it('does not send for visitor messages', function () {
    Http::fake();

    $message = Message::create([
        'conversation_id' => $this->conversation->id,
        'visitor_id' => $this->visitor->id,
        'message_type' => 'visitor',
        'body' => 'Visitor message',
        'format' => 'text',
    ]);

    $listener = app(SendTelegramReply::class);
    $listener->handle(new MessageCreated($message));

    Http::assertNothingSent();
});
