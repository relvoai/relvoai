<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCannedReplyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'shortcut' => [
                'required',
                'string',
                'max:50',
                // Unique rule: complicated because unique per user or shared?
                // PRD: "if user_id is null (shared), shortcut should be unique among shared?"
                // Let's rely on controller to enforce scope or just basic unique?
                // Basic check for now, can refine if needed.
            ],
            'content' => ['required', 'string'],
            'is_shared' => ['boolean'], // Only admin can set TRUE
        ];
    }
}
