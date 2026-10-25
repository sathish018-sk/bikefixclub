<?php
// backend/public/index.php
declare(strict_types=1);

// Error reporting configuration for development
error_reporting(E_ALL);
ini_set('display_errors', '0');
ini_set('log_errors', '1');

// Autoload internal classes
spl_autoload_register(function (string $class) {
    $prefix = 'BikeFix\\';
    if (str_starts_with($class, $prefix)) {
        $relativeClass = substr($class, strlen($prefix));
        $file = __DIR__ . '/../' . str_replace('\\', '/', $relativeClass) . '.php';
        if (file_exists($file)) {
            require_once $file;
        }
    }
});

use BikeFix\Config\Env;
use BikeFix\Config\Database;
use BikeFix\Middleware\AuthMiddleware;
use BikeFix\Middleware\RoleMiddleware;
use BikeFix\Controllers\AuthController;
use BikeFix\Controllers\PublicController;
use BikeFix\Controllers\CustomerController;
use BikeFix\Controllers\AdminController;
use BikeFix\Controllers\ReportController;
use BikeFix\Controllers\WebhookController;
use BikeFix\Utils\Response;
use BikeFix\Utils\PdfInvoice;

// 1. Load Environment Configuration
Env::load(__DIR__ . '/../.env');

// 2. CORS Handling
$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
header("Access-Control-Allow-Origin: {$origin}");
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Razorpay-Signature, Accept');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// 3. Request Normalization
$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?? '/';

// Normalize path when served through subdirectories
if (str_contains($uri, '/public/index.php')) {
    $uri = substr($uri, strpos($uri, '/public/index.php') + strlen('/public/index.php'));
} elseif (str_contains($uri, '/backend/public')) {
    $uri = substr($uri, strpos($uri, '/backend/public') + strlen('/backend/public'));
}
$uri = '/' . ltrim($uri, '/');

// Parse JSON Body
$body = [];
$contentType = $_SERVER['CONTENT_TYPE'] ?? $_SERVER['HTTP_CONTENT_TYPE'] ?? '';
if (str_contains($contentType, 'application/json')) {
    $rawInput = file_get_contents('php://input');
    if ($rawInput) {
        $parsed = json_decode($rawInput, true);
        if (is_array($parsed)) {
            $body = $parsed;
        }
    }
} else {
    $body = $_POST;
}

// Global Exception Handler
set_exception_handler(function (Throwable $e) {
    error_log('API Uncaught Exception: ' . $e->getMessage() . "\n" . $e->getTraceAsString());
    Response::error('An unexpected server error occurred. Please try again later.', 500);
});

// Helper for regex route matching
function matchRoute(string $pattern, string $uri, array &$params): bool {
    $regex = '#^' . preg_replace('#\{([a-zA-Z0-9_]+)\}#', '(?P<$1>[^/]+)', $pattern) . '$#';
    if (preg_match($regex, $uri, $matches)) {
        $params = array_filter($matches, 'is_string', ARRAY_FILTER_USE_KEY);
        return true;
    }
    return false;
}

$params = [];

// ====================================================================
// HEALTH CHECK
// ====================================================================
if ($uri === '/api/v1/health' && $method === 'GET') {
    try {
        $db = Database::getConnection();
        $version = $db->query('SELECT VERSION()')->fetchColumn();
        Response::json([
            'status' => 'healthy',
            'app' => 'BikeFix Club API',
            'tagline' => 'Your Bike. Your Club. Our Care.',
            'version' => '1.0.0',
            'database' => 'connected',
            'mysql_version' => $version,
            'timestamp' => date('c')
        ], 'API is online and healthy.');
    } catch (Exception $e) {
        Response::error('Database connection failed.', 500);
    }
}

// ====================================================================
// AUTHENTICATION ROUTES
// ====================================================================
if ($uri === '/api/v1/auth/register' && $method === 'POST') {
    AuthController::register($body);
}

if ($uri === '/api/v1/auth/login' && $method === 'POST') {
    AuthController::login($body);
}

if ($uri === '/api/v1/auth/me' && $method === 'GET') {
    $user = AuthMiddleware::authenticate();
    AuthController::me($user);
}

if ($uri === '/api/v1/auth/logout' && $method === 'POST') {
    AuthController::logout();
}

if ($uri === '/api/v1/auth/forgot-password' && $method === 'POST') {
    AuthController::forgotPassword($body);
}

if ($uri === '/api/v1/auth/reset-password' && $method === 'POST') {
    AuthController::resetPassword($body);
}

// ====================================================================
// PUBLIC ROUTES
// ====================================================================
if ($uri === '/api/v1/public/workshop-info' && $method === 'GET') {
    PublicController::getWorkshopInfo();
}

if ($uri === '/api/v1/public/service-categories' && $method === 'GET') {
    PublicController::getCategories();
}

if ($uri === '/api/v1/public/services' && $method === 'GET') {
    $categoryId = isset($_GET['category_id']) ? (int)$_GET['category_id'] : null;
    PublicController::getServices($categoryId);
}

if ($uri === '/api/v1/public/reviews' && $method === 'GET') {
    PublicController::getReviews();
}

if ($uri === '/api/v1/public/contact' && $method === 'POST') {
    PublicController::submitContact($body);
}

// ====================================================================
// PAYMENT GATEWAY WEBHOOK
// ====================================================================
if ($uri === '/api/v1/webhooks/payment-gateway' && $method === 'POST') {
    WebhookController::handlePaymentWebhook();
}

// ====================================================================
// CUSTOMER PORTAL ROUTES (Role: customer or admin)
// ====================================================================
if (str_starts_with($uri, '/api/v1/customer/')) {
    $user = AuthMiddleware::authenticate();

    // Profile
    if ($uri === '/api/v1/customer/profile') {
        if ($method === 'GET') CustomerController::getProfile($user);
        if ($method === 'PUT') CustomerController::updateProfile($user, $body);
    }

    // Bikes
    if ($uri === '/api/v1/customer/bikes') {
        if ($method === 'GET') CustomerController::getBikes($user);
        if ($method === 'POST') CustomerController::createBike($user, $body);
    }

    if (matchRoute('/api/v1/customer/bikes/{id}', $uri, $params)) {
        $id = (int)$params['id'];
        if ($method === 'GET') CustomerController::getBike($user, $id);
        if ($method === 'PUT') CustomerController::updateBike($user, $id, $body);
        if ($method === 'DELETE') CustomerController::deleteBike($user, $id);
    }

    // Bookings
    if ($uri === '/api/v1/customer/bookings') {
        if ($method === 'GET') CustomerController::getBookings($user);
        if ($method === 'POST') CustomerController::createBooking($user, $body);
    }

    if (matchRoute('/api/v1/customer/bookings/{id}', $uri, $params)) {
        $id = (int)$params['id'];
        if ($method === 'GET') CustomerController::getBooking($user, $id);
    }

    if (matchRoute('/api/v1/customer/bookings/{id}/cancel', $uri, $params) && $method === 'POST') {
        CustomerController::cancelBooking($user, (int)$params['id'], $body);
    }

    if (matchRoute('/api/v1/customer/bookings/{id}/reschedule', $uri, $params) && $method === 'POST') {
        CustomerController::rescheduleBooking($user, (int)$params['id'], $body);
    }

    // Service Tracking & History
    if ($uri === '/api/v1/customer/service-history' && $method === 'GET') {
        CustomerController::getServiceHistory($user);
    }

    if (matchRoute('/api/v1/customer/job-cards/{id}', $uri, $params) && $method === 'GET') {
        CustomerController::getJobCardTracking($user, (int)$params['id']);
    }

    // Invoices & Payments
    if ($uri === '/api/v1/customer/invoices' && $method === 'GET') {
        CustomerController::getInvoices($user);
    }

    if (matchRoute('/api/v1/customer/invoices/{id}', $uri, $params) && $method === 'GET') {
        CustomerController::getInvoice($user, (int)$params['id']);
    }

    if (matchRoute('/api/v1/customer/invoices/{id}/pdf', $uri, $params) && $method === 'GET') {
        // Render print-friendly HTML view
        $db = Database::getConnection();
        $stmt = $db->prepare('
            SELECT inv.*,
                   jc.job_card_reference, jc.initial_odometer, jc.final_odometer,
                   b.brand as bike_brand, b.model as bike_model, b.registration_number, b.variant,
                   u.name as customer_name, u.email as customer_email, u.phone as customer_phone,
                   cp.address as customer_address, cp.city as customer_city, cp.state as customer_state, cp.postal_code as customer_postal_code
            FROM invoices inv
            JOIN job_cards jc ON inv.job_card_id = jc.id
            JOIN bikes b ON jc.bike_id = b.id
            JOIN users u ON inv.customer_user_id = u.id
            LEFT JOIN customer_profiles cp ON u.id = cp.user_id
            WHERE inv.id = ? AND inv.customer_user_id = ?
            LIMIT 1
        ');
        $stmt->execute([(int)$params['id'], $user['id']]);
        $inv = $stmt->fetch();
        if (!$inv) Response::error('Invoice not found or access denied.', 404);

        $itemsStmt = $db->prepare('SELECT * FROM invoice_items WHERE invoice_id = ?');
        $itemsStmt->execute([(int)$params['id']]);
        $inv['items'] = $itemsStmt->fetchAll();

        $payStmt = $db->prepare('SELECT * FROM payments WHERE invoice_id = ?');
        $payStmt->execute([(int)$params['id']]);
        $inv['payments'] = $payStmt->fetchAll();

        header('Content-Type: text/html; charset=utf-8');
        echo PdfInvoice::renderHtml($inv);
        exit;
    }

    if (matchRoute('/api/v1/customer/invoices/{id}/payment-orders', $uri, $params) && $method === 'POST') {
        CustomerController::createPaymentOrder($user, (int)$params['id'], $body);
    }

    if (matchRoute('/api/v1/customer/payments/{id}/verify', $uri, $params) && $method === 'POST') {
        CustomerController::verifyPayment($user, (int)$params['id'], $body);
    }

    if ($uri === '/api/v1/customer/payments' && $method === 'GET') {
        CustomerController::getPayments($user);
    }

    // Reviews
    if ($uri === '/api/v1/customer/reviews' && $method === 'GET') {
        CustomerController::getReviews($user);
    }

    if (matchRoute('/api/v1/customer/bookings/{id}/review', $uri, $params) && $method === 'POST') {
        CustomerController::submitReview($user, (int)$params['id'], $body);
    }

    // Notifications
    if ($uri === '/api/v1/customer/notifications' && $method === 'GET') {
        CustomerController::getNotifications($user);
    }

    if (matchRoute('/api/v1/customer/notifications/{id}/read', $uri, $params) && $method === 'PATCH') {
        CustomerController::markNotificationRead($user, (int)$params['id']);
    }

    if ($uri === '/api/v1/customer/notifications/read-all' && $method === 'POST') {
        CustomerController::markAllNotificationsRead($user);
    }
}

// ====================================================================
// ADMIN PORTAL ROUTES (Role: admin)
// ====================================================================
if (str_starts_with($uri, '/api/v1/admin/')) {
    $admin = AuthMiddleware::authenticate();
    RoleMiddleware::check($admin, 'admin');

    // Dashboard
    if ($uri === '/api/v1/admin/dashboard' && $method === 'GET') {
        AdminController::getDashboard();
    }

    // Reports
    if ($uri === '/api/v1/admin/reports/revenue' && $method === 'GET') {
        ReportController::getRevenueReport();
    }
    if ($uri === '/api/v1/admin/reports/bookings' && $method === 'GET') {
        ReportController::getBookingsReport();
    }
    if ($uri === '/api/v1/admin/reports/inventory' && $method === 'GET') {
        ReportController::getInventoryReport();
    }
    if ($uri === '/api/v1/admin/reports/mechanics' && $method === 'GET') {
        ReportController::getMechanicPerformance();
    }
    if ($uri === '/api/v1/admin/reports/export' && $method === 'GET') {
        ReportController::exportCsv();
    }

    // Customers
    if ($uri === '/api/v1/admin/customers' && $method === 'GET') {
        AdminController::getCustomers();
    }
    if (matchRoute('/api/v1/admin/customers/{id}', $uri, $params) && $method === 'GET') {
        AdminController::getCustomer((int)$params['id']);
    }
    if (matchRoute('/api/v1/admin/customers/{id}/status', $uri, $params) && $method === 'PATCH') {
        AdminController::updateCustomerStatus((int)$params['id'], $body);
    }
    if ($uri === '/api/v1/admin/walk-in' && $method === 'POST') {
        AdminController::registerWalkInCustomer($body);
    }

    // Bookings
    if ($uri === '/api/v1/admin/bookings') {
        if ($method === 'GET') AdminController::getBookings();
    }
    if (matchRoute('/api/v1/admin/bookings/{id}', $uri, $params) && $method === 'GET') {
        AdminController::getBooking((int)$params['id']);
    }
    if (matchRoute('/api/v1/admin/bookings/{id}/status', $uri, $params) && $method === 'PATCH') {
        AdminController::updateBookingStatus($admin, (int)$params['id'], $body);
    }

    // Job Cards
    if ($uri === '/api/v1/admin/job-cards') {
        if ($method === 'GET') AdminController::getJobCards();
        if ($method === 'POST') AdminController::createJobCard($admin, $body);
    }
    if (matchRoute('/api/v1/admin/job-cards/{id}', $uri, $params)) {
        $id = (int)$params['id'];
        if ($method === 'GET') AdminController::getJobCard($id);
        if ($method === 'PATCH') AdminController::updateJobCard($admin, $id, $body);
    }
    if (matchRoute('/api/v1/admin/job-cards/{id}/status', $uri, $params) && $method === 'PATCH') {
        AdminController::updateJobCardStatus($admin, (int)$params['id'], $body);
    }
    if (matchRoute('/api/v1/admin/job-cards/{id}/services', $uri, $params) && $method === 'POST') {
        AdminController::addJobCardService((int)$params['id'], $body);
    }
    if (matchRoute('/api/v1/admin/job-cards/{id}/parts', $uri, $params) && $method === 'POST') {
        AdminController::addJobCardPart($admin, (int)$params['id'], $body);
    }
    if (matchRoute('/api/v1/admin/job-cards/{id}/deliver', $uri, $params) && $method === 'POST') {
        AdminController::deliverJobCard($admin, (int)$params['id'], $body);
    }
    if (matchRoute('/api/v1/admin/job-cards/{id}/invoice', $uri, $params) && $method === 'POST') {
        AdminController::generateInvoice($admin, (int)$params['id'], $body);
    }

    // Invoices & Billing
    if ($uri === '/api/v1/admin/invoices' && $method === 'GET') {
        AdminController::getInvoices();
    }
    if (matchRoute('/api/v1/admin/invoices/{id}', $uri, $params) && $method === 'GET') {
        AdminController::getInvoice((int)$params['id']);
    }
    if (matchRoute('/api/v1/admin/invoices/{id}/pdf', $uri, $params) && $method === 'GET') {
        $db = Database::getConnection();
        $stmt = $db->prepare('
            SELECT inv.*,
                   jc.job_card_reference, jc.initial_odometer, jc.final_odometer,
                   b.brand as bike_brand, b.model as bike_model, b.registration_number, b.variant,
                   u.name as customer_name, u.email as customer_email, u.phone as customer_phone,
                   cp.address as customer_address, cp.city as customer_city, cp.state as customer_state, cp.postal_code as customer_postal_code
            FROM invoices inv
            JOIN job_cards jc ON inv.job_card_id = jc.id
            JOIN bikes b ON jc.bike_id = b.id
            JOIN users u ON inv.customer_user_id = u.id
            LEFT JOIN customer_profiles cp ON u.id = cp.user_id
            WHERE inv.id = ?
            LIMIT 1
        ');
        $stmt->execute([(int)$params['id']]);
        $inv = $stmt->fetch();
        if (!$inv) Response::error('Invoice not found.', 404);

        $itemsStmt = $db->prepare('SELECT * FROM invoice_items WHERE invoice_id = ?');
        $itemsStmt->execute([(int)$params['id']]);
        $inv['items'] = $itemsStmt->fetchAll();

        $payStmt = $db->prepare('SELECT * FROM payments WHERE invoice_id = ?');
        $payStmt->execute([(int)$params['id']]);
        $inv['payments'] = $payStmt->fetchAll();

        header('Content-Type: text/html; charset=utf-8');
        echo PdfInvoice::renderHtml($inv);
        exit;
    }
    if (matchRoute('/api/v1/admin/invoices/{id}/record-payment', $uri, $params) && $method === 'POST') {
        AdminController::recordPayment($admin, (int)$params['id'], $body);
    }
    if ($uri === '/api/v1/admin/payments' && $method === 'GET') {
        AdminController::getPayments();
    }

    // Mechanics
    if ($uri === '/api/v1/admin/mechanics') {
        if ($method === 'GET') AdminController::getMechanics();
        if ($method === 'POST') AdminController::createMechanic($body);
    }
    if (matchRoute('/api/v1/admin/mechanics/{id}', $uri, $params) && $method === 'PUT') {
        AdminController::updateMechanic((int)$params['id'], $body);
    }

    // Services Catalogue
    if ($uri === '/api/v1/admin/services') {
        if ($method === 'GET') AdminController::getServices();
        if ($method === 'POST') AdminController::createService($body);
    }
    if (matchRoute('/api/v1/admin/services/{id}', $uri, $params) && $method === 'PUT') {
        AdminController::updateService((int)$params['id'], $body);
    }

    // Spare Parts & Inventory
    if ($uri === '/api/v1/admin/parts') {
        if ($method === 'GET') AdminController::getParts();
        if ($method === 'POST') AdminController::createPart($admin, $body);
    }
    if (matchRoute('/api/v1/admin/parts/{id}', $uri, $params) && $method === 'PUT') {
        AdminController::updatePart((int)$params['id'], $body);
    }
    if (matchRoute('/api/v1/admin/parts/{id}/stock-adjustments', $uri, $params) && $method === 'POST') {
        AdminController::recordStockAdjustment($admin, (int)$params['id'], $body);
    }
    if ($uri === '/api/v1/admin/stock-movements' && $method === 'GET') {
        AdminController::getStockMovements();
    }

    // Expenses
    if ($uri === '/api/v1/admin/expenses') {
        if ($method === 'GET') AdminController::getExpenses();
        if ($method === 'POST') AdminController::createExpense($admin, $body);
    }

    // Reviews Moderation
    if ($uri === '/api/v1/admin/reviews' && $method === 'GET') {
        AdminController::getReviews();
    }
    if (matchRoute('/api/v1/admin/reviews/{id}/moderation', $uri, $params) && $method === 'PATCH') {
        AdminController::moderateReview((int)$params['id'], $body);
    }
    if (matchRoute('/api/v1/admin/reviews/{id}/response', $uri, $params) && $method === 'POST') {
        AdminController::respondReview($admin, (int)$params['id'], $body);
    }

    // Settings
    if ($uri === '/api/v1/admin/settings') {
        if ($method === 'GET') AdminController::getSettings();
        if ($method === 'PUT') AdminController::updateSettings($admin, $body);
    }
}

// Route Not Found
Response::error("Resource not found for {$method} {$uri}", 404);
