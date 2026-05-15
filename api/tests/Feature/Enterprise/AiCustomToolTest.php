<?php

use App\Ai\Agents\SupportAgent;
use App\Enterprise\AdvancedAi\AiToolRegistry;
use App\Enterprise\AdvancedAi\CustomAiTool;
use App\Enterprise\AdvancedAi\Models\AiCustomTool;
use App\Enterprise\EnterpriseServiceProvider;
use App\Enterprise\LicenseManager;
use App\Models\Ai\AiAgent;
use App\Models\AuditLog;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Support\Facades\Http;
use Laravel\Ai\Tools\Request;

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);
    $this->user = User::factory()->create();
    $this->user->addRole('admin');
    $this->actingAs($this->user, 'sanctum');
});

it('blocks enterprise tool CRUD when license invalid', function () {
    config(['enterprise.license_key' => null]);
    app(LicenseManager::class)->flush();

    $this->getJson('/api/v1/admin/enterprise/ai-tools')->assertStatus(402);
});

it('creates a custom tool when license is valid', function () {
    config(['enterprise.license_key' => 'test-dev-key', 'app.env' => 'local']);
    app(LicenseManager::class)->flush();
    // EnterpriseServiceProvider needs to register routes — re-boot.
    app(EnterpriseServiceProvider::class, ['app' => $this->app])->boot();

    $response = $this->postJson('/api/v1/admin/enterprise/ai-tools', [
        'name' => 'lookup_order',
        'description' => 'Look up the visitor\'s order by ID.',
        'parameter_schema' => [
            'order_id' => ['type' => 'string', 'description' => 'Order ID', 'required' => true],
        ],
        'endpoint' => 'https://example.test/orders',
        'http_method' => 'POST',
    ]);

    $response->assertSuccessful();
    expect(AiCustomTool::query()->where('name', 'lookup_order')->exists())->toBeTrue();
});

it('appends custom tools to SupportAgent tools when resolver is installed', function () {
    config(['enterprise.license_key' => 'test-dev-key', 'app.env' => 'local']);
    app(LicenseManager::class)->flush();
    app(EnterpriseServiceProvider::class, ['app' => $this->app])->boot();

    $agent = AiAgent::factory()->create();
    $tool = AiCustomTool::create([
        'workspace_id' => $agent->workspace_id,
        'ai_agent_id' => null, // workspace-wide
        'name' => 'refund',
        'description' => 'Issue a refund',
        'parameter_schema' => ['order_id' => ['type' => 'string', 'required' => true]],
        'endpoint' => 'https://example.test/refund',
        'enabled' => true,
    ]);

    $registry = app(AiToolRegistry::class);
    $resolved = $registry->toolsForAgent($agent);

    expect($resolved)->toHaveCount(1);
    expect($resolved[0])->toBeInstanceOf(CustomAiTool::class);
    expect($resolved[0]->name())->toBe('refund');
});

it('OSS process never registers extra tools resolver', function () {
    config(['enterprise.license_key' => null]);
    app(LicenseManager::class)->flush();
    SupportAgent::$extraToolsResolver = null; // simulate no enterprise boot

    expect(SupportAgent::$extraToolsResolver)->toBeNull();
});

it('audits tool invocations and truncates oversize responses', function () {
    Http::fake([
        'https://example.test/*' => Http::response(str_repeat('A', 20000), 200),
    ]);

    $tool = AiCustomTool::create([
        'name' => 'big_response',
        'description' => 'returns large body',
        'parameter_schema' => ['q' => ['type' => 'string', 'required' => true]],
        'endpoint' => 'https://example.test/big',
        'http_method' => 'GET',
        'response_size_limit' => 512,
        'enabled' => true,
    ]);

    $adapter = new CustomAiTool($tool);
    $result = $adapter->handle(new Request(['q' => 'hi']));

    expect(strlen($result))->toBe(512);
    expect(AuditLog::query()->where('event', 'ai.custom_tool.invoked')->count())->toBe(1);

    $entry = AuditLog::query()->where('event', 'ai.custom_tool.invoked')->first();
    expect($entry->new_values['truncated'])->toBeTrue();
});

it('rate limits tool invocations', function () {
    Http::fake(['*' => Http::response('ok')]);

    $tool = AiCustomTool::create([
        'name' => 'rate_test',
        'description' => 'rate-limited',
        'parameter_schema' => ['q' => ['type' => 'string']],
        'endpoint' => 'https://example.test/rt',
        'rate_limit_per_minute' => 2,
        'enabled' => true,
    ]);

    $adapter = new CustomAiTool($tool);
    $req = new Request(['q' => 'x']);
    $adapter->handle($req);
    $adapter->handle($req);
    $third = $adapter->handle($req);

    expect($third)->toContain('rate-limited');
    expect(AuditLog::query()->where('event', 'ai.custom_tool.rate_limited')->exists())->toBeTrue();
});
