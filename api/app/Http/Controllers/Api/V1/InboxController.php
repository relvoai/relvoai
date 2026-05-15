<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Channel;
use App\Models\Inbox;
use App\Services\ChannelType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class InboxController extends Controller
{
    /**
     * List Inboxes
     */
    public function index(Request $request)
    {
        $user = $request->user();

        // If Admin, show all. If Agent, show assigned.
        $query = Inbox::query()->withCount(['channels', 'agents'])->with('channels');

        if (! $user->hasRole('admin')) {
            $query->whereHas('agents', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            });
        }

        return response()->json([
            'success' => true,
            'data' => $query->latest()->get(),
            'message' => null,
        ]);
    }

    /**
     * Create Inbox + Channel (Atomic)
     *
     * Creates an Inbox and its primary Channel in a single atomic operation.
     *
     * @param  object  $inbox.working_hours
     * @param  object  $inbox.csat_config
     * @param  object  $inbox.auto_assignment_config
     * @param  object  $channel.config  Channel configuration object
     *
     * @response status=201 scenario="Success" {
     *   "success": true,
     *   "data": {
     *     "inbox": {
     *       "id": "uuid",
     *       "name": "My Inbox"
     *     },
     *     "channel": {
     *       "id": "uuid",
     *       "type": "web_chat",
     *       "config": {}
     *     }
     *   },
     *   "message": "Inbox created."
     * }
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'inbox.name' => 'required|string|max:255',
            'inbox.timezone' => 'nullable|string|max:50',
            'inbox.greeting_enabled' => 'boolean',
            'inbox.greeting_message' => 'nullable|string',

            'channel.type' => ['required', Rule::in(array_keys(ChannelType::all()))],
            'channel.name' => 'required|string|max:255',
            'channel.webhook_url' => 'nullable|url',
            'channel.config' => 'nullable|array',
            'channel.hmac_mandatory' => 'boolean',
        ]);

        $result = DB::transaction(function () use ($validated, $request) {
            // 1. Create Inbox
            $inbox = Inbox::create([
                'name' => $validated['inbox']['name'],
                'timezone' => $validated['inbox']['timezone'] ?? 'UTC',
                'greeting_enabled' => $validated['inbox']['greeting_enabled'] ?? false,
                'greeting_message' => $validated['inbox']['greeting_message'] ?? null,
            ]);

            // 2. Prepare Channel Data
            $channelType = $validated['channel']['type'];
            $defaultConfig = ChannelType::all()[$channelType]['default_config'] ?? [];
            $inputConfig = $validated['channel']['config'] ?? [];

            $channelData = [
                'inbox_id' => $inbox->id,
                'type' => $channelType,
                'name' => $validated['channel']['name'],
                'webhook_url' => $validated['channel']['webhook_url'] ?? null,
                'config' => array_replace_recursive($defaultConfig, $inputConfig),
            ];

            // 3. Generate Identifiers/Secrets based on Type
            if ($channelType === ChannelType::WEB_CHAT) {
                $channelData['channel_key'] = (string) Str::uuid();
                // Check if Identity validation enabled in config
                if (! empty($channelData['config']['identity_validation']['enabled'])) {
                    $channelData['hmac_mandatory'] = $channelData['config']['identity_validation']['hmac_mandatory'] ?? false;
                    $channelData['hmac_secret'] = Str::random(32);
                }
            } elseif ($channelType === ChannelType::API) {
                $channelData['inbox_identifier'] = (string) Str::uuid();
                $channelData['hmac_mandatory'] = $validated['channel']['hmac_mandatory'] ?? true;
                $channelData['hmac_secret'] = Str::random(32);
            }

            // 4. Create Channel
            $channel = Channel::create($channelData);

            // 5. Assign Creator
            $inbox->agents()->attach($request->user()->id);

            return ['inbox' => $inbox->fresh(), 'channel' => $channel->fresh()];
        });

        return response()->json([
            'success' => true,
            'data' => $result,
            'message' => 'Inbox created.',
        ], 201);
    }

    /**
     * Show Inbox
     */
    public function show(Inbox $inbox)
    {
        // Authorization check recommended here (policy)
        $inbox->load(['channels', 'agents']);

        return response()->json([
            'success' => true,
            'data' => $inbox,
            'message' => null,
        ]);
    }

    /**
     * Update Inbox (Common Settings)
     */
    public function update(Request $request, Inbox $inbox)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'is_active' => 'sometimes|boolean',
            'greeting_enabled' => 'sometimes|boolean',
            'greeting_message' => 'nullable|string',
            'working_hours_enabled' => 'sometimes|boolean',
            'timezone' => 'nullable|string|max:50',
            'out_of_office_message' => 'nullable|string',
            'working_hours' => 'nullable|array',
            'csat_survey_enabled' => 'sometimes|boolean',
            'csat_config' => 'nullable|array',
            'enable_auto_assignment' => 'sometimes|boolean',
            'auto_assignment_config' => 'nullable|array',
            'allow_messages_after_resolved' => 'sometimes|boolean',
            'lock_to_single_conversation' => 'sometimes|boolean',
            'sender_name_type' => 'sometimes|string|in:friendly,professional',
            'business_name' => 'nullable|string|max:255',
            'callback_webhook_url' => 'nullable|url',
        ]);

        $inbox->update($validated);

        return response()->json([
            'success' => true,
            'data' => $inbox,
            'message' => 'Inbox updated.',
        ]);
    }

    /**
     * Update Agents
     */
    public function updateAgents(Request $request, Inbox $inbox)
    {
        $validated = $request->validate([
            'agent_ids' => 'required|array',
            'agent_ids.*' => 'exists:users,id',
        ]);

        $inbox->agents()->sync($validated['agent_ids']);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $inbox->id,
                'agents_count' => $inbox->agents()->count(),
                'agents' => $inbox->agents,
            ],
            'message' => 'Agents updated.',
        ]);
    }

    /**
     * Delete Inbox
     */
    public function destroy(Inbox $inbox)
    {
        $inbox->delete();

        return response()->json([
            'success' => true,
            'data' => null,
            'message' => 'Inbox deleted.',
        ]);
    }
}
