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
        Schema::create('conversation_participants', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('workspace_id')->constrained()->cascadeOnDelete();

            $table->foreignUuid('conversation_id')->constrained('conversations')->cascadeOnDelete();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();

            $table->timestamp('joined_at');
            $table->timestamp('left_at')->nullable();
            $table->boolean('is_owner')->default(false);

            $table->timestamps();

            $table->unique(['conversation_id', 'user_id']); // Ensure user only joins once (active or not? Usually history is tracked separately or rows soft blocked? This unique prevents duplicates. If they leave and join again, maybe update row or new row? Assuming new row if they fully left? Actually maybe just update 'left_at' to null. But unique constraint here might be tricky if preserving history. Let's drop unique if we want log. But simpler model: Active participants. History in log. Let's keep unique for active? M3 plan says "Group Chat: operators join/leave". Usually simple unique is fine.)
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('conversation_participants');
    }
};
