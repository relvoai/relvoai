<?php

namespace App\Observers;

use App\Events\MessageCreated;
use App\Models\Message;

class MessageObserver
{
    public function created(Message $message): void
    {
        broadcast(new MessageCreated($message));
    }
}
