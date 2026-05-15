<?php

namespace App\Http\Controllers\Api\V1\Widget;

use App\Http\Controllers\Api\ApiController;
use App\Models\Message;
use App\Models\MessageAttachment;
use App\Models\WidgetSession;
use App\Notifications\NewConversationMessage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class WidgetAttachmentController extends ApiController
{
    /**
     * Upload Attachment
     *
     * Upload a file as a visitor message attachment. Creates (or appends to)
     * a visitor message and returns the stored attachment record.
     */
    public function store(Request $request)
    {
        $token = $request->bearerToken();
        if (! $token) {
            return $this->error('Unauthorized', null, 401);
        }

        $session = WidgetSession::where('token', hash('sha256', $token))
            ->where('expires_at', '>', now())
            ->with('conversation')
            ->first();

        if (! $session || ! $session->conversation) {
            return $this->error('Unauthorized', null, 401);
        }

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
            'client_message_id' => 'nullable|string|max:100',
        ]);

        $disk = (string) config('attachments.disk', 'public');
        $file = $data['file'];
        $path = $file->store('attachments/'.$session->conversation_id, $disk);

        $message = Message::create([
            'conversation_id' => $session->conversation_id,
            'user_id' => null,
            'visitor_id' => $session->conversation->visitor_id,
            'body' => $data['body'] ?? null,
            'message_type' => 'visitor',
            'format' => 'text',
            'has_attachments' => true,
            'client_message_id' => $data['client_message_id'] ?? null,
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

        $session->conversation->update([
            'last_message_at' => now(),
            'last_message_id' => $message->id,
            'last_message_by' => 'visitor',
        ]);

        $session->update(['expires_at' => now()->addDays(7)]);
        if ($assignee = $session->conversation->assignedTo) {
            $assignee->notify(new NewConversationMessage($message));
        }

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
