<?php

namespace App\Enterprise\AdvancedAi\Models;

use App\Concerns\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class AiCustomTool extends Model
{
    use BelongsToWorkspace, HasUuids;

    protected $fillable = [
        'workspace_id',
        'ai_agent_id',
        'name',
        'description',
        'parameter_schema',
        'endpoint',
        'http_method',
        'auth_type',
        'auth_value',
        'rate_limit_per_minute',
        'response_size_limit',
        'timeout_seconds',
        'enabled',
    ];

    protected function casts(): array
    {
        return [
            'parameter_schema' => 'array',
            'rate_limit_per_minute' => 'integer',
            'response_size_limit' => 'integer',
            'timeout_seconds' => 'integer',
            'enabled' => 'boolean',
        ];
    }
}
