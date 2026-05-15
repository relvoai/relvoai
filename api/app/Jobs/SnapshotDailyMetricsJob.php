<?php

namespace App\Jobs;

use App\Models\Conversation;
use App\Models\ReportMetric;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;

class SnapshotDailyMetricsJob implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new job instance.
     */
    public function __construct()
    {
        //
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $date = now()->subDay()->toDateString();
        $start = now()->subDay()->startOfDay();
        $end = now()->subDay()->endOfDay();

        // 1. Conversations Count
        $count = Conversation::whereBetween('created_at', [$start, $end])->count();
        ReportMetric::updateOrCreate(
            ['metric' => 'conversations_count', 'date' => $date],
            ['value' => $count]
        );

        // 2. Avg Response Time (Seconds)
        // Using same logic as ReportController, adjusted for efficiency if possible
        // SQLite/MySQL diff handling via DB::raw is tricky, doing PHP calculation for robust job
        $conversations = Conversation::whereBetween('created_at', [$start, $end])
            ->whereNotNull('first_response_at')
            ->get();

        $avgTime = 0;
        if ($conversations->isNotEmpty()) {
            $totalSeconds = $conversations->sum(function ($c) {
                return abs($c->first_response_at->timestamp - $c->created_at->timestamp);
            });
            $avgTime = $totalSeconds / $conversations->count();
        }

        ReportMetric::updateOrCreate(
            ['metric' => 'avg_response_time', 'date' => $date],
            ['value' => round($avgTime, 2)]
        );

        // 3. Messages Count
        $messagesCount = DB::table('messages')
            ->whereBetween('created_at', [$start, $end])
            ->count();

        ReportMetric::updateOrCreate(
            ['metric' => 'messages_count', 'date' => $date],
            ['value' => $messagesCount]
        );
    }
}
