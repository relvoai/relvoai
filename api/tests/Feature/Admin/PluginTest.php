<?php

use App\Models\PluginInstallation;
use App\Models\User;
use App\Models\Workspace;
use App\Plugins\PluginManager;
use App\Plugins\PluginRepository;
use Database\Seeders\RolesAndPermissionsSeeder;
use RelvoAi\Plugins\ExampleSidebarWidget\ExampleSidebarWidgetServiceProvider;

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);
    $this->user = User::factory()->create();
    $this->user->addRole('admin');
    $this->actingAs($this->user, 'sanctum');
});

it('discovers the reference plugin', function () {
    $manager = app(PluginManager::class);
    $discovered = $manager->discover();

    expect($discovered)->toHaveKey('example-sidebar-widget');
    expect($discovered['example-sidebar-widget']->name)->toBe('Example Sidebar Widget');
});

it('lists plugins with per-workspace enabled state', function () {
    $response = $this->getJson('/api/v1/admin/plugins');

    $response->assertSuccessful();
    $response->assertJsonPath('success', true);

    $slugs = collect($response->json('data'))->pluck('slug')->all();
    expect($slugs)->toContain('example-sidebar-widget');

    $entry = collect($response->json('data'))->firstWhere('slug', 'example-sidebar-widget');
    expect($entry['enabled'])->toBeFalse();
});

it('enables and disables a plugin for the current workspace', function () {
    $this->postJson('/api/v1/admin/plugins/example-sidebar-widget/enable')->assertSuccessful();

    expect(PluginInstallation::query()->where('slug', 'example-sidebar-widget')->where('enabled', true)->exists())->toBeTrue();
    expect(app(PluginRepository::class)->isEnabled('example-sidebar-widget'))->toBeTrue();

    $this->postJson('/api/v1/admin/plugins/example-sidebar-widget/disable')->assertSuccessful();
    expect(app(PluginRepository::class)->isEnabled('example-sidebar-widget'))->toBeFalse();
});

it('returns 404 for unknown plugin enable', function () {
    $this->postJson('/api/v1/admin/plugins/does-not-exist/enable')->assertNotFound();
});

it('exposes only enabled plugins via the manifest endpoint', function () {
    $response = $this->getJson('/api/v1/admin/plugins/manifest');
    $response->assertSuccessful();
    expect($response->json('data'))->toBe([]);

    app(PluginRepository::class)->enable(app(PluginManager::class)->find('example-sidebar-widget'));

    $response = $this->getJson('/api/v1/admin/plugins/manifest');
    $response->assertSuccessful();

    $payload = $response->json('data');
    expect($payload)->toHaveCount(1);
    expect($payload[0])->toMatchArray([
        'slug' => 'example-sidebar-widget',
        'name' => 'Example Sidebar Widget',
    ]);
    expect($payload[0]['bundle'])->toContain('example-sidebar-widget');
});

it('activates the reference plugin service provider when enabled', function () {
    $manager = app(PluginManager::class);
    $manifest = $manager->find('example-sidebar-widget');
    expect($manifest->serviceProvider)->toBe(ExampleSidebarWidgetServiceProvider::class);
    expect(class_exists($manifest->serviceProvider))->toBeTrue();

    app(PluginRepository::class)->enable($manifest);

    // Activate manually in the current process (the boot pass ran before this enable).
    $manager->activate($manifest);

    $response = $this->getJson('/api/plugins/example-sidebar-widget/ping');
    $response->assertSuccessful();
    expect($response->json('data.pong'))->toBeTrue();
});

it('scopes plugin installations to workspace', function () {
    $other = Workspace::create(['name' => 'Other', 'slug' => 'other', 'is_active' => true]);
    $manager = app(PluginManager::class);
    $repo = app(PluginRepository::class);

    $repo->enable($manager->find('example-sidebar-widget'));
    expect($repo->isEnabled('example-sidebar-widget'))->toBeTrue();
    expect($repo->isEnabled('example-sidebar-widget', $other))->toBeFalse();
});
