<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Support\AuthToken;
use Illuminate\Console\Command;

use function Laravel\Prompts\info;
use function Laravel\Prompts\note;
use function Laravel\Prompts\text;

class DevTokenCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'dev:token {email? : The email of the user to generate a token for}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate a Sanctum token for development testing';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        if (config('app.env') === 'production') {
            $this->error('dev:token is disabled in production. Issue Sanctum tokens via the API.');

            return self::FAILURE;
        }

        $email = $this->argument('email');

        if (! $email) {
            $email = text(
                label: 'Enter email address',
                placeholder: 'admin@example.com',
                default: 'admin@example.com'
            );
        }

        $user = User::firstOrCreate(
            ['email' => $email],
            [
                'first_name' => 'Dev',
                'last_name' => 'Admin',
                'username' => 'dev_admin',
                'password' => bcrypt('password'),
                'is_active' => true,
            ]
        );

        // Ensure admin role if Laratrust is set up (we'll handle roles later, but good to keep in mind)
        // if ($user->wasRecentlyCreated) { ... }

        $token = AuthToken::issueTokenFor($user, 'dev-cli');

        info("Token generated for {$user->email}:");
        note($token);

        info('Curl Example:');
        note("curl -H \"Authorization: Bearer {$token}\" ".url('/api/v1/me'));

        return self::SUCCESS;
    }
}
