<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\ApiController;
use App\Plugins\PluginManager;
use App\Plugins\PluginManifest;
use App\Plugins\PluginRepository;
use Illuminate\Http\JsonResponse;

class PluginController extends ApiController
{
    public function __construct(
        protected PluginManager $manager,
        protected PluginRepository $repository,
    ) {}

    /**
     * List Plugins
     *
     * Returns every discovered plugin alongside its per-workspace enabled state.
     */
    public function index(): JsonResponse
    {
        $installs = $this->repository->allForCurrent();

        $payload = array_values(array_map(function (PluginManifest $m) use ($installs) {
            $install = $installs[$m->slug] ?? null;

            return $m->toArray() + [
                'enabled' => $install?->enabled ?? false,
                'installed_version' => $install?->version,
            ];
        }, $this->manager->discover()));

        return $this->success($payload);
    }

    /**
     * Enable Plugin
     */
    public function enable(string $slug): JsonResponse
    {
        $manifest = $this->manager->find($slug);

        if (! $manifest) {
            return $this->notFound("Plugin {$slug} not found.");
        }

        $this->repository->enable($manifest);

        return $this->success(['enabled' => true]);
    }

    /**
     * Disable Plugin
     */
    public function disable(string $slug): JsonResponse
    {
        if (! $this->manager->find($slug)) {
            return $this->notFound("Plugin {$slug} not found.");
        }

        $this->repository->disable($slug);

        return $this->success(['enabled' => false]);
    }

    /**
     * Frontend Manifest
     *
     * Lists enabled plugins + their frontend bundle URLs for the admin SPA to
     * boot dynamically.
     */
    public function manifest(): JsonResponse
    {
        $base = (string) config('plugins.asset_base_url', '/plugins');

        $payload = array_values(array_map(function (PluginManifest $m) use ($base) {
            $bundle = $m->frontendBundle
                ? rtrim($base, '/').'/'.ltrim($m->slug.'/'.$m->frontendBundle, '/')
                : null;

            return [
                'slug' => $m->slug,
                'name' => $m->name,
                'version' => $m->version,
                'bundle' => $bundle,
                'capabilities' => $m->capabilities,
            ];
        }, $this->manager->enabled()));

        return $this->success($payload);
    }
}
