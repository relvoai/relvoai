<?php

namespace Database\Seeders;

use App\Models\Workspace;
use Illuminate\Database\Seeder;

class WorkspaceSeeder extends Seeder
{
    public function run(): void
    {
        Workspace::clearResolvedCurrent();
        Workspace::firstOrCreate(
            ['slug' => Workspace::DEFAULT_SLUG],
            ['name' => 'Default', 'is_active' => true]
        );
        Workspace::clearResolvedCurrent();
    }
}
