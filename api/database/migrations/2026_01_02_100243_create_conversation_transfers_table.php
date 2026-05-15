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
        Schema::create('conversation_transfers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('workspace_id')->constrained()->cascadeOnDelete();

            $table->foreignUuid('conversation_id')->constrained('conversations')->cascadeOnDelete();

            $table->foreignUuid('from_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignUuid('to_user_id')->nullable()->constrained('users')->nullOnDelete(); // or to_department
            $table->foreignUuid('transferred_by_user_id')->nullable()->constrained('users')->nullOnDelete();

            $table->text('note')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('conversation_transfers');
    }
};
