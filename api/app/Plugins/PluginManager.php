<?php

namespace App\Plugins;

use Illuminate\Contracts\Foundation\Application;
use Throwable;

/**
 * Discovers plugins on the filesystem and activates the ones enabled for the
 * current workspace at boot time.
 *
 * Discovery scans `{plugins_path}/*\/plugin.json`. Each manifest is indexed by
 * slug. Activation registers the plugin's service provider; the SP (extending
 * PluginServiceProvider) is given its manifest and loads its own routes /
 * migrations via standard Laravel methods.
 *
 * Errors in a single plugin must not break the application. Failures are
 * reported but discovery continues for the remaining plugins.
 */
class PluginManager
{
    /** @var array<string,PluginManifest>|null */
    protected ?array $discovered = null;

    public function __construct(
        protected Application $app,
        protected PluginRepository $repository,
        protected string $pluginsPath,
    ) {}

    /**
     * @return array<string,PluginManifest>
     */
    public function discover(): array
    {
        if ($this->discovered !== null) {
            return $this->discovered;
        }

        $manifests = [];

        if (! is_dir($this->pluginsPath)) {
            return $this->discovered = $manifests;
        }

        foreach (glob($this->pluginsPath.DIRECTORY_SEPARATOR.'*'.DIRECTORY_SEPARATOR.'plugin.json') ?: [] as $manifestFile) {
            try {
                $manifest = PluginManifest::fromFile($manifestFile);
                $manifests[$manifest->slug] = $manifest;
            } catch (Throwable $e) {
                report($e);
            }
        }

        ksort($manifests);

        return $this->discovered = $manifests;
    }

    public function find(string $slug): ?PluginManifest
    {
        return $this->discover()[$slug] ?? null;
    }

    /**
     * @return array<string,PluginManifest>
     */
    public function enabled(): array
    {
        $installs = $this->repository->allForCurrent();

        return array_filter(
            $this->discover(),
            fn (PluginManifest $m) => isset($installs[$m->slug]) && $installs[$m->slug]->enabled,
        );
    }

    public function repository(): PluginRepository
    {
        return $this->repository;
    }

    public function pluginsPath(): string
    {
        return $this->pluginsPath;
    }

    /**
     * Activate all enabled plugins for the current workspace. Idempotent —
     * registering the same provider twice is a no-op in Laravel's container.
     */
    public function activateEnabled(): void
    {
        foreach ($this->enabled() as $manifest) {
            $this->activate($manifest);
        }
    }

    public function activate(PluginManifest $manifest): void
    {
        try {
            if (! $manifest->serviceProvider || ! class_exists($manifest->serviceProvider)) {
                return;
            }

            $provider = $this->app->resolveProvider($manifest->serviceProvider);

            if ($provider instanceof PluginServiceProvider) {
                $provider->setManifest($manifest);
            }

            $this->app->register($provider);
        } catch (Throwable $e) {
            report($e);
        }
    }
}
