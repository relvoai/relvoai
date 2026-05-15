<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'email' => $this->email,
            'username' => $this->username,
            'is_active' => $this->is_active,
            'last_login_at' => $this->last_login_at,
            'locale' => $this->locale,
            'timezone' => $this->timezone,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'roles' => $this->roles->pluck('name'),
            'permissions' => $this->allPermissions()->pluck('name'),
            'departments' => DepartmentResource::collection($this->whenLoaded('departments')),
        ];
    }
}
