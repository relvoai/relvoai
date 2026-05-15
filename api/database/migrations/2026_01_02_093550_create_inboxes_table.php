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
        Schema::create('inboxes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('workspace_id')->constrained()->cascadeOnDelete();

            // Basic Info
            $table->string('name', 255);
            $table->boolean('is_active')->default(true);
            $table->text('avatar_path')->nullable();

            // Greeting
            $table->boolean('greeting_enabled')->default(false);
            $table->text('greeting_message')->nullable();

            // Working Hours
            $table->boolean('working_hours_enabled')->default(false);
            $table->string('timezone', 50)->nullable();
            $table->text('out_of_office_message')->nullable();
            $table->json('working_hours')->nullable(); // Stores array of schedule objects

            // CSAT
            $table->boolean('csat_survey_enabled')->default(false);
            $table->json('csat_config')->nullable();

            // Auto Assignment
            $table->boolean('enable_auto_assignment')->default(false);
            $table->json('auto_assignment_config')->nullable();

            // Conversation Behavior
            $table->boolean('allow_messages_after_resolved')->default(true);
            $table->boolean('lock_to_single_conversation')->default(false);

            // Identity / Display
            $table->string('sender_name_type', 20)->default('friendly'); // friendly|professional
            $table->string('business_name', 255)->nullable();

            // Integrations
            $table->text('callback_webhook_url')->nullable();

            $table->json('config')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inboxes');
    }
};
