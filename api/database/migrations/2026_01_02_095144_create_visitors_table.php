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
        Schema::create('visitors', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('workspace_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('channel_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('uid')->nullable()->index();
            $table->foreignUuid('contact_id')->nullable()->constrained('contacts')->nullOnDelete();

            $table->timestamp('first_seen_at')->nullable();
            $table->timestamp('last_seen_at')->nullable();

            $table->text('last_seen_url')->nullable();
            $table->text('last_referrer')->nullable();
            $table->string('last_ip', 64)->nullable();
            $table->text('user_agent')->nullable();
            $table->string('locale', 10)->nullable();
            $table->string('timezone', 50)->nullable();
            $table->json('meta')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->unique(['channel_id', 'uid']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('visitors');
    }
};
