<?php

use App\Models\Channel;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

use function Pest\Laravel\postJson;

beforeEach(function () {
    Storage::fake('public');

    $this->channel = Channel::factory()->create();

    $bootstrap = postJson('/api/v1/public/widget/bootstrap', [], [
        'X-Channel-Key' => $this->channel->channel_key,
        'X-Visitor-Uid' => fake()->uuid(),
    ]);

    $this->sessionToken = $bootstrap->json('data.session_token');
});

test('visitor can upload an image attachment', function () {
    $file = UploadedFile::fake()->image('screenshot.png', 400, 300);

    $response = $this->post('/api/v1/public/widget/attachments', [
        'file' => $file,
        'body' => 'See screenshot',
    ], [
        'Authorization' => "Bearer {$this->sessionToken}",
        'Accept' => 'application/json',
    ]);

    $response->assertCreated();

    $this->assertDatabaseHas('messages', [
        'body' => 'See screenshot',
        'message_type' => 'visitor',
        'has_attachments' => true,
    ]);
    $this->assertDatabaseCount('message_attachments', 1);
});

test('attachment upload rejects forbidden mime types', function () {
    $file = UploadedFile::fake()->create('malware.exe', 10, 'application/x-msdownload');

    $this->post('/api/v1/public/widget/attachments', [
        'file' => $file,
    ], [
        'Authorization' => "Bearer {$this->sessionToken}",
        'Accept' => 'application/json',
    ])->assertStatus(422);

    $this->assertDatabaseCount('message_attachments', 0);
});

test('attachment upload requires session token', function () {
    $file = UploadedFile::fake()->image('screenshot.png');

    $this->post('/api/v1/public/widget/attachments', [
        'file' => $file,
    ], ['Accept' => 'application/json'])->assertUnauthorized();
});
