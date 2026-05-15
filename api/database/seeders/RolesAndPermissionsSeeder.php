<?php

namespace Database\Seeders;

use App\Constants\Permissions;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

class RolesAndPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Reset cached roles and permissions
        // app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Laratrust usually caches in cache driver.
        // But let's stick to Laratrust seeder logic.

        // 2. Create Permissions
        $allPermissions = Permissions::all();

        foreach ($allPermissions as $pName) {
            Permission::firstOrCreate(['name' => $pName], [
                'display_name' => ucwords(str_replace('.', ' ', $pName)),
                'description' => 'Ability to '.str_replace('.', ' ', $pName),
            ]);
        }

        // 3. Create Roles
        $adminRole = Role::firstOrCreate(['name' => 'admin'], [
            'display_name' => 'Administrator',
            'description' => 'Full access to everything',
        ]);

        $agentRole = Role::firstOrCreate(['name' => 'agent'], [
            'display_name' => 'Support Agent',
            'description' => 'Handles conversations',
        ]);

        // 4. Assign Permissions
        // Admin gets ALL
        $adminRole->syncPermissions(Permission::all());

        // Agent gets subset
        $agentPermissions = Permissions::getAgentPermissions();

        $agentRole->syncPermissions($agentPermissions);

        // 5. Create Default Admin User
        $admin = User::firstOrCreate(
            ['email' => 'admin@example.com'],
            [
                'first_name' => 'System',
                'last_name' => 'Admin',
                'username' => 'admin',
                'password' => bcrypt('password'), // In real app, use .env or prompt
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );

        if (! $admin->hasRole('admin')) {
            $admin->addRole('admin');
        }

        $this->command->info('Seeding complete. Admin: admin@example.com / password');
    }
}
