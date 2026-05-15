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
        Schema::create('report_metrics', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('metric'); // e.g. "conversations_count", "avg_response_time"
            $table->decimal('value', 10, 2);

            $table->string('scope', 30)->default('global'); // global|inbox|channel|user|inbox_user|channel_user
            $table->foreignUuid('inbox_id')->nullable()->constrained('inboxes')->cascadeOnDelete();
            $table->foreignUuid('channel_id')->nullable()->constrained('channels')->cascadeOnDelete();
            $table->foreignUuid('user_id')->nullable()->constrained('users')->cascadeOnDelete();
            $table->date('date')->index();
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->unique(['metric', 'date']); // One metric value per day
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('report_metrics');
    }
};
