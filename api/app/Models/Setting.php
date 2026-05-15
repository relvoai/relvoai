<?php

namespace App\Models;

use App\Concerns\BelongsToWorkspace;
use Database\Factories\SettingFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    /** @use HasFactory<SettingFactory> */
    use BelongsToWorkspace, HasFactory, HasUuids;

    protected $fillable = [
        'key',
        'value',
        'type',
    ];
}
