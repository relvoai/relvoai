<?php

namespace App\Models\Ai;

use App\Concerns\BelongsToWorkspace;
use App\Models\Channel;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property string $id
 * @property string $name
 * @property string|null $identity_persona
 * @property string|null $welcome_message
 * @property string|null $custom_instructions
 * @property string|null $provider
 * @property string|null $model
 * @property float|null $temperature
 * @property bool $is_active
 * @property array<string, mixed>|null $handoff_policy
 * @property array<string, mixed>|null $meta
 */
class AiAgent extends Model
{
    use BelongsToWorkspace, HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'name',
        'identity_persona',
        'welcome_message',
        'custom_instructions',
        'provider',
        'model',
        'temperature',
        'is_active',
        'handoff_policy',
        'meta',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'temperature' => 'float',
            'handoff_policy' => 'array',
            'meta' => 'array',
        ];
    }

    public function channels(): BelongsToMany
    {
        return $this->belongsToMany(Channel::class, 'ai_agent_channel')
            ->withPivot('is_primary')
            ->withTimestamps();
    }

    public function knowledgeSources(): HasMany
    {
        return $this->hasMany(AiKnowledgeSource::class);
    }

    public function knowledgeChunks(): HasMany
    {
        return $this->hasMany(AiKnowledgeChunk::class);
    }

    public function creditEntries(): HasMany
    {
        return $this->hasMany(AiCreditLedger::class);
    }
}
