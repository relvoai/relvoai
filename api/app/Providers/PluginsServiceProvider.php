<?php

namespace App\Providers;

use App\Plugins\PluginManager;
use App\Plugins\PluginRepository;
use Illuminate\Contracts\Foundation\Application;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\ServiceProvider;
use Throwable;

class PluginsServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(PluginRepository::class);

        $this->app->singleton(PluginManager::class, function (Application $app) {
            return new PluginManager(
                app: $app,
                repository: $app->make(PluginRepository::class),
                pluginsPath: (string) config('plugins.path', base_path('../plugins')),
            );
        });
    }

    public function boot(): void
    {
        if ($this->app->runningInConsole() && ! $this->shouldActivateInConsole()) {
            return;
        }

        $this->app->booted(function (): void {
            // Belt-and-suspenders: never let plugin activation break boot.
            // Catches missing DB (fresh install, package:discover), missing
            // plugins table, malformed plugin manifests — anything.
            try {
                if (! Schema::hasTable('plugins')) {
                    return;
                }
                $this->app->make(PluginManager::class)->activateEnabled();
            } catch (Throwable $e) {
                if (! $this->app->runningInConsole()) {
                    report($e);
                }
            }
        });
    }

    /**
     * During artisan migrate/test boots we still want plugin migrations
     * discoverable; for `package:discover` and similar metadata-only commands
     * we skip activation to avoid touching the DB before it exists.
     */
    protected function shouldActivateInConsole(): bool
    {
        $argv = $_SERVER['argv'] ?? [];
        $skip = ['package:discover', 'config:cache', 'route:cache', 'event:cache'];

        foreach ($argv as $arg) {
            if (in_array($arg, $skip, true)) {
                return false;
            }
        }

        return true;
    }
}
