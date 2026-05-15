<?php

namespace App\Models;

use App\Concerns\BelongsToWorkspace;
use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Conversation extends Model
{
    use Auditable, BelongsToWorkspace, HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'inbox_id',
        'channel_id',
        'visitor_id',
        'contact_id',
        'assigned_to_user_id',
        'assigned_by_user_id',
        'subject',
        'summary',
        'status',
        'priority',
        'last_message_at',
        'last_message_id',
        'last_message_by',
        'first_response_at',
        'closed_at',
        'assigned_at',
        'meta',
    ];

    protected $casts = [
        'tags' => 'array',
        'meta' => 'array',
        'bot_enabled' => 'boolean',
        'bot_disabled_at' => 'datetime',
        'assigned_at' => 'datetime',
        'last_message_at' => 'datetime',
        'first_response_at' => 'datetime',
        'closed_at' => 'datetime',
    ];

    public function inbox()
    {
        return $this->belongsTo(Inbox::class);
    }

    public function channel()
    {
        return $this->belongsTo(Channel::class);
    }

    public function visitor()
    {
        return $this->belongsTo(Visitor::class);
    }

    public function contact()
    {
        return $this->belongsTo(Contact::class);
    }

    public function assignedTo()
    {
        return $this->belongsTo(User::class, 'assigned_to_user_id');
    }

    public function assignedBy()
    {
        return $this->belongsTo(User::class, 'assigned_by_user_id');
    }

    public function messages()
    {
        return $this->hasMany(Message::class);
    }

    public function lastMessage()
    {
        return $this->belongsTo(Message::class, 'last_message_id');
    }

    public function ratings()
    {
        return $this->hasMany(ConversationRating::class);
    }
}
