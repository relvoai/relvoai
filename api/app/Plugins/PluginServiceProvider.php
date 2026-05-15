<?php

namespace App\Plugins;

use Illuminate\Support\ServiceProvider;

/**
 * Base class plugin authors extend. PluginManager calls `setManifest()` on the
 * instance after registration, so concrete plugins can resolve their own
 * routes/migrations/views paths relative to their plugin directory.
 */
abstract class PluginServiceProvider extends ServiceProvider
{
    protected ?PluginManifest $manifest = null;

    public function setManifest(PluginManifest $manifest): void
    {
        $this->manifest = $manifest;
    }

    public function manifest(): PluginManifest
    {
        if ($this->manifest === null) {
            throw new \RuntimeException(static::class.': manifest accessed before PluginManager activation.');
        }

        return $this->manifest;
    }

    protected function loadPluginRoutes(string $relative = 'routes.php'): void
    {
        $path = $this->manifest()->absolutePath($relative);
        if (is_file($path)) {
            $this->loadRoutesFrom($path);
        }
    }

    protected function loadPluginMigrations(string $relative = 'migrations'): void
    {
        $path = $this->manifest()->absolutePath($relative);
        if (is_dir($path)) {
            $this->loadMigrationsFrom($path);
        }
    }
}
