<?php

namespace Database\Factories;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Message>
 */
class MessageFactory extends Factory
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
            'conversation_id' => Conversation::factory(),
            'message_type' => 'visitor',
            'body' => $this->faker->sentence(),
            'format' => 'text',
            'delivered_at' => now(),
        ];
    }
}
