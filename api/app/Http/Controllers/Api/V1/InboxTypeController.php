<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class InboxTypeController extends Controller
{
    /**
     * List Inbox Types
     *
     * Get a list of available inbox types.
     */
    public function __invoke(Request $request)
    {
        return response()->json([
            [
                'id' => 'email',
                'name' => 'Email',
                'description' => 'Connect via IMAP/SMTP',
                'icon' => 'InboxIcon',
            ],
            [
                'id' => 'whatsapp',
                'name' => 'WhatsApp',
                'description' => 'Connect WhatsApp Business API',
                'icon' => 'ChatBubbleLeftIcon',
            ],
            [
                'id' => 'sms',
                'name' => 'SMS',
                'description' => 'Connect Twilio or other SMS providers',
                'icon' => 'DevicePhoneMobileIcon',
            ],
            [
                'id' => 'api',
                'name' => 'API Channel',
                'description' => 'Custom integration via API',
                'icon' => 'CodeBracketIcon',
            ],
            [
                'id' => 'website',
                'name' => 'Website Widget',
                'description' => 'Live chat for your website',
                'icon' => 'GlobeAltIcon',
            ],
        ]);
    }
}
