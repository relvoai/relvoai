<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\ApiController;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class RoleController extends ApiController implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('permission:roles.view'),
        ];
    }

    /**
     * List Roles
     *
     * Get all roles with permission counts and user counts.
     */
    public function index(Request $request)
    {
        $roles = Role::withCount(['permissions', 'users'])->get();

        $data = $roles->map(function ($role) {
            return [
                'id' => $role->id,
                'name' => ucfirst($role->name),
                'description' => $this->getRoleDescription($role->name),
                'permissions_count' => $role->permissions_count,
                'users_count' => $role->users_count,
            ];
        });

        return $this->success($data);
    }

    /**
     * Show Role
     *
     * Get a role with its full permission list.
     */
    public function show(Role $role)
    {
        $role->load('permissions');

        return $this->success([
            'id' => $role->id,
            'name' => ucfirst($role->name),
            'description' => $this->getRoleDescription($role->name),
            'permissions' => $role->permissions->map(fn ($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'display_name' => $p->display_name,
            ]),
            'users_count' => $role->users()->count(),
        ]);
    }

    private function getRoleDescription(string $roleName): string
    {
        return match ($roleName) {
            'admin' => 'Full system access. Can manage all settings, users, and configurations.',
            'agent' => 'Can handle conversations, manage contacts, and use productivity tools.',
            default => 'Custom role with specific permissions.',
        };
    }
}
