<?php

use App\Models\Ai\AiCreditBalance;
use App\Models\Ai\AiCreditLedger;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);
    $this->admin = User::factory()->create();
    $this->admin->addRole('admin');
    $this->actingAs($this->admin, 'sanctum');
});

it('returns the current balance and ledger', function () {
    AiCreditBalance::credit(5000);
    AiCreditLedger::create([
        'delta' => 5000,
        'reason' => AiCreditLedger::REASON_GRANT,
    ]);

    $this->getJson('/api/v1/admin/ai-credits')
        ->assertSuccessful()
        ->assertJsonPath('data.balance', 5000)
        ->assertJsonCount(1, 'data.ledger');
});

it('grants credits and records a ledger entry', function () {
    $this->postJson('/api/v1/admin/ai-credits/grant', [
        'amount' => 1200,
        'note' => 'April top-up',
    ])->assertSuccessful()
        ->assertJsonPath('data.balance', 1200);

    $this->assertDatabaseHas('ai_credit_ledger', [
        'delta' => 1200,
        'reason' => AiCreditLedger::REASON_GRANT,
    ]);
});

it('atomic debit refuses to go below zero', function () {
    AiCreditBalance::credit(100);

    expect(AiCreditBalance::debit(150))->toBeFalse();
    expect(AiCreditBalance::current()->balance)->toBe(100);

    expect(AiCreditBalance::debit(100))->toBeTrue();
    expect(AiCreditBalance::current()->balance)->toBe(0);
});

it('requires ai.credits.manage permission', function () {
    $agent = User::factory()->create();
    $agent->addRole('agent');
    $this->actingAs($agent, 'sanctum');

    $this->getJson('/api/v1/admin/ai-credits')->assertForbidden();
});
