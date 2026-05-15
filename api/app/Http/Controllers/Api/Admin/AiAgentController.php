<?php

namespace App\Http\Controllers\Api\Admin;

use App\Constants\Permissions;
use App\Http\Controllers\Api\ApiController;
use App\Models\Ai\AiAgent;
use App\Models\Channel;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\DB;

class AiAgentController extends ApiController implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('permission:'.Permissions::AI_AGENTS_MANAGE),
        ];
    }

    /**
     * List AI Agents
     */
    public function index()
    {
        return $this->success(
            AiAgent::query()->with('channels:id,name')->latest()->get()
        );
    }

    /**
     * Create AI Agent
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'identity_persona' => 'nullable|string|max:500',
            'welcome_message' => 'nullable|string|max:300',
            'custom_instructions' => 'nullable|string|max:4000',
            'provider' => 'nullable|string|max:40',
            'model' => 'nullable|string|max:100',
            'temperature' => 'nullable|numeric|min:0|max:2',
            'is_active' => 'sometimes|boolean',
            'handoff_policy' => 'nullable|array',
        ]);

        $agent = AiAgent::create($data);

        return $this->success($agent, 'AI agent created.', 201);
    }

    /**
     * Show AI Agent
     */
    public function show(AiAgent $aiAgent)
    {
        return $this->success($aiAgent->load('channels:id,name', 'knowledgeSources'));
    }

    /**
     * Update AI Agent
     */
    public function update(Request $request, AiAgent $aiAgent)
    {
        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'identity_persona' => 'nullable|string|max:500',
            'welcome_message' => 'nullable|string|max:300',
            'custom_instructions' => 'nullable|string|max:4000',
            'provider' => 'nullable|string|max:40',
            'model' => 'nullable|string|max:100',
            'temperature' => 'nullable|numeric|min:0|max:2',
            'is_active' => 'sometimes|boolean',
            'handoff_policy' => 'nullable|array',
        ]);

        $aiAgent->update($data);

        return $this->success($aiAgent->fresh(), 'AI agent updated.');
    }

    /**
     * Delete AI Agent
     */
    public function destroy(AiAgent $aiAgent)
    {
        $aiAgent->delete();

        return $this->success(null, 'AI agent deleted.');
    }

    /**
     * Attach to Channel
     *
     * Optional is_primary flag designates the agent that auto-handles
     * inbound messages on that channel. Exactly one primary per channel.
     */
    public function attachChannel(Request $request, AiAgent $aiAgent, Channel $channel)
    {
        $data = $request->validate([
            'is_primary' => 'sometimes|boolean',
        ]);

        $isPrimary = (bool) ($data['is_primary'] ?? false);

        DB::transaction(function () use ($aiAgent, $channel, $isPrimary) {
            if ($isPrimary) {
                DB::table('ai_agent_channel')
                    ->where('channel_id', $channel->id)
                    ->update(['is_primary' => false]);
            }

            $aiAgent->channels()->syncWithoutDetaching([
                $channel->id => ['is_primary' => $isPrimary],
            ]);
        });

        return $this->success(null, 'Agent attached to channel.');
    }

    /**
     * Detach from Channel
     */
    public function detachChannel(AiAgent $aiAgent, Channel $channel)
    {
        $aiAgent->channels()->detach($channel->id);

        return $this->success(null, 'Agent detached from channel.');
    }
}
