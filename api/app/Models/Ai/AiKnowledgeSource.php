<?php

namespace App\Models\Ai;

use App\Concerns\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property string $id
 * @property string $ai_agent_id
 * @property string $type
 * @property string $name
 * @property string|null $disk
 * @property string|null $storage_path
 * @property string|null $source_url
 * @property string|null $raw_text
 * @property string $status
 * @property string|null $last_error
 * @property int $chunk_count
 * @property int $token_count
 * @property Carbon|null $last_indexed_at
 */
class AiKnowledgeSource extends Model
{
    use BelongsToWorkspace, HasFactory, HasUuids;

    public const TYPE_PDF = 'pdf';

    public const TYPE_TEXT = 'text';

    public const TYPE_URL = 'url';

    public const STATUS_PROCESSING = 'processing';

    public const STATUS_READY = 'ready';

    public const STATUS_FAILED = 'failed';

    protected $fillable = [
        'ai_agent_id',
        'type',
        'name',
        'disk',
        'storage_path',
        'source_url',
        'raw_text',
        'status',
        'last_error',
        'chunk_count',
        'token_count',
        'last_indexed_at',
    ];

    protected function casts(): array
    {
        return [
            'last_indexed_at' => 'datetime',
        ];
    }

    public function agent(): BelongsTo
    {
        return $this->belongsTo(AiAgent::class, 'ai_agent_id');
    }

    public function chunks(): HasMany
    {
        return $this->hasMany(AiKnowledgeChunk::class, 'source_id');
    }
}
