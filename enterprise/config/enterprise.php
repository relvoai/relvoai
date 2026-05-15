<?php

return [
    /*
    |--------------------------------------------------------------------------
    | License key
    |--------------------------------------------------------------------------
    |
    | Set via RELVO_LICENSE_KEY. Without a valid key the Enterprise feature
    | provider does not register and license-protected routes return 402.
    | Keys prefixed `test-` are accepted in non-production environments.
    */

    'license_key' => env('RELVO_LICENSE_KEY'),
];
