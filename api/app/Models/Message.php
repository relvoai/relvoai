<?php

namespace App\Models;

use App\Concerns\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Message extends Model
{
    use BelongsToWorkspace, HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'conversation_id',
        'user_id',
        'visitor_id',
        'message_type',
        'body',
        'format',
        'has_attachments',
        'client_message_id',
        'delivered_at',
        'read_at',
    ];

    protected $casts = [
        'meta' => 'array',
        'has_attachments' => 'boolean',
        'delivered_at' => 'datetime',
        'read_at' => 'datetime',
    ];

    public function conversation()
    {
        return $this->belongsTo(Conversation::class);
    }

    public function visitor()
    {
        return $this->belongsTo(Visitor::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function attachments()
    {
        return $this->hasMany(MessageAttachment::class);
    }
}
