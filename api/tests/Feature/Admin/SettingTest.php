<?php

use App\Models\Setting;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Database\Seeders\SettingsSeeder;

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);
    $this->seed(SettingsSeeder::class);

    $this->admin = User::factory()->create();
    $this->admin->addRole('admin');
});

it('lists settings', function () {
    $this->actingAs($this->admin, 'sanctum');

    $response = $this->getJson('/api/v1/admin/settings');

    $response->assertSuccessful();
    expect($response->json('data'))->not->toBeEmpty();
});

it('updates a setting by key', function () {
    $this->actingAs($this->admin, 'sanctum');

    $setting = Setting::first();

    $this->putJson("/api/v1/admin/settings/{$setting->key}", ['value' => 'updated-value'])
        ->assertSuccessful();

    expect($setting->fresh()->value)->toBe('updated-value');
});

it('returns 404 for unknown key', function () {
    $this->actingAs($this->admin, 'sanctum');

    $this->putJson('/api/v1/admin/settings/does.not.exist', ['value' => 'x'])
        ->assertNotFound();
});

it('rejects unauthenticated requests', function () {
    $this->getJson('/api/v1/admin/settings')->assertUnauthorized();
});

it('rejects users lacking system.settings permission', function () {
    $agent = User::factory()->create();
    $agent->addRole('agent');
    $this->actingAs($agent, 'sanctum');

    $this->getJson('/api/v1/admin/settings')->assertForbidden();
});
