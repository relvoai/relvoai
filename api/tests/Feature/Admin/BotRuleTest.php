<?php

use App\Models\BotRule;
use App\Models\Inbox;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);
    $this->user = User::factory()->create();
    $this->user->addRole('admin');
    $this->actingAs($this->user, 'sanctum');
    $this->inbox = Inbox::factory()->create();
});

it('can list bot rules', function () {
    BotRule::create([
        'inbox_id' => $this->inbox->id,
        'name' => 'Welcome',
        'trigger_type' => 'keyword',
        'keywords' => ['hello', 'hi'],
        'reply_content' => 'Welcome!',
    ]);

    $response = $this->getJson('/api/v1/admin/bot-rules');

    $response->assertSuccessful();
    $response->assertJsonPath('success', true);
    expect($response->json('data'))->toHaveCount(1);
});

it('can create a bot rule', function () {
    $response = $this->postJson('/api/v1/admin/bot-rules', [
        'inbox_id' => $this->inbox->id,
        'name' => 'Price Bot',
        'trigger_type' => 'keyword',
        'keywords' => ['price', 'cost', 'pricing'],
        'reply_content' => 'Our pricing starts at $29/mo.',
    ]);

    $response->assertStatus(201);
    $response->assertJsonPath('data.name', 'Price Bot');
    $this->assertDatabaseHas('bot_rules', ['name' => 'Price Bot']);
});

it('can update a bot rule', function () {
    $rule = BotRule::create([
        'inbox_id' => $this->inbox->id,
        'name' => 'Old Name',
        'trigger_type' => 'keyword',
        'keywords' => ['test'],
        'reply_content' => 'Test reply',
    ]);

    $response = $this->putJson("/api/v1/admin/bot-rules/{$rule->id}", [
        'name' => 'New Name',
        'is_active' => false,
    ]);

    $response->assertSuccessful();
    $response->assertJsonPath('data.name', 'New Name');
    $response->assertJsonPath('data.is_active', false);
});

it('can delete a bot rule', function () {
    $rule = BotRule::create([
        'inbox_id' => $this->inbox->id,
        'name' => 'Delete Me',
        'trigger_type' => 'keyword',
        'keywords' => ['bye'],
        'reply_content' => 'Goodbye!',
    ]);

    $response = $this->deleteJson("/api/v1/admin/bot-rules/{$rule->id}");

    $response->assertSuccessful();
    $this->assertDatabaseMissing('bot_rules', ['id' => $rule->id]);
});
