<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\ApiController;
use App\Http\Resources\ConversationRatingResource;
use App\Models\ConversationRating;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class RatingController extends ApiController implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('permission:reports.view'),
        ];
    }

    /**
     * List Ratings
     *
     * Get paginated CSAT ratings with summary statistics.
     */
    public function index(Request $request)
    {
        $query = ConversationRating::query()
            ->with(['conversation.assignedTo', 'visitor.contact'])
            ->orderBy('created_at', 'desc');

        if ($request->has('inbox_id')) {
            $query->where('inbox_id', $request->input('inbox_id'));
        }

        $ratings = $query->paginate($request->integer('per_page', 25));

        // Summary stats
        $totalCount = ConversationRating::count();
        $avgRating = ConversationRating::avg('rating');
        $csatScore = $totalCount > 0
            ? round(ConversationRating::where('rating', '>=', 4)->count() / $totalCount * 100, 1)
            : 0;

        return $this->success([
            'summary' => [
                'average_rating' => round($avgRating ?? 0, 1),
                'csat_score' => $csatScore,
                'total_responses' => $totalCount,
            ],
            'ratings' => ConversationRatingResource::collection($ratings),
        ]);
    }
}
