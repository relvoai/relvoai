<?php

namespace App\Models;

use App\Concerns\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property string $id
 * @property object|null $meta
 */
class Visitor extends Model
{
    use BelongsToWorkspace, HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'channel_id',
        'uid',
        'contact_id',
        'first_seen_at',
        'last_seen_at',
        'last_seen_url',
        'last_referrer',
        'meta',
    ];

    public function channel()
    {
        return $this->belongsTo(Channel::class);
    }

    protected $casts = [
        'meta' => 'array',
        'first_seen_at' => 'datetime',
        'last_seen_at' => 'datetime',
    ];

    public function contact()
    {
        return $this->belongsTo(Contact::class);
    }

    public function sessions()
    {
        return $this->hasMany(VisitorSession::class);
    }

    public function conversations()
    {
        return $this->hasMany(Conversation::class);
    }

    public function messages()
    {
        return $this->hasMany(Message::class);
    }
}
