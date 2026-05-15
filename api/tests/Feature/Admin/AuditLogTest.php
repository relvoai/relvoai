<?php

use App\Models\AuditLog;
use App\Models\Channel;
use App\Models\Conversation;
use App\Models\User;
use App\Models\Visitor;
use Database\Seeders\RolesAndPermissionsSeeder;

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);
    $this->user = User::factory()->create();
    $this->user->addRole('admin');
    $this->actingAs($this->user, 'sanctum');
});

it('can list audit logs', function () {
    AuditLog::create([
        'user_id' => $this->user->id,
        'event' => 'conversation.closed',
        'auditable_type' => 'App\\Models\\Conversation',
        'auditable_id' => fake()->uuid(),
        'ip_address' => '127.0.0.1',
    ]);

    $response = $this->getJson('/api/v1/admin/audit-logs');

    $response->assertSuccessful();
    $response->assertJsonPath('success', true);
});

it('auto-logs conversation updates via auditable trait', function () {
    $channel = Channel::factory()->create();
    $visitor = Visitor::factory()->create(['channel_id' => $channel->id]);

    $conversation = Conversation::create([
        'inbox_id' => $channel->inbox_id,
        'channel_id' => $channel->id,
        'visitor_id' => $visitor->id,
        'status' => 'open',
        'priority' => 'normal',
    ]);

    // Update should create audit log
    $conversation->update(['status' => 'closed']);

    $this->assertDatabaseHas('audit_logs', [
        'event' => 'updated',
        'auditable_type' => 'App\\Models\\Conversation',
        'auditable_id' => $conversation->id,
    ]);
});
