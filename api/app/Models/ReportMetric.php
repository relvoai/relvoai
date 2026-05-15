<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ReportMetric extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'metric',
        'value',
        'date',
        'meta',
    ];

    protected $casts = [
        'date' => 'date',
        'meta' => 'array',
    ];
}
