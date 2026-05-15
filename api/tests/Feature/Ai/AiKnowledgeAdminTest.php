<?php

use App\Jobs\Ai\IndexKnowledgeSourceJob;
use App\Models\Ai\AiAgent;
use App\Models\Ai\AiKnowledgeSource;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Queue::fake();
    Storage::fake('public');

    $this->seed(RolesAndPermissionsSeeder::class);

    $this->admin = User::factory()->create();
    $this->admin->addRole('admin');

    $this->actingAs($this->admin, 'sanctum');

    $this->aiAgent = AiAgent::factory()->create();
});

it('accepts a text knowledge source and queues indexing', function () {
    $response = $this->postJson("/api/v1/admin/ai-agents/{$this->aiAgent->id}/knowledge", [
        'name' => 'Refund policy',
        'type' => 'text',
        'raw_text' => 'We offer a 30-day refund window for all paid plans.',
    ])->assertCreated();

    $this->assertDatabaseHas('ai_knowledge_sources', [
        'ai_agent_id' => $this->aiAgent->id,
        'name' => 'Refund policy',
        'type' => 'text',
        'status' => AiKnowledgeSource::STATUS_PROCESSING,
    ]);

    Queue::assertPushed(IndexKnowledgeSourceJob::class);
});

it('accepts a URL knowledge source', function () {
    $this->postJson("/api/v1/admin/ai-agents/{$this->aiAgent->id}/knowledge", [
        'name' => 'Pricing page',
        'type' => 'url',
        'source_url' => 'https://example.com/pricing',
    ])->assertCreated();

    $this->assertDatabaseHas('ai_knowledge_sources', [
        'source_url' => 'https://example.com/pricing',
    ]);

    Queue::assertPushed(IndexKnowledgeSourceJob::class);
});

it('accepts a PDF upload', function () {
    $this->postJson("/api/v1/admin/ai-agents/{$this->aiAgent->id}/knowledge", [
        'name' => 'Handbook',
        'type' => 'pdf',
        'file' => UploadedFile::fake()->create('handbook.pdf', 50, 'application/pdf'),
    ])->assertCreated();

    $source = AiKnowledgeSource::first();
    expect($source->storage_path)->not->toBeNull();
    Storage::disk('public')->assertExists($source->storage_path);

    Queue::assertPushed(IndexKnowledgeSourceJob::class);
});

it('rejects a text source without raw_text', function () {
    $this->postJson("/api/v1/admin/ai-agents/{$this->aiAgent->id}/knowledge", [
        'name' => 'Bad',
        'type' => 'text',
    ])->assertStatus(422);
});

it('lists knowledge sources for a specific agent', function () {
    AiKnowledgeSource::create([
        'ai_agent_id' => $this->aiAgent->id,
        'type' => 'text',
        'name' => 'A',
        'raw_text' => 'hello',
        'status' => 'ready',
    ]);

    $this->getJson("/api/v1/admin/ai-agents/{$this->aiAgent->id}/knowledge")
        ->assertSuccessful()
        ->assertJsonCount(1, 'data');
});

it('reindex queues another indexer run', function () {
    $source = AiKnowledgeSource::create([
        'ai_agent_id' => $this->aiAgent->id,
        'type' => 'text',
        'name' => 'A',
        'raw_text' => 'hello',
        'status' => 'ready',
    ]);

    $this->postJson("/api/v1/admin/ai-agents/{$this->aiAgent->id}/knowledge/{$source->id}/reindex")
        ->assertSuccessful();

    expect($source->fresh()->status)->toBe(AiKnowledgeSource::STATUS_PROCESSING);
    Queue::assertPushed(IndexKnowledgeSourceJob::class);
});

it('refuses to show a source belonging to a different agent', function () {
    $otherAgent = AiAgent::factory()->create();
    $otherSource = AiKnowledgeSource::create([
        'ai_agent_id' => $otherAgent->id,
        'type' => 'text',
        'name' => 'Other',
        'raw_text' => 'x',
        'status' => 'ready',
    ]);

    $this->getJson("/api/v1/admin/ai-agents/{$this->aiAgent->id}/knowledge/{$otherSource->id}")
        ->assertNotFound();
});
