<?php

namespace App\Enterprise;

use App\Ai\Agents\SupportAgent;
use App\Enterprise\AdvancedAi\AiToolRegistry;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

/**
 * Top-level service provider for the proprietary `enterprise/` half of the
 * codebase. Always registers the LicenseManager singleton (so OSS callers can
 * inspect license status) but only wires Enterprise feature subsystems when
 * the license is valid.
 *
 * Concrete feature subsystems (Custom AI Tools, SSO, Audit export, Branding)
 * register from inside `bootEnterpriseFeatures()` so the OSS process never
 * accidentally exposes proprietary routes/listeners on a missing key.
 */
class EnterpriseServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->mergeConfigFrom(__DIR__.'/../config/enterprise.php', 'enterprise');

        $this->app->singleton(LicenseManager::class);
    }

    public function boot(): void
    {
        // Routes are always registered. The `license` middleware on each route
        // returns 402 when the license is invalid — so the public surface is
        // consistent ("the resource exists; you can't use it without a license")
        // rather than 404 hiding the feature's existence entirely.
        $this->loadEnterpriseRoutes();

        if (! $this->app->make(LicenseManager::class)->isValid()) {
            return;
        }

        $this->bootEnterpriseFeatures();
    }

    /**
     * Hook for downstream feature groups (Group 4 plugs Custom AI Tools in
     * here). Only runs when the license is valid.
     */
    protected function bootEnterpriseFeatures(): void
    {
        $this->bootCustomAiTools();
    }

    protected function bootCustomAiTools(): void
    {
        SupportAgent::$extraToolsResolver = function ($agent) {
            return $this->app->make(AiToolRegistry::class)->toolsForAgent($agent);
        };
    }

    protected function loadEnterpriseRoutes(): void
    {
        Route::middleware(['api', 'auth:sanctum', 'license'])
            ->prefix('api/v1/admin/enterprise')
            ->group(__DIR__.'/../routes/api.php');
    }
}
