<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreAgentReplyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'body' => ['required', 'string'],
            'attachments' => ['nullable', 'array'],
            // 'internal_note' => ['boolean'] ? Separate endpoint or flag? M3 plan says "Reply, Note".
            'is_note' => ['boolean'],
        ];
    }
}
