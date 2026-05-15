<?php

namespace App\Http\Controllers\Api\V1\Widget;

use App\Http\Controllers\Api\ApiController;
use App\Models\Channel;
use Dedoc\Scramble\Attributes\HeaderParameter;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class WidgetConfigController extends ApiController
{
    /**
     * Get Configuration
     *
     * Retrieve the widget configuration, including UI settings, identity policy, and realtime connection details.
     * Supports caching via ETag.
     */
    #[HeaderParameter('X-Channel-Key', description: 'The public channel key (Required if not in query)', type: 'string', required: false)]
    public function __invoke(Request $request)
    {
        // 1. Resolve Channel Key
        $channelKey = $request->header('X-Channel-Key') ?? $request->query('channel_key');

        if (! $channelKey) {
            return $this->error('Channel key missing', null, 400);
        }

        // 2. Cache Key & ETag
        $cacheKey = "widget:config:{$channelKey}";
        $ttl = 300; // 5 minutes

        $configData = Cache::remember($cacheKey, $ttl, function () use ($channelKey, $ttl) {
            $channel = Channel::where('channel_key', $channelKey)->first();

            if (! $channel) {
                return null;
            }

            // Map Identity Mode
            $requireEmail = $channel->config['require_email'] ?? false;
            $preChatForm = $channel->config['pre_chat_form'] ?? false;

            $identityMode = ($requireEmail || $preChatForm) ? 'required' : 'optional';

            // Generate Config Version Hash
            $configVersion = md5(json_encode($channel->config).$identityMode);

            return [
                'widget_config' => [
                    'widget_color' => $channel->config['widget_color'] ?? '#009CE0',
                    'welcome_title' => $channel->config['welcome_title'] ?? 'Hi 👋',
                    'welcome_tagline' => $channel->config['welcome_tagline'] ?? 'How can we help?',
                ],
                'identity' => [
                    'mode' => $identityMode,
                    'fields' => [
                        'name' => true,
                        'email' => true,
                    ],
                ],
                'meta' => [
                    'config_version' => $configVersion,
                    'cache_ttl' => $ttl,
                ],
            ];
        });

        if (! $configData) {
            return $this->error('Invalid channel', null, 404);
        }

        // 3. ETag Check
        $etag = '"'.$configData['meta']['config_version'].'"';
        $requestEtag = $request->header('If-None-Match');

        if ($requestEtag && $requestEtag === $etag) {
            return response()->noContent(304);
        }

        return $this->success($configData)->header('ETag', $etag);
    }
}
