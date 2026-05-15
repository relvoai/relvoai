<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('conversations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('workspace_id')->constrained()->cascadeOnDelete();

            $table->foreignUuid('inbox_id')->constrained('inboxes')->cascadeOnDelete();
            $table->foreignUuid('channel_id')->constrained('channels')->cascadeOnDelete();
            $table->foreignUuid('visitor_id')->nullable()->constrained('visitors')->cascadeOnDelete();
            $table->foreignUuid('contact_id')->nullable()->constrained('contacts')->nullOnDelete();

            // Assignment
            $table->foreignUuid('assigned_to_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('assigned_at')->nullable();
            $table->foreignUuid('assigned_by_user_id')->nullable()->constrained('users')->nullOnDelete();

            // Status
            $table->string('status', 20)->default('open'); // open|pending|closed
            $table->string('priority', 20)->default('normal'); // low|normal|high|urgent
            $table->json('tags')->nullable();
            $table->string('subject')->nullable();
            $table->text('summary')->nullable();

            // Bot control
            $table->boolean('bot_enabled')->default(true);
            $table->timestamp('bot_disabled_at')->nullable();

            // conversations.last_message_id -> messages.id FK is added inside the messages migration.
            $table->uuid('last_message_id')->nullable();

            $table->string('last_message_by', 20)->nullable();
            $table->timestamp('last_message_at')->nullable();
            $table->timestamp('first_response_at')->nullable();
            $table->timestamp('closed_at')->nullable();

            $table->json('meta')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['channel_id', 'contact_id', 'status', 'updated_at'], 'conv_contact_lookup_index');
            $table->index(['channel_id', 'visitor_id', 'status', 'updated_at'], 'conv_visitor_lookup_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('conversations');
    }
};
