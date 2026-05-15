<?php

namespace App\Models\Ai;

use App\Concerns\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property string $id
 * @property string $ai_agent_id
 * @property string $source_id
 * @property string $content
 * @property array<int, float> $embedding
 * @property int $token_count
 * @property int $position
 * @property array<string, mixed>|null $metadata
 */
class AiKnowledgeChunk extends Model
{
    use BelongsToWorkspace, HasFactory, HasUuids;

    protected $fillable = [
        'ai_agent_id',
        'source_id',
        'content',
        'embedding',
        'token_count',
        'position',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            // pgvector column; Laravel's vector blueprint + `array` cast round-trips the ordered floats.
            'embedding' => 'array',
            'metadata' => 'array',
        ];
    }

    public function agent(): BelongsTo
    {
        return $this->belongsTo(AiAgent::class, 'ai_agent_id');
    }

    public function source(): BelongsTo
    {
        return $this->belongsTo(AiKnowledgeSource::class, 'source_id');
    }
}
