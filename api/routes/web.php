<?php

use App\Models\Channel;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/widget/test/{channelKey}', function (string $channelKey) {
    $channel = Channel::where('channel_key', $channelKey)->firstOrFail();

    return view('widget-test', [
        'channelKey' => $channelKey,
        'channelName' => $channel->name,
    ]);
})->name('widget.test');
