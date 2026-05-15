<?php

namespace App\Enterprise\AdvancedAi;

use App\Enterprise\AdvancedAi\Models\AiCustomTool;
use App\Models\Ai\AiAgent;

/**
 * Resolves the list of enabled custom Tools for a given agent. Used by
 * EnterpriseServiceProvider as the resolver injected into
 * SupportAgent::$extraToolsResolver — so OSS code never directly references
 * Enterprise classes.
 */
class AiToolRegistry
{
    /**
     * @return array<int,CustomAiTool>
     */
    public function toolsForAgent(AiAgent $agent): array
    {
        return AiCustomTool::query()
            ->where('workspace_id', $agent->workspace_id)
            ->where('enabled', true)
            ->where(function ($q) use ($agent) {
                $q->whereNull('ai_agent_id')->orWhere('ai_agent_id', $agent->id);
            })
            ->get()
            ->map(fn (AiCustomTool $row) => new CustomAiTool($row))
            ->all();
    }
}
