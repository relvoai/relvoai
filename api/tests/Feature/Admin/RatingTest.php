<?php

use App\Models\Channel;
use App\Models\Conversation;
use App\Models\ConversationRating;
use App\Models\Inbox;
use App\Models\User;
use App\Models\Visitor;
use Database\Seeders\RolesAndPermissionsSeeder;

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);
    $this->user = User::factory()->create();
    $this->user->addRole('admin');
    $this->actingAs($this->user, 'sanctum');
});

it('can list ratings with summary', function () {
    $inbox = Inbox::factory()->create();
    $channel = Channel::factory()->create(['inbox_id' => $inbox->id]);
    $visitor = Visitor::factory()->create(['channel_id' => $channel->id]);
    $conversation = Conversation::factory()->create([
        'inbox_id' => $inbox->id,
        'channel_id' => $channel->id,
        'visitor_id' => $visitor->id,
    ]);

    ConversationRating::create([
        'conversation_id' => $conversation->id,
        'inbox_id' => $inbox->id,
        'channel_id' => $channel->id,
        'visitor_id' => $visitor->id,
        'rating' => 5,
        'comment' => 'Great support!',
    ]);

    $response = $this->getJson('/api/v1/admin/ratings');

    $response->assertSuccessful();
    $response->assertJsonPath('data.summary.total_responses', 1);
    expect((float) $response->json('data.summary.average_rating'))->toBe(5.0);
    expect((float) $response->json('data.summary.csat_score'))->toBe(100.0);
});
