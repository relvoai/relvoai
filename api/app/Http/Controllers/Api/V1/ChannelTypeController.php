<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Services\ChannelType;

class ChannelTypeController extends ApiController
{
    /**
     * List Channel Types
     *
     * Get available channel types for inbox creation.
     */
    public function index()
    {
        return $this->success(array_values(ChannelType::all()));
    }
}
