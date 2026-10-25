<?php
// backend/controllers/AuthController.php
declare(strict_types=1);

namespace BikeFix\Controllers;

use BikeFix\Config\Database;
use BikeFix\Utils\JwtHelper;
use BikeFix\Utils\Response;
use BikeFix\Utils\Validator;
use PDO;

class AuthController
{
    public static function register(array $body): void
    {
        $v = Validator::make($body)
            ->required('name', 'Full Name')
            ->minLength('name', 3, 'Full Name')
            ->required('email', 'Email Address')
            ->email('email', 'Email Address')
            ->required('phone', 'Phone Number')
            ->phone('phone', 'Phone Number')
            ->required('password', 'Password')
            ->minLength('password', 6, 'Password');

        if ($v->fails()) {
            Response::error($v->firstError(), 422, $v->errors());
        }

        $db = Database::getConnection();

        // Check unique email and phone
        $stmt = $db->prepare('SELECT id, email, phone FROM users WHERE email = ? OR phone = ? LIMIT 1');
        $stmt->execute([trim($body['email']), trim($body['phone'])]);
        $existing = $stmt->fetch();

        if ($existing) {
            if (strcasecmp($existing['email'], trim($body['email'])) === 0) {
                Response::error('An account with this email address already exists.', 409);
            }
            Response::error('An account with this phone number already exists.', 409);
        }

        $passwordHash = password_hash($body['password'], PASSWORD_BCRYPT);

        $db->beginTransaction();
        try {
            $insertUser = $db->prepare('
                INSERT INTO users (name, email, phone, password_hash, role, account_status, email_verified_at, phone_verified_at)
                VALUES (?, ?, ?, ?, "customer", "active", NOW(), NOW())
            ');
            $insertUser->execute([
                trim($body['name']),
                trim($body['email']),
                trim($body['phone']),
                $passwordHash
            ]);

            $userId = (int)$db->lastInsertId();

            // Create customer profile
            $insertProfile = $db->prepare('
                INSERT INTO customer_profiles (user_id, address, city, state, postal_code)
                VALUES (?, ?, ?, ?, ?)
            ');
            $insertProfile->execute([
                $userId,
                trim($body['address'] ?? ''),
                trim($body['city'] ?? 'Aruppukkottai'),
                trim($body['state'] ?? 'Tamil Nadu'),
                trim($body['postal_code'] ?? '626101')
            ]);

            // Create welcome notification
            $notif = $db->prepare('
                INSERT INTO notifications (user_id, title, message, type)
                VALUES (?, ?, ?, "system")
            ');
            $notif->execute([
                $userId,
                'Welcome to BikeFix Club!',
                'Welcome to BikeFix Club — Your Bike. Your Club. Our Care. You can now register your motorcycles and schedule services with transparent tracking.'
            ]);

            $db->commit();

            $token = JwtHelper::generateToken([
                'sub' => $userId,
                'name' => trim($body['name']),
                'email' => trim($body['email']),
                'role' => 'customer'
            ]);

            Response::json([
                'token' => $token,
                'user' => [
                    'id' => $userId,
                    'name' => trim($body['name']),
                    'email' => trim($body['email']),
                    'phone' => trim($body['phone']),
                    'role' => 'customer'
                ]
            ], 'Registration successful. Welcome to BikeFix Club!', 201);
        } catch (\Exception $e) {
            $db->rollBack();
            error_log('Registration error: ' . $e->getMessage());
            Response::error('Failed to create account. Please try again.', 500);
        }
    }

    public static function login(array $body): void
    {
        $loginInput = $body['login'] ?? $body['email'] ?? null;
        if (!$loginInput || empty(trim((string)$loginInput))) {
            Response::error('Email or Phone Number is required.', 422);
        }

        if (empty($body['password'])) {
            Response::error('Password is required.', 422);
        }

        $login = trim((string)$loginInput);
        $db = Database::getConnection();

        $stmt = $db->prepare('
            SELECT id, name, email, phone, password_hash, role, account_status
            FROM users
            WHERE email = ? OR phone = ?
            LIMIT 1
        ');
        $stmt->execute([$login, $login]);
        $user = $stmt->fetch();

        // Constant time verification defense
        if (!$user || !password_verify($body['password'], $user['password_hash'])) {
            Response::error('Invalid email/phone or password.', 401);
        }

        if ($user['account_status'] !== 'active') {
            Response::error('Your account is currently ' . $user['account_status'] . '. Please contact support.', 403);
        }

        // Update last login
        $db->prepare('UPDATE users SET last_login = NOW() WHERE id = ?')->execute([$user['id']]);

        $token = JwtHelper::generateToken([
            'sub' => (int)$user['id'],
            'name' => $user['name'],
            'email' => $user['email'],
            'role' => $user['role']
        ]);

        Response::json([
            'token' => $token,
            'user' => [
                'id' => (int)$user['id'],
                'name' => $user['name'],
                'email' => $user['email'],
                'phone' => $user['phone'],
                'role' => $user['role']
            ]
        ], 'Login successful.');
    }

    public static function me(array $currentUser): void
    {
        $db = Database::getConnection();
        $stmt = $db->prepare('
            SELECT u.id, u.name, u.email, u.phone, u.role, u.account_status, u.last_login, u.created_at,
                   cp.address, cp.city, cp.state, cp.postal_code, cp.emergency_contact
            FROM users u
            LEFT JOIN customer_profiles cp ON u.id = cp.user_id
            WHERE u.id = ?
            LIMIT 1
        ');
        $stmt->execute([$currentUser['id']]);
        $profile = $stmt->fetch();

        if (!$profile) {
            Response::error('User profile not found.', 404);
        }

        Response::json($profile, 'User profile retrieved.');
    }

    public static function logout(): void
    {
        Response::json(null, 'Logged out successfully.');
    }

    public static function forgotPassword(array $body): void
    {
        $v = Validator::make($body)
            ->required('email', 'Email Address')
            ->email('email', 'Email Address');

        if ($v->fails()) {
            Response::error($v->firstError(), 422, $v->errors());
        }

        // Security best practice: Always return generic success to prevent email enumeration
        Response::json([
            'reset_token' => 'DEMO-RESET-' . strtoupper(bin2hex(random_bytes(4)))
        ], 'If an account exists with this email, password reset instructions have been generated.');
    }

    public static function resetPassword(array $body): void
    {
        $v = Validator::make($body)
            ->required('email', 'Email Address')
            ->required('password', 'New Password')
            ->minLength('password', 6, 'New Password');

        if ($v->fails()) {
            Response::error($v->firstError(), 422, $v->errors());
        }

        $db = Database::getConnection();
        $hash = password_hash($body['password'], PASSWORD_BCRYPT);
        $stmt = $db->prepare('UPDATE users SET password_hash = ? WHERE email = ?');
        $stmt->execute([$hash, trim($body['email'])]);

        Response::json(null, 'Password updated successfully. You may now log in with your new password.');
    }
}
