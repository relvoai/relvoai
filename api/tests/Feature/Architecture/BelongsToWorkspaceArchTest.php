<?php

use App\Concerns\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * Architectural invariant: every Eloquent model whose table carries a
 * `workspace_id` column MUST use the `BelongsToWorkspace` trait. Catches
 * future drift the moment someone adds a workspace_scoped table and forgets
 * the trait.
 */
it('every model with workspace_id uses BelongsToWorkspace', function () {
    $appModels = collect(File::allFiles(app_path('Models')))
        ->filter(fn ($f) => $f->getExtension() === 'php')
        ->map(function ($f) {
            $rel = Str::after($f->getRealPath(), app_path('Models').DIRECTORY_SEPARATOR);
            $rel = Str::replaceLast('.php', '', $rel);
            $rel = str_replace(DIRECTORY_SEPARATOR, '\\', $rel);

            return 'App\\Models\\'.$rel;
        });

    $enterpriseRoot = base_path('../enterprise/src');
    $enterpriseModels = collect();
    if (is_dir($enterpriseRoot)) {
        $enterpriseModels = collect(File::allFiles($enterpriseRoot))
            ->filter(fn ($f) => $f->getExtension() === 'php')
            ->map(function ($f) use ($enterpriseRoot) {
                $rel = Str::after($f->getRealPath(), realpath($enterpriseRoot).DIRECTORY_SEPARATOR);
                $rel = Str::replaceLast('.php', '', $rel);
                $rel = str_replace(DIRECTORY_SEPARATOR, '\\', $rel);

                return 'App\\Enterprise\\'.$rel;
            });
    }

    $modelFiles = $appModels->concat($enterpriseModels);

    $violations = [];

    foreach ($modelFiles as $class) {
        if (! class_exists($class)) {
            continue;
        }

        $reflection = new ReflectionClass($class);
        if ($reflection->isAbstract() || ! $reflection->isSubclassOf(Model::class)) {
            continue;
        }

        $instance = $reflection->newInstanceWithoutConstructor();
        $table = $instance->getTable();

        if (! Schema::hasTable($table)) {
            continue;
        }

        if (! Schema::hasColumn($table, 'workspace_id')) {
            continue;
        }

        $usesTrait = in_array(BelongsToWorkspace::class, class_uses_recursive($class), true);

        if (! $usesTrait) {
            $violations[] = $class;
        }
    }

    expect($violations)->toBe([], 'These models have a `workspace_id` column but are missing the BelongsToWorkspace trait: '.implode(', ', $violations));
});
