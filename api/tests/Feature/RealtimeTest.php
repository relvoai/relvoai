<?php

use App\Events\ConversationUpdated;
use App\Events\ParticipantJoined;
use App\Events\ParticipantLeft;
use App\Models\Conversation;
use App\Models\ConversationParticipant;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Queue;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\postJson;

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);
});

test('joining conversation broadcasts event', function () {
    Event::fake();

    $user = User::factory()->create();
    $user->addRole('agent');

    $conversation = Conversation::factory()->create();

    actingAs($user, 'sanctum');

    postJson("/api/v1/admin/conversations/{$conversation->id}/join")
        ->assertSuccessful();

    Event::assertDispatched(ParticipantJoined::class);
});

test('leaving conversation broadcasts event', function () {
    Event::fake();

    $user = User::factory()->create();
    $user->addRole('agent');

    $conversation = Conversation::factory()->create();

    ConversationParticipant::create([
        'conversation_id' => $conversation->id,
        'user_id' => $user->id,
        'joined_at' => now(),
    ]);

    actingAs($user, 'sanctum');

    postJson("/api/v1/admin/conversations/{$conversation->id}/leave")
        ->assertSuccessful();

    Event::assertDispatched(ParticipantLeft::class);
});

test('closing conversation broadcasts update', function () {
    Event::fake();
    Queue::fake();

    $user = User::factory()->create();
    $user->addRole('agent');

    $conversation = Conversation::factory()->create();

    actingAs($user, 'sanctum');

    postJson("/api/v1/admin/conversations/{$conversation->id}/close")
        ->assertSuccessful();

    Event::assertDispatched(ConversationUpdated::class);
});
