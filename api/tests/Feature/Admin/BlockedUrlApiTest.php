<?php

use App\Models\BlockedUrl;
use App\Models\Channel;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);
    $this->user = User::factory()->create();
    $this->user->addRole('admin');
    $this->actingAs($this->user, 'sanctum');
    $this->channel = Channel::factory()->create();
});

it('lists blocked urls', function () {
    BlockedUrl::create([
        'channel_id' => $this->channel->id,
        'url_pattern' => '*/checkout*',
        'match_type' => 'wildcard',
        'is_active' => true,
    ]);

    $this->getJson('/api/v1/admin/blocked-urls')
        ->assertSuccessful()
        ->assertJsonCount(1, 'data');
});

it('creates a blocked url', function () {
    $this->postJson('/api/v1/admin/blocked-urls', [
        'channel_id' => $this->channel->id,
        'url_pattern' => '*/admin*',
        'match_type' => 'wildcard',
        'reason' => 'internal pages',
    ])->assertCreated();

    $this->assertDatabaseHas('blocked_urls', ['url_pattern' => '*/admin*']);
});

it('updates a blocked url', function () {
    $blocked = BlockedUrl::create([
        'channel_id' => $this->channel->id,
        'url_pattern' => '*/old*',
        'match_type' => 'wildcard',
        'is_active' => true,
    ]);

    $this->putJson("/api/v1/admin/blocked-urls/{$blocked->id}", ['is_active' => false])
        ->assertSuccessful();

    expect($blocked->fresh()->is_active)->toBeFalse();
});

it('deletes a blocked url', function () {
    $blocked = BlockedUrl::create([
        'channel_id' => $this->channel->id,
        'url_pattern' => '*/x*',
        'match_type' => 'wildcard',
    ]);

    $this->deleteJson("/api/v1/admin/blocked-urls/{$blocked->id}")->assertSuccessful();
    $this->assertDatabaseMissing('blocked_urls', ['id' => $blocked->id]);
});

it('requires permission', function () {
    $agent = User::factory()->create();
    $agent->addRole('agent');
    $this->actingAs($agent, 'sanctum');

    $this->getJson('/api/v1/admin/blocked-urls')->assertForbidden();
});
