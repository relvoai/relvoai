<?php

use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;

use function Pest\Laravel\actingAs;

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);

    $this->admin = User::factory()->create();
    $this->admin->addRole('admin');

    $this->agent = User::factory()->create();
    $this->agent->addRole('agent');
});

it('admin can list users', function () {
    actingAs($this->admin)
        ->getJson('/api/v1/admin/users')
        ->assertStatus(200)
        ->assertJsonStructure(['data' => [['id', 'email', 'roles']]]);
});

it('agent cannot list users', function () {
    actingAs($this->agent)
        ->getJson('/api/v1/admin/users')
        ->assertStatus(403);
});

it('admin can create user', function () {
    $data = [
        'first_name' => 'John',
        'last_name' => 'Doe',
        'email' => 'john@example.com',
        'username' => 'johndoe',
        'password' => 'password',
        'password_confirmation' => 'password',
        'is_active' => true,
        'roles' => ['agent'],
    ];

    actingAs($this->admin)
        ->postJson('/api/v1/admin/users', $data)
        ->assertStatus(201)
        ->assertJsonPath('data.email', 'john@example.com');

    expect(User::where('email', 'john@example.com')->exists())->toBeTrue();
    expect(User::where('email', 'john@example.com')->first()->hasRole('agent'))->toBeTrue();
});

it('admin can update user', function () {
    $user = User::factory()->create();

    $data = [
        'first_name' => 'Jane',
    ];

    actingAs($this->admin)
        ->putJson("/api/v1/admin/users/{$user->id}", $data)
        ->assertStatus(200)
        ->assertJsonPath('data.first_name', 'Jane');

    expect($user->fresh()->first_name)->toBe('Jane');
});

it('admin can delete user', function () {
    $user = User::factory()->create();

    actingAs($this->admin)
        ->deleteJson("/api/v1/admin/users/{$user->id}")
        ->assertStatus(200);

    expect(User::find($user->id))->toBeNull();
});
