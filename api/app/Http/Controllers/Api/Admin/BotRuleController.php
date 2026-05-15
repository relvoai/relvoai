<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\ApiController;
use App\Http\Resources\BotRuleResource;
use App\Models\BotRule;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class BotRuleController extends ApiController implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('permission:bot_rules.manage'),
        ];
    }

    /**
     * List Bot Rules
     *
     * Get all bot rules, optionally filtered by inbox.
     */
    public function index(Request $request)
    {
        $query = BotRule::query()->orderBy('created_at', 'desc');

        if ($request->has('inbox_id')) {
            $query->where('inbox_id', $request->input('inbox_id'));
        }

        return $this->success(BotRuleResource::collection($query->get()));
    }

    /**
     * Create Bot Rule
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'inbox_id' => 'required|uuid|exists:inboxes,id',
            'name' => 'required|string|max:255',
            'trigger_type' => 'required|in:keyword,regex,exact',
            'keywords' => 'required|array|min:1',
            'keywords.*' => 'required|string',
            'reply_content' => 'required|string',
            'is_active' => 'boolean',
        ]);

        $rule = BotRule::create($validated);

        return $this->success(new BotRuleResource($rule), 'Bot rule created.', 201);
    }

    /**
     * Update Bot Rule
     */
    public function update(Request $request, BotRule $botRule)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'trigger_type' => 'sometimes|in:keyword,regex,exact',
            'keywords' => 'sometimes|array|min:1',
            'keywords.*' => 'required|string',
            'reply_content' => 'sometimes|string',
            'is_active' => 'sometimes|boolean',
        ]);

        $botRule->update($validated);

        return $this->success(new BotRuleResource($botRule->fresh()), 'Bot rule updated.');
    }

    /**
     * Delete Bot Rule
     */
    public function destroy(BotRule $botRule)
    {
        $botRule->delete();

        return $this->success(null, 'Bot rule deleted.');
    }
}
