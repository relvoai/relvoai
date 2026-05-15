<?php

namespace App\Http\Controllers\Api\Admin;

use App\Constants\Permissions;
use App\Http\Controllers\Api\ApiController;
use App\Jobs\Ai\IndexKnowledgeSourceJob;
use App\Models\Ai\AiAgent;
use App\Models\Ai\AiKnowledgeSource;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class AiKnowledgeController extends ApiController implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('permission:'.Permissions::AI_KNOWLEDGE_MANAGE),
        ];
    }

    /**
     * List Knowledge Sources
     */
    public function index(AiAgent $aiAgent)
    {
        return $this->success(
            $aiAgent->knowledgeSources()->latest()->get()
        );
    }

    /**
     * Upload Knowledge Source
     *
     * Accepts one of: a file upload (pdf/text), a raw text blob, or a URL.
     * Creates the source row, queues an indexer job, returns immediately.
     */
    public function store(Request $request, AiAgent $aiAgent)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:pdf,text,url',
            'file' => 'required_if:type,pdf|file|mimes:pdf|max:20480',
            'raw_text' => 'required_if:type,text|nullable|string|max:500000',
            'source_url' => 'required_if:type,url|nullable|url|max:2000',
        ]);

        $sourcePayload = [
            'ai_agent_id' => $aiAgent->id,
            'type' => $data['type'],
            'name' => $data['name'],
            'status' => AiKnowledgeSource::STATUS_PROCESSING,
        ];

        if ($data['type'] === AiKnowledgeSource::TYPE_PDF) {
            $disk = (string) config('attachments.disk', 'public');
            $path = $request->file('file')->store("ai/knowledge/{$aiAgent->id}", $disk);
            $sourcePayload['disk'] = $disk;
            $sourcePayload['storage_path'] = $path;
        } elseif ($data['type'] === AiKnowledgeSource::TYPE_TEXT) {
            $sourcePayload['raw_text'] = $data['raw_text'];
        } elseif ($data['type'] === AiKnowledgeSource::TYPE_URL) {
            $sourcePayload['source_url'] = $data['source_url'];
        }

        $source = AiKnowledgeSource::create($sourcePayload);

        IndexKnowledgeSourceJob::dispatch($source->id);

        return $this->success($source, 'Knowledge source uploaded; indexing in background.', 201);
    }

    /**
     * Show Knowledge Source
     */
    public function show(AiAgent $aiAgent, AiKnowledgeSource $source)
    {
        $this->ensureOwnership($aiAgent, $source);

        return $this->success($source);
    }

    /**
     * Delete Knowledge Source
     */
    public function destroy(AiAgent $aiAgent, AiKnowledgeSource $source)
    {
        $this->ensureOwnership($aiAgent, $source);

        $source->delete();

        return $this->success(null, 'Knowledge source deleted.');
    }

    /**
     * Re-index Knowledge Source
     */
    public function reindex(AiAgent $aiAgent, AiKnowledgeSource $source)
    {
        $this->ensureOwnership($aiAgent, $source);

        $source->update(['status' => AiKnowledgeSource::STATUS_PROCESSING, 'last_error' => null]);
        IndexKnowledgeSourceJob::dispatch($source->id);

        return $this->success($source->fresh(), 'Re-indexing queued.');
    }

    private function ensureOwnership(AiAgent $aiAgent, AiKnowledgeSource $source): void
    {
        abort_if($source->ai_agent_id !== $aiAgent->id, 404);
    }
}
