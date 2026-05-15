<?php

use App\Models\Role;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);
    $this->user = User::factory()->create();
    $this->user->addRole('admin');
    $this->actingAs($this->user, 'sanctum');
});

it('can list roles with counts', function () {
    $response = $this->getJson('/api/v1/admin/roles');

    $response->assertSuccessful();
    $response->assertJsonPath('success', true);

    $roles = $response->json('data');
    expect($roles)->toHaveCount(2); // admin + agent
    expect(collect($roles)->pluck('name')->toArray())->toContain('Admin', 'Agent');
});

it('can show role with permissions', function () {
    $role = Role::where('name', 'admin')->first();

    $response = $this->getJson("/api/v1/admin/roles/{$role->id}");

    $response->assertSuccessful();
    $response->assertJsonPath('data.name', 'Admin');
    expect($response->json('data.permissions'))->not->toBeEmpty();
});
