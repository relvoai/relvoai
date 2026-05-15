<?php

namespace App\Models;

use App\Concerns\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Contact extends Model
{
    use BelongsToWorkspace, HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'external_id',
        'name',
        'email',
        'phone',
        'avatar_url',
        'custom_attributes',
    ];

    protected $casts = [
        'tags' => 'array',
        'custom_attributes' => 'array',
    ];

    public function visitors()
    {
        return $this->hasMany(Visitor::class);
    }

    public function conversations()
    {
        return $this->hasMany(Conversation::class);
    }

    public function mergedIntoContact()
    {
        return $this->belongsTo(Contact::class, 'merged_into_contact_id');
    }

    public function notes()
    {
        return $this->morphMany(Note::class, 'notable');
    }
}
