<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_credit_ledger', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('workspace_id')->constrained()->cascadeOnDelete();

            $table->foreignUuid('ai_agent_id')->nullable()->constrained('ai_agents')->nullOnDelete();
            $table->foreignUuid('conversation_id')->nullable()->constrained('conversations')->nullOnDelete();

            // Negative for spend, positive for refill/grant.
            $table->bigInteger('delta');

            $table->string('reason', 30);   // chat | train | refill | adjust | grant

            $table->unsignedInteger('tokens_prompt')->default(0);
            $table->unsignedInteger('tokens_completion')->default(0);
            $table->decimal('cost_usd', 10, 6)->nullable();
            $table->string('provider', 40)->nullable();
            $table->string('model', 100)->nullable();

            $table->json('meta')->nullable();

            $table->timestamps();

            $table->index(['ai_agent_id', 'created_at']);
            $table->index(['conversation_id']);
            $table->index(['reason', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_credit_ledger');
    }
};
