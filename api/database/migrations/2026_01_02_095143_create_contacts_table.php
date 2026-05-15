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
        Schema::create('contacts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('workspace_id')->constrained()->cascadeOnDelete();
            $table->string('external_id')->nullable()->unique()->index();
            $table->string('name')->nullable();
            $table->string('email')->nullable()->unique();

            $table->string('phone', 32)->nullable();
            $table->string('avatar_url')->nullable();
            $table->json('tags')->nullable();
            $table->json('custom_attributes')->nullable();
            $table->text('internal_notes')->nullable();

            $table->uuid('merged_into_contact_id')->nullable();

            $table->timestamps();
            $table->softDeletes();
        });

        Schema::table('contacts', function (Blueprint $table) {
            $table->foreign('merged_into_contact_id')
                ->references('id')->on('contacts')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('contacts');
    }
};
