<?php

namespace App\Models;

use App\Concerns\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MessageAttachment extends Model
{
    use BelongsToWorkspace, HasFactory, HasUuids;

    protected $fillable = [
        'message_id',
        'disk',
        'path',
        'original_name',
        'mime_type',
        'size_bytes',
        'is_image',
        'checksum',
        'meta',
    ];

    protected $casts = [
        'meta' => 'array',
        'is_image' => 'boolean',
    ];

    public function message()
    {
        return $this->belongsTo(Message::class);
    }
}
