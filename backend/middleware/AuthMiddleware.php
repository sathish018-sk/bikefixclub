<?php
// backend/middleware/AuthMiddleware.php
declare(strict_types=1);

namespace BikeFix\Middleware;

use BikeFix\Config\Database;
use BikeFix\Utils\JwtHelper;
use BikeFix\Utils\Response;
use PDO;

class AuthMiddleware
{
    public static function authenticate(): array
    {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';

        if (!$authHeader || !preg_match('/Bearer\s(\S+)/i', $authHeader, $matches)) {
            Response::error('Authentication required. Missing or malformed Bearer token.', 401);
        }

        $token = $matches[1];
        $payload = JwtHelper::verifyToken($token);

        if (!$payload || !isset($payload['sub'])) {
            Response::error('Invalid or expired authentication token. Please log in again.', 401);
        }

        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT id, name, email, phone, role, account_status FROM users WHERE id = ? LIMIT 1');
        $stmt->execute([$payload['sub']]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            Response::error('User account not found.', 401);
        }

        if ($user['account_status'] !== 'active') {
            Response::error('Your account is currently inactive or suspended. Please contact workshop administration.', 403);
        }

        return $user;
    }
}
