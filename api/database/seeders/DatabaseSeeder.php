<?php

namespace Database\Seeders;

use App\Models\Channel;
use App\Models\Inbox;
use App\Models\User;
use App\Services\ChannelType;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(WorkspaceSeeder::class);
        $this->call(RolesAndPermissionsSeeder::class);

        $admin = User::first();
        if (! $admin) {
            $admin = User::factory()->create([
                'first_name' => 'Admin',
                'last_name' => 'User',
                'email' => 'admin@example.com',
            ]);
        }

        $inbox = Inbox::create([
            'name' => 'Support',
            'is_active' => true,
            'greeting_enabled' => true,
            'greeting_message' => 'Hello! How can we help you?',
            'timezone' => 'UTC',
        ]);

        Channel::create([
            'inbox_id' => $inbox->id,
            'type' => ChannelType::WEB_CHAT,
            'name' => 'Website',
            'channel_key' => (string) Str::uuid(),
            'is_active' => true,
            'config' => ChannelType::all()[ChannelType::WEB_CHAT]['default_config'],
        ]);

        $inbox->agents()->attach($admin->id);
    }
}
