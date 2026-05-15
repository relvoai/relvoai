<?php

namespace App\Models;

use App\Concerns\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

/**
 * @property string $id
 * @property string $type
 * @property string $name
 * @property object|null $config
 */
class Channel extends Model
{
    use BelongsToWorkspace, HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'inbox_id',
        'type',
        'name',
        'is_active',
        'channel_key',
        'inbox_identifier',
        'hmac_mandatory',
        'hmac_secret',
        'webhook_url',
        'config',
    ];

    protected $hidden = [
        'hmac_secret', // Always hide secret by default
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'hmac_mandatory' => 'boolean',
        'hmac_secret' => 'encrypted',
        'config' => 'array',
    ];

    public function inbox()
    {
        return $this->belongsTo(Inbox::class);
    }

    public function domains()
    {
        return $this->hasMany(ChannelDomain::class);
    }

    // NOTE: PreChatForm table might be redundant if we store config in JSON
    // But keeping relationship if table exists
    public function preChatForm()
    {
        return $this->hasOne(PreChatForm::class);
    }

    public function conversations()
    {
        return $this->hasMany(Conversation::class);
    }

    /**
     * Generate a unique widget key.
     * Format: wd_ + 24 random alphanumeric characters
     */
    public static function generateUniqueKey(): string
    {
        do {
            $key = 'wd_'.Str::random(24);
        } while (static::where('channel_key', $key)->exists());

        return $key;
    }
}
