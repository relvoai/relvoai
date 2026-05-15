<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_custom_tools', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('workspace_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('ai_agent_id')->nullable()->constrained('ai_agents')->nullOnDelete();
            $table->string('name');
            $table->string('description', 1000);
            $table->json('parameter_schema');
            $table->string('endpoint');
            $table->string('http_method', 10)->default('POST');
            $table->string('auth_type', 32)->default('none'); // none|bearer|header
            $table->string('auth_value')->nullable();
            $table->unsignedInteger('rate_limit_per_minute')->default(30);
            $table->unsignedInteger('response_size_limit')->default(8192); // bytes
            $table->unsignedInteger('timeout_seconds')->default(10);
            $table->boolean('enabled')->default(true);
            $table->timestamps();

            $table->index(['workspace_id', 'ai_agent_id', 'enabled']);
            $table->unique(['workspace_id', 'name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_custom_tools');
    }
};
