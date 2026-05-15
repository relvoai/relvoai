<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\Pivot;

class InboxAgent extends Pivot
{
    use HasFactory, HasUuids;

    protected $table = 'inbox_agents';

    // Explicitly defining incrementing is false for UUID pivots if strict,
    // but HasUuids trait handles the 'id' generation.
    public $incrementing = false;

    protected $fillable = [
        'inbox_id',
        'user_id',
    ];

    public function inbox()
    {
        return $this->belongsTo(Inbox::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
