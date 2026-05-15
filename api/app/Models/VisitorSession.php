<?php

namespace App\Models;

use App\Concerns\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VisitorSession extends Model
{
    use BelongsToWorkspace, HasFactory, HasUuids;

    protected $fillable = [
        'channel_id',
        'visitor_id',
        'session_started_at',
        'last_activity_at',
        'entry_url',
        'referrer',
        'ip',
        'user_agent',
        'country',
        'city',
        'meta',
    ];

    protected $casts = [
        'meta' => 'array',
        'session_started_at' => 'datetime',
        'last_activity_at' => 'datetime',
    ];

    public function visitor()
    {
        return $this->belongsTo(Visitor::class);
    }

    public function channel()
    {
        return $this->belongsTo(Channel::class);
    }
}
