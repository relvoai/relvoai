<?php

namespace App\Constants;

class Permissions
{
    /**
     * Module: System
     */
    public const SYSTEM_SETTINGS_INDEX = 'system.settings.index'; // Access Settings Menu

    public const SYSTEM_SETTINGS_VIEW = 'system.settings.view';

    public const SYSTEM_SETTINGS_UPDATE = 'system.settings.update';

    public const SYSTEM_LOGS_VIEW = 'system.logs.view';

    /**
     * Module: Users & Roles
     */
    public const USERS_INDEX = 'users.index'; // Access Users Menu

    public const USERS_VIEW_ANY = 'users.view_any';

    public const USERS_CREATE = 'users.create';

    public const USERS_UPDATE = 'users.update';

    public const USERS_DELETE = 'users.delete';

    public const USERS_DEACTIVATE = 'users.deactivate';

    public const USERS_VIEW = 'users.view';

    public const ROLES_INDEX = 'roles.index'; // Access Roles Menu

    public const ROLES_VIEW_ANY = 'roles.view_any';

    public const ROLES_MANAGE = 'roles.manage';

    public const PERMISSIONS_ASSIGN = 'permissions.assign';

    public const ROLES_VIEW = 'roles.view';

    /**
     * Module: Departments
     */
    public const DEPARTMENTS_INDEX = 'departments.index'; // Access Departments Menu

    public const DEPARTMENTS_VIEW_ANY = 'departments.view_any';

    public const DEPARTMENTS_VIEW = 'departments.view';

    public const DEPARTMENTS_CREATE = 'departments.create';

    public const DEPARTMENTS_UPDATE = 'departments.update';

    public const DEPARTMENTS_DELETE = 'departments.delete';

    /**
     * Module: Inboxes
     */
    public const INBOXES_INDEX = 'inboxes.index'; // Access Inboxes Menu

    public const INBOXES_VIEW_ANY = 'inboxes.view_any';

    public const INBOXES_VIEW_OWN = 'inboxes.view_own';

    public const INBOXES_CREATE = 'inboxes.create';

    public const INBOXES_UPDATE = 'inboxes.update';

    public const INBOXES_DELETE = 'inboxes.delete';

    public const INBOXES_MANAGE_AGENTS = 'inboxes.manage_agents';

    public const INBOXES_VIEW = 'inboxes.view';

    /**
     * Module: Channels
     */
    public const CHANNELS_INDEX = 'channels.index'; // Access Channels Menu

    public const CHANNELS_VIEW_ANY = 'channels.view_any';

    public const CHANNELS_MANAGE = 'channels.manage';

    public const CHANNELS_API_KEYS_MANAGE = 'channels.api_keys.manage';

    public const CHANNELS_VIEW = 'channels.view';

    /**
     * Module: Conversations
     */
    public const CONVERSATIONS_INDEX = 'conversations.index'; // Access Conversations Menu

    public const CONVERSATIONS_VIEW_ANY = 'conversations.view_any';

    public const CONVERSATIONS_VIEW_OWN = 'conversations.view_own';

    public const CONVERSATIONS_CREATE = 'conversations.create';

    public const CONVERSATIONS_REPLY = 'conversations.reply';

    public const CONVERSATIONS_NOTE = 'conversations.note';

    public const CONVERSATIONS_ASSIGN = 'conversations.assign';

    public const CONVERSATIONS_TRANSFER = 'conversations.transfer';

    public const CONVERSATIONS_RESOLVE = 'conversations.resolve';

    public const CONVERSATIONS_CLOSE = 'conversations.close';

    public const CONVERSATIONS_REOPEN = 'conversations.reopen';

    public const CONVERSATIONS_JOIN_GROUP = 'conversations.join_group';

    public const CONVERSATIONS_LEAVE_GROUP = 'conversations.leave_group';

    public const CONVERSATIONS_MANAGE_TAGS = 'conversations.manage_tags';

    public const CONVERSATIONS_DELETE_MESSAGES = 'conversations.delete_messages'; // Admin override

    public const CONVERSATIONS_VIEW = 'conversations.view';

    /**
     * Module: Messages
     */
    public const MESSAGES_STAR = 'messages.star';

    /**
     * Module: Canned Replies
     */
    public const CANNED_REPLIES_INDEX = 'canned_replies.index'; // Access Replies Menu

    public const CANNED_REPLIES_VIEW_ANY = 'canned_replies.view_any';

    public const CANNED_REPLIES_VIEW_OWN = 'canned_replies.view_own';

    public const CANNED_REPLIES_CREATE = 'canned_replies.create';

    public const CANNED_REPLIES_UPDATE = 'canned_replies.update';

    public const CANNED_REPLIES_DELETE = 'canned_replies.delete';

    public const CANNED_REPLIES_MANAGE_SHARED = 'canned_replies.manage_shared';

    public const CANNED_REPLIES_VIEW = 'canned_replies.view';

    /**
     * Module: Visitors & Contacts (CRM)
     */
    public const VISITORS_INDEX = 'visitors.index'; // Access Visitors Menu

    public const VISITORS_VIEW_ANY = 'visitors.view_any'; // Live visitor list

    public const VISITORS_VIEW_ONLINE = 'visitors.view_online';

    public const VISITORS_VIEW = 'visitors.view';

    public const CONTACTS_INDEX = 'contacts.index'; // Access Contacts Menu

    public const CONTACTS_VIEW_ANY = 'contacts.view_any'; // Contact list

    public const CONTACTS_VIEW = 'contacts.view';

    public const CONTACTS_CREATE = 'contacts.create';

    public const CONTACTS_UPDATE = 'contacts.update';

    public const CONTACTS_DELETE = 'contacts.delete';

    /**
     * Module: Reports & Analytics
     */
    public const REPORTS_INDEX = 'reports.index'; // Access Reports Menu

    public const REPORTS_VIEW = 'reports.view';

    public const REPORTS_VIEW_ALL = 'reports.view_all';

    public const REPORTS_EXPORT = 'reports.export';

    /**
     * Module: Automations & Bot
     */
    public const AUTOMATIONS_INDEX = 'automations.index'; // Access Automations Menu

    public const AUTOMATIONS_MANAGE = 'automations.manage';

    public const BOT_RULES_MANAGE = 'bot_rules.manage';

    /**
     * Module: Security & Compliance
     */
    public const SECURITY_INDEX = 'security.index'; // Access Security Menu

    public const BLOCKED_URLS_MANAGE = 'blocked_urls.manage';

    public const AUDIT_LOGS_VIEW = 'audit_logs.view';

    /**
     * Module: AI
     */
    public const AI_AGENTS_MANAGE = 'ai.agents.manage';

    public const AI_KNOWLEDGE_MANAGE = 'ai.knowledge.manage';

    public const AI_CREDITS_MANAGE = 'ai.credits.manage';

    /**
     * Get all defined permissions.
     */
    public static function all(): array
    {
        return [
            self::SYSTEM_SETTINGS_INDEX,
            self::SYSTEM_SETTINGS_VIEW,
            self::SYSTEM_SETTINGS_UPDATE,
            self::SYSTEM_LOGS_VIEW,

            self::USERS_INDEX,
            self::USERS_VIEW_ANY,
            self::USERS_CREATE,
            self::USERS_UPDATE,
            self::USERS_DELETE,
            self::USERS_DEACTIVATE,

            self::ROLES_INDEX,
            self::ROLES_VIEW_ANY,
            self::ROLES_MANAGE,
            self::PERMISSIONS_ASSIGN,

            self::DEPARTMENTS_INDEX,
            self::DEPARTMENTS_VIEW_ANY,
            self::DEPARTMENTS_VIEW,
            self::DEPARTMENTS_CREATE,
            self::DEPARTMENTS_UPDATE,
            self::DEPARTMENTS_DELETE,

            self::INBOXES_INDEX,
            self::INBOXES_VIEW_ANY,
            self::INBOXES_VIEW_OWN,
            self::INBOXES_CREATE,
            self::INBOXES_UPDATE,
            self::INBOXES_DELETE,
            self::INBOXES_MANAGE_AGENTS,

            self::CHANNELS_INDEX,
            self::CHANNELS_VIEW_ANY,
            self::CHANNELS_MANAGE,
            self::CHANNELS_API_KEYS_MANAGE,

            self::CONVERSATIONS_INDEX,
            self::CONVERSATIONS_VIEW_ANY,
            self::CONVERSATIONS_VIEW_OWN,
            self::CONVERSATIONS_CREATE,
            self::CONVERSATIONS_REPLY,
            self::CONVERSATIONS_NOTE,
            self::CONVERSATIONS_ASSIGN,
            self::CONVERSATIONS_TRANSFER,
            self::CONVERSATIONS_RESOLVE,
            self::CONVERSATIONS_CLOSE,
            self::CONVERSATIONS_REOPEN,
            self::CONVERSATIONS_JOIN_GROUP,
            self::CONVERSATIONS_LEAVE_GROUP,
            self::CONVERSATIONS_MANAGE_TAGS,
            self::CONVERSATIONS_DELETE_MESSAGES,

            self::MESSAGES_STAR,

            self::CANNED_REPLIES_INDEX,
            self::CANNED_REPLIES_VIEW_ANY,
            self::CANNED_REPLIES_VIEW_OWN,
            self::CANNED_REPLIES_CREATE,
            self::CANNED_REPLIES_UPDATE,
            self::CANNED_REPLIES_DELETE,
            self::CANNED_REPLIES_MANAGE_SHARED,

            self::VISITORS_INDEX,
            self::VISITORS_VIEW_ANY,
            self::VISITORS_VIEW_ONLINE,

            self::CONTACTS_INDEX,
            self::CONTACTS_VIEW_ANY,
            self::CONTACTS_CREATE,
            self::CONTACTS_UPDATE,
            self::CONTACTS_DELETE,

            self::REPORTS_INDEX,
            self::REPORTS_VIEW,
            self::REPORTS_VIEW_ALL,
            self::REPORTS_EXPORT,

            self::AUTOMATIONS_INDEX,
            self::AUTOMATIONS_MANAGE,
            self::BOT_RULES_MANAGE,

            self::SECURITY_INDEX,
            self::BLOCKED_URLS_MANAGE,
            self::AUDIT_LOGS_VIEW,

            self::AI_AGENTS_MANAGE,
            self::AI_KNOWLEDGE_MANAGE,
            self::AI_CREDITS_MANAGE,

            self::USERS_VIEW,
            self::ROLES_VIEW,
            self::INBOXES_VIEW,
            self::CHANNELS_VIEW,
            self::CONVERSATIONS_VIEW,
            self::CANNED_REPLIES_VIEW,
            self::VISITORS_VIEW,
            self::CONTACTS_VIEW,
        ];
    }

    /**
     * Default permissions for the 'Agent' role.
     */
    public static function getAgentPermissions(): array
    {
        return [
            self::INBOXES_INDEX,
            self::INBOXES_VIEW_OWN,

            self::CHANNELS_INDEX,
            self::CHANNELS_VIEW_ANY,

            self::CONVERSATIONS_INDEX,
            self::CONVERSATIONS_VIEW,
            self::CONVERSATIONS_VIEW_OWN,
            self::CONVERSATIONS_REPLY,
            self::CONVERSATIONS_NOTE,
            self::CONVERSATIONS_ASSIGN,
            self::CONVERSATIONS_TRANSFER,
            self::CONVERSATIONS_RESOLVE,
            self::CONVERSATIONS_CLOSE,
            self::CONVERSATIONS_REOPEN,
            self::CONVERSATIONS_JOIN_GROUP,
            self::CONVERSATIONS_LEAVE_GROUP,
            self::CONVERSATIONS_MANAGE_TAGS,

            self::MESSAGES_STAR,

            self::VISITORS_INDEX,
            self::VISITORS_VIEW_ANY,
            self::VISITORS_VIEW_ONLINE,

            self::CONTACTS_INDEX,
            self::CONTACTS_VIEW_ANY,
            self::CONTACTS_CREATE,
            self::CONTACTS_UPDATE,

            self::CANNED_REPLIES_INDEX,
            self::CANNED_REPLIES_VIEW,
            self::CANNED_REPLIES_VIEW_ANY,
            self::CANNED_REPLIES_VIEW_OWN,
            self::CANNED_REPLIES_CREATE,
            self::CANNED_REPLIES_UPDATE,
            self::CANNED_REPLIES_DELETE,
        ];
    }
}
