<?php

namespace Database\Factories;

use App\Models\Widget;
use App\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Widget>
 */
class WidgetFactory extends Factory
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
            'name' => $this->faker->company().' Widget',
            'widget_key' => 'wdg_'.Str::random(32),
            'is_active' => true,
            'default_priority' => 'normal',
        ];
    }
}
