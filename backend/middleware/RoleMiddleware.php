<?php
// backend/middleware/RoleMiddleware.php
declare(strict_types=1);

namespace BikeFix\Middleware;

use BikeFix\Utils\Response;

class RoleMiddleware
{
    public static function check(array $user, array|string $allowedRoles): void
    {
        $allowed = is_array($allowedRoles) ? $allowedRoles : [$allowedRoles];
        if (!in_array($user['role'], $allowed, true)) {
            Response::error('Forbidden. You do not have permission to access this resource.', 403);
        }
    }
}
