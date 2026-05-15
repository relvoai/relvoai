<?php

use App\Enterprise\Http\Middleware\RequireValidLicense;
use App\Enterprise\LicenseManager;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Support\Facades\Route;

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);
    $this->user = User::factory()->create();
    $this->user->addRole('admin');
    $this->actingAs($this->user, 'sanctum');
});

it('reports invalid when no key is set', function () {
    config(['enterprise.license_key' => null]);
    app(LicenseManager::class)->flush();

    expect(app(LicenseManager::class)->isValid())->toBeFalse();

    $response = $this->getJson('/api/v1/admin/license');
    $response->assertSuccessful();
    $response->assertJsonPath('data.valid', false);
    $response->assertJsonPath('data.edition', 'community');
    $response->assertJsonPath('data.mode', 'missing');
});

it('accepts test- keys outside production', function () {
    config(['enterprise.license_key' => 'test-dev-key', 'app.env' => 'local']);
    app(LicenseManager::class)->flush();

    expect(app(LicenseManager::class)->isValid())->toBeTrue();

    $this->getJson('/api/v1/admin/license')
        ->assertSuccessful()
        ->assertJsonPath('data.valid', true)
        ->assertJsonPath('data.edition', 'enterprise')
        ->assertJsonPath('data.mode', 'test');
});

it('rejects test- keys in production', function () {
    config(['enterprise.license_key' => 'test-dev-key', 'app.env' => 'production']);
    app(LicenseManager::class)->flush();

    expect(app(LicenseManager::class)->isValid())->toBeFalse();
});

it('authorizes via a remote validator when registered', function () {
    config(['enterprise.license_key' => 'prod-abc', 'app.env' => 'production']);
    $license = app(LicenseManager::class);
    $license->flush();
    $license->setRemoteValidator(fn (string $key) => $key === 'prod-abc');

    expect($license->isValid())->toBeTrue();
});

it('returns 402 for license-gated routes when invalid', function () {
    config(['enterprise.license_key' => null]);
    app(LicenseManager::class)->flush();

    Route::middleware(['auth:sanctum', 'license'])
        ->get('/api/v1/test-enterprise-route', fn () => response()->json(['ok' => true]));

    $this->getJson('/api/v1/test-enterprise-route')->assertStatus(402);
});

it('passes through license-gated routes when valid', function () {
    config(['enterprise.license_key' => 'test-dev-key', 'app.env' => 'local']);
    app(LicenseManager::class)->flush();

    Route::middleware(['auth:sanctum', 'license'])
        ->get('/api/v1/test-enterprise-route-ok', fn () => response()->json(['ok' => true]));

    $this->getJson('/api/v1/test-enterprise-route-ok')->assertSuccessful();
});

it('middleware unit returns 402 envelope', function () {
    config(['enterprise.license_key' => null]);
    app(LicenseManager::class)->flush();

    $middleware = app(RequireValidLicense::class);
    $response = $middleware->handle(request(), fn () => response()->json(['unexpected' => true]));

    expect($response->getStatusCode())->toBe(402);
    expect(json_decode($response->getContent(), true)['success'])->toBeFalse();
});
