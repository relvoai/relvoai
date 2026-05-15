<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AiRequest extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'provider',
        'model',
        'prompt',
        'response',
        'input_tokens',
        'output_tokens',
        'meta',
    ];

    protected $casts = [
        'meta' => 'array',
    ];
}
