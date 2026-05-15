<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'body' => ['nullable', 'string'],
            'client_message_id' => ['nullable', 'string', 'max:100'],
            'attachments' => ['nullable', 'array'],
            // If attachments are files? Or IDs? Start with simple file upload or pre-uploaded IDs?
            // "messages" table has "has_attachments". "message_attachments" table exists.
            // For now, let's assume body is required if no attachments.
            // But validation is complex. Let's keep it simple: body nullable.
        ];
    }
}
