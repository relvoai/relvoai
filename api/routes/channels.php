<?php

use App\Models\Conversation;
use App\Models\User;
use App\Models\Visitor;
use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
|
| Here you may register all of the event broadcasting channels that your
| application supports. The given channel authorization callbacks are
| used to check if an authenticated user can listen to the channel.
|
*/

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// Admin/Agent Global Channels
Broadcast::channel('admin.visitors', function ($user) {
    return $user instanceof User && $user->hasPermission('visitors.view_online');
});

Broadcast::channel('admin.conversations', function ($user) {
    return $user instanceof User && $user->hasPermission('conversations.view');
});

// Conversation Presence Channel (for Participants: Agents & Visitor)
Broadcast::channel('conversations.{conversationId}', function ($user, $conversationId) {
    $conversation = Conversation::find($conversationId);

    if (! $conversation) {
        return false;
    }

    // 1. If it's a User (Agent/Admin)
    if ($user instanceof User) {
        // Must have view permission OR be assigned OR be a participant
        return $user->hasPermission('conversations.view');
    }

    // 2. If it's a Visitor (Sanctum/Session guard)
    if ($user instanceof Visitor) {
        return $conversation->visitor_id === $user->id;
    }

    return false;
}, ['guards' => ['web', 'sanctum']]);
