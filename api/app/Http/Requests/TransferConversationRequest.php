<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class TransferConversationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'to_user_id' => ['nullable', 'uuid', 'exists:users,id'],
            'to_department_id' => ['nullable', 'uuid', 'exists:departments,id'],
            'note' => ['nullable', 'string'],
        ];
    }
}
