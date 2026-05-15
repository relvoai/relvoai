<?php

use App\Ai\Services\KnowledgeIndexer;
use App\Jobs\Ai\IndexKnowledgeSourceJob;
use Illuminate\Support\Facades\Queue;

it('chunks long text into overlapping windows within the char budget', function () {
    $indexer = new KnowledgeIndexer;

    $paragraph = str_repeat('This is a single fairly long sentence that repeats. ', 200);
    $chunks = $indexer->chunk($paragraph."\n\n".$paragraph);

    expect($chunks)->toBeArray();
    expect(count($chunks))->toBeGreaterThan(1);

    foreach ($chunks as $chunk) {
        expect(mb_strlen($chunk))->toBeLessThanOrEqual(KnowledgeIndexer::CHUNK_CHARS);
    }
});

it('returns a single chunk for short text', function () {
    $chunks = (new KnowledgeIndexer)->chunk('A short note that fits easily.');

    expect($chunks)->toHaveCount(1);
    expect($chunks[0])->toBe('A short note that fits easily.');
});

it('returns empty for empty input', function () {
    expect((new KnowledgeIndexer)->chunk(''))->toBe([]);
    expect((new KnowledgeIndexer)->chunk("   \n\n"))->toBe([]);
});

it('IndexKnowledgeSourceJob is queueable with a source id', function () {
    Queue::fake();

    IndexKnowledgeSourceJob::dispatch('019d-some-uuid');

    Queue::assertPushed(IndexKnowledgeSourceJob::class, function ($job) {
        return $job->sourceId === '019d-some-uuid';
    });
});
