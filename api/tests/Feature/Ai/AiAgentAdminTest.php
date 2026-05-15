<?php

use App\Models\Ai\AiAgent;
use App\Models\Channel;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);

    $this->admin = User::factory()->create();
    $this->admin->addRole('admin');

    $this->actingAs($this->admin, 'sanctum');
});

it('lists ai agents', function () {
    AiAgent::factory()->count(2)->create();

    $this->getJson('/api/v1/admin/ai-agents')
        ->assertSuccessful()
        ->assertJsonCount(2, 'data');
});

it('creates an ai agent', function () {
    $this->postJson('/api/v1/admin/ai-agents', [
        'name' => 'Support Bot',
        'identity_persona' => 'You are Maya, a warm support specialist.',
        'welcome_message' => 'Hi! Ask me anything.',
        'custom_instructions' => 'Focus on billing, shipping, and returns.',
        'temperature' => 0.2,
        'is_active' => true,
    ])->assertCreated()
        ->assertJsonPath('data.name', 'Support Bot');

    $this->assertDatabaseHas('ai_agents', ['name' => 'Support Bot']);
});

it('updates an ai agent', function () {
    $agent = AiAgent::factory()->create(['name' => 'Old']);

    $this->putJson("/api/v1/admin/ai-agents/{$agent->id}", ['name' => 'New'])
        ->assertSuccessful();

    expect($agent->fresh()->name)->toBe('New');
});

it('attaches an agent to a channel as primary and enforces one primary per channel', function () {
    $agentA = AiAgent::factory()->create();
    $agentB = AiAgent::factory()->create();
    $channel = Channel::factory()->create();

    $this->postJson("/api/v1/admin/ai-agents/{$agentA->id}/channels/{$channel->id}", ['is_primary' => true])
        ->assertSuccessful();

    $this->postJson("/api/v1/admin/ai-agents/{$agentB->id}/channels/{$channel->id}", ['is_primary' => true])
        ->assertSuccessful();

    // B becomes primary; A is demoted.
    $this->assertDatabaseHas('ai_agent_channel', [
        'ai_agent_id' => $agentB->id,
        'channel_id' => $channel->id,
        'is_primary' => true,
    ]);
    $this->assertDatabaseHas('ai_agent_channel', [
        'ai_agent_id' => $agentA->id,
        'channel_id' => $channel->id,
        'is_primary' => false,
    ]);
});

it('detaches an agent from a channel', function () {
    $agent = AiAgent::factory()->create();
    $channel = Channel::factory()->create();

    $agent->channels()->attach($channel->id, ['is_primary' => false]);

    $this->deleteJson("/api/v1/admin/ai-agents/{$agent->id}/channels/{$channel->id}")
        ->assertSuccessful();

    $this->assertDatabaseMissing('ai_agent_channel', [
        'ai_agent_id' => $agent->id,
        'channel_id' => $channel->id,
    ]);
});

it('rejects agents without ai.agents.manage permission', function () {
    $agent = User::factory()->create();
    $agent->addRole('agent');
    $this->actingAs($agent, 'sanctum');

    $this->getJson('/api/v1/admin/ai-agents')->assertForbidden();
});
