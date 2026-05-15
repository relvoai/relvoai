<?php

namespace App\Enterprise\AdvancedAi\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAiCustomToolRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string,mixed>
     */
    public function rules(): array
    {
        return [
            'ai_agent_id' => ['nullable', 'uuid', 'exists:ai_agents,id'],
            'name' => ['sometimes', 'required', 'string', 'max:120'],
            'description' => ['sometimes', 'required', 'string', 'max:1000'],
            'parameter_schema' => ['sometimes', 'required', 'array'],
            'endpoint' => ['sometimes', 'required', 'url', 'max:2048'],
            'http_method' => ['nullable', 'in:GET,POST,PUT,PATCH,DELETE'],
            'auth_type' => ['nullable', 'in:none,bearer,header'],
            'auth_value' => ['nullable', 'string', 'max:1024'],
            'rate_limit_per_minute' => ['nullable', 'integer', 'min:1', 'max:600'],
            'response_size_limit' => ['nullable', 'integer', 'min:128', 'max:131072'],
            'timeout_seconds' => ['nullable', 'integer', 'min:1', 'max:60'],
            'enabled' => ['nullable', 'boolean'],
        ];
    }
}
