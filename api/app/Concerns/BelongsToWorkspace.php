<?php

namespace App\Concerns;

use App\Models\Workspace;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Apply on every Eloquent model that has a `workspace_id` column.
 *
 * - `initializeBelongsToWorkspace` runs on every new model instance and seeds
 *   `workspace_id` from `Workspace::current()` when missing. Runs at
 *   construction time, BEFORE save, NOT through the event dispatcher — so
 *   tests using `Event::fake()` cannot accidentally bypass it.
 * - `creating` is a belt-and-suspenders backup for instances that pre-date
 *   trait initialization (e.g. unguarded mass-assigns that wipe attributes).
 * - Adds the `workspace()` relationship.
 *
 * Single-tenant: `Workspace::current()` resolves the seeded singleton.
 * Multi-tenant (Cloud overlay, private repo): a global scope is added on top.
 */
trait BelongsToWorkspace
{
    public function initializeBelongsToWorkspace(): void
    {
        if (array_key_exists('workspace_id', $this->attributes) && ! empty($this->attributes['workspace_id'])) {
            return;
        }

        // Framework paths instantiate models with no attributes (e.g.
        // `Model::observe()` calls `new static`). In those cases we'd be
        // resolving the workspace just to fill an unused skeleton — and
        // worse, this fires during AppServiceProvider::boot when the DB
        // may not yet be reachable (CI before .env is written). Skip the
        // lookup; the `static::creating` listener still defaults it on save.
        try {
            $this->attributes['workspace_id'] = Workspace::current()->id;
        } catch (\Throwable) {
            // intentionally swallowed — save path defaults this via `creating`
        }
    }

    public static function bootBelongsToWorkspace(): void
    {
        static::creating(function ($model) {
            if (empty($model->workspace_id)) {
                $model->workspace_id = Workspace::current()->id;
            }
        });
    }

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }
}
