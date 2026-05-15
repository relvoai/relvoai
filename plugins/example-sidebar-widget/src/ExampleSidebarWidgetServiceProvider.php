<?php

namespace RelvoAi\Plugins\ExampleSidebarWidget;

use App\Plugins\PluginServiceProvider;

class ExampleSidebarWidgetServiceProvider extends PluginServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        $this->loadPluginRoutes();
    }
}
