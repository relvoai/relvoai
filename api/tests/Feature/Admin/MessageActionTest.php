<?php

use App\Models\Channel;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use App\Models\Visitor;
use Database\Seeders\RolesAndPermissionsSeeder;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\deleteJson;
use function Pest\Laravel\postJson;

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);

    $this->agent = User::factory()->create();
    $this->agent->addRole('agent');

    $channel = Channel::factory()->create();
    $visitor = Visitor::factory()->create(['channel_id' => $channel->id]);
    $conversation = Conversation::factory()->create([
        'inbox_id' => $channel->inbox_id,
        'channel_id' => $channel->id,
        'visitor_id' => $visitor->id,
    ]);

    $this->message = Message::create([
        'conversation_id' => $conversation->id,
        'visitor_id' => $visitor->id,
        'message_type' => 'visitor',
        'body' => 'Important message',
    ]);
});

test('agent can star message', function () {
    actingAs($this->agent, 'sanctum');

    postJson("/api/v1/admin/messages/{$this->message->id}/star")
        ->assertSuccessful();

    $this->assertDatabaseHas('message_stars', [
        'message_id' => $this->message->id,
        'user_id' => $this->agent->id,
    ]);
});

test('agent can unstar message', function () {
    actingAs($this->agent, 'sanctum');

    postJson("/api/v1/admin/messages/{$this->message->id}/star");

    deleteJson("/api/v1/admin/messages/{$this->message->id}/star")
        ->assertSuccessful();

    $this->assertDatabaseMissing('message_stars', [
        'message_id' => $this->message->id,
        'user_id' => $this->agent->id,
    ]);
});
