<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\ApiController;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\Hash;

class UserController extends ApiController implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('permission:users.view', only: ['index', 'show']),
            new Middleware('permission:users.create', only: ['store']),
            new Middleware('permission:users.update', only: ['update']),
            new Middleware('permission:users.delete', only: ['destroy']),
        ];
    }

    /**
     * List Users
     *
     * Get a paginated list of users (agents and admins).
     */
    public function index(Request $request)
    {
        $users = User::with('roles')->paginate($request->get('per_page', 15));

        return $this->success(UserResource::collection($users));
    }

    /**
     * Create User
     *
     * Create a new user (agent or admin) and assign roles/departments.
     */
    public function store(StoreUserRequest $request)
    {
        $data = $request->validated();
        $data['password'] = Hash::make($data['password']);

        $user = User::create($data);

        if (isset($data['roles'])) {
            $user->syncRoles($data['roles']);
        }

        if (isset($data['departments'])) {
            $user->departments()->sync($data['departments']);
        }

        return $this->success(new UserResource($user), 'User created successfully.', 201);
    }

    /**
     * Get User Details
     */
    public function show(User $user)
    {
        return $this->success(new UserResource($user->load(['roles', 'departments'])));
    }

    /**
     * Update User
     *
     * Update user details, roles, and departments.
     */
    public function update(UpdateUserRequest $request, User $user)
    {
        $data = $request->validated();

        if (isset($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        $user->update($data);

        if (isset($data['roles'])) {
            $user->syncRoles($data['roles']);
        }

        if (isset($data['departments'])) {
            $user->departments()->sync($data['departments']);
        }

        return $this->success(new UserResource($user), 'User updated successfully.');
    }

    /**
     * Delete User
     */
    public function destroy(User $user)
    {
        if ($user->id === auth()->id()) {
            return $this->error('You cannot delete yourself.', null, 400);
        }

        $user->delete();

        return $this->success(null, 'User deleted successfully.');
    }
}
