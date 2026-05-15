<?php

use App\Models\Channel;
use App\Models\Conversation;
use App\Models\User;
use App\Models\Visitor;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Support\Facades\Queue;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\getJson;
use function Pest\Laravel\postJson;

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);

    $this->agent = User::factory()->create();
    $this->agent->addRole('agent');

    $channel = Channel::factory()->create();
    $visitor = Visitor::factory()->create(['channel_id' => $channel->id]);

    $this->conversation = Conversation::factory()->create([
        'inbox_id' => $channel->inbox_id,
        'channel_id' => $channel->id,
        'visitor_id' => $visitor->id,
        'status' => 'open',
    ]);
});

test('agent can view conversations', function () {
    actingAs($this->agent, 'sanctum');

    getJson('/api/v1/admin/conversations')
        ->assertSuccessful();
});

test('agent can join conversation', function () {
    actingAs($this->agent, 'sanctum');

    postJson("/api/v1/admin/conversations/{$this->conversation->id}/join")
        ->assertSuccessful();

    $this->assertDatabaseHas('conversation_participants', [
        'conversation_id' => $this->conversation->id,
        'user_id' => $this->agent->id,
    ]);
});

test('agent can reply', function () {
    actingAs($this->agent, 'sanctum');

    postJson("/api/v1/admin/conversations/{$this->conversation->id}/reply", [
        'body' => 'Hello there!',
    ])->assertSuccessful();

    $this->assertDatabaseHas('messages', [
        'body' => 'Hello there!',
        'user_id' => $this->agent->id,
        'message_type' => 'agent',
    ]);

    $this->conversation->refresh();
    expect($this->conversation->last_message_by)->toBe('agent');
});

test('agent can transfer', function () {
    $otherAgent = User::factory()->create();
    $otherAgent->addRole('agent');

    actingAs($this->agent, 'sanctum');

    postJson("/api/v1/admin/conversations/{$this->conversation->id}/transfer", [
        'to_user_id' => $otherAgent->id,
        'note' => 'Please handle this.',
    ])->assertSuccessful();

    $this->conversation->refresh();
    expect($this->conversation->assigned_to_user_id)->toBe($otherAgent->id);
});

test('agent can close conversation', function () {
    Queue::fake();

    actingAs($this->agent, 'sanctum');

    postJson("/api/v1/admin/conversations/{$this->conversation->id}/close")
        ->assertSuccessful();

    $this->conversation->refresh();
    expect($this->conversation->status)->toBe('closed');
});
