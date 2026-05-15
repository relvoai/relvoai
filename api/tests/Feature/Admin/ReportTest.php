<?php

use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\getJson;

test('admin can view reports', function () {
    $this->seed(RolesAndPermissionsSeeder::class);

    $admin = User::factory()->create();
    $admin->addRole('admin');

    $day1 = now()->subDays(2);
    Conversation::factory()->create(['created_at' => $day1]);
    Conversation::factory()->create([
        'created_at' => $day1,
        'first_response_at' => $day1->copy()->addMinutes(5),
    ]);
    Message::factory()->count(5)->create(['created_at' => $day1]);

    $day2 = now()->subDays(1);
    Conversation::factory()->create([
        'created_at' => $day2,
        'first_response_at' => $day2->copy()->addMinutes(10),
    ]);
    Message::factory()->count(3)->create(['created_at' => $day2]);

    actingAs($admin, 'sanctum');

    $response = getJson('/api/v1/admin/reports?start_date='.$day1->toDateString().'&end_date='.$day2->toDateString());

    $response->assertSuccessful();
    $response->assertJsonPath('data.summary.total_conversations', 3);
    expect($response->json('data.summary.avg_response_time_seconds'))->toEqualWithDelta(450, 1);

    $daily = $response->json('data.daily');
    expect($daily)->toHaveCount(2);

    expect($daily[0]['date'])->toBe($day1->toDateString())
        ->and($daily[0]['conversations'])->toBe(2)
        ->and($daily[0]['messages'])->toBe(5);

    expect($daily[1]['date'])->toBe($day2->toDateString())
        ->and($daily[1]['conversations'])->toBe(1)
        ->and($daily[1]['messages'])->toBe(3);
});
