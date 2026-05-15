<?php

namespace App\Enterprise\AdvancedAi\Http\Controllers;

use App\Enterprise\AdvancedAi\Http\Requests\StoreAiCustomToolRequest;
use App\Enterprise\AdvancedAi\Http\Requests\UpdateAiCustomToolRequest;
use App\Enterprise\AdvancedAi\Models\AiCustomTool;
use App\Http\Controllers\Api\ApiController;
use Illuminate\Http\JsonResponse;

class AiCustomToolController extends ApiController
{
    /**
     * List AI Custom Tools
     */
    public function index(): JsonResponse
    {
        return $this->success(AiCustomTool::query()->orderByDesc('created_at')->get());
    }

    /**
     * Create AI Custom Tool
     */
    public function store(StoreAiCustomToolRequest $request): JsonResponse
    {
        $tool = AiCustomTool::create($request->validated());

        return $this->success($tool, 'Custom AI tool created.', 201);
    }

    /**
     * Show AI Custom Tool
     */
    public function show(AiCustomTool $aiTool): JsonResponse
    {
        return $this->success($aiTool);
    }

    /**
     * Update AI Custom Tool
     */
    public function update(UpdateAiCustomToolRequest $request, AiCustomTool $aiTool): JsonResponse
    {
        $aiTool->update($request->validated());

        return $this->success($aiTool->fresh());
    }

    /**
     * Delete AI Custom Tool
     */
    public function destroy(AiCustomTool $aiTool): JsonResponse
    {
        $aiTool->delete();

        return $this->success(null, 'Custom AI tool deleted.');
    }
}
