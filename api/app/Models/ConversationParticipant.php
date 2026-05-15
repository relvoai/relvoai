<?php

namespace App\Models;

use App\Concerns\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
// Should extend Pivot or Model? Pivot if checks many-to-many. But here we have ID, so Model is better usually.
// Schema has 'id'.
use Illuminate\Database\Eloquent\Relations\Pivot;

class ConversationParticipant extends Model
{
    use BelongsToWorkspace, HasFactory, HasUuids;

    protected $fillable = [
        'conversation_id',
        'user_id',
        'joined_at',
        'left_at',
    ];

    protected $casts = [
        'joined_at' => 'datetime',
        'left_at' => 'datetime',
        'is_owner' => 'boolean',
    ];

    public function conversation()
    {
        return $this->belongsTo(Conversation::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
