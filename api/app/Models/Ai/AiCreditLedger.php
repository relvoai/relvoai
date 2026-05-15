<?php

namespace App\Models\Ai;

use App\Concerns\BelongsToWorkspace;
use App\Models\Conversation;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property string $id
 * @property string|null $ai_agent_id
 * @property string|null $conversation_id
 * @property int $delta
 * @property string $reason
 * @property int $tokens_prompt
 * @property int $tokens_completion
 * @property float|null $cost_usd
 * @property string|null $provider
 * @property string|null $model
 * @property array<string, mixed>|null $meta
 */
class AiCreditLedger extends Model
{
    use BelongsToWorkspace, HasFactory, HasUuids;

    protected $table = 'ai_credit_ledger';

    public const REASON_CHAT = 'chat';

    public const REASON_TRAIN = 'train';

    public const REASON_REFILL = 'refill';

    public const REASON_ADJUST = 'adjust';

    public const REASON_GRANT = 'grant';

    protected $fillable = [
        'ai_agent_id',
        'conversation_id',
        'delta',
        'reason',
        'tokens_prompt',
        'tokens_completion',
        'cost_usd',
        'provider',
        'model',
        'meta',
    ];

    protected function casts(): array
    {
        return [
            'cost_usd' => 'float',
            'meta' => 'array',
        ];
    }

    public function agent(): BelongsTo
    {
        return $this->belongsTo(AiAgent::class, 'ai_agent_id');
    }

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }
}
