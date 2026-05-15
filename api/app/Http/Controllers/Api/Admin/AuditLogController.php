<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\ApiController;
use App\Http\Resources\AuditLogResource;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class AuditLogController extends ApiController implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('permission:audit_logs.view'),
        ];
    }

    /**
     * List Audit Logs
     *
     * Get paginated audit logs with optional filters.
     */
    public function index(Request $request)
    {
        $query = AuditLog::query()
            ->with('user')
            ->orderBy('created_at', 'desc');

        if ($request->has('event')) {
            $query->where('event', $request->input('event'));
        }

        if ($request->has('user_id')) {
            $query->where('user_id', $request->input('user_id'));
        }

        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('event', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($uq) use ($search) {
                        $uq->where('first_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%");
                    });
            });
        }

        $logs = $query->paginate($request->integer('per_page', 25));

        return $this->success(AuditLogResource::collection($logs));
    }
}
