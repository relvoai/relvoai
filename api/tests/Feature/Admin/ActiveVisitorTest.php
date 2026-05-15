<?php

use App\Models\Channel;
use App\Models\User;
use App\Models\Visitor;
use Database\Seeders\RolesAndPermissionsSeeder;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\getJson;

test('admin can see online visitors', function () {
    $this->seed(RolesAndPermissionsSeeder::class);

    $admin = User::factory()->create();
    $admin->addRole('admin');

    $channel = Channel::factory()->create();

    // Online Visitor (active now)
    Visitor::factory()->create([
        'channel_id' => $channel->id,
        'last_seen_at' => now(),
        'last_seen_url' => '/home',
    ]);

    // Offline Visitor (active 10 mins ago)
    Visitor::factory()->create([
        'channel_id' => $channel->id,
        'last_seen_at' => now()->subMinutes(10),
    ]);

    actingAs($admin, 'sanctum');

    $response = getJson('/api/v1/admin/visitors/online');

    $response->assertSuccessful()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.last_seen_url', '/home');
});
