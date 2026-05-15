<?php

namespace Database\Factories;

use App\Models\Channel;
use App\Models\Visitor;
use App\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Visitor>
 */
class VisitorFactory extends Factory
{
    public function definition(): array
    {
        return [
            'workspace_id' => fn () => Workspace::current()->id,
            'channel_id' => Channel::factory(),
            'uid' => (string) Str::uuid(),
            'first_seen_at' => now(),
            'last_seen_at' => now(),
        ];
    }
}
