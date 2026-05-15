<?php

namespace Tests\Feature\Admin;

use App\Models\CannedReply;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CannedReplyTest extends TestCase
{
    use RefreshDatabase;

    public User $admin;

    public User $agent;

    protected function setUp(): void
    {
        parent::setUp();
        Auth::forgetGuards();
        $this->seed(RolesAndPermissionsSeeder::class);

        $this->admin = User::where('email', 'admin@example.com')->first();
        $this->agent = User::factory()->create();
        $this->agent->addRole('agent');
    }

    public function test_agent_can_create_private_canned_reply()
    {
        Sanctum::actingAs($this->agent, ['*']);

        $response = $this->postJson('/api/v1/admin/canned-replies', [
            'shortcut' => 'hi',
            'content' => 'Hello there!',
            'is_shared' => false,
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('canned_replies', [
            'shortcut' => 'hi',
            'user_id' => $this->agent->id,
        ]);
    }

    public function test_agent_cannot_create_shared_canned_reply()
    {
        Sanctum::actingAs($this->agent, ['*']);

        $response = $this->postJson('/api/v1/admin/canned-replies', [
            'shortcut' => 'global',
            'content' => 'Everyone uses this',
            'is_shared' => true,
        ]);

        $response->assertForbidden();
    }

    public function test_admin_can_create_shared_canned_reply()
    {
        // Debug confirm permission exists if needed, but normally seeder handles it.
        // $this->assertTrue($this->admin->hasPermission('canned_replies.shared.manage'));

        Sanctum::actingAs($this->admin, ['*']);

        $response = $this->postJson('/api/v1/admin/canned-replies', [
            'shortcut' => 'global',
            'content' => 'Everyone uses this',
            'is_shared' => true,
        ]);

        if ($response->status() === 403) {
            $response->dump();
        }

        $response->assertCreated();
        $this->assertDatabaseHas('canned_replies', [
            'shortcut' => 'global',
            'is_shared' => true,
            'user_id' => null,
        ]);
    }

    public function test_agent_can_list_own_and_shared_replies()
    {
        CannedReply::factory()->create(['user_id' => $this->agent->id, 'shortcut' => 'mine']);
        CannedReply::factory()->create(['is_shared' => true, 'user_id' => null, 'shortcut' => 'theirs']);
        CannedReply::factory()->create(['user_id' => $this->admin->id, 'shortcut' => 'admin_private']);

        Sanctum::actingAs($this->agent, ['*']);

        $response = $this->getJson('/api/v1/admin/canned-replies');

        $response->assertSuccessful();
        $response->assertJsonCount(2, 'data'); // mine + shared
        $response->assertJsonFragment(['shortcut' => 'mine']);
        $response->assertJsonFragment(['shortcut' => 'theirs']);
        $response->assertJsonMissing(['shortcut' => 'admin_private']);
    }
}
