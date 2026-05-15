<?php

namespace App\Docs;

use Dedoc\Scramble\Scramble;
use Dedoc\Scramble\Support\Generator\OpenApi;
use Dedoc\Scramble\Support\Generator\SecurityScheme;
use Illuminate\Support\Str;

class ScrambleConfig
{
    /**
     * Configure Scramble settings and hooks.
     */
    public static function configure(): void
    {
        Scramble::afterOpenApiGenerated(function (OpenApi $openApi) {
            static::configureSecurity($openApi);
            static::configureUsageGroups($openApi);
        });
    }

    /**
     * Add Bearer Auth security scheme.
     */
    protected static function configureSecurity(OpenApi $openApi): void
    {
        $openApi->secure(
            SecurityScheme::http('bearer')
        );
    }

    /**
     * Organize endpoints into Public and Auth groups.
     */
    protected static function configureUsageGroups(OpenApi $openApi): void
    {
        foreach ($openApi->paths as $pathItem) {
            $path = $pathItem->path;
            // Normalize path for matching (e.g., 'admin/users')
            $cleanPath = trim(str_replace('api/v1', '', $path), '/');

            foreach ($pathItem->operations as $method => $operation) {
                $operation->tags = static::resolveTags($cleanPath);
            }
        }
    }

    /**
     * Resolve tags based on the URI path.
     */
    protected static function resolveTags(string $path): array
    {
        // 1. Setup
        if (Str::contains($path, 'channel-types')) {
            return ['Setup'];
        }

        // 3. Widget SDK
        if (Str::startsWith($path, 'public/widget')) {
            return ['Widget SDK'];
        }

        // 4. Auth / Management
        if (Str::startsWith($path, 'inboxes')) {
            return ['Inbox Management'];
        }

        if (Str::startsWith($path, 'channels')) {
            return ['Channel Management'];
        }

        if (Str::startsWith($path, 'admin')) {
            if (Str::contains($path, 'users')) {
                return ['Admin: Users'];
            }
            if (Str::contains($path, 'departments')) {
                return ['Admin: Departments'];
            }
            if (Str::contains($path, 'settings')) {
                return ['Admin: Settings'];
            }
            if (Str::contains($path, 'reports')) {
                return ['Admin: Reports'];
            }
            if (Str::contains($path, 'canned-replies')) {
                return ['Admin: Canned Replies'];
            }
            if (Str::contains($path, 'conversations')) {
                return ['Admin: Conversations'];
            }

            return ['Admin: General'];
        }

        // 4. Auth
        if (Str::contains($path, ['login', 'me', 'logout'])) {
            return ['Authentication'];
        }

        return ['General'];
    }
}
