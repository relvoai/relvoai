<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_agent_channel', function (Blueprint $table) {
            $table->foreignUuid('ai_agent_id')->constrained('ai_agents')->cascadeOnDelete();
            $table->foreignUuid('channel_id')->constrained('channels')->cascadeOnDelete();

            $table->boolean('is_primary')->default(false);

            $table->timestamps();

            $table->primary(['ai_agent_id', 'channel_id']);
        });

        // Exactly one primary agent per channel (partial unique index on PG).
        DB::statement('CREATE UNIQUE INDEX ai_agent_channel_one_primary_per_channel ON ai_agent_channel (channel_id) WHERE is_primary IS TRUE');
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_agent_channel');
    }
};
