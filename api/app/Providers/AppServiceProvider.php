<?php

namespace App\Providers;

use App\Docs\ScrambleConfig;
use App\Models\Message;
use App\Observers\MessageObserver;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        ScrambleConfig::configure();

        Message::observe(MessageObserver::class);

        $this->configureRateLimiters();
    }

    /**
     * Register named rate limiters used across API routes.
     *
     * Public widget limiters key by channel_key + IP so a single abusive
     * visitor cannot exhaust quota for the whole widget, and a single
     * widget cannot be brute-forced from one IP.
     */
    protected function configureRateLimiters(): void
    {
        RateLimiter::for('widget-bootstrap', function (Request $request) {
            return Limit::perMinute((int) config('ratelimit.widget_bootstrap', 30))
                ->by($this->widgetKeyFor($request).'|'.$request->ip());
        });

        RateLimiter::for('widget-message', function (Request $request) {
            return Limit::perMinute((int) config('ratelimit.widget_message', 60))
                ->by($this->widgetKeyFor($request).'|'.$request->ip());
        });

        RateLimiter::for('widget-rating', function (Request $request) {
            return Limit::perMinute((int) config('ratelimit.widget_rating', 10))
                ->by($this->widgetKeyFor($request).'|'.$request->ip());
        });

        RateLimiter::for('login', function (Request $request) {
            return Limit::perMinute((int) config('ratelimit.login', 10))
                ->by(strtolower((string) $request->input('email')).'|'.$request->ip());
        });

        RateLimiter::for('telegram-webhook', function (Request $request) {
            return Limit::perMinute(600)->by('telegram|'.$request->ip());
        });
    }

    protected function widgetKeyFor(Request $request): string
    {
        return (string) ($request->header('X-Channel-Key') ?? $request->bearerToken() ?? 'anon');
    }
}
