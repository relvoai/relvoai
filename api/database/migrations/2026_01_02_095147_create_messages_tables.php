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
        // Messages
        Schema::create('messages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('workspace_id')->constrained()->cascadeOnDelete();

            $table->foreignUuid('conversation_id')->constrained('conversations')->cascadeOnDelete();

            $table->string('message_type', 20); // visitor|agent|system|note
            $table->foreignUuid('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignUuid('visitor_id')->nullable()->constrained('visitors')->nullOnDelete();

            $table->text('body')->nullable();
            $table->string('format', 20)->default('text'); // text|html|markdown
            $table->boolean('has_attachments')->default(false);

            $table->string('client_message_id', 100)->nullable(); // dedupe

            $table->timestamp('delivered_at')->nullable();
            $table->timestamp('read_at')->nullable();
            $table->json('meta')->nullable();

            $table->timestamps();
            $table->softDeletes();
        });

        // Message Attachments
        Schema::create('message_attachments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('workspace_id')->constrained()->cascadeOnDelete();

            $table->foreignUuid('message_id')->constrained('messages')->cascadeOnDelete();

            $table->string('disk', 50)->default('public');
            $table->text('path');
            $table->string('original_name')->nullable();
            $table->string('mime_type', 100)->nullable();
            $table->unsignedBigInteger('size_bytes')->default(0);
            $table->boolean('is_image')->default(false);
            $table->string('checksum', 128)->nullable();
            $table->json('meta')->nullable();

            $table->timestamps();
        });

        Schema::table('conversations', function (Blueprint $table) {
            $table->foreign('last_message_id')->references('id')->on('messages')->nullOnDelete();
        });
    }

    public function down(): void
    {
        if (Schema::hasColumn('conversations', 'last_message_id')) {
            Schema::table('conversations', function (Blueprint $table) {
                $table->dropForeign(['last_message_id']);
            });
        }

        Schema::dropIfExists('message_attachments');
        Schema::dropIfExists('messages');
    }
};
