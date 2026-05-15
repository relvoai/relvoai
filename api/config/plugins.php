<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Plugins directory
    |--------------------------------------------------------------------------
    |
    | Absolute path to the directory containing one subdirectory per plugin.
    | Each plugin directory must contain a `plugin.json` manifest.
    |
    | Defaults to the monorepo `plugins/` directory (sibling of `api/`).
    */

    'path' => env('PLUGINS_PATH', base_path('../plugins')),

    /*
    |--------------------------------------------------------------------------
    | Public asset base URL
    |--------------------------------------------------------------------------
    |
    | Where the admin SPA fetches plugin frontend bundles from. The relative
    | `frontend_bundle` from a plugin's manifest is appended.
    */

    'asset_base_url' => env('PLUGINS_ASSET_BASE_URL', '/plugins'),
];
