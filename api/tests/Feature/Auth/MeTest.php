<?php

use App\Models\User;

it('returns the authenticated user', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->getJson('/api/v1/me');

    $response->assertStatus(200)
        ->assertJsonStructure([
            'success',
            'data' => [
                'id',
                'first_name',
                'last_name',
                'email',
                'roles',
                'permissions',
            ],
        ])
        ->assertJsonPath('data.email', $user->email);
});

it('returns 401 for unauthenticated user', function () {
    $response = $this->getJson('/api/v1/me');

    $response->assertStatus(401);
});
