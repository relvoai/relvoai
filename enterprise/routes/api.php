<?php

use App\Enterprise\AdvancedAi\Http\Controllers\AiCustomToolController;
use Illuminate\Support\Facades\Route;

Route::apiResource('ai-tools', AiCustomToolController::class);
