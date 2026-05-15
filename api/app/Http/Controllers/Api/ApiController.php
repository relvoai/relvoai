<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Contracts\Pagination\LengthAwarePaginator as LengthAwarePaginatorContract;
use Illuminate\Contracts\Pagination\Paginator as PaginatorContract;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\ResourceCollection;

abstract class ApiController extends Controller
{
    /**
     * Return a success JSON response.
     *
     * When the payload is a ResourceCollection wrapping a paginator, or a raw
     * paginator, the envelope is hoisted so the response exposes `data`, `meta`,
     * and `links` at the top level alongside `success` + `message`. This keeps
     * the shape consistent with Laravel's default pagination and lets the
     * frontend page past the first chunk without breaking.
     */
    protected function success(mixed $data = null, ?string $message = null, int $status = 200): JsonResponse
    {
        if ($data instanceof ResourceCollection && $data->resource instanceof PaginatorContract) {
            return $this->paginatedResponse($data, $message, $status);
        }

        if ($data instanceof PaginatorContract) {
            return $this->paginatedResponse($data, $message, $status);
        }

        return response()->json([
            'success' => true,
            'data' => $data,
            'message' => $message,
        ], $status);
    }

    private function paginatedResponse(mixed $payload, ?string $message, int $status): JsonResponse
    {
        // Let the ResourceCollection / paginator render itself (items + meta + links)
        // then splice its fields into our envelope.
        $rendered = json_decode(
            $payload instanceof ResourceCollection
                ? $payload->response()->getContent()
                : response()->json($payload)->getContent(),
            associative: true,
        ) ?? [];

        $envelope = [
            'success' => true,
            'data' => $rendered['data'] ?? [],
            'message' => $message,
        ];

        if (isset($rendered['meta'])) {
            $envelope['meta'] = $rendered['meta'];
        } elseif ($payload instanceof LengthAwarePaginatorContract) {
            $envelope['meta'] = [
                'current_page' => $payload->currentPage(),
                'last_page' => $payload->lastPage(),
                'per_page' => $payload->perPage(),
                'total' => $payload->total(),
            ];
        }

        if (isset($rendered['links'])) {
            $envelope['links'] = $rendered['links'];
        }

        return response()->json($envelope, $status);
    }

    /**
     * Return an error JSON response.
     */
    protected function error(string $message, mixed $errors = null, int $status = 400): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
            'errors' => $errors,
        ], $status);
    }

    /**
     * Return a not found JSON response.
     */
    protected function notFound(string $message = 'Resource not found.'): JsonResponse
    {
        return $this->error($message, null, 404);
    }

    /**
     * Return a forbidden JSON response.
     */
    protected function forbidden(string $message = 'Access forbidden.'): JsonResponse
    {
        return $this->error($message, null, 403);
    }
}
