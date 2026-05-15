<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\ApiController;
use App\Http\Requests\UpdateSettingRequest;
use App\Http\Resources\SettingResource;
use App\Models\Setting;
use Illuminate\Http\Request;

class SettingController extends ApiController
{
    /**
     * List Settings
     */
    public function index(Request $request)
    {
        return $this->success(SettingResource::collection(Setting::all()));
    }

    /**
     * Update Setting
     */
    public function update(UpdateSettingRequest $request, string $key)
    {
        $setting = Setting::where('key', $key)->firstOrFail();

        $setting->update([
            'value' => $request->value,
        ]);

        return $this->success(new SettingResource($setting), 'Setting updated successfully.');
    }
}
