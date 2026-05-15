<?php

namespace App\Plugins;

use App\Models\PluginInstallation;
use App\Models\Workspace;

/**
 * DB-backed per-workspace enabled state.
 *
 * Discovery is filesystem-driven (the PluginManager scans `plugins/`); this
 * repository tracks which discovered plugins are currently enabled for which
 * workspace, and is the source of truth for runtime activation.
 */
class PluginRepository
{
    public function isEnabled(string $slug, ?Workspace $workspace = null): bool
    {
        $workspace ??= Workspace::current();

        return PluginInstallation::query()
            ->where('workspace_id', $workspace->id)
            ->where('slug', $slug)
            ->where('enabled', true)
            ->exists();
    }

    /**
     * @return array<string,PluginInstallation> keyed by slug
     */
    public function allForCurrent(): array
    {
        $workspace = Workspace::current();

        return PluginInstallation::query()
            ->where('workspace_id', $workspace->id)
            ->get()
            ->keyBy('slug')
            ->all();
    }

    public function enable(PluginManifest $manifest, ?Workspace $workspace = null): PluginInstallation
    {
        $workspace ??= Workspace::current();

        return PluginInstallation::query()->updateOrCreate(
            ['workspace_id' => $workspace->id, 'slug' => $manifest->slug],
            ['version' => $manifest->version, 'enabled' => true],
        );
    }

    public function disable(string $slug, ?Workspace $workspace = null): void
    {
        $workspace ??= Workspace::current();

        PluginInstallation::query()
            ->where('workspace_id', $workspace->id)
            ->where('slug', $slug)
            ->update(['enabled' => false]);
    }
}
