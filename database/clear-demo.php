<?php
// database/clear-demo.php
declare(strict_types=1);

require_once __DIR__ . '/../backend/config/Env.php';
require_once __DIR__ . '/../backend/config/Database.php';

use BikeFix\Config\Env;
use BikeFix\Config\Database;

Env::load(__DIR__ . '/../backend/.env');

echo "====================================================\n";
echo "BikeFix Club — Database Cleanup: Purging Demo Records\n";
echo "====================================================\n";

try {
    $pdo = Database::getConnection();

    echo "Reading database/clear-demo-records.sql...\n";
    $sql = file_get_contents(__DIR__ . '/clear-demo-records.sql');
    if ($sql === false) {
        throw new RuntimeException("Could not read clear-demo-records.sql");
    }

    echo "Executing cleanup statements...\n";
    $pdo->exec($sql);
    echo "✓ Demo and old records cleared successfully.\n\n";

    echo "=== Current Database State Verification ===\n";
    $tables = [
        'users',
        'customer_profiles',
        'mechanics',
        'bikes',
        'bookings',
        'booking_services',
        'job_cards',
        'job_card_services',
        'job_card_parts',
        'invoices',
        'invoice_items',
        'payments',
        'reviews',
        'expenses',
        'notifications',
        'spare_parts',
        'stock_movements',
        'service_categories',
        'services',
        'workshop_settings'
    ];

    foreach ($tables as $t) {
        $count = $pdo->query("SELECT COUNT(*) FROM `{$t}`")->fetchColumn();
        echo " - {$t}: {$count} records\n";
    }

    echo "\n=== Preserved Admin User Login ===\n";
    $admin = $pdo->query("SELECT id, name, email, phone, role, account_status FROM users WHERE role = 'admin'")->fetch();
    if ($admin) {
        echo " ✓ Admin Account Confirmed:\n";
        echo "   ID:       {$admin['id']}\n";
        echo "   Name:     {$admin['name']}\n";
        echo "   Email:    {$admin['email']}\n";
        echo "   Phone:    {$admin['phone']}\n";
        echo "   Role:     {$admin['role']}\n";
        echo "   Status:   {$admin['account_status']}\n";
    } else {
        echo " ❌ ERROR: Admin account not found!\n";
    }

    echo "\n✓ Cleanup complete! The project is now clean with only the Admin account and master catalog.\n";
} catch (Exception $e) {
    echo "❌ Cleanup failed: " . $e->getMessage() . "\n";
    exit(1);
}
