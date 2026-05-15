<?php

namespace App\Models;

use App\Concerns\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ConversationRating extends Model
{
    use BelongsToWorkspace, HasFactory, HasUuids;

    protected $fillable = [
        'conversation_id',
        'inbox_id',
        'channel_id',
        'visitor_id',
        'rating',
        'comment',
    ];

    public function conversation()
    {
        return $this->belongsTo(Conversation::class);
    }

    public function visitor()
    {
        return $this->belongsTo(Visitor::class);
    }
}
