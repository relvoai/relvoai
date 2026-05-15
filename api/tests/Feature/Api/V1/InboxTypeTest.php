<?php

use App\Models\User;

use function Pest\Laravel\actingAs;

test('authenticated user can list channel types', function () {
    $user = User::factory()->create();

    actingAs($user, 'sanctum')
        ->getJson('/api/v1/channel-types')
        ->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonStructure([
            'success',
            'data' => ['*' => ['type', 'label', 'description']],
        ]);
});
