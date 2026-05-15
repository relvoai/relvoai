<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/api/plugins/example-sidebar-widget/ping', function (Request $request) {
    return response()->json([
        'success' => true,
        'data' => ['plugin' => 'example-sidebar-widget', 'pong' => true],
        'message' => null,
    ]);
});
