<?php

namespace App\Jobs\Ai;

use App\Ai\Services\KnowledgeIndexer;
use App\Models\Ai\AiKnowledgeSource;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Throwable;

class IndexKnowledgeSourceJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $backoff = 30;

    public function __construct(public string $sourceId) {}

    public function handle(KnowledgeIndexer $indexer): void
    {
        $source = AiKnowledgeSource::find($this->sourceId);
        if (! $source) {
            return;
        }

        try {
            $indexer->index($source);
        } catch (Throwable $e) {
            // The indexer has already marked status=failed + recorded last_error.
            // Swallow so the sync queue driver can't bubble exceptions back to the
            // HTTP request that dispatched the job; the failed-state row is the
            // canonical signal for the owner, who can click Reindex to retry.
            Log::warning('Knowledge indexing failed', [
                'source_id' => $source->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
