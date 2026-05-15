<?php

namespace App\Models;

use App\Concerns\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PreChatForm extends Model
{
    use BelongsToWorkspace, HasFactory, HasUuids;

    protected $fillable = [
        'channel_id',
        'enabled',
        'message',
        'fields',
    ];

    protected function casts(): array
    {
        return [
            'enabled' => 'boolean',
            'fields' => 'array',
        ];
    }

    public function channel()
    {
        return $this->belongsTo(Channel::class);
    }
}
