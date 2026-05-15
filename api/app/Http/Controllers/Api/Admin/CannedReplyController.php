<?php

namespace App\Http\Controllers\Api\Admin;

use App\Constants\Permissions;
use App\Http\Controllers\Api\ApiController;
use App\Http\Requests\StoreCannedReplyRequest;
use App\Http\Resources\CannedReplyResource;
use App\Models\CannedReply;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\Auth;

class CannedReplyController extends ApiController implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('permission:canned_replies.view', only: ['index', 'show']),
            new Middleware('permission:canned_replies.create', only: ['store']),
            new Middleware('permission:canned_replies.update', only: ['update']),
            new Middleware('permission:canned_replies.delete', only: ['destroy']),
        ];
    }

    /**
     * List Canned Replies
     *
     * Get a paginated list of canned replies visible to the user (own + shared).
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        $query = CannedReply::query();

        // Return shared AND user's own
        $query->where(function ($q) use ($user) {
            $q->where('is_shared', true)
                ->orWhere('user_id', $user->id);
        });

        if ($request->has('search')) {
            $search = $request->query('search');
            $query->where('shortcut', 'like', "%{$search}%")
                ->orWhere('content', 'like', "%{$search}%");
        }

        return $this->success(CannedReplyResource::collection($query->latest()->paginate(20)));
    }

    /**
     * Create Canned Reply
     *
     * Create a new canned reply. Can be personal or shared.
     */
    public function store(StoreCannedReplyRequest $request)
    {
        $data = $request->validated();
        $user = Auth::user();

        // Policy: Only admin can create shared? Or check permission?
        if (($data['is_shared'] ?? false) && ! $user->hasPermission(Permissions::CANNED_REPLIES_MANAGE_SHARED)) {
            return $this->error('Unauthorized to create shared replies.', null, 403);
        }

        // Duplicate Check (optional strict logic)
        // For simplicity, just create.

        $reply = CannedReply::create([
            'user_id' => ($data['is_shared'] ?? false) ? null : $user->id,
            'is_shared' => $data['is_shared'] ?? false,
            'shortcut' => $data['shortcut'],
            'content' => $data['content'],
        ]);

        return $this->success(new CannedReplyResource($reply), 'Canned reply created.', 201);
    }

    /**
     * Delete Canned Reply
     */
    public function destroy(CannedReply $cannedReply)
    {
        $user = Auth::user();

        // Policy: Can delete own. Can delete shared if have permission.
        if ($cannedReply->is_shared && ! $user->hasPermission(Permissions::CANNED_REPLIES_MANAGE_SHARED)) {
            return $this->error('Unauthorized to delete shared reply', null, 403);
        }

        if (! $cannedReply->is_shared && $cannedReply->user_id !== $user->id && ! $user->hasRole('admin')) {
            return $this->error('Unauthorized to delete this reply', null, 403);
        }

        $cannedReply->delete();

        return $this->success(null, 'Canned reply deleted.');
    }
}
