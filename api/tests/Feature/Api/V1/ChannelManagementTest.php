<?php

use App\Models\Channel;
use App\Models\User;
use App\Services\ChannelType;
use Database\Seeders\RolesAndPermissionsSeeder;

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);

    $this->admin = User::factory()->create();
    $this->admin->addRole('admin');

    $this->channel = Channel::factory()->create([
        'type' => ChannelType::WEB_CHAT,
    ]);
});

function asAdmin(): void
{
    test()->actingAs(test()->admin, 'sanctum');
}

it('returns an embed script for a web_chat channel', function () {
    asAdmin();
    $response = $this->getJson("/api/v1/channels/{$this->channel->id}/embed-script");

    $response->assertSuccessful();

    $script = $response->json('data.script');
    expect($script)->toContain('widget.js');
    expect($script)->toContain($this->channel->channel_key);
});

it('refuses embed script for non-web_chat channels', function () {
    asAdmin();
    $telegramChannel = Channel::factory()->create(['type' => ChannelType::TELEGRAM]);

    $this->getJson("/api/v1/channels/{$telegramChannel->id}/embed-script")
        ->assertStatus(400);
});

it('rotates the hmac secret', function () {
    asAdmin();
    $this->channel->update(['hmac_secret' => 'original-secret']);

    $response = $this->postJson("/api/v1/channels/{$this->channel->id}/rotate-hmac-secret");

    $response->assertSuccessful();
    $response->assertJsonPath('data.hmac_secret', '****');

    expect($this->channel->fresh()->hmac_secret)->not->toBe('original-secret');
    expect(strlen($this->channel->fresh()->hmac_secret))->toBe(32);
});

it('syncs allowed domains for a web_chat channel', function () {
    asAdmin();
    $this->putJson("/api/v1/channels/{$this->channel->id}/domains", [
        'domains' => ['https://a.com', 'https://b.com'],
    ])->assertSuccessful();

    $this->assertDatabaseCount('channel_domains', 2);
    $this->assertDatabaseHas('channel_domains', [
        'channel_id' => $this->channel->id,
        'domain' => 'https://a.com',
    ]);
});

it('replaces domains on subsequent sync (wipe + reinsert)', function () {
    asAdmin();
    $this->putJson("/api/v1/channels/{$this->channel->id}/domains", [
        'domains' => ['https://old.com'],
    ])->assertSuccessful();

    $this->putJson("/api/v1/channels/{$this->channel->id}/domains", [
        'domains' => ['https://new.com'],
    ])->assertSuccessful();

    $this->assertDatabaseCount('channel_domains', 1);
    $this->assertDatabaseHas('channel_domains', ['domain' => 'https://new.com']);
    $this->assertDatabaseMissing('channel_domains', ['domain' => 'https://old.com']);
});

it('refuses domain sync for non-web_chat channels', function () {
    asAdmin();
    $telegramChannel = Channel::factory()->create(['type' => ChannelType::TELEGRAM]);

    $this->putJson("/api/v1/channels/{$telegramChannel->id}/domains", [
        'domains' => ['https://x.com'],
    ])->assertStatus(400);
});

it('requires auth for channel management', function () {
    $this->getJson("/api/v1/channels/{$this->channel->id}/embed-script")->assertUnauthorized();
    $this->postJson("/api/v1/channels/{$this->channel->id}/rotate-hmac-secret")->assertUnauthorized();
    $this->putJson("/api/v1/channels/{$this->channel->id}/domains", ['domains' => []])->assertUnauthorized();
});
