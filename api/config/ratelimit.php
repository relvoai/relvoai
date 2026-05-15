<?php

return [
    'widget_bootstrap' => env('WIDGET_BOOTSTRAP_RATE_LIMIT', 30),
    'widget_message' => env('WIDGET_MESSAGE_RATE_LIMIT', 60),
    'widget_rating' => env('WIDGET_RATING_RATE_LIMIT', 10),
    'login' => env('LOGIN_RATE_LIMIT', 10),
];
