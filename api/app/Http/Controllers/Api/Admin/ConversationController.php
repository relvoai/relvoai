<?php

namespace App\Http\Controllers\Api\Admin;

use App\Events\ConversationUpdated;
use App\Events\ParticipantJoined;
use App\Events\ParticipantLeft;
use App\Http\Controllers\Api\ApiController;
use App\Http\Requests\StoreAgentReplyRequest;
use App\Http\Requests\TransferConversationRequest;
use App\Http\Resources\AdminConversationResource;
use App\Http\Resources\MessageResource;
use App\Jobs\Ai\SummarizeConversationJob;
use App\Models\Conversation;
use App\Models\ConversationParticipant;
use App\Models\ConversationTransfer;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\Auth;

class ConversationController extends ApiController implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('permission:conversations.view', only: ['index', 'show', 'messages']),
            new Middleware('permission:conversations.reply', only: ['reply']),
            new Middleware('permission:conversations.join_group', only: ['join']),
            new Middleware('permission:conversations.leave_group', only: ['leave']),
            new Middleware('permission:conversations.transfer', only: ['transfer']),
            new Middleware('permission:conversations.close', only: ['close']),
        ];
    }

    /**
     * List Conversations
     *
     * Get a paginated list of conversations with filters (status, assigned_to_me).
     */
    public function index(Request $request)
    {
        $query = Conversation::query()
            ->with(['visitor', 'assignedTo', 'contact'])
            ->latest('last_message_at');

        if ($request->has('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->has('assigned_to_me') && $request->boolean('assigned_to_me')) {
            $query->where('assigned_to_user_id', Auth::id());
        }

        return $this->success(AdminConversationResource::collection($query->paginate(20)));
    }

    /**
     * Get Conversation
     *
     * Get full details of a specific conversation including messages and participants.
     */
    public function show(Conversation $conversation)
    {
        return $this->success(new AdminConversationResource($conversation->load(['messages', 'visitor', 'assignedTo', 'contact'])));
    }

    /**
     * List Messages
     *
     * Get paginated messages for a conversation. Supports ?since= for polling.
     */
    public function messages(Request $request, Conversation $conversation)
    {
        $query = $conversation->messages()
            ->with(['user'])
            ->orderBy('created_at', 'asc');

        if ($request->has('since')) {
            $query->where('created_at', '>', $request->input('since'));
        }

        $messages = $query->paginate($request->integer('per_page', 50));

        return $this->success(MessageResource::collection($messages));
    }

    /**
     * Reply to Conversation
     *
     * Send an agent reply or internal note.
     */
    public function reply(StoreAgentReplyRequest $request, Conversation $conversation)
    {
        $data = $request->validated();
        $user = Auth::user();

        $message = $conversation->messages()->create([
            'user_id' => $user->id,
            'message_type' => $request->boolean('is_note') ? 'note' : 'agent',
            'body' => $data['body'],
            'format' => 'text',
            'delivered_at' => now(),
        ]);

        $conversation->update([
            'last_message_at' => now(),
            'last_message_id' => $message->id,
            'last_message_by' => $request->boolean('is_note') ? 'system' : 'agent',
            // If replied by agent, maybe set first_response_at?
            'first_response_at' => $conversation->first_response_at ?? now(),
        ]);

        return $this->success(new MessageResource($message));
    }

    /**
     * Join Conversation
     *
     * Add the current user as a participant.
     */
    public function join(Conversation $conversation)
    {
        $user = Auth::user();

        $participant = ConversationParticipant::firstOrCreate([
            'conversation_id' => $conversation->id,
            'user_id' => $user->id,
        ], [
            'joined_at' => now(),
        ]);

        broadcast(new ParticipantJoined($conversation, $participant))->toOthers();

        return $this->success(null, 'Joined conversation.');
    }

    /**
     * Leave Conversation
     *
     * Remove the current user from participants.
     */
    public function leave(Conversation $conversation)
    {
        $user = Auth::user();

        ConversationParticipant::where('conversation_id', $conversation->id)
            ->where('user_id', $user->id)
            ->delete();

        broadcast(new ParticipantLeft($conversation, $user))->toOthers();

        return $this->success(null, 'Left conversation.');
    }

    /**
     * Transfer Conversation
     *
     * Transfer conversation to another user or department.
     */
    public function transfer(TransferConversationRequest $request, Conversation $conversation)
    {
        $data = $request->validated();
        $user = Auth::user();

        // Log Transfer
        ConversationTransfer::create([
            'conversation_id' => $conversation->id,
            'from_user_id' => $conversation->assigned_to_user_id, // previous owner
            'to_user_id' => $data['to_user_id'] ?? null,
            'transferred_by_user_id' => $user->id,
            'note' => $data['note'] ?? null,
        ]);

        $updateData = [];
        if (! empty($data['to_user_id'])) {
            $updateData['assigned_to_user_id'] = $data['to_user_id'];
            $updateData['assigned_at'] = now();
            $updateData['assigned_by_user_id'] = $user->id;
        }

        // Column department_id does not exist on conversations.
        // If we want to support department transfers, we would need to add it or use tags/assignment rules.
        // For now, removing to fix error.
        /*
        if (!empty($data['to_department_id'])) {
            $updateData['department_id'] = $data['to_department_id'];
            if (empty($data['to_user_id'])) {
                $updateData['assigned_to_user_id'] = null;
            }
        }
        */

        $conversation->update($updateData);

        broadcast(new ConversationUpdated($conversation));

        return $this->success(null, 'Conversation transferred.');
    }

    /**
     * Close Conversation
     *
     * Mark the conversation as closed.
     */
    public function close(Conversation $conversation)
    {
        $conversation->update([
            'status' => 'closed',
            'closed_at' => now(),
        ]);

        SummarizeConversationJob::dispatch($conversation);
        broadcast(new ConversationUpdated($conversation));

        return $this->success(null, 'Conversation closed.');
    }
}
