<?php

namespace App\Models;

use App\Concerns\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BotRule extends Model
{
    use BelongsToWorkspace, HasFactory, HasUuids;

    protected $fillable = [
        'inbox_id',
        'name',
        'trigger_type',
        'keywords',
        'reply_content',
        'is_active',
    ];

    public function inbox()
    {
        return $this->belongsTo(Inbox::class);
    }

    protected $casts = [
        'keywords' => 'array',
        'is_active' => 'boolean',
    ];
}
