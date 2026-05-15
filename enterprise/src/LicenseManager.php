<?php

namespace App\Enterprise;

use Illuminate\Contracts\Config\Repository as Config;

/**
 * Resolves and validates the Enterprise license key.
 *
 * Single source of truth read by EnterpriseServiceProvider (to decide whether
 * to register Enterprise features), RequireValidLicense middleware (to gate
 * Enterprise HTTP routes with a 402 when invalid), and the admin license
 * endpoint (so the SPA conditionally renders Enterprise UI).
 *
 * Validation rules — intentionally simple in OSS:
 *   1. No key set → invalid.
 *   2. Keys starting with `test-` are accepted unless `APP_ENV=production`.
 *   3. Otherwise the key must validate against the registered remote
 *      validator callback (Cloud overlay installs one); without a validator
 *      installed, only the test-key path can authorize.
 *
 * The result is cached per-request to keep call sites cheap.
 */
class LicenseManager
{
    protected ?bool $cached = null;

    /** @var callable|null */
    protected $remoteValidator = null;

    public function __construct(protected Config $config) {}

    public function key(): ?string
    {
        $key = (string) ($this->config->get('enterprise.license_key') ?? '');

        return $key === '' ? null : $key;
    }

    public function isValid(): bool
    {
        if ($this->cached !== null) {
            return $this->cached;
        }

        return $this->cached = $this->evaluate();
    }

    /**
     * Drop the cached evaluation. Tests use this to flip envs mid-process.
     */
    public function flush(): void
    {
        $this->cached = null;
    }

    /**
     * Returns the structured status payload exposed via /api/v1/admin/license.
     *
     * @return array{valid: bool, edition: 'community'|'enterprise', mode: 'missing'|'test'|'remote'}
     */
    public function status(): array
    {
        $key = $this->key();
        $valid = $this->isValid();

        $mode = match (true) {
            $key === null => 'missing',
            str_starts_with($key, 'test-') => 'test',
            default => 'remote',
        };

        return [
            'valid' => $valid,
            'edition' => $valid ? 'enterprise' : 'community',
            'mode' => $mode,
        ];
    }

    /**
     * Cloud overlay (or tests) can register a callable that takes the raw key
     * and returns bool. Without this, only `test-*` keys authorize.
     */
    public function setRemoteValidator(?callable $validator): void
    {
        $this->remoteValidator = $validator;
        $this->cached = null;
    }

    protected function evaluate(): bool
    {
        $key = $this->key();

        if ($key === null) {
            return false;
        }

        $env = (string) $this->config->get('app.env', 'production');

        if (str_starts_with($key, 'test-') && $env !== 'production') {
            return true;
        }

        if ($this->remoteValidator !== null) {
            return (bool) call_user_func($this->remoteValidator, $key);
        }

        return false;
    }
}
