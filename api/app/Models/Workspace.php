<?php

namespace App\Models;

use Database\Factories\WorkspaceFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Workspace extends Model
{
    /** @use HasFactory<WorkspaceFactory> */
    use HasFactory, HasUuids, SoftDeletes;

    public const DEFAULT_SLUG = 'default';

    protected $fillable = [
        'name',
        'slug',
        'is_active',
    ];

    protected static ?self $resolvedCurrent = null;

    public static function current(): self
    {
        if (self::$resolvedCurrent !== null) {
            return self::$resolvedCurrent;
        }

        $workspace = static::where('slug', self::DEFAULT_SLUG)
            ->where('is_active', true)
            ->first();

        if (! $workspace) {
            $workspace = static::create([
                'name' => 'Default',
                'slug' => self::DEFAULT_SLUG,
                'is_active' => true,
            ]);
        }

        return self::$resolvedCurrent = $workspace;
    }

    public static function clearResolvedCurrent(): void
    {
        self::$resolvedCurrent = null;
    }

    /**
     * Hook used by multi-tenant overlays (Cloud) to swap the resolved
     * workspace per-request from a tenant resolver middleware. OSS callers
     * should not use this — `current()` resolves the singleton automatically.
     */
    public static function setResolvedCurrent(self $workspace): void
    {
        self::$resolvedCurrent = $workspace;
    }

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }
}
