<?php

use App\Ai\Agents\SupportAgent;
use App\Jobs\Ai\HandleVisitorMessageJob;
use App\Models\Ai\AiAgent;
use App\Models\Ai\AiConversation;
use App\Models\Ai\AiCreditBalance;
use App\Models\Channel;
use App\Models\Contact;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Visitor;
use Laravel\Ai\Ai;

beforeEach(function () {
    $this->aiAgent = AiAgent::factory()->create();

    $this->channel = Channel::factory()->create();
    $this->visitor = Visitor::factory()->create(['channel_id' => $this->channel->id]);
    $this->contact = Contact::factory()->create();

    $this->conversation = Conversation::factory()->create([
        'channel_id' => $this->channel->id,
        'inbox_id' => $this->channel->inbox_id,
        'visitor_id' => $this->visitor->id,
        'contact_id' => $this->contact->id,
        'status' => 'open',
    ]);

    $this->visitorMessage = Message::create([
        'conversation_id' => $this->conversation->id,
        'visitor_id' => $this->visitor->id,
        'message_type' => 'visitor',
        'body' => 'Do you offer refunds?',
        'format' => 'text',
    ]);

    // Seed balance so the pipeline runs.
    AiCreditBalance::credit(10_000);
});

it('persists the bot reply and broadcasts when credits are available', function () {
    Ai::fakeAgent(SupportAgent::class, ['Yes — we offer a 30-day refund window.']);

    (new HandleVisitorMessageJob(
        $this->conversation->id,
        $this->aiAgent->id,
        $this->visitorMessage->id,
    ))->handle();

    $this->assertDatabaseHas('messages', [
        'conversation_id' => $this->conversation->id,
        'message_type' => 'bot',
        'body' => 'Yes — we offer a 30-day refund window.',
    ]);
});

it('hands off to a human when credits are depleted', function () {
    // Drain balance.
    AiCreditBalance::query()->update(['balance' => 0]);

    (new HandleVisitorMessageJob(
        $this->conversation->id,
        $this->aiAgent->id,
        $this->visitorMessage->id,
    ))->handle();

    $aiConv = AiConversation::where('conversation_id', $this->conversation->id)->first();
    expect($aiConv)->not->toBeNull();
    expect($aiConv->handed_off_at)->not->toBeNull();
    expect($aiConv->handoff_reason)->toBe('credits_depleted');

    $this->assertDatabaseHas('messages', [
        'conversation_id' => $this->conversation->id,
        'message_type' => 'system',
    ]);
});

it('does nothing when the conversation is already handed off', function () {
    AiConversation::create([
        'conversation_id' => $this->conversation->id,
        'ai_agent_id' => $this->aiAgent->id,
        'handed_off_at' => now(),
        'handoff_reason' => 'ai_requested',
    ]);

    $messagesBefore = Message::count();

    (new HandleVisitorMessageJob(
        $this->conversation->id,
        $this->aiAgent->id,
        $this->visitorMessage->id,
    ))->handle();

    expect(Message::count())->toBe($messagesBefore);
});

it('skips when the ai agent is inactive', function () {
    $this->aiAgent->update(['is_active' => false]);

    $messagesBefore = Message::count();

    (new HandleVisitorMessageJob(
        $this->conversation->id,
        $this->aiAgent->id,
        $this->visitorMessage->id,
    ))->handle();

    expect(Message::count())->toBe($messagesBefore);
});
