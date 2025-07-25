<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Message;
use App\Events\MessageSent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Http\Resources\MessageResource;
use App\Events\UserTyping;
use Illuminate\Support\Facades\Broadcast;




class MessageController extends Controller
{
    // Fetch messages between two users
    public function fetchMessages($receiverId)
    {
        $userId = Auth::id();
        $messages = Message::with('sender') // Add sender details
            ->conversation($userId, $receiverId)
            ->orderBy('created_at')
            ->get();

        return MessageResource::collection($messages);
    }

    // Send a new message
    public function store(Request $request)
    {
        $request->validate([
            'receiver_id' => 'required|exists:users,id',
            'content' => 'required_without:file|nullable|string',
            'file' => 'nullable|file|max:20480', // Max 20MB
        ]);

        $data = [
            'sender_id' => Auth::id(),
            'receiver_id' => $request->receiver_id,
            'content' => $request->input('content'),
            'message_type' => 'text',
            'is_read' => false,
        ];

        // File upload (optional)
        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $path = $file->store('chat_files', 'public');

            $data['file_url'] = '/storage/' . $path;
            $data['file_name'] = $file->getClientOriginalName();
            $data['file_size'] = $file->getSize();
            $data['message_type'] = 'file';
        }

        $message = Message::create($data);

        // Broadcast event
        broadcast(new MessageSent($message))->toOthers();

        return response()->json($message);
    }
    public function markAsSeen(Request $request, $senderId)
    {
        $userId = Auth::id();

        $messages = Message::where('sender_id', $senderId)
            ->where('receiver_id', $userId)
            ->whereNull('seen_at')
            ->get();

        foreach ($messages as $message) {
            $message->update(['seen_at' => now()]);

            broadcast(new \App\Events\MessageSeen($message))->toOthers();
        }

        return response()->json(['message' => 'Messages marked as seen']);
    }

    public function markAsDelivered(Request $request)
    {
        \Log::info('DELIVERED route hit', ['message_id' => $request->message_id]);
        $messageId = $request->input('message_id');

        $message = Message::find($messageId);
        if ($message && $message->delivered_at === null) {
            $message->update(['delivered_at' => now()]);
        }

        return response()->json(['message' => 'Message marked as delivered']);
    }
    public function typing(Request $request)
    {
        $senderId = auth()->id();
        $receiverId = $request->receiver_id;

        // Fire a broadcast event to the receiver's private channel
        broadcast(new UserTyping($senderId, $receiverId))->toOthers();

        return response()->json(['status' => 'typing']);
    }
    public function getConversation($userId)
    {
        $authUserId = Auth::id();

        $messages = Message::where(function ($query) use ($authUserId, $userId) {
            $query->where('sender_id', $authUserId)
                ->where('receiver_id', $userId);
        })->orWhere(function ($query) use ($authUserId, $userId) {
            $query->where('sender_id', $userId)
                ->where('receiver_id', $authUserId);
        })->orderBy('created_at', 'asc')->get();

        return MessageResource::collection($messages);
    }
    // Edit message
    public function update(Request $request, $id)
    {
        $message = Message::findOrFail($id);

        if ($message->sender_id !== auth()->id()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $request->validate([
            'content' => 'required|string|max:1000',
        ]);

        if ($request->filled('content')) {
            $message->content = $request->input('content');
            $message->save();
        }

        return response()->json($message);
    }


    // Delete message
    public function destroy($id)
    {
        $message = Message::findOrFail($id);

        if ($message->sender_id !== auth()->id() && $message->receiver_id !== auth()->id()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $message->delete(); // Or soft delete if you prefer

        return response()->json(['success' => true]);
    }

}
