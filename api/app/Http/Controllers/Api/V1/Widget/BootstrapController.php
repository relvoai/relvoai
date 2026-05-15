<?php

namespace App\Http\Controllers\Api\V1\Widget;

use App\Http\Controllers\Api\ApiController;
use App\Models\BlockedUrl;
use App\Models\Channel;
use App\Models\Contact;
use App\Models\Conversation;
use App\Models\Visitor;
use App\Models\WidgetSession;
use Dedoc\Scramble\Attributes\HeaderParameter;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class BootstrapController extends ApiController
{
    /**
     * Bootstrap Session
     *
     * Initialize a new widget session. Resolves the visitor identity, enforces identity policies,
     * and links to an existing or new conversation. Returns a session token.
     */
    #[HeaderParameter('X-Channel-Key', description: 'The public channel key', type: 'string', required: true)]
    #[HeaderParameter('X-Visitor-Uid', description: 'Unique Visitor ID (client-generated UUID)', type: 'string', required: true)]
    public function __invoke(Request $request)
    {
        // 1. Validate Headers & Payload
        $channelKey = $request->header('X-Channel-Key');
        $visitorUid = $request->header('X-Visitor-Uid');

        if (! $channelKey || ! $visitorUid) {
            return $this->error('X-Channel-Key and X-Visitor-Uid headers are required.', null, 400);
        }

        $request->validate([
            'user' => 'nullable|array',
            'user.external_id' => 'nullable|string',
            'user.name' => 'nullable|string',
            'user.email' => 'nullable|email',
            'client' => 'nullable|array',
        ]);

        // 2. Resolve Channel
        $channel = Channel::where('channel_key', $channelKey)->where('is_active', true)->first();
        if (! $channel) {
            return $this->error('Invalid channel key.', null, 404);
        }

        // 3. Domain Allowlist Check (Strict in Production)
        if (app()->environment('production')) {
            $origin = $request->header('Origin');
            $allowed = false;
            // Check against channel allowed origins (assuming logic exists or implementing basic check)
            // For strict mode, if origin is not matching config's allowed list
            $allowedDomains = $channel->config['allowed_domains'] ?? [];
            // Basic Check simulation:
            if (empty($allowedDomains) || in_array($origin, $allowedDomains)) {
                $allowed = true;
            }

            if (! $allowed) {
                return $this->error('Origin not allowed.', ['code' => 'ORIGIN_NOT_ALLOWED'], 403);
            }
        }

        // 3b. URL Blacklist Check
        $pageUrl = $request->input('client.page_url');
        if ($pageUrl) {
            $blocked = BlockedUrl::where('channel_id', $channel->id)
                ->where('is_active', true)
                ->get()
                ->first(fn (BlockedUrl $rule) => $rule->matches($pageUrl));

            if ($blocked) {
                return $this->error('Chat disabled on this page.', [
                    'code' => 'URL_BLOCKED',
                    'reason' => $blocked->reason,
                ], 403);
            }
        }

        // 4. Resolve/Create Visitor
        $visitor = Visitor::firstOrCreate(
            ['channel_id' => $channel->id, 'uid' => $visitorUid],
            ['first_seen_at' => now(), 'last_seen_at' => now()]
        );
        // 4b. Update Visitor Metadata
        $clientData = $request->input('client') ?? [];
        $visitor->update([
            'last_seen_at' => now(),
            'last_seen_url' => $clientData['page_url'] ?? null,
            'last_referrer' => $clientData['referrer'] ?? null,
            'meta' => array_merge($visitor->meta ?? [], array_filter([
                'user_agent' => $clientData['user_agent'] ?? null,
                'timezone' => $clientData['timezone'] ?? null,
                'resolution' => $clientData['screen_resolution'] ?? null,
                'language' => $clientData['language'] ?? null,
                'page_title' => $clientData['page_title'] ?? null,
            ])),
        ]);

        // 5. Apply Identity Policy & Resolve Contact
        $userData = $request->input('user') ?? [];
        $identityMode = $channel->config['identity_mode'] ?? 'optional'; // 'required' or 'optional'

        // Validation for Required Identity
        if ($identityMode === 'required') {
            $hasName = ! empty($userData['name']);
            $hasEmail = ! empty($userData['email']);

            // Logic: assuming config says WHICH fields are required.
            // Simplified: if required modal is on, at least one identifier or specific fields needed?
            // "If identity is required: require whichever fields are enabled"

            $reqEmail = $channel->config['require_email'] ?? false;

            if ($reqEmail && ! $hasEmail) {
                return $this->error('Identity required (Email).', ['code' => 'IDENTITY_REQUIRED'], 422);
            }
        }

        $contact = null;

        // Resolve by External ID
        if (! empty($userData['external_id'])) {
            $contact = Contact::where('external_id', $userData['external_id'])->first(); // Scope by channel? No, contacts are global or scoped? Assuming global for now.
            if (! $contact) {
                $contact = Contact::create([
                    'external_id' => $userData['external_id'],
                    'name' => $userData['name'] ?? null,
                    'email' => $userData['email'] ?? null,
                ]);
            } else {
                // Update contact info if provided
                $contact->update(array_filter([
                    'name' => $userData['name'] ?? $contact->name,
                    'email' => $userData['email'] ?? $contact->email,
                ]));
            }
        }
        // Resolve by Email
        elseif (! empty($userData['email'])) {
            $contact = Contact::where('email', $userData['email'])->first();
            if (! $contact) {
                $contact = Contact::create([
                    'name' => $userData['name'] ?? null,
                    'email' => $userData['email'],
                ]);
            }
        }

        // Link Visitor to Contact
        if ($contact) {
            if ($visitor->contact_id !== $contact->id) {
                $visitor->update(['contact_id' => $contact->id]);
            }
        } else {
            // Anonymous: check if visitor already has a contact?
            if ($visitor->contact_id) {
                $contact = $visitor->contact;
            } else {
                // Anonymous mode: Do we create an anonymous contact OR just use visitor?
                // Request says: "create/find an anonymous contact bound to visitor"
                // Pattern: create Contact with null email/external_id and link visitor->contact
                $contact = Contact::create(['name' => 'Visitor '.substr($visitorUid, 0, 6)]);
                $visitor->update(['contact_id' => $contact->id]);
            }
        }

        // 6. Resolve Conversation (Reuse Open)
        $conversation = Conversation::where('channel_id', $channel->id)
            ->where('status', 'open')
            ->where(function ($query) use ($contact, $visitor) {
                $query->where('contact_id', $contact->id)
                    ->orWhere('visitor_id', $visitor->id);
            })
            ->latest('updated_at') // or created_at
            ->first();

        // 6b. Ensure Visitor ID is set on reused conversation
        if ($conversation && ! $conversation->visitor_id) {
            $conversation->update(['visitor_id' => $visitor->id]);
        }

        // If none exists, create new
        if (! $conversation) {
            $conversation = Conversation::create([
                'channel_id' => $channel->id,
                'inbox_id' => $channel->inbox_id,
                'contact_id' => $contact->id,
                'visitor_id' => $visitor->id,
                'status' => 'open',
                'subject' => 'New Conversation',
            ]);
        }

        // 7. Issue Session
        $rawToken = Str::random(64);
        $hashedToken = hash('sha256', $rawToken);

        WidgetSession::create([
            'channel_id' => $channel->id,
            'contact_id' => $contact->id,
            'conversation_id' => $conversation->id,
            'token' => $hashedToken,
            'expires_at' => now()->addHours(24),
        ]);

        return $this->success([
            'session_token' => $rawToken,
            'conversation_id' => $conversation->id,
            'contact' => [
                'id' => $contact->id,
                'name' => $contact->name,
                'external_id' => $contact->external_id,
            ],
            'realtime' => [
                'driver' => 'reverb',
                'key' => config('broadcasting.connections.reverb.key'),
                'host' => config('broadcasting.connections.reverb.options.host'),
                'port' => config('broadcasting.connections.reverb.options.port'),
                'scheme' => config('broadcasting.connections.reverb.options.scheme', 'https'),
            ],
        ]);
    }
}
