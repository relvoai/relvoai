<?php

namespace App\Models;

use App\Concerns\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property string $id
 * @property string $name
 * @property bool $is_active
 * @property array|null $working_hours
 * @property object|null $csat_config
 * @property object|null $auto_assignment_config
 * @property object|null $config
 */
class Inbox extends Model
{
    use BelongsToWorkspace, HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'name',
        'is_active',
        'avatar_path',

        // Greeting
        'greeting_enabled',
        'greeting_message',
        'working_hours_enabled',
        'timezone',
        'out_of_office_message',
        'working_hours',
        'csat_survey_enabled',
        'csat_config',
        'enable_auto_assignment',
        'auto_assignment_config',
        'allow_messages_after_resolved',
        'lock_to_single_conversation',
        'sender_name_type',
        'business_name',
        'callback_webhook_url',
        'config',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'greeting_enabled' => 'boolean',
        'working_hours_enabled' => 'boolean',
        'working_hours' => 'array',
        'csat_survey_enabled' => 'boolean',
        'csat_config' => 'array',
        'enable_auto_assignment' => 'boolean',
        'auto_assignment_config' => 'array',
        'allow_messages_after_resolved' => 'boolean',
        'lock_to_single_conversation' => 'boolean',
        'config' => 'array',
    ];

    public function channels()
    {
        return $this->hasMany(Channel::class);
    }

    public function agents()
    {
        return $this->belongsToMany(User::class, 'inbox_agents')
            ->using(InboxAgent::class)
            ->withTimestamps();
    }

    public function conversations()
    {
        return $this->hasMany(Conversation::class);
    }
}
