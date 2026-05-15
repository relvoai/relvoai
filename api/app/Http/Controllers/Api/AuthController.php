<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\LoginRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends ApiController
{
    /**
     * Log the user in and return a token.
     */
    public function login(LoginRequest $request)
    {
        $data = $request->validated();

        if (! Auth::attempt($data)) {
            return $this->error('Invalid credentials.', null, 422);
        }

        /** @var User $user */
        $user = Auth::user();

        if (! $user->is_active) {
            Auth::logout();

            return $this->error('Your account is inactive.', null, 403);
        }

        $user->update(['last_login_at' => now()]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return $this->success([
            'token' => $token,
            'user' => new UserResource($user),
        ], 'Logged in successfully.');
    }

    /**
     * Get the authenticated user.
     */
    public function me(Request $request)
    {
        return $this->success(
            new UserResource($request->user()->load(['roles', 'permissions']))
        );
    }

    /**
     * Log the user out (revoke token).
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return $this->success(null, 'Logged out successfully.');
    }
}
