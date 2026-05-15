<?php

use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

// --- Setup Admin ---
$adminRole = Role::where('name', 'admin')->first();
if (!$adminRole) {
    $adminRole = Role::create(['name' => 'admin', 'display_name' => 'Admin']);
    $adminRole->givePermission('conversations.view');
}

$user = User::where('email', 'admin@test.com')->first();
if (!$user) {
    $user = User::factory()->create(['email' => 'admin@test.com']);
}
if (!$user->hasRole('admin')) {
    $user->addRole('admin');
}
if (!$user->hasPermission('conversations.view')) {
    \App\Models\Permission::firstOrCreate(['name' => 'conversations.view'], ['display_name' => 'View Conv']);
    $user->givePermission('conversations.view');
}
foreach (['widgets.create', 'conversations.join_group', 'conversations.close', 'conversations.reply'] as $permName) {
    if (!$user->hasPermission($permName)) {
        \App\Models\Permission::firstOrCreate(['name' => $permName], ['display_name' => ucfirst($permName)]);
        $user->givePermission($permName);
    }
}

// Mock AI Service to avoid 500 errors during Close
app()->bind(\App\Services\Ai\AiService::class, function () {
    return new class implements \App\Services\Ai\AiService {
        public function summarize(\App\Models\Conversation $conversation): string
        {
            return 'Mock Summary';
        }
    };
});

$adminToken = $user->createToken('manual_test')->plainTextToken;
$adminHeaders = [
    'Authorization' => 'Bearer ' . $adminToken,
    'Accept' => 'application/json',
];

$baseUrl = 'http://livechat.test/api/v1';

// --- 1. Create Widget ---
echo "\n--- 1. Create Widget (Admin) ---\n";
$widgetName = 'Test Widget ' . Str::random(5);
$randomDomain = 'test-' . Str::random(5) . '.test';
$res = Http::withHeaders($adminHeaders)->post("$baseUrl/admin/widgets", [
    'name' => $widgetName,
    'domains' => [$randomDomain]
]);
echo "Create Widget: " . $res->status() . "\n";
\Illuminate\Support\Facades\Log::info('Widget Headers', $res->headers());
\Illuminate\Support\Facades\Log::info('Widget Body', ['body' => substr($res->body(), 0, 1000)]);
\Illuminate\Support\Facades\Log::info('Widget Create Response', $res->json() ?? []);

$widgetId = $res->json('data.id') ?? $res->json('data.data.id');
$widgetKey = $res->json('data.widget_key') ?? $res->json('data.data.widget_key');

echo "Widget ID: $widgetId\n";
echo "Widget Key: $widgetKey\n";

if (!$widgetKey) {
    echo "Response Body: " . $res->body() . "\n";
    die("Failed to get widget key\n");
}

// --- 2. Identify Visitor ---
echo "\n--- 2. Identify Visitor (Widget) ---\n";
$widgetHeaders = [
    'X-Widget-Key' => $widgetKey,
    'Accept' => 'application/json',
];
$res = Http::withHeaders($widgetHeaders)->post("$baseUrl/widget/identify", [
    'uuid' => (string) Str::uuid(),
]);
echo "Identify: " . $res->status() . "\n";
$visitorId = $res->json('data.id');
echo "Visitor ID: $visitorId\n";

// The Identity response doesn't return a token in our current implementation, 
// but creates a session. We rely on X-Visitor-Id for now (or maybe we need to add token generation).
// For this test, we follow the Controller requirement of X-Visitor-Id.
$visitorHeaders = array_merge($widgetHeaders, [
    'X-Visitor-Id' => $visitorId
]);

// --- 3. Create Conversation ---
echo "\n--- 3. Create Conversation (Widget) ---\n";
$res = Http::withHeaders($visitorHeaders)->post("$baseUrl/widget/conversations", [
    'subject' => 'Help me!',
    'initial_message' => 'Hello support.'
]);
echo "Create Conv: " . $res->status() . "\n";
if ($res->status() !== 201) {
    echo "Error Body: " . $res->body() . "\n";
}
$convId = $res->json('data.id');
echo "Conversation ID: $convId\n";

// --- 4. Send Message (Visitor) ---
echo "\n--- 4. Send Message (Visitor) ---\n";
$res = Http::withHeaders($visitorHeaders)->post("$baseUrl/widget/conversations/$convId/messages", [
    'body' => 'I need help testing broadcasting.'
]);
echo "Visitor Message: " . $res->status() . "\n";

// --- 5. Join Conversation (Agent) ---
echo "\n--- 5. Join Conversation (Agent) ---\n";
$res = Http::withHeaders($adminHeaders)->post("$baseUrl/admin/conversations/$convId/join");
echo "Agent Join: " . $res->status() . "\n";

// Force sync queue to avoid configuration errors for Jobs
\Illuminate\Support\Facades\Config::set('queue.default', 'sync');

// --- 6. Send Message (Agent) ---
echo "\n--- 6. Send Message (Agent) ---\n";
$res = Http::withHeaders($adminHeaders)->post("$baseUrl/admin/conversations/$convId/reply", [
    'body' => 'I am here to help.'
]);
echo "Agent Message: " . $res->status() . "\n";

// --- 7. Typing (Agent) ---
echo "\n--- 7. Typing (Agent) ---\n";
$res = Http::withHeaders($adminHeaders)->post("$baseUrl/admin/conversations/$convId/typing", ['type' => 'start']);
echo "Agent Typing: " . $res->status() . "\n";

// --- 8. Close (Agent) ---
echo "\n--- 8. Close (Agent) ---\n";
$res = Http::withHeaders($adminHeaders)->post("$baseUrl/admin/conversations/$convId/close");
echo "Agent Close: " . $res->status() . "\n";
