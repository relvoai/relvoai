<?php
use App\Models\User;
use Illuminate\Support\Facades\Http;

$user = User::where('email', 'admin@test.com')->first();
$token = $user->createToken('debug')->plainTextToken;
$headers = ['Authorization' => 'Bearer ' . $token, 'Accept' => 'application/json'];

$res = Http::withHeaders($headers)->post('http://livechat.test/api/v1/admin/widgets', [
    'name' => 'Debug Widget',
    'domains' => ['example.com']
]);

echo "Status: " . $res->status() . "\n";
print_r($res->json());
if (isset($json['exception'])) {
    echo "Exception: " . $json['exception'] . "\n";
    echo "File: " . $json['file'] . " (" . $json['line'] . ")\n";
}
