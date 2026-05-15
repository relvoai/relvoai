<?php

namespace App\Plugins;

use InvalidArgumentException;

/**
 * Immutable representation of a `plugin.json` manifest.
 *
 * Required fields: name, slug, version. Everything else is optional and
 * defaults to empty / null. The plugin's directory is captured so the manager
 * can resolve relative paths (routes file, migrations dir, frontend bundle).
 */
final class PluginManifest
{
    /**
     * @param  array<string,mixed>  $raw
     * @param  array<string>  $capabilities
     * @param  array<string>  $permissions
     * @param  array<string>  $tools
     * @param  array<string,string>  $requires
     */
    public function __construct(
        public readonly string $name,
        public readonly string $slug,
        public readonly string $version,
        public readonly string $path,
        public readonly ?string $description = null,
        public readonly ?string $serviceProvider = null,
        public readonly ?string $routes = null,
        public readonly ?string $migrations = null,
        public readonly ?string $frontendBundle = null,
        public readonly array $capabilities = [],
        public readonly array $permissions = [],
        public readonly array $tools = [],
        public readonly array $requires = [],
        public readonly array $raw = [],
    ) {}

    public static function fromFile(string $manifestPath): self
    {
        if (! is_file($manifestPath)) {
            throw new InvalidArgumentException("Plugin manifest not found: {$manifestPath}");
        }

        $raw = json_decode((string) file_get_contents($manifestPath), true, flags: JSON_THROW_ON_ERROR);

        if (! is_array($raw)) {
            throw new InvalidArgumentException("Plugin manifest must be a JSON object: {$manifestPath}");
        }

        foreach (['name', 'slug', 'version'] as $required) {
            if (empty($raw[$required]) || ! is_string($raw[$required])) {
                throw new InvalidArgumentException("Plugin manifest {$manifestPath} missing required string field: {$required}");
            }
        }

        return new self(
            name: $raw['name'],
            slug: $raw['slug'],
            version: $raw['version'],
            path: dirname($manifestPath),
            description: $raw['description'] ?? null,
            serviceProvider: $raw['service_provider'] ?? null,
            routes: $raw['routes'] ?? null,
            migrations: $raw['migrations'] ?? null,
            frontendBundle: $raw['frontend_bundle'] ?? null,
            capabilities: array_values((array) ($raw['capabilities'] ?? [])),
            permissions: array_values((array) ($raw['permissions'] ?? [])),
            tools: array_values((array) ($raw['tools'] ?? [])),
            requires: (array) ($raw['requires'] ?? []),
            raw: $raw,
        );
    }

    public function absolutePath(string $relative): string
    {
        return rtrim($this->path, DIRECTORY_SEPARATOR).DIRECTORY_SEPARATOR.ltrim($relative, DIRECTORY_SEPARATOR);
    }

    /**
     * @return array<string,mixed>
     */
    public function toArray(): array
    {
        return [
            'name' => $this->name,
            'slug' => $this->slug,
            'version' => $this->version,
            'description' => $this->description,
            'capabilities' => $this->capabilities,
            'permissions' => $this->permissions,
            'tools' => $this->tools,
            'requires' => $this->requires,
            'frontend_bundle' => $this->frontendBundle,
        ];
    }
}
