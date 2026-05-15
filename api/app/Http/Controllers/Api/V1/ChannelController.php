<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Channel;
use App\Models\Inbox;
use App\Models\Workspace;
use App\Services\ChannelType;
use App\Services\Telegram\TelegramService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class ChannelController extends Controller
{
    /**
     * Store Channel in Inbox
     */
    /**
     * Store Channel in Inbox
     *
     * @param  object  $config  Channel configuration object
     */
    public function store(Request $request, Inbox $inbox)
    {
        $validated = $request->validate([
            'type' => ['required', Rule::in(array_keys(ChannelType::all()))],
            'name' => 'required|string|max:255',
            'webhook_url' => 'nullable|url',
            'config' => 'nullable|array',
        ]);

        $channelData = [
            'inbox_id' => $inbox->id,
            'type' => $validated['type'],
            'name' => $validated['name'],
            'webhook_url' => $validated['webhook_url'] ?? null,
            'config' => $validated['config'] ?? [],
            'is_active' => true,
        ];

        // Generate Identifiers based on Type
        if ($channelData['type'] === ChannelType::WEB_CHAT) {
            $channelData['channel_key'] = Channel::generateUniqueKey();
            if (! empty($channelData['config']['identity_validation']['enabled'])) {
                $channelData['hmac_secret'] = Str::random(32);
            }
        } elseif ($channelData['type'] === ChannelType::API) {
            $channelData['inbox_identifier'] = (string) Str::uuid();
            $channelData['hmac_mandatory'] = true;
            $channelData['hmac_secret'] = Str::random(32);
        } elseif ($channelData['type'] === ChannelType::TELEGRAM) {
            $botToken = $channelData['config']['bot_token'] ?? null;
            if (! $botToken) {
                return response()->json([
                    'success' => false,
                    'message' => 'Bot token is required for Telegram channels.',
                ], 422);
            }

            $telegram = app(TelegramService::class);
            $botInfo = $telegram->getMe($botToken);
            if (! $botInfo['ok']) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid Telegram bot token.',
                ], 422);
            }

            $channelData['channel_key'] = Channel::generateUniqueKey();
            $channelData['config'] = array_merge($channelData['config'], [
                'bot_username' => $botInfo['username'],
                'bot_name' => $botInfo['first_name'],
            ]);
        }

        $channel = Channel::create($channelData);

        // Register Telegram webhook after channel creation
        if ($channel->type === ChannelType::TELEGRAM) {
            $webhookUrl = rtrim(config('app.url'), '/').'/api/v1/webhooks/telegram/'.$channel->channel_key;
            $telegram = app(TelegramService::class);
            $telegram->setWebhook($channel->config['bot_token'], $webhookUrl);
            $channel->update(['webhook_url' => $webhookUrl]);
        }

        return response()->json([
            'success' => true,
            'data' => $channel->fresh(),
            'message' => 'Channel created.',
        ], 201);
    }

    /**
     * Show Channel Settings
     */
    public function show(Channel $channel)
    {
        $data = $channel->toArray();
        // Mask Secret
        $data['hmac_secret'] = $channel->hmac_secret ? '****' : null;

        return response()->json([
            'success' => true,
            'data' => $data,
            'message' => null,
        ]);
    }

    /**
     * Update Channel
     *
     * @param  object  $config  Channel configuration object
     */
    public function update(Request $request, Channel $channel)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'is_active' => 'sometimes|boolean',
            'hmac_mandatory' => 'sometimes|boolean',
            'webhook_url' => 'nullable|url',
            'config' => 'sometimes|array',
        ]);

        $channel->update($validated);

        $data = $channel->fresh()->toArray();
        $data['hmac_secret'] = $channel->hmac_secret ? '****' : null;

        return response()->json([
            'success' => true,
            'data' => $data,
            'message' => 'Channel updated.',
        ]);
    }

    /**
     * Sync Allowed Domains (Web Chat)
     */
    public function domains(Request $request, Channel $channel)
    {
        if ($channel->type !== ChannelType::WEB_CHAT) {
            abort(400, 'Domains only available for web_chat');
        }

        $validated = $request->validate([
            'domains' => 'required|array',
            'domains.*' => 'required|string|max:255',
        ]);

        // Wipe and Re-insert
        // Assuming relationship `domains()` exists on Channel model.
        // Need to ensure Channel model has hasMany relationship to ChannelDomain or similar.
        DB::transaction(function () use ($channel, $validated) {
            DB::table('channel_domains')->where('channel_id', $channel->id)->delete();

            $uniqueDomains = array_unique($validated['domains']);
            $workspaceId = Workspace::current()->id;
            $insertData = [];
            foreach ($uniqueDomains as $domain) {
                $insertData[] = [
                    'id' => (string) Str::uuid(),
                    'workspace_id' => $workspaceId,
                    'channel_id' => $channel->id,
                    'domain' => $domain,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }

            if (! empty($insertData)) {
                DB::table('channel_domains')->insert($insertData);
            }
        });

        return response()->json([
            'success' => true,
            'data' => [
                'channel' => $channel,
                'domains' => $validated['domains'],
            ],
            'message' => 'Domains updated.',
        ]);
    }

    /**
     * Get Embed Script (Web only)
     * Generates script dynamically
     */
    public function getEmbedScript(Channel $channel)
    {
        if ($channel->type !== ChannelType::WEB_CHAT) {
            abort(400, 'Embed script only available for web_chat');
        }

        $baseUrl = config('app.url');
        $script = "
<script>
  (function(d,t) {
    var BASE_URL=\"$baseUrl\";
    var g=d.createElement(t),s=d.getElementsByTagName(t)[0];
    g.src=BASE_URL+\"/js/widget.js\";
    g.defer = true;
    g.async = true;
    s.parentNode.insertBefore(g,s);
    g.onload=function(){
      window.relvoSDK.run({
        websiteToken: '{$channel->channel_key}',
        baseUrl: BASE_URL
      })
    }
  })(document,'script');
</script>
        ";

        return response()->json([
            'success' => true,
            'data' => ['script' => trim($script)],
            'message' => null,
        ]);
    }

    /**
     * Rotate HMAC Secret
     */
    public function rotateHmacSecret(Channel $channel)
    {
        $channel->update([
            'hmac_secret' => Str::random(32),
        ]);

        $data = $channel->fresh()->toArray();
        $data['hmac_secret'] = '****';

        return response()->json([
            'success' => true,
            'data' => $data,
            'message' => 'Secret rotated.',
        ]);
    }

    /**
     * Delete Channel
     */
    public function destroy(Channel $channel)
    {
        // Remove Telegram webhook before deleting
        if ($channel->type === ChannelType::TELEGRAM) {
            $botToken = $channel->config['bot_token'] ?? null;
            if ($botToken) {
                app(TelegramService::class)->deleteWebhook($botToken);
            }
        }

        $channel->delete();

        return response()->json([
            'success' => true,
            'data' => null,
            'message' => 'Channel deleted.',
        ]);
    }
}
