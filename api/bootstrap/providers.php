<?php

use App\Enterprise\EnterpriseServiceProvider;
use App\Providers\AppServiceProvider;
use App\Providers\PluginsServiceProvider;
use App\Providers\TelescopeServiceProvider;

return [
    AppServiceProvider::class,
    PluginsServiceProvider::class,
    EnterpriseServiceProvider::class,
    TelescopeServiceProvider::class,
];
