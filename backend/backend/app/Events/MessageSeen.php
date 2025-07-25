<?php
namespace App\Events;

use App\Models\Message;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Queue\SerializesModels;

class MessageSeen implements ShouldBroadcast
{
    use SerializesModels;

    public $message;

    public function __construct(Message $message)
    {
        $this->message = $message;
    }

    public function broadcastOn()
    {
        // Notify the sender
        return new PrivateChannel('private-chat.' . $this->message->sender_id);
    }

    public function broadcastWith()
    {
        return [
            'message_id' => $this->message->id,
            'seen_at' => now()->toISOString(),
        ];
    }

    public function broadcastAs()
    {
        return 'message.seen';
    }
}

