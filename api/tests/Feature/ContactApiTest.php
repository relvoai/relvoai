<?php

use App\Models\Contact;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;

use function Pest\Laravel\actingAs;

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);
});

test('admin can list contacts', function () {
    $admin = User::factory()->create();
    $admin->addRole('admin');

    Contact::factory()->count(3)->create();

    actingAs($admin, 'sanctum')
        ->getJson('/api/v1/admin/contacts')
        ->assertOk()
        ->assertJsonCount(3, 'data');
});

test('admin can create contact', function () {
    $admin = User::factory()->create();
    $admin->addRole('admin');

    $payload = [
        'name' => 'John Doe',
        'email' => 'john@example.com',
        'phone' => '1234567890',
    ];

    actingAs($admin, 'sanctum')
        ->postJson('/api/v1/admin/contacts', $payload)
        ->assertCreated()
        ->assertJsonPath('data.name', 'John Doe');
});
