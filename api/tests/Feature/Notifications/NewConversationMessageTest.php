<?php

use App\Models\Channel;
use App\Models\Contact;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use App\Models\Visitor;
use App\Notifications\Channels\TelegramChannel;
use App\Notifications\NewConversationMessage;
use App\Services\Telegram\TelegramService;
use Illuminate\Support\Facades\Notification;

use function Pest\Laravel\postJson;

beforeEach(function () {
    Notification::fake();

    $this->agent = User::factory()->create([
        'first_name' => 'Jane',
        'email' => 'jane@example.com',
    ]);

    $this->channel = Channel::factory()->create();
    $this->visitor = Visitor::factory()->create(['channel_id' => $this->channel->id]);
    $this->contact = Contact::factory()->create(['name' => 'Acme Buyer']);

    $this->conversation = Conversation::factory()->create([
        'channel_id' => $this->channel->id,
        'inbox_id' => $this->channel->inbox_id,
        'visitor_id' => $this->visitor->id,
        'contact_id' => $this->contact->id,
        'assigned_to_user_id' => $this->agent->id,
        'status' => 'open',
    ]);
});

function sendVisitorMessage(): void
{
    $bootstrap = postJson('/api/v1/public/widget/bootstrap', [], [
        'X-Channel-Key' => test()->channel->channel_key,
        'X-Visitor-Uid' => test()->visitor->uid,
    ])->assertSuccessful();

    // The bootstrap reuses the existing open conversation (same visitor).
    $token = $bootstrap->json('data.session_token');

    postJson('/api/v1/public/widget/messages', ['body' => 'Hello, anyone there?'], [
        'Authorization' => "Bearer {$token}",
    ])->assertCreated();
}

test('visitor message notifies the assigned agent via mail + database + broadcast', function () {
    sendVisitorMessage();

    Notification::assertSentTo($this->agent, NewConversationMessage::class, function ($n, array $channels) {
        return in_array('mail', $channels)
            && in_array('database', $channels)
            && in_array('broadcast', $channels);
    });
});

test('telegram channel is added when user has configured it', function () {
    $this->agent->update([
        'telegram_bot_token' => 'test-token',
        'telegram_chat_id' => '12345',
    ]);

    sendVisitorMessage();

    Notification::assertSentTo($this->agent, NewConversationMessage::class, function ($n, array $channels) {
        return in_array(TelegramChannel::class, $channels);
    });
});

test('telegram channel is omitted when user has NOT configured it', function () {
    sendVisitorMessage();

    Notification::assertSentTo($this->agent, NewConversationMessage::class, function ($n, array $channels) {
        return ! in_array(TelegramChannel::class, $channels);
    });
});

test('unassigned conversations do not notify anyone', function () {
    $this->conversation->update(['assigned_to_user_id' => null]);

    sendVisitorMessage();

    Notification::assertNothingSent();
});

test('telegram channel calls TelegramService::sendMessage with the users credentials', function () {
    Notification::fake()->serializeAndRestore();

    $this->agent->update([
        'telegram_bot_token' => 'bot-xyz',
        'telegram_chat_id' => '987654',
    ]);

    $fake = Mockery::mock(TelegramService::class);
    $fake->shouldReceive('sendMessage')
        ->once()
        ->withArgs(fn ($token, $chat, $text) => $token === 'bot-xyz' && $chat === '987654' && str_contains($text, 'Acme Buyer'))
        ->andReturn(true);
    app()->instance(TelegramService::class, $fake);

    $notification = new NewConversationMessage(
        Message::create([
            'conversation_id' => $this->conversation->id,
            'visitor_id' => $this->visitor->id,
            'body' => 'Hi from Acme Buyer',
            'message_type' => 'visitor',
            'format' => 'text',
        ])
    );

    (new TelegramChannel($fake))->send($this->agent, $notification);
});
