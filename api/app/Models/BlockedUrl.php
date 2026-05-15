<?php

namespace App\Models;

use App\Concerns\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BlockedUrl extends Model
{
    use BelongsToWorkspace, HasFactory, HasUuids;

    protected $fillable = [
        'channel_id',
        'url_pattern',
        'match_type',
        'is_active',
        'reason',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function channel(): BelongsTo
    {
        return $this->belongsTo(Channel::class);
    }

    public function matches(string $url): bool
    {
        return match ($this->match_type) {
            'exact' => $url === $this->url_pattern,
            'contains' => str_contains($url, $this->url_pattern),
            'regex' => (bool) @preg_match('/'.str_replace('/', '\/', $this->url_pattern).'/i', $url),
            default => fnmatch($this->url_pattern, $url, FNM_CASEFOLD),
        };
    }
}
