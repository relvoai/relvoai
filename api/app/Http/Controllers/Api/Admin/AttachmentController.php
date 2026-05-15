<?php

namespace App\Http\Controllers\Api\Admin;

use App\Constants\Permissions;
use App\Http\Controllers\Api\ApiController;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\MessageAttachment;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class AttachmentController extends ApiController implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('permission:'.Permissions::CONVERSATIONS_REPLY, only: ['store']),
        ];
    }

    /**
     * Upload Agent Attachment
     *
     * Upload a file from an agent into a conversation. Creates a new agent
     * message carrying the attachment.
     */
    public function store(Request $request, Conversation $conversation)
    {
        $data = $request->validate([
            'file' => [
                'required',
                'file',
                'max:'.((int) config('attachments.max_kb', 10240)),
                'mimes:'.implode(',', (array) config('attachments.allowed_mimes', [
                    'jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx', 'txt', 'csv', 'xls', 'xlsx', 'zip',
                ])),
            ],
            'body' => 'nullable|string|max:10000',
            'is_note' => 'nullable|boolean',
        ]);

        $disk = (string) config('attachments.disk', 'public');
        $file = $data['file'];
        $path = $file->store('attachments/'.$conversation->id, $disk);

        $message = $conversation->messages()->create([
            'user_id' => Auth::id(),
            'message_type' => $request->boolean('is_note') ? 'note' : 'agent',
            'body' => $data['body'] ?? null,
            'format' => 'text',
            'has_attachments' => true,
            'delivered_at' => now(),
        ]);

        $attachment = MessageAttachment::create([
            'message_id' => $message->id,
            'disk' => $disk,
            'path' => $path,
            'original_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getClientMimeType(),
            'size_bytes' => $file->getSize(),
            'is_image' => str_starts_with((string) $file->getClientMimeType(), 'image/'),
        ]);

        $conversation->update([
            'last_message_at' => now(),
            'last_message_id' => $message->id,
            'last_message_by' => $request->boolean('is_note') ? 'system' : 'agent',
            'first_response_at' => $conversation->first_response_at ?? now(),
        ]);

        return $this->success([
            'message_id' => $message->id,
            'attachment' => [
                'id' => $attachment->id,
                'url' => Storage::disk($disk)->url($path),
                'original_name' => $attachment->original_name,
                'mime_type' => $attachment->mime_type,
                'size_bytes' => $attachment->size_bytes,
                'is_image' => $attachment->is_image,
            ],
        ], 'Attachment uploaded', 201);
    }
}
