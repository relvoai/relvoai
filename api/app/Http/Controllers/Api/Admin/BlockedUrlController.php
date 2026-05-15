<?php

namespace App\Http\Controllers\Api\Admin;

use App\Constants\Permissions;
use App\Http\Controllers\Api\ApiController;
use App\Models\BlockedUrl;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class BlockedUrlController extends ApiController implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('permission:'.Permissions::BLOCKED_URLS_MANAGE),
        ];
    }

    /**
     * List Blocked URLs
     *
     * Get blocked URL patterns, optionally filtered by channel.
     */
    public function index(Request $request)
    {
        $query = BlockedUrl::query()->latest();

        if ($request->filled('channel_id')) {
            $query->where('channel_id', $request->input('channel_id'));
        }

        return $this->success($query->get());
    }

    /**
     * Create Blocked URL
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'channel_id' => 'required|uuid|exists:channels,id',
            'url_pattern' => 'required|string|max:500',
            'match_type' => 'required|in:wildcard,regex,contains,exact',
            'reason' => 'nullable|string|max:255',
            'is_active' => 'boolean',
        ]);

        $blocked = BlockedUrl::create($data);

        return $this->success($blocked, 'Blocked URL created.', 201);
    }

    /**
     * Update Blocked URL
     */
    public function update(Request $request, BlockedUrl $blockedUrl)
    {
        $data = $request->validate([
            'url_pattern' => 'sometimes|string|max:500',
            'match_type' => 'sometimes|in:wildcard,regex,contains,exact',
            'reason' => 'nullable|string|max:255',
            'is_active' => 'sometimes|boolean',
        ]);

        $blockedUrl->update($data);

        return $this->success($blockedUrl->fresh(), 'Blocked URL updated.');
    }

    /**
     * Delete Blocked URL
     */
    public function destroy(BlockedUrl $blockedUrl)
    {
        $blockedUrl->delete();

        return $this->success(null, 'Blocked URL deleted.');
    }
}
