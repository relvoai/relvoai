<?php

namespace App\Services;

class ChannelType
{
    public const WEB_CHAT = 'web_chat';

    public const TELEGRAM = 'telegram';

    public const API = 'api';

    public const WHATSAPP = 'whatsapp';

    public const EMAIL = 'email';

    public static function all(): array
    {
        return [
            self::WEB_CHAT => [
                'type' => self::WEB_CHAT,
                'label' => 'Website Chat',
                'description' => 'Add a live chat widget to your website',
                'logo_key' => 'globe-alt',
                'required_fields' => ['website_url'], // Added
                'requires_setup' => false,
                'default_config' => [
                    'website_url' => '',
                    'widget_color' => '#009CE0',
                    'welcome_title' => 'Hi there!',
                    'welcome_tagline' => 'We are here to help.',
                    'reply_time' => 'in_a_few_minutes',
                    'selected_feature_flags' => ['attachments', 'emoji_picker', 'end_conversation'],
                    'enable_email_collect' => true,
                    'continuity_via_email' => true,
                    'pre_chat_form' => [
                        'enabled' => false,
                        'pre_chat_message' => 'Share your queries or comments here.',
                        'fields' => [
                            ['name' => 'fullName', 'type' => 'text', 'label' => 'Full Name', 'required' => false, 'enabled' => false],
                            ['name' => 'emailAddress', 'type' => 'email', 'label' => 'Email Address', 'required' => true, 'enabled' => false],
                        ],
                    ],
                    'identity_validation' => [
                        'enabled' => false,
                        'hmac_mandatory' => false,
                    ],
                ],
            ],
            self::TELEGRAM => [
                'type' => self::TELEGRAM,
                'label' => 'Telegram',
                'description' => 'Connect a Telegram bot',
                'logo_key' => 'paper-airplane',
                'required_fields' => ['bot_token'], // Added
                'requires_setup' => true,
                'fields' => [
                    ['name' => 'bot_token', 'type' => 'password', 'label' => 'Bot Token', 'required' => true],
                ],
                'default_config' => [
                    'bot_name' => '',
                ],
            ],
            self::API => [
                'type' => self::API,
                'label' => 'API Channel',
                'description' => 'Build a custom integration',
                'logo_key' => 'code-bracket',
                'required_fields' => ['webhook_url'], // Added
                'requires_setup' => false,
                'default_config' => [
                    'additional_attributes' => [],
                ],
            ],
            self::WHATSAPP => [
                'type' => self::WHATSAPP,
                'label' => 'WhatsApp',
                'description' => 'Connect WhatsApp Business (Coming Soon)',
                'logo_key' => 'chat-bubble-left',
                'required_fields' => [],
                'requires_setup' => true,
                'disabled' => true,
            ],
            self::EMAIL => [
                'type' => self::EMAIL,
                'label' => 'Email',
                'description' => 'Forward emails to inbox (Coming Soon)',
                'logo_key' => 'envelope',
                'required_fields' => [],
                'requires_setup' => true,
                'disabled' => true,
            ],
        ];
    }
}
