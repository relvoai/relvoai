<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enterprise\LicenseManager;
use App\Http\Controllers\Api\ApiController;
use Illuminate\Http\JsonResponse;

class LicenseController extends ApiController
{
    public function __construct(protected LicenseManager $license) {}

    /**
     * License Status
     *
     * Returns the current Enterprise license state. The admin SPA reads this
     * on boot to decide whether to render Enterprise UI.
     */
    public function show(): JsonResponse
    {
        return $this->success($this->license->status());
    }
}
