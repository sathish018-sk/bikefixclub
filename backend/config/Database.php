<?php
// backend/config/Database.php
declare(strict_types=1);

namespace BikeFix\Config;

use PDO;
use PDOException;
use RuntimeException;

class Database
{
    private static ?PDO $instance = null;

    public static function getConnection(): PDO
    {
        if (self::$instance !== null) {
            return self::$instance;
        }

        $host = Env::get('DB_HOST', '127.0.0.1');
        $port = Env::get('DB_PORT', '3306');
        $dbname = Env::get('DB_NAME', 'bikefix_club');
        $username = Env::get('DB_USER', 'root');
        $password = Env::get('DB_PASS', 'sathish');
        $charset = Env::get('DB_CHARSET', 'utf8mb4');

        $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset={$charset}";

        try {
            $pdo = new PDO($dsn, $username, $password, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]);

            self::$instance = $pdo;
            return self::$instance;
        } catch (PDOException $e) {
            error_log("Database connection error: " . $e->getMessage());
            throw new RuntimeException("Database service is currently unavailable.");
        }
    }
}
