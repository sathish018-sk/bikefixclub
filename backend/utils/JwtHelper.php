<?php
// backend/utils/JwtHelper.php
declare(strict_types=1);

namespace BikeFix\Utils;

use BikeFix\Config\Env;

class JwtHelper
{
    private static function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function base64UrlDecode(string $data): string|false
    {
        return base64_decode(strtr($data, '-_', '+/'));
    }

    public static function generateToken(array $payload, int $ttlSeconds = 604800): string
    {
        $secret = Env::get('JWT_SECRET', 'bikefix_club_default_secure_secret_key_2026');
        $header = [
            'typ' => 'JWT',
            'alg' => 'HS256'
        ];

        $now = time();
        $payload['iat'] = $now;
        $payload['exp'] = $now + $ttlSeconds;

        $base64Header = self::base64UrlEncode((string)json_encode($header));
        $base64Payload = self::base64UrlEncode((string)json_encode($payload));

        $signature = hash_hmac('sha256', "{$base64Header}.{$base64Payload}", $secret, true);
        $base64Signature = self::base64UrlEncode($signature);

        return "{$base64Header}.{$base64Payload}.{$base64Signature}";
    }

    public static function verifyToken(string $token): ?array
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return null;
        }

        [$base64Header, $base64Payload, $base64Signature] = $parts;

        $secret = Env::get('JWT_SECRET', 'bikefix_club_default_secure_secret_key_2026');
        $expectedSignature = self::base64UrlEncode(hash_hmac('sha256', "{$base64Header}.{$base64Payload}", $secret, true));

        if (!hash_equals($expectedSignature, $base64Signature)) {
            return null;
        }

        $payloadJson = self::base64UrlDecode($base64Payload);
        if ($payloadJson === false) {
            return null;
        }

        $payload = json_decode($payloadJson, true);
        if (!is_array($payload)) {
            return null;
        }

        if (isset($payload['exp']) && time() > $payload['exp']) {
            return null; // Expired
        }

        return $payload;
    }
}
