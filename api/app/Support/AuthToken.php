<?php

namespace App\Support;

use App\Models\User;
use Laravel\Sanctum\NewAccessToken;

class AuthToken
{
    /**
     * Issue a fresh token for the given user.
     */
    public static function issueTokenFor(User $user, string $name = 'dev'): string
    {
        /** @var NewAccessToken $token */
        $token = $user->createToken($name);

        return $token->plainTextToken;
    }

    /**
     * Get the auth headers for a given token.
     *
     * @return array<string, string>
     */
    public static function authHeaders(string $token): array
    {
        return [
            'Authorization' => 'Bearer '.$token,
            'Accept' => 'application/json',
        ];
    }
}
