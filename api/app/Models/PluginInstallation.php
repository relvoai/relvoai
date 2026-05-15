<?php

namespace App\Models;

use App\Concerns\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class PluginInstallation extends Model
{
    use BelongsToWorkspace, HasUuids;

    protected $table = 'plugins';

    protected $fillable = [
        'workspace_id',
        'slug',
        'version',
        'enabled',
        'settings',
    ];

    protected function casts(): array
    {
        return [
            'enabled' => 'boolean',
            'settings' => 'array',
        ];
    }
}
