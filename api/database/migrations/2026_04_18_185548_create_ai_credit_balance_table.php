<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_credit_balance', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('workspace_id')->constrained()->cascadeOnDelete();

            // Integer credits; atomic decrement guards against races in WidgetMessageController.
            $table->bigInteger('balance')->default(0);

            // Monthly refill anchor — optional billing hook.
            $table->unsignedInteger('monthly_refill')->default(0);
            $table->timestamp('last_refilled_at')->nullable();

            $table->timestamps();

            // One credit-balance row per workspace.
            $table->unique('workspace_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_credit_balance');
    }
};
