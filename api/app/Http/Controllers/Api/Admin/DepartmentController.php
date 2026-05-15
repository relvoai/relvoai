<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\ApiController;
use App\Http\Requests\StoreDepartmentRequest;
use App\Http\Requests\UpdateDepartmentRequest;
use App\Http\Resources\DepartmentResource;
use App\Models\Department;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class DepartmentController extends ApiController implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('permission:departments.view', only: ['index', 'show']),
            new Middleware('permission:departments.create', only: ['store']),
            new Middleware('permission:departments.update', only: ['update']),
            new Middleware('permission:departments.delete', only: ['destroy']),
        ];
    }

    /**
     * List Departments
     *
     * Get a paginated list of departments.
     */
    public function index(Request $request)
    {
        $departments = Department::withCount('users')->paginate($request->get('per_page', 15));

        return $this->success(DepartmentResource::collection($departments));
    }

    /**
     * Create Department
     */
    public function store(StoreDepartmentRequest $request)
    {
        $department = Department::create($request->validated());

        return $this->success(new DepartmentResource($department), 'Department created successfully.', 201);
    }

    /**
     * Get Department
     */
    public function show(Department $department)
    {
        return $this->success(new DepartmentResource($department->loadCount('users')));
    }

    /**
     * Update Department
     */
    public function update(UpdateDepartmentRequest $request, Department $department)
    {
        $department->update($request->validated());

        return $this->success(new DepartmentResource($department), 'Department updated successfully.');
    }

    /**
     * Delete Department
     */
    public function destroy(Department $department)
    {
        $department->delete();

        return $this->success(null, 'Department deleted successfully.');
    }
}
