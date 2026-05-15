<?php

namespace Database\Factories;

use App\Models\Inbox;
use App\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Inbox>
 */
class InboxFactory extends Factory
{
    protected $model = Inbox::class;

    public function definition(): array
    {
        return [
            'workspace_id' => fn () => Workspace::current()->id,
            'name' => $this->faker->company().' Inbox',
            'is_active' => true,
            'greeting_enabled' => false,
            'working_hours_enabled' => false,
            'csat_survey_enabled' => false,
            'enable_auto_assignment' => false,
            'allow_messages_after_resolved' => false,
            'lock_to_single_conversation' => false,
        ];
    }
}
