<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_knowledge_sources', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('workspace_id')->constrained()->cascadeOnDelete();

            $table->foreignUuid('ai_agent_id')->constrained('ai_agents')->cascadeOnDelete();

            $table->string('type', 20);                    // pdf | text | url
            $table->string('name');
            $table->string('disk', 40)->nullable();        // for pdf/text uploaded files
            $table->string('storage_path', 500)->nullable();
            $table->text('source_url')->nullable();        // for url sources
            $table->text('raw_text')->nullable();          // for inline text sources

            $table->string('status', 20)->default('processing');  // processing | ready | failed
            $table->string('last_error', 500)->nullable();
            $table->unsignedInteger('chunk_count')->default(0);
            $table->unsignedBigInteger('token_count')->default(0);
            $table->timestamp('last_indexed_at')->nullable();

            $table->timestamps();

            $table->index(['ai_agent_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_knowledge_sources');
    }
};
