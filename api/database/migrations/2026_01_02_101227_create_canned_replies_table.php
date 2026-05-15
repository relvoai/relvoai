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
        Schema::create('canned_replies', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('workspace_id')->constrained()->cascadeOnDelete();

            $table->foreignUuid('inbox_id')->nullable()->constrained('inboxes')->cascadeOnDelete();
            $table->foreignUuid('user_id')->nullable()->constrained('users')->cascadeOnDelete(); // Nullable for shared?

            $table->string('shortcut', 50); // e.g. "hi"
            $table->text('content'); // e.g. "Hello there! How can I help?"

            $table->boolean('is_shared')->default(false);

            $table->timestamps();

            $table->index(['user_id', 'shortcut']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('canned_replies');
    }
};
