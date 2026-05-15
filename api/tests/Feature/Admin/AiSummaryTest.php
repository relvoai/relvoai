<?php

use App\Ai\Agents\ConversationSummarizer;
use App\Jobs\Ai\SummarizeConversationJob;
use App\Models\Conversation;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Support\Facades\Queue;
use Laravel\Ai\Ai;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\postJson;

test('closing conversation dispatches summary job', function () {
    Queue::fake();
    $this->seed(RolesAndPermissionsSeeder::class);

    $admin = User::factory()->create();
    $admin->addRole('admin');

    $conversation = Conversation::factory()->create();

    actingAs($admin, 'sanctum');

    postJson("/api/v1/admin/conversations/{$conversation->id}/close")
        ->assertSuccessful();

    Queue::assertPushed(SummarizeConversationJob::class, function ($job) use ($conversation) {
        return $job->conversation->id === $conversation->id;
    });
});

test('job saves the summary returned by the AI agent', function () {
    Ai::fakeAgent(ConversationSummarizer::class, [
        'Visitor asked about refund policy; assistant confirmed 30-day window.',
    ]);

    $conversation = Conversation::factory()->create(['summary' => null]);

    (new SummarizeConversationJob($conversation))->handle();

    expect($conversation->fresh()->summary)
        ->toBe('Visitor asked about refund policy; assistant confirmed 30-day window.');
});
