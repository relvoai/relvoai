<?php

use App\Http\Controllers\Api\Admin\ActiveVisitorController;
use App\Http\Controllers\Api\Admin\AiAgentController;
use App\Http\Controllers\Api\Admin\AiCreditController;
use App\Http\Controllers\Api\Admin\AiKnowledgeController;
use App\Http\Controllers\Api\Admin\AttachmentController;
use App\Http\Controllers\Api\Admin\AuditLogController;
use App\Http\Controllers\Api\Admin\BlockedUrlController;
use App\Http\Controllers\Api\Admin\BotRuleController;
use App\Http\Controllers\Api\Admin\CannedReplyController;
use App\Http\Controllers\Api\Admin\ContactController;
use App\Http\Controllers\Api\Admin\ConversationController;
use App\Http\Controllers\Api\Admin\DepartmentController;
use App\Http\Controllers\Api\Admin\LicenseController;
use App\Http\Controllers\Api\Admin\MessageActionController;
use App\Http\Controllers\Api\Admin\PluginController;
use App\Http\Controllers\Api\Admin\RatingController;
use App\Http\Controllers\Api\Admin\ReportController;
use App\Http\Controllers\Api\Admin\RoleController;
use App\Http\Controllers\Api\Admin\SettingController;
use App\Http\Controllers\Api\Admin\UserController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\MeController;
use App\Http\Controllers\Api\V1\ChannelController;
use App\Http\Controllers\Api\V1\ChannelTypeController;
use App\Http\Controllers\Api\V1\InboxController;
use App\Http\Controllers\Api\V1\Webhook\TelegramWebhookController;
use App\Http\Controllers\Api\V1\Widget\BootstrapController;
use App\Http\Controllers\Api\V1\Widget\HeartbeatController;
use App\Http\Controllers\Api\V1\Widget\WidgetAttachmentController;
use App\Http\Controllers\Api\V1\Widget\WidgetConfigController;
use App\Http\Controllers\Api\V1\Widget\WidgetConversationController;
use App\Http\Controllers\Api\V1\Widget\WidgetMessageController;
use App\Http\Controllers\Api\V1\Widget\WidgetRatingController;
use App\Http\Controllers\Api\V1\Widget\WidgetRefreshController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {

    // Auth Routes
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:login');

    // Telegram Webhook (no auth — validated by channel_key)
    Route::post('/webhooks/telegram/{channelKey}', TelegramWebhookController::class)
        ->middleware('throttle:telegram-webhook');

    // Widget Bootstrap & Session Messages
    Route::prefix('public/widget')->group(function () {
        Route::get('/config', WidgetConfigController::class)
            ->middleware('throttle:widget-bootstrap');
        Route::post('/bootstrap', BootstrapController::class)
            ->middleware('throttle:widget-bootstrap');
        Route::post('/refresh', WidgetRefreshController::class)
            ->middleware('throttle:widget-bootstrap');
        Route::post('/sessions/heartbeat', HeartbeatController::class)
            ->middleware('throttle:widget-message');
        Route::get('/conversations', [WidgetConversationController::class, 'index'])
            ->middleware('throttle:widget-message');
        Route::post('/conversations', [WidgetConversationController::class, 'store'])
            ->middleware('throttle:widget-message');
        Route::post('/conversations/{conversation}/select', [WidgetConversationController::class, 'select'])
            ->middleware('throttle:widget-message');
        Route::get('/messages', [WidgetMessageController::class, 'index'])
            ->middleware('throttle:widget-message');
        Route::post('/messages', [WidgetMessageController::class, 'store'])
            ->middleware('throttle:widget-message');
        Route::post('/attachments', [WidgetAttachmentController::class, 'store'])
            ->middleware('throttle:widget-message');
        Route::post('/ratings', [WidgetRatingController::class, 'store'])
            ->middleware('throttle:widget-rating');
    });

    // Protected Routes
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);

        // Notification self-service
        Route::get('/me/notification-settings', [MeController::class, 'notificationSettings']);
        Route::put('/me/notification-settings', [MeController::class, 'updateNotificationSettings']);
        Route::get('/me/notifications', [MeController::class, 'notifications']);
        Route::post('/me/notifications/{id}/read', [MeController::class, 'markNotificationRead']);
        Route::post('/me/notifications/read-all', [MeController::class, 'markAllNotificationsRead']);

        // Channel Types
        Route::get('/channel-types', [ChannelTypeController::class, 'index']);

        // Inboxes
        Route::apiResource('inboxes', InboxController::class);
        Route::put('/inboxes/{inbox}/agents', [InboxController::class, 'updateAgents']);

        // Channels Management
        Route::post('/inboxes/{inbox}/channels', [ChannelController::class, 'store']);
        Route::get('/channels/{channel}', [ChannelController::class, 'show']);
        Route::put('/channels/{channel}', [ChannelController::class, 'update']);
        Route::delete('/channels/{channel}', [ChannelController::class, 'destroy']);

        // Web Channel Specific Management
        Route::get('/channels/{channel}/embed-script', [ChannelController::class, 'getEmbedScript']);
        Route::post('/channels/{channel}/rotate-hmac-secret', [ChannelController::class, 'rotateHmacSecret']);
        Route::put('/channels/{channel}/domains', [ChannelController::class, 'domains']);

        // Admin Routes
        Route::prefix('admin')->group(function () {
            // Users
            Route::apiResource('users', UserController::class);
            Route::apiResource('contacts', ContactController::class);
            Route::prefix('contacts/{contact}')->group(function () {
                Route::get('conversations', [ContactController::class, 'conversations']);
                Route::get('notes', [ContactController::class, 'notes']);
                Route::post('notes', [ContactController::class, 'storeNote']);
                Route::post('merge', [ContactController::class, 'merge']);
            });
            Route::apiResource('departments', DepartmentController::class);

            // Conversation Ops
            Route::get('conversations', [ConversationController::class, 'index']);
            Route::get('conversations/{conversation}', [ConversationController::class, 'show']);
            Route::get('conversations/{conversation}/messages', [ConversationController::class, 'messages']);
            Route::post('conversations/{conversation}/reply', [ConversationController::class, 'reply']);
            Route::post('conversations/{conversation}/attachments', [AttachmentController::class, 'store']);
            Route::post('conversations/{conversation}/join', [ConversationController::class, 'join']);
            Route::post('conversations/{conversation}/leave', [ConversationController::class, 'leave']);
            Route::post('conversations/{conversation}/transfer', [ConversationController::class, 'transfer']);
            Route::post('conversations/{conversation}/close', [ConversationController::class, 'close']);
            // Route::post('conversations/{conversation}/typing', \App\Http\Controllers\Api\V1\Widget\TypingController::class); // Removed legacy typing

            // Canned Replies
            Route::apiResource('canned-replies', CannedReplyController::class);

            // Message Actions
            Route::post('messages/{message}/star', [MessageActionController::class, 'star']);
            Route::delete('messages/{message}/star', [MessageActionController::class, 'unstar']);

            Route::get('settings', [SettingController::class, 'index'])->middleware('permission:system.settings.view');
            Route::put('settings/{key}', [SettingController::class, 'update'])->middleware('permission:system.settings.update');

            // Online Visitors
            Route::get('visitors/online', [ActiveVisitorController::class, 'index']);

            // Bot Rules
            Route::get('bot-rules', [BotRuleController::class, 'index']);
            Route::post('bot-rules', [BotRuleController::class, 'store']);
            Route::put('bot-rules/{botRule}', [BotRuleController::class, 'update']);
            Route::delete('bot-rules/{botRule}', [BotRuleController::class, 'destroy']);

            // AI
            Route::apiResource('ai-agents', AiAgentController::class);
            Route::post('ai-agents/{aiAgent}/channels/{channel}', [AiAgentController::class, 'attachChannel']);
            Route::delete('ai-agents/{aiAgent}/channels/{channel}', [AiAgentController::class, 'detachChannel']);

            Route::get('ai-agents/{aiAgent}/knowledge', [AiKnowledgeController::class, 'index']);
            Route::post('ai-agents/{aiAgent}/knowledge', [AiKnowledgeController::class, 'store']);
            Route::get('ai-agents/{aiAgent}/knowledge/{source}', [AiKnowledgeController::class, 'show']);
            Route::delete('ai-agents/{aiAgent}/knowledge/{source}', [AiKnowledgeController::class, 'destroy']);
            Route::post('ai-agents/{aiAgent}/knowledge/{source}/reindex', [AiKnowledgeController::class, 'reindex']);

            Route::get('ai-credits', [AiCreditController::class, 'index']);
            Route::post('ai-credits/grant', [AiCreditController::class, 'grant']);

            // License (Enterprise)
            Route::get('license', [LicenseController::class, 'show']);

            // Plugins
            Route::get('plugins', [PluginController::class, 'index']);
            Route::get('plugins/manifest', [PluginController::class, 'manifest']);
            Route::post('plugins/{slug}/enable', [PluginController::class, 'enable']);
            Route::post('plugins/{slug}/disable', [PluginController::class, 'disable']);

            // URL Blacklist
            Route::apiResource('blocked-urls', BlockedUrlController::class)
                ->except(['show']);

            // Audit Logs
            Route::get('audit-logs', [AuditLogController::class, 'index']);

            // Ratings
            Route::get('ratings', [RatingController::class, 'index']);

            // Roles
            Route::get('roles', [RoleController::class, 'index']);
            Route::get('roles/{role}', [RoleController::class, 'show']);

            // Reports
            Route::get('reports', [ReportController::class, 'index']);
        });
    });
});
