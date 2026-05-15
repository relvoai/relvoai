<?php

namespace App\Http\Controllers\Api\Admin;

use App\Constants\Permissions;
use App\Http\Controllers\Api\ApiController;
use App\Models\Ai\AiCreditBalance;
use App\Models\Ai\AiCreditLedger;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class AiCreditController extends ApiController implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('permission:'.Permissions::AI_CREDITS_MANAGE),
        ];
    }

    /**
     * Show Credit Balance + Recent Ledger
     */
    public function index(Request $request)
    {
        $balance = AiCreditBalance::current();

        $ledger = AiCreditLedger::query()
            ->latest()
            ->limit((int) $request->get('limit', 50))
            ->get();

        return $this->success([
            'balance' => $balance->balance,
            'monthly_refill' => $balance->monthly_refill,
            'last_refilled_at' => $balance->last_refilled_at,
            'ledger' => $ledger,
        ]);
    }

    /**
     * Grant Credits (manual top-up)
     */
    public function grant(Request $request)
    {
        $data = $request->validate([
            'amount' => 'required|integer|min:1',
            'note' => 'nullable|string|max:255',
        ]);

        AiCreditBalance::credit($data['amount']);

        AiCreditLedger::create([
            'delta' => $data['amount'],
            'reason' => AiCreditLedger::REASON_GRANT,
            'meta' => ['note' => $data['note'] ?? null, 'by' => $request->user()?->id],
        ]);

        return $this->success(['balance' => AiCreditBalance::current()->balance], 'Credits granted.');
    }
}
