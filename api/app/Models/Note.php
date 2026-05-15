<?php

namespace App\Models;

use App\Concerns\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Note extends Model
{
    use BelongsToWorkspace, HasFactory, HasUuids;

    protected $fillable = [
        'content',
        'user_id',
        'notable_id',
        'notable_type',
    ];

    /**
     * Get the owning notable model.
     */
    public function notable(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Get the user who created the note.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
