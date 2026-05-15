<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\ApiController;
use App\Models\Message;
use App\Models\MessageStar;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\Auth;

class MessageActionController extends ApiController implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('permission:messages.star', only: ['star', 'unstar']),
        ];
    }

    /**
     * Star Message
     */
    public function star(Message $message)
    {
        $user = Auth::user();

        MessageStar::firstOrCreate([
            'message_id' => $message->id,
            'user_id' => $user->id,
        ]);

        return $this->success(null, 'Message starred.');
    }

    /**
     * Unstar Message
     */
    public function unstar(Message $message)
    {
        $user = Auth::user();

        MessageStar::where('message_id', $message->id)
            ->where('user_id', $user->id)
            ->delete();

        return $this->success(null, 'Message unstarred.');
    }
}
