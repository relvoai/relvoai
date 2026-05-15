<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreConversationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'subject' => ['nullable', 'string', 'max:255'],
            'priority' => ['nullable', 'string', 'in:low,normal,high,urgent'],
            'department_id' => ['nullable', 'uuid', 'exists:departments,id'],
            'initial_message' => ['required', 'string'], // Usually starting a convo implies a message
            'meta' => ['nullable', 'array'],
        ];
    }
}
