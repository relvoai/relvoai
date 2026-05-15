<?php

use App\Models\Department;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);

    $this->admin = User::factory()->create();
    $this->admin->addRole('admin');

    $this->actingAs($this->admin, 'sanctum');
});

it('lists departments', function () {
    Department::factory()->count(3)->create();

    $this->getJson('/api/v1/admin/departments')
        ->assertSuccessful()
        ->assertJsonCount(3, 'data');
});

it('creates a department', function () {
    $this->postJson('/api/v1/admin/departments', [
        'name' => 'Sales',
        'is_active' => true,
    ])->assertCreated();

    $this->assertDatabaseHas('departments', ['name' => 'Sales']);
});

it('shows a department', function () {
    $department = Department::factory()->create(['name' => 'Support']);

    $this->getJson("/api/v1/admin/departments/{$department->id}")
        ->assertSuccessful()
        ->assertJsonPath('data.name', 'Support');
});

it('updates a department', function () {
    $department = Department::factory()->create(['name' => 'Old']);

    $this->putJson("/api/v1/admin/departments/{$department->id}", ['name' => 'New'])
        ->assertSuccessful();

    expect($department->fresh()->name)->toBe('New');
});

it('soft-deletes a department', function () {
    $department = Department::factory()->create();

    $this->deleteJson("/api/v1/admin/departments/{$department->id}")->assertSuccessful();

    $this->assertSoftDeleted('departments', ['id' => $department->id]);
});

it('rejects agents without department permissions', function () {
    $agent = User::factory()->create();
    $agent->addRole('agent');
    $this->actingAs($agent, 'sanctum');

    $this->postJson('/api/v1/admin/departments', ['name' => 'X'])->assertForbidden();
});
