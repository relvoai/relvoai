<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::ensureVectorExtensionExists();

        Schema::create('ai_knowledge_chunks', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('workspace_id')->constrained()->cascadeOnDelete();

            $table->foreignUuid('ai_agent_id')->constrained('ai_agents')->cascadeOnDelete();
            $table->foreignUuid('source_id')->constrained('ai_knowledge_sources')->cascadeOnDelete();

            $table->text('content');
            $table->vector('embedding', dimensions: (int) env('AI_DEFAULT_EMBEDDING_DIMENSIONS', 1536))->index();

            $table->unsignedInteger('token_count')->default(0);
            $table->unsignedInteger('position')->default(0);
            $table->json('metadata')->nullable();

            $table->timestamps();

            $table->index(['ai_agent_id']);
            $table->index(['source_id', 'position']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_knowledge_chunks');
    }
};
