<?php

namespace Database\Factories;

use App\Models\Channel;
use App\Models\Inbox;
use App\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Channel>
 */
class ChannelFactory extends Factory
{
    protected $model = Channel::class;

    public function definition(): array
    {
        return [
            'workspace_id' => fn () => Workspace::current()->id,
            'inbox_id' => Inbox::factory(),
            'type' => 'web_chat',
            'name' => $this->faker->company().' Channel',
            'is_active' => true,
            'channel_key' => Channel::generateUniqueKey(),
            'hmac_mandatory' => false,
        ];
    }

    public function telegram(): static
    {
        return $this->state(fn () => [
            'type' => 'telegram',
            'name' => $this->faker->company().' Telegram',
        ]);
    }
}
