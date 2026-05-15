<?php

namespace Database\Seeders;

use App\Models\Ai\AiAgent;
use App\Models\Ai\AiKnowledgeSource;
use App\Models\Channel;
use App\Models\Contact;
use App\Models\Conversation;
use App\Models\Inbox;
use App\Models\Message;
use App\Models\User;
use App\Models\Visitor;
use App\Models\Workspace;
use App\Services\ChannelType;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Populates a fully realistic demo dataset so a fresh install can be shown
 * off without a manual click-around. Idempotent — re-running it from a
 * clean DB produces the same result; on a dirty DB it tops up missing rows.
 */
class DemoSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(WorkspaceSeeder::class);
        $this->call(RolesAndPermissionsSeeder::class);

        Workspace::clearResolvedCurrent();

        $owner = User::firstOrCreate(
            ['email' => 'demo-owner@example.com'],
            [
                'first_name' => 'Demo',
                'last_name' => 'Owner',
                'username' => 'demo_owner',
                'password' => bcrypt('password'),
                'is_active' => true,
            ],
        );
        if (! $owner->hasRole('admin')) {
            $owner->addRole('admin');
        }

        $agents = collect([
            ['demo-agent-1@example.com', 'Alex', 'Agent'],
            ['demo-agent-2@example.com', 'Sam', 'Agent'],
        ])->map(function (array $row) {
            [$email, $first, $last] = $row;
            $user = User::firstOrCreate(['email' => $email], [
                'first_name' => $first,
                'last_name' => $last,
                'username' => Str::slug($first.' '.$last, '_'),
                'password' => bcrypt('password'),
                'is_active' => true,
            ]);
            if (! $user->hasRole('agent')) {
                $user->addRole('agent');
            }

            return $user;
        });

        $inbox = Inbox::firstOrCreate(
            ['name' => 'Demo Support'],
            ['is_active' => true, 'greeting_enabled' => true, 'greeting_message' => 'Welcome to the demo!', 'timezone' => 'UTC'],
        );
        $inbox->agents()->syncWithoutDetaching([$owner->id, ...$agents->pluck('id')->all()]);

        $channel = Channel::firstOrCreate(
            ['inbox_id' => $inbox->id, 'type' => ChannelType::WEB_CHAT],
            [
                'name' => 'Demo Website',
                'channel_key' => (string) Str::uuid(),
                'is_active' => true,
                'config' => ChannelType::all()[ChannelType::WEB_CHAT]['default_config'],
            ],
        );

        $aiAgent = AiAgent::firstOrCreate(
            ['name' => 'Demo Assistant'],
            [
                'identity_persona' => 'You are a friendly support assistant.',
                'custom_instructions' => 'Always cite sources and offer human handoff if unsure.',
                'is_active' => true,
            ],
        );

        AiKnowledgeSource::firstOrCreate(
            ['ai_agent_id' => $aiAgent->id, 'name' => 'Demo FAQ'],
            ['type' => 'text', 'raw_text' => 'Pricing starts at $0 for self-host. Refunds within 14 days.', 'status' => 'ready'],
        );

        for ($i = 1; $i <= 5; $i++) {
            $contact = Contact::firstOrCreate(
                ['email' => "demo-visitor-{$i}@example.com"],
                ['name' => "Visitor {$i} Demo"],
            );

            $visitor = Visitor::firstOrCreate(
                ['contact_id' => $contact->id],
                ['uid' => (string) Str::uuid()],
            );

            $status = match ($i % 3) {
                0 => 'closed',
                1 => 'open',
                default => 'pending',
            };

            $conversation = Conversation::create([
                'inbox_id' => $inbox->id,
                'channel_id' => $channel->id,
                'visitor_id' => $visitor->id,
                'contact_id' => $contact->id,
                'status' => $status,
                'assigned_to_user_id' => $i % 2 === 0 ? $agents->first()->id : null,
            ]);

            Message::create([
                'conversation_id' => $conversation->id,
                'message_type' => 'visitor',
                'body' => "Hello, this is demo message #{$i}.",
                'visitor_id' => $visitor->id,
            ]);

            if ($i % 2 === 0) {
                Message::create([
                    'conversation_id' => $conversation->id,
                    'message_type' => 'agent',
                    'body' => "Thanks for reaching out! How can I help with message #{$i}?",
                    'user_id' => $agents->first()->id,
                ]);
            }
        }

        $this->command?->info('DemoSeeder complete: owner, 2 agents, inbox, web channel, AI agent + knowledge, 5 demo conversations.');
    }
}
