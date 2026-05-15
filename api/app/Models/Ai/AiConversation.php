<?php

namespace App\Models\Ai;

use App\Concerns\BelongsToWorkspace;
use App\Models\Conversation;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property string $id
 * @property string $conversation_id
 * @property string $ai_agent_id
 * @property string|null $sdk_conversation_id
 * @property Carbon|null $handed_off_at
 * @property string|null $handoff_reason
 * @property string|null $handoff_summary
 */
class AiConversation extends Model
{
    use BelongsToWorkspace, HasFactory, HasUuids;

    protected $fillable = [
        'conversation_id',
        'ai_agent_id',
        'sdk_conversation_id',
        'handed_off_at',
        'handoff_reason',
        'handoff_summary',
    ];

    protected function casts(): array
    {
        return [
            'handed_off_at' => 'datetime',
        ];
    }

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    public function agent(): BelongsTo
    {
        return $this->belongsTo(AiAgent::class, 'ai_agent_id');
    }
}
