<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_conversations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('workspace_id')->constrained()->cascadeOnDelete();

            $table->foreignUuid('conversation_id')->unique()->constrained('conversations')->cascadeOnDelete();
            $table->foreignUuid('ai_agent_id')->constrained('ai_agents')->cascadeOnDelete();

            // Links to the SDK's agent_conversations.id (the "memory" handle) when the SDK drives turns.
            $table->string('sdk_conversation_id', 36)->nullable()->index();

            $table->timestamp('handed_off_at')->nullable();
            $table->string('handoff_reason', 60)->nullable();
            $table->text('handoff_summary')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_conversations');
    }
};
