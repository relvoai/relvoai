<?php

namespace Database\Factories;

use App\Models\Channel;
use App\Models\Conversation;
use App\Models\Visitor;
use App\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Conversation>
 */
class ConversationFactory extends Factory
{
    public function definition(): array
    {
        $channel = Channel::factory()->create();

        return [
            'workspace_id' => fn () => Workspace::current()->id,
            'inbox_id' => $channel->inbox_id,
            'channel_id' => $channel->id,
            'visitor_id' => Visitor::factory()->state(['channel_id' => $channel->id]),
            'status' => 'open',
            'priority' => 'normal',
            'subject' => $this->faker->sentence,
        ];
    }
}
