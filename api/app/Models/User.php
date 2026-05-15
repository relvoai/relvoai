<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Concerns\BelongsToWorkspace;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laratrust\Traits\HasRolesAndPermissions;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use BelongsToWorkspace, HasApiTokens, HasFactory, HasRolesAndPermissions, HasUuids, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'first_name',
        'last_name',
        'username',
        'email',
        'password',
        'is_active',
        'last_login_at',
        'locale',
        'timezone',
        'telegram_bot_token',
        'telegram_chat_id',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'telegram_bot_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
            'last_login_at' => 'datetime',
            'telegram_bot_token' => 'encrypted',
        ];
    }

    /**
     * Route for the custom "telegram" notification channel.
     * Returns null when the user has not configured their bot, so the
     * channel is silently skipped.
     *
     * @return array{bot_token: string, chat_id: string}|null
     */
    public function routeNotificationForTelegram(): ?array
    {
        if (! $this->telegram_bot_token || ! $this->telegram_chat_id) {
            return null;
        }

        return [
            'bot_token' => (string) $this->telegram_bot_token,
            'chat_id' => (string) $this->telegram_chat_id,
        ];
    }

    public function departments()
    {
        return $this->belongsToMany(Department::class)->withPivot('role')->withTimestamps();
    }

    public function inboxes()
    {
        return $this->belongsToMany(Inbox::class, 'inbox_agents')
            ->using(InboxAgent::class)
            ->withTimestamps();
    }

    public function getNameAttribute(): string
    {
        return trim("{$this->first_name} {$this->last_name}") ?: $this->username ?: 'User';
    }
}
