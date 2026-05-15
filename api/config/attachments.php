<?php

return [
    'disk' => env('ATTACHMENTS_DISK', 'public'),

    'max_kb' => env('ATTACHMENTS_MAX_KB', 10240),

    'allowed_mimes' => array_values(array_filter(array_map('trim', explode(',', (string) env(
        'ATTACHMENTS_ALLOWED_MIMES',
        'jpg,jpeg,png,gif,webp,pdf,doc,docx,txt,csv,xls,xlsx,zip'
    ))))),
];
