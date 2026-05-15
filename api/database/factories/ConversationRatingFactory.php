<?php

namespace Database\Factories;

use App\Models\ConversationRating;
use App\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ConversationRating>
 */
class ConversationRatingFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'workspace_id' => fn () => Workspace::current()->id,
            //
        ];
    }
}
