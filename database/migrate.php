<?php
// database/migrate.php
declare(strict_types=1);

require_once __DIR__ . '/../backend/config/Env.php';
use BikeFix\Config\Env;

if (file_exists(__DIR__ . '/../backend/.env')) {
    Env::load(__DIR__ . '/../backend/.env');
}

$host = Env::get('DB_HOST', '127.0.0.1');
$port = Env::get('DB_PORT', '3306');
$user = Env::get('DB_USER', 'root');
$pass = Env::get('DB_PASS', 'sathish');
$dbname = Env::get('DB_NAME', 'bikefix_club');

$withDemo = in_array('--demo', $argv ?? [], true);

try {
    echo "Connecting to MySQL server at {$host}:{$port}...\n";
    $pdo = new PDO("mysql:host={$host};port={$port}", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::MYSQL_ATTR_MULTI_STATEMENTS => true,
    ]);

    echo "Creating database `{$dbname}` if not exists...\n";
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `{$dbname}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;");
    $pdo->exec("USE `{$dbname}`;");

    echo "Importing schema from database/schema.sql...\n";
    $schemaSql = file_get_contents(__DIR__ . '/schema.sql');
    if ($schemaSql === false) {
        throw new RuntimeException("Could not read schema.sql");
    }
    $pdo->exec($schemaSql);
    echo "✓ Schema imported successfully.\n";

    if ($withDemo) {
        echo "Importing development demo seed data from database/seed-development.sql...\n";
        $seedFile = __DIR__ . '/seed-development.sql';
    } else {
        echo "Importing clean seed data (Admin only, no demo records) from database/seed-clean.sql...\n";
        $seedFile = __DIR__ . '/seed-clean.sql';
    }

    $seedSql = file_get_contents($seedFile);
    if ($seedSql === false) {
        throw new RuntimeException("Could not read {$seedFile}");
    }
    $pdo->exec($seedSql);
    echo "✓ Seed data imported successfully.\n";

    $stmt = $pdo->query("SHOW TABLES;");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo "\n=== Verification Summary ===\n";
    echo "Total tables created: " . count($tables) . "\n";
    foreach ($tables as $t) {
        $count = $pdo->query("SELECT COUNT(*) FROM `{$t}`")->fetchColumn();
        echo " - {$t}: {$count} records\n";
    }

    echo "\n=== Admin Account ===\n";
    $admin = $pdo->query("SELECT id, name, email, phone, role FROM users WHERE role = 'admin'")->fetch(PDO::FETCH_ASSOC);
    if ($admin) {
        echo " ✓ Admin: {$admin['name']} ({$admin['email']}) - Role: {$admin['role']}\n";
    }

    echo "\n✓ Database initialization complete!\n";
} catch (Exception $e) {
    echo "❌ Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}
