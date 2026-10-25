<?php
// backend/tests/api_test.php
declare(strict_types=1);

require_once __DIR__ . '/../config/Env.php';
require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../utils/JwtHelper.php';
require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../utils/Validator.php';

use BikeFix\Config\Env;
use BikeFix\Config\Database;
use BikeFix\Utils\JwtHelper;

Env::load(__DIR__ . '/../.env');

echo "====================================================\n";
echo "BikeFix Club — Backend Test Suite Execution\n";
echo "====================================================\n";

$passCount = 0;
$failCount = 0;

function assertTest(string $description, bool $condition): void {
    global $passCount, $failCount;
    if ($condition) {
        echo "  [PASS] {$description}\n";
        $passCount++;
    } else {
        echo "  [FAIL] {$description}\n";
        $failCount++;
    }
}

// 1. Test Database Connectivity
echo "\nTest Group 1: Database Connectivity\n";
try {
    $db = Database::getConnection();
    $version = $db->query("SELECT VERSION()")->fetchColumn();
    assertTest("Database connected to MySQL version: {$version}", !empty($version));

    $tableCount = (int)$db->query("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'bikefix_club'")->fetchColumn();
    assertTest("Database contains 24 required tables (found: {$tableCount})", $tableCount === 24);
} catch (Exception $e) {
    assertTest("Database connection failed: " . $e->getMessage(), false);
}

// 2. Test JWT Generation and Verification
echo "\nTest Group 2: Authentication & Security Tokens\n";
$payload = ['sub' => 1, 'email' => 'admin@bikefixclub.com', 'role' => 'admin'];
$token = JwtHelper::generateToken($payload, 3600);
assertTest("JWT token successfully generated", !empty($token) && substr_count($token, '.') === 2);

$decoded = JwtHelper::verifyToken($token);
assertTest("JWT token decodes correctly with matching payload", $decoded !== null && $decoded['sub'] === 1 && $decoded['role'] === 'admin');

$invalidDecoded = JwtHelper::verifyToken($token . "tampered");
assertTest("Tampered JWT signature is rejected", $invalidDecoded === null);

// 3. Test Admin Account & Role Permissions
echo "\nTest Group 3: User Accounts & Role Permissions\n";
$adminUser = $db->query("SELECT * FROM users WHERE email = 'admin@bikefixclub.com'")->fetch();
assertTest("Admin account exists", !empty($adminUser));
assertTest("Admin role is strictly 'admin'", $adminUser && $adminUser['role'] === 'admin');
assertTest("Admin password verification succeeds for 'password123'", $adminUser && password_verify('password123', $adminUser['password_hash']));

$customerUser = $db->query("SELECT * FROM users WHERE role = 'customer' LIMIT 1")->fetch();
if ($customerUser) {
    assertTest("Customer account role is 'customer'", $customerUser['role'] === 'customer');
} else {
    assertTest("Clean state confirmed: No stale/demo customer accounts exist", true);
}

// 4. Test Customer Bikes
echo "\nTest Group 4: Motorcycle Records\n";
if ($customerUser) {
    $bikes = $db->query("SELECT * FROM bikes WHERE customer_user_id = {$customerUser['id']}")->fetchAll();
    assertTest("Customer has registered motorcycles", count($bikes) >= 1);
    assertTest("Bike has registration number format", !empty($bikes[0]['registration_number']));
} else {
    $bikeCount = (int)$db->query("SELECT COUNT(*) FROM bikes")->fetchColumn();
    assertTest("Clean state confirmed: Demo motorcycle records cleared (count: {$bikeCount})", $bikeCount === 0);
}

// 5. Test Services Catalogue & Pricing
echo "\nTest Group 5: Service Catalogue & Spare Parts\n";
$services = $db->query("SELECT * FROM services WHERE is_active = 1")->fetchAll();
assertTest("Active services are seeded in catalogue (found: " . count($services) . ")", count($services) >= 10);

$parts = $db->query("SELECT * FROM spare_parts WHERE is_active = 1")->fetchAll();
assertTest("Active spare parts seeded in inventory (found: " . count($parts) . ")", count($parts) >= 8);

// 6. Test Invoicing and Calculations
echo "\nTest Group 6: Authoritative Invoicing & Monetary Accuracy\n";
$invoice = $db->query("SELECT * FROM invoices LIMIT 1")->fetch();
if ($invoice) {
    $expectedTotal = round(((float)$invoice['subtotal'] - (float)$invoice['discount']) * 1.18, 2);
    assertTest("Invoice total matches subtotal - discount + 18% GST (Calculated: {$expectedTotal}, Actual: {$invoice['total_amount']})", abs($expectedTotal - (float)$invoice['total_amount']) < 0.05);
} else {
    $invoiceCount = (int)$db->query("SELECT COUNT(*) FROM invoices")->fetchColumn();
    assertTest("Clean state confirmed: Demo invoices cleared (count: {$invoiceCount})", $invoiceCount === 0);
}

// 7. Test Review Eligibility Rules / Clean State
echo "\nTest Group 7: Review Eligibility & Transaction State\n";
$bookingCount = (int)$db->query("SELECT COUNT(*) FROM bookings")->fetchColumn();
$jobCardCount = (int)$db->query("SELECT COUNT(*) FROM job_cards")->fetchColumn();
$reviewCount = (int)$db->query("SELECT COUNT(*) FROM reviews")->fetchColumn();
assertTest("Operational transactions cleared (Bookings: {$bookingCount}, Job Cards: {$jobCardCount}, Reviews: {$reviewCount})", $bookingCount === 0 && $jobCardCount === 0 && $reviewCount === 0);

// 8. Test Workshop Settings
echo "\nTest Group 8: Workshop Identity & Contact Settings\n";
$workshopName = $db->query("SELECT setting_value FROM workshop_settings WHERE setting_key = 'workshop_name'")->fetchColumn();
assertTest("Brand name is strictly 'BikeFix Club'", $workshopName === 'BikeFix Club');

$workshopPhone = $db->query("SELECT setting_value FROM workshop_settings WHERE setting_key = 'workshop_phone'")->fetchColumn();
assertTest("Workshop phone is strictly '9597881218'", $workshopPhone === '9597881218');

$workshopAddress = $db->query("SELECT setting_value FROM workshop_settings WHERE setting_key = 'workshop_address'")->fetchColumn();
assertTest("Workshop address is '2/2, RS Puram, Aruppukkottai'", $workshopAddress === '2/2, RS Puram, Aruppukkottai');

$tagline = $db->query("SELECT setting_value FROM workshop_settings WHERE setting_key = 'tagline'")->fetchColumn();
assertTest("Official tagline is 'Your Bike. Your Club. Our Care.'", $tagline === 'Your Bike. Your Club. Our Care.');

echo "\n====================================================\n";
echo "Test Execution Summary: {$passCount} Passed, {$failCount} Failed\n";
echo "====================================================\n";

if ($failCount > 0) {
    exit(1);
}
