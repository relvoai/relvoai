<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\ApiController;
use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\DB;

class ReportController extends ApiController implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('permission:reports.view', only: ['index']),
        ];
    }

    /**
     * Get Report Statistics
     *
     * Returns summary and daily breakdown of conversations and messages.
     */
    public function index(Request $request)
    {
        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'timezone' => 'nullable|timezone',
        ]);

        $start = $request->date('start_date')->startOfDay();
        $end = $request->date('end_date')->endOfDay();
        // $timezone = $request->input('timezone', 'UTC'); // Future: handle timezone shifting

        // 1. Summary Metrics
        $totalConversations = Conversation::whereBetween('created_at', [$start, $end])->count();

        $conversationsWithResponse = Conversation::whereBetween('created_at', [$start, $end])
            ->whereNotNull('first_response_at')
            ->get(['created_at', 'first_response_at']);

        $avgResponseTime = $conversationsWithResponse->avg(function ($conversation) {
            return abs($conversation->first_response_at->timestamp - $conversation->created_at->timestamp);
        });

        // 2. Daily Conversations
        $conversationsDaily = Conversation::whereBetween('created_at', [$start, $end])
            ->select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('count(*) as count')
            )
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->keyBy('date');

        // 3. Daily Messages
        $messagesDaily = Message::whereBetween('created_at', [$start, $end])
            ->select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('count(*) as count')
            )
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->keyBy('date');

        // 4. Merge into a date range array
        $dailyData = [];
        $current = $start->copy();

        while ($current <= $end) {
            $dateStr = $current->format('Y-m-d');
            $dailyData[] = [
                'date' => $dateStr,
                'conversations' => $conversationsDaily[$dateStr]->count ?? 0,
                'messages' => $messagesDaily[$dateStr]->count ?? 0,
            ];
            $current->addDay();
        }

        return $this->success([
            'summary' => [
                'total_conversations' => $totalConversations,
                'avg_response_time_seconds' => round($avgResponseTime ?? 0, 1),
            ],
            'daily' => $dailyData,
        ]);
    }
}
