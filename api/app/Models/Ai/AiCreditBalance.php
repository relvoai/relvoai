<?php

namespace App\Models\Ai;

use App\Concerns\BelongsToWorkspace;
use App\Models\Workspace;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Singleton: exactly one row in ai_credit_balance at all times.
 *
 * @property string $id
 * @property int $balance
 * @property int $monthly_refill
 * @property Carbon|null $last_refilled_at
 */
class AiCreditBalance extends Model
{
    use BelongsToWorkspace, HasUuids;

    protected $table = 'ai_credit_balance';

    protected $fillable = [
        'balance',
        'monthly_refill',
        'last_refilled_at',
    ];

    protected function casts(): array
    {
        return [
            'balance' => 'integer',
            'monthly_refill' => 'integer',
            'last_refilled_at' => 'datetime',
        ];
    }

    public static function current(): self
    {
        $workspaceId = Workspace::current()->id;

        return self::firstOrCreate(
            ['workspace_id' => $workspaceId],
            ['balance' => (int) env('AI_INITIAL_CREDIT_BALANCE', 0), 'monthly_refill' => 0]
        );
    }

    /**
     * Atomically debit `$amount` from the current workspace's balance.
     * Returns true if the debit succeeded, false if insufficient funds.
     */
    public static function debit(int $amount): bool
    {
        if ($amount <= 0) {
            return true;
        }

        self::current();
        $workspaceId = Workspace::current()->id;

        $affected = DB::update(
            'UPDATE ai_credit_balance SET balance = balance - ?, updated_at = NOW() WHERE workspace_id = ? AND balance >= ?',
            [$amount, $workspaceId, $amount],
        );

        return $affected > 0;
    }

    public static function credit(int $amount): void
    {
        if ($amount <= 0) {
            return;
        }

        self::current();
        $workspaceId = Workspace::current()->id;

        DB::update(
            'UPDATE ai_credit_balance SET balance = balance + ?, updated_at = NOW() WHERE workspace_id = ?',
            [$amount, $workspaceId]
        );
    }
}
