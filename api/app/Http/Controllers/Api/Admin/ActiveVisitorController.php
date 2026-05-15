<?php

namespace App\Http\Controllers\Api\Admin;

use App\Constants\Permissions;
use App\Http\Controllers\Api\ApiController;
use App\Http\Resources\VisitorResource;
use App\Models\Visitor;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class ActiveVisitorController extends ApiController implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('permission:'.Permissions::VISITORS_VIEW_ANY, only: ['index']),
        ];
    }

    /**
     * List Online Visitors
     *
     * Get a list of visitors currently online (active in the last 2 minutes).
     */
    public function index()
    {
        $visitors = Visitor::query()
            ->with(['contact'])
            ->where('last_seen_at', '>=', now()->subMinutes(2))
            ->latest('last_seen_at')
            ->get();

        return $this->success(VisitorResource::collection($visitors));
    }
}
