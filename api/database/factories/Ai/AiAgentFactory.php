<?php

namespace Database\Factories\Ai;

use App\Models\Ai\AiAgent;
use App\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AiAgent>
 */
class AiAgentFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'workspace_id' => fn () => Workspace::current()->id,
            'name' => fake()->unique()->words(2, true),
            'identity_persona' => 'You are '.fake()->firstName().', a helpful customer support assistant.',
            'welcome_message' => '👋 Hi! How can I help you today?',
            'custom_instructions' => 'Answer clearly and cite relevant knowledge when possible. Ask a follow-up if unsure.',
            'provider' => null,
            'model' => null,
            'temperature' => 0.3,
            'is_active' => true,
            'handoff_policy' => [
                'on_tool_call' => true,
                'on_low_confidence' => true,
                'confidence_threshold' => 0.5,
                'on_keywords' => ['human', 'agent', 'person'],
                'on_credits_depleted' => true,
            ],
        ];
    }
}
