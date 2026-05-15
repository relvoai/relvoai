<?php

namespace Database\Factories;

use App\Models\CannedReply;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CannedReply>
 */
class CannedReplyFactory extends Factory
{
    public function definition(): array
    {
        return [
            'workspace_id' => fn () => Workspace::current()->id,
            'user_id' => User::factory(),
            'shortcut' => $this->faker->unique()->word,
            'content' => $this->faker->sentence,
            'is_shared' => false,
        ];
    }
}
