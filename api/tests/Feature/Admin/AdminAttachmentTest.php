<?php

use App\Models\Channel;
use App\Models\Conversation;
use App\Models\User;
use App\Models\Visitor;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('public');

    $this->seed(RolesAndPermissionsSeeder::class);

    $this->agent = User::factory()->create();
    $this->agent->addRole('agent');

    $channel = Channel::factory()->create();
    $visitor = Visitor::factory()->create(['channel_id' => $channel->id]);
    $this->conversation = Conversation::factory()->create([
        'inbox_id' => $channel->inbox_id,
        'channel_id' => $channel->id,
        'visitor_id' => $visitor->id,
    ]);
});

test('agent can upload an attachment to a conversation', function () {
    $this->actingAs($this->agent, 'sanctum');

    $file = UploadedFile::fake()->image('screenshot.png');

    $response = $this->post("/api/v1/admin/conversations/{$this->conversation->id}/attachments", [
        'file' => $file,
        'body' => 'Here is a screenshot',
    ], ['Accept' => 'application/json']);

    $response->assertCreated();

    $this->assertDatabaseHas('messages', [
        'conversation_id' => $this->conversation->id,
        'user_id' => $this->agent->id,
        'message_type' => 'agent',
        'has_attachments' => true,
        'body' => 'Here is a screenshot',
    ]);
    $this->assertDatabaseCount('message_attachments', 1);
});

test('agent can upload as an internal note', function () {
    $this->actingAs($this->agent, 'sanctum');

    $file = UploadedFile::fake()->create('notes.pdf', 100, 'application/pdf');

    $this->post("/api/v1/admin/conversations/{$this->conversation->id}/attachments", [
        'file' => $file,
        'is_note' => true,
    ], ['Accept' => 'application/json'])->assertCreated();

    $this->assertDatabaseHas('messages', [
        'conversation_id' => $this->conversation->id,
        'message_type' => 'note',
    ]);
});

test('attachment upload rejects forbidden mime types', function () {
    $this->actingAs($this->agent, 'sanctum');

    $file = UploadedFile::fake()->create('malware.exe', 10, 'application/x-msdownload');

    $this->post("/api/v1/admin/conversations/{$this->conversation->id}/attachments", [
        'file' => $file,
    ], ['Accept' => 'application/json'])->assertStatus(422);

    $this->assertDatabaseCount('message_attachments', 0);
});

test('attachment upload requires auth', function () {
    $this->post("/api/v1/admin/conversations/{$this->conversation->id}/attachments", [
        'file' => UploadedFile::fake()->image('x.png'),
    ], ['Accept' => 'application/json'])->assertUnauthorized();
});

test('user without conversations.reply permission cannot upload', function () {
    $viewer = User::factory()->create();

    $this->actingAs($viewer, 'sanctum');

    $this->post("/api/v1/admin/conversations/{$this->conversation->id}/attachments", [
        'file' => UploadedFile::fake()->image('x.png'),
    ], ['Accept' => 'application/json'])->assertForbidden();
});
