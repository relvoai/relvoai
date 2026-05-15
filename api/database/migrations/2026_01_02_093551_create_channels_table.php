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
        Schema::create('channels', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('workspace_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('inbox_id')->constrained('inboxes')->cascadeOnDelete();

            $table->string('type', 30); // web_chat|telegram|api|whatsapp|email
            $table->string('name', 255);
            $table->boolean('is_active')->default(true);

            // Public Identifiers (Indexed for lookup)
            $table->string('channel_key', 64)->unique()->nullable(); // web_chat public ID
            $table->string('inbox_identifier', 64)->unique()->nullable(); // api channel ID

            // Security
            $table->boolean('hmac_mandatory')->default(false);
            $table->text('hmac_secret')->nullable(); // Encrypted at rest

            // Webhook
            $table->text('webhook_url')->nullable();

            // Config (Type specific)
            $table->json('config')->nullable();

            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('channels');
    }
};
