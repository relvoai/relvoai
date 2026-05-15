<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_agents', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('workspace_id')->constrained()->cascadeOnDelete();

            $table->string('name');
            $table->string('identity_persona', 500)->nullable();
            $table->string('welcome_message', 300)->nullable();

            $table->text('custom_instructions')->nullable();

            $table->string('provider', 40)->nullable();
            $table->string('model', 100)->nullable();
            $table->decimal('temperature', 3, 2)->nullable();

            $table->boolean('is_active')->default(true);
            $table->json('handoff_policy')->nullable();
            $table->json('meta')->nullable();

            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_agents');
    }
};
