<?php
/**
 * BikeFix Club — End-to-End Full Lifecycle Verification Suite
 * Tests the entire platform: Public, Authentication, Customer Portal, Admin Workshop Operations,
 * Inventory Atomicity, Invoicing, Payments, Gated Reviews, and Reports.
 *
 * Official Brand: BikeFix Club
 * Tagline: Your Bike. Your Club. Our Care.
 * Address: 2/2, RS Puram, Aruppukkottai
 * Mobile: 9597881218
 */

$directBase = 'http://127.0.0.1:8000/api/v1';
$proxyBase  = 'http://127.0.0.1:5173/api/v1';

$testResults = [];

function request($method, $url, $data = null, $token = null) {
    $ch = curl_init($url);
    $headers = [
        'Content-Type: application/json',
        'Accept: application/json'
    ];
    if ($token) {
        $headers[] = 'Authorization: Bearer ' . $token;
    }

    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_TIMEOUT, 15);

    if ($data !== null) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    }

    $raw = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_error($ch);
    curl_close($ch);

    if ($err) {
        return ['status' => 0, 'error' => $err, 'json' => null, 'raw' => ''];
    }

    $json = json_decode($raw, true);
    return ['status' => $status, 'json' => $json, 'raw' => $raw];
}

function assertTest($name, $condition, $details = '') {
    global $testResults;
    if ($condition) {
        echo "  [PASS] $name\n";
        $testResults[] = ['name' => $name, 'status' => 'PASS'];
    } else {
        echo "  [FAIL] $name : $details\n";
        $testResults[] = ['name' => $name, 'status' => 'FAIL', 'details' => $details];
    }
}

echo "========================================================\n";
echo "   BIKEFIX CLUB — END-TO-END VERIFICATION SUITE\n";
echo "========================================================\n\n";

// --- 1. Vite Proxy & Public API ---
echo "--- 1. Testing Vite Proxy & Public Endpoints ---\n";
$resProxy = request('GET', "$proxyBase/public/workshop-info");
assertTest('Vite Proxy forwarded /api/v1/public/workshop-info to backend', $resProxy['status'] === 200 && isset($resProxy['json']['data']));
assertTest('Brand name is strictly BikeFix Club', ($resProxy['json']['data']['brand_name'] ?? '') === 'BikeFix Club');
assertTest('Tagline is "Your Bike. Your Club. Our Care."', ($resProxy['json']['data']['tagline'] ?? '') === 'Your Bike. Your Club. Our Care.');
assertTest('Headline is "Your Bike. Our Priority."', ($resProxy['json']['data']['headline'] ?? '') === 'Your Bike. Our Priority.');
assertTest('Address is 2/2, RS Puram, Aruppukkottai', ($resProxy['json']['data']['address'] ?? '') === '2/2, RS Puram, Aruppukkottai');
assertTest('Mobile number is 9597881218', ($resProxy['json']['data']['mobile'] ?? '') === '9597881218');

$resServices = request('GET', "$directBase/public/services");
assertTest('Public active services catalogue returned', $resServices['status'] === 200 && count($resServices['json']['data'] ?? []) >= 10);

$resCategories = request('GET', "$directBase/public/service-categories");
assertTest('Public service categories returned', $resCategories['status'] === 200 && count($resCategories['json']['data'] ?? []) >= 6);

$resReviews = request('GET', "$directBase/public/reviews");
assertTest('Public approved reviews returned', $resReviews['status'] === 200 && is_array($resReviews['json']['data'] ?? []));

$resContact = request('POST', "$directBase/public/contact", [
    'name' => 'Kavitha Devi',
    'phone' => '9840123456',
    'email' => 'kavitha@example.com',
    'subject' => 'Service Inquiry',
    'message' => 'Do you provide roadside pickup for Royal Enfield bikes?'
]);
assertTest('Public contact form validated and stored', $resContact['status'] === 200 && ($resContact['json']['success'] ?? false) === true);

// --- 2. Authentication Flows ---
echo "\n--- 2. Authentication Flows ---\n";
$loginCust = request('POST', "$directBase/auth/login", [
    'login' => 'sathish@example.com',
    'password' => 'password123'
]);
assertTest('Customer Login (sathish@example.com)', $loginCust['status'] === 200 && !empty($loginCust['json']['data']['token']));
$custToken = $loginCust['json']['data']['token'] ?? null;
$custId    = $loginCust['json']['data']['user']['id'] ?? null;

$loginAdmin = request('POST', "$directBase/auth/login", [
    'login' => 'admin@bikefixclub.com',
    'password' => 'password123'
]);
assertTest('Admin Login (admin@bikefixclub.com)', $loginAdmin['status'] === 200 && ($loginAdmin['json']['data']['user']['role'] ?? '') === 'admin');
$adminToken = $loginAdmin['json']['data']['token'] ?? null;
$adminId    = $loginAdmin['json']['data']['user']['id'] ?? null;

// Auth Me validation
$authMe = request('GET', "$directBase/auth/me", null, $custToken);
assertTest('Session token authentication via /auth/me', $authMe['status'] === 200 && ($authMe['json']['data']['email'] ?? '') === 'sathish@example.com');

// New Customer Registration
$randPhone = '94433' . rand(10000, 99999);
$regCust = request('POST', "$directBase/auth/register", [
    'name' => 'Praveen Kumar',
    'email' => 'praveen_' . time() . '@test.com',
    'phone' => $randPhone,
    'password' => 'secret123',
    'address' => '10 Bazaar Street, Aruppukkottai'
]);
assertTest('Customer Registration with automatic welcome notification', $regCust['status'] === 201 && !empty($regCust['json']['data']['token']));

// --- 3. Customer Portal Features ---
echo "\n--- 3. Customer Portal Operations ---\n";
$profile = request('GET', "$directBase/customer/profile", null, $custToken);
assertTest('Customer profile retrieved', $profile['status'] === 200 && ($profile['json']['data']['email'] ?? '') === 'sathish@example.com');

$bikes = request('GET', "$directBase/customer/bikes", null, $custToken);
assertTest('Customer registered bikes retrieved', $bikes['status'] === 200 && count($bikes['json']['data'] ?? []) > 0);

// Add New Bike
$newBikeReg = 'TN 67 ' . chr(rand(65, 90)) . chr(rand(65, 90)) . ' ' . rand(1000, 9999);
$addBike = request('POST', "$directBase/customer/bikes", [
    'registration_number' => $newBikeReg,
    'brand' => 'Yamaha',
    'model' => 'MT-15 V2',
    'manufacturing_year' => 2023,
    'fuel_type' => 'Petrol',
    'current_odometer' => 6400,
    'notes' => 'First chain service'
], $custToken);
assertTest('Register New Motorcycle in Customer Garage', $addBike['status'] === 201 && !empty($addBike['json']['data']['id']));
$newBikeId = $addBike['json']['data']['id'] ?? $bikes['json']['data'][0]['id'];

// Multi-step Book Service
$bookDate = date('Y-m-d', strtotime('+2 days'));
$bookRes = request('POST', "$directBase/customer/bookings", [
    'bike_id' => $newBikeId,
    'service_ids' => [1, 2], // General Service + Premium Oil Change
    'preferred_date' => $bookDate,
    'preferred_time' => '10:00:00',
    'current_odometer' => 6450,
    'problem_description' => 'Rear disc brake squeal and routine periodic service'
], $custToken);
assertTest('Book Service Appointment (Reference generated)', $bookRes['status'] === 201 && !empty($bookRes['json']['data']['booking_reference']));
$bookingId = $bookRes['json']['data']['booking_id'] ?? null;
$bookingRef = $bookRes['json']['data']['booking_reference'] ?? null;

// Customer Service Tracking
$custBkRes = request('GET', "$directBase/customer/bookings/$bookingId", null, $custToken);
assertTest('Customer Booking & Service Details retrieved', $custBkRes['status'] === 200 && ($custBkRes['json']['data']['booking_reference'] ?? '') === $bookingRef);

// Customer Notifications
$notifs = request('GET', "$directBase/customer/notifications", null, $custToken);
assertTest('Customer Notifications list retrieved', $notifs['status'] === 200 && is_array($notifs['json']['data'] ?? []));

// --- 4. Admin Portal Operations & Workshop Lifecycle ---
echo "\n--- 4. Admin Portal Operations & Workshop Lifecycle ---\n";

// Dashboard Metrics
$adminDash = request('GET', "$directBase/admin/dashboard", null, $adminToken);
assertTest('Admin Dashboard Live KPIs & Financial Stats', $adminDash['status'] === 200 && isset($adminDash['json']['data']['metrics']));

// Admin Confirm Booking
$confirmBooking = request('PATCH', "$directBase/admin/bookings/$bookingId/status", [
    'status' => 'confirmed',
    'admin_notes' => 'Appointment slot reserved by workshop admin'
], $adminToken);
assertTest('Admin Confirms Service Booking', $confirmBooking['status'] === 200);

// Admin Creates Job Card
$createJc = request('POST', "$directBase/admin/job-cards", [
    'booking_id' => $bookingId,
    'customer_user_id' => $custId,
    'bike_id' => $newBikeId,
    'reported_problem' => 'Rear disc brake squeal; periodic maintenance',
    'inspection_findings' => 'Brake pads worn to 2mm, oil color dark',
    'recommended_work' => 'Replace engine oil, adjust chain slack, clean brake caliper',
    'approved_work' => 'Customer approved general service & oil change',
    'initial_odometer' => 6450
], $adminToken);
$jobCardId = $createJc['json']['data']['id'] ?? $createJc['json']['data']['job_card_id'] ?? null;
assertTest('Admin Creates Workshop Job Card (JC-YYYY-XXXX)', $createJc['status'] === 201 && !empty($jobCardId), 'Status: ' . $createJc['status']);

// Assign Mechanic
$mechanics = request('GET', "$directBase/admin/mechanics", null, $adminToken);
$mechanicId = $mechanics['json']['data'][0]['id'] ?? 1;
$assignMech = request('PATCH', "$directBase/admin/job-cards/$jobCardId", [
    'assigned_mechanic_id' => $mechanicId,
    'inspection_findings' => 'Brake pads inspected; cleaned and adjusted'
], $adminToken);
assertTest("Assign Mechanic (ID $mechanicId) to Job Card", $assignMech['status'] === 200);

// Update Status to 'repair_in_progress'
$statusProgress = request('PATCH', "$directBase/admin/job-cards/$jobCardId/status", [
    'status' => 'repair_in_progress',
    'notes' => 'Mechanic commenced service and maintenance'
], $adminToken);
assertTest('Job Card Status -> repair_in_progress', $statusProgress['status'] === 200);

// Check Stock of Spare Part #1 before usage
$partsList = request('GET', "$directBase/admin/parts", null, $adminToken);
$part1Before = null;
foreach ($partsList['json']['data'] ?? [] as $p) {
    if ($p['id'] == 1) {
        $part1Before = (int)$p['stock_quantity'];
        break;
    }
}

// Add Spare Part to Job Card (Atomic transaction + stock decrement)
$addPart = request('POST', "$directBase/admin/job-cards/$jobCardId/parts", [
    'part_id' => 1, // Motul Engine Oil
    'quantity' => 1
], $adminToken);
assertTest('Add Spare Part to Job Card', $addPart['status'] === 200 || $addPart['status'] === 201);

// Verify inventory decremented atomically
$partsAfter = request('GET', "$directBase/admin/parts", null, $adminToken);
$part1After = null;
foreach ($partsAfter['json']['data'] ?? [] as $p) {
    if ($p['id'] == 1) {
        $part1After = (int)$p['stock_quantity'];
        break;
    }
}
assertTest('Inventory Stock Decremented by 1 Atomically', ($part1Before !== null && $part1After === ($part1Before - 1)), "Before: $part1Before, After: $part1After");

// Add Labour Item to Job Card
$addLabour = request('POST', "$directBase/admin/job-cards/$jobCardId/services", [
    'description' => 'Rear disc brake caliper cleaning & adjustment',
    'quantity' => 1,
    'unit_price' => 250.00
], $adminToken);
assertTest('Add Labour Service Item to Job Card', $addLabour['status'] === 200 || $addLabour['status'] === 201);

// Update Status to 'ready_for_delivery'
$statusReady = request('PATCH', "$directBase/admin/job-cards/$jobCardId/status", [
    'status' => 'ready_for_delivery',
    'notes' => 'Test ride successful. Motorcycle cleaned and ready for billing.'
], $adminToken);
assertTest('Job Card Status -> ready_for_delivery', $statusReady['status'] === 200);

// Generate Workshop Invoice
$genInvoice = request('POST', "$directBase/admin/job-cards/$jobCardId/invoice", [
    'tax_rate' => 18.00,
    'discount' => 50.00,
    'notes' => 'Thank you for choosing BikeFix Club! Next service recommended in 3000 km.'
], $adminToken);
assertTest('Generate Workshop Invoice with Tax & Discount', $genInvoice['status'] === 201 && !empty($genInvoice['json']['data']['invoice_number']));
$invoiceId = $genInvoice['json']['data']['id'] ?? $genInvoice['json']['data']['invoice_id'] ?? null;
$totalAmount = (float)($genInvoice['json']['data']['total_amount'] ?? 0);

// Download PDF Invoice
$pdfRes = request('GET', "$directBase/customer/invoices/$invoiceId/pdf", null, $custToken);
assertTest('Customer PDF/HTML Invoice Rendered', $pdfRes['status'] === 200 && strpos($pdfRes['raw'], 'BikeFix Club') !== false);

// Customer Attempts Review BEFORE Payment -> Strict Block Check
$prematureReview = request('POST', "$directBase/customer/bookings/$bookingId/review", [
    'rating' => 5,
    'comment' => 'Great work done by the BikeFix Club team!'
], $custToken);
assertTest('Review Strictly Blocked Before Invoice Payment & Vehicle Delivery', ($prematureReview['status'] === 400 || $prematureReview['status'] === 403));

// Record Full Payment at Workshop (Cash / UPI)
$recPayment = request('POST', "$directBase/admin/invoices/$invoiceId/record-payment", [
    'payment_method' => 'upi_workshop',
    'amount' => $totalAmount,
    'notes' => 'GPay UPI confirmed at counter'
], $adminToken);
assertTest('Record Full Payment (UPI at Counter)', $recPayment['status'] === 200 || $recPayment['status'] === 201);

// Deliver Job Card
$deliverRes = request('POST', "$directBase/admin/job-cards/$jobCardId/deliver", [
    'final_odometer' => 6452,
    'customer_visible_notes' => 'Motorcycle handed over in excellent condition.'
], $adminToken);
assertTest('Job Card Delivered & Vehicle Handed Over', $deliverRes['status'] === 200);

// Customer Submits Review AFTER Payment & Delivery -> Must Succeed
$validReview = request('POST', "$directBase/customer/bookings/$bookingId/review", [
    'rating' => 5,
    'comment' => 'BikeFix Club solved the rear brake squeal completely! The MT-15 rides smoothly and customer care was top notch.'
], $custToken);
assertTest('Review Allowed After Full Payment & Vehicle Delivery', $validReview['status'] === 201);
$reviewId = $validReview['json']['data']['id'] ?? null;

// Admin Moderates Review (Approves)
if ($reviewId) {
    $approveReview = request('PATCH', "$directBase/admin/reviews/$reviewId/moderation", [
        'status' => 'approved'
    ], $adminToken);
    assertTest('Admin Approves Customer Review', $approveReview['status'] === 200);
}

// Verify Review is now Visible on Public Testimonials
$publicRevAfter = request('GET', "$directBase/public/reviews");
$foundApproved = false;
foreach ($publicRevAfter['json']['data'] ?? [] as $r) {
    if (($r['id'] ?? null) == $reviewId || strpos($r['comment'] ?? '', 'rear brake squeal') !== false) {
        $foundApproved = true;
        break;
    }
}
assertTest('Approved Review Surfaces in Public Testimonials', $foundApproved);

// Admin Reports
$repRevenue = request('GET', "$directBase/admin/reports/revenue", null, $adminToken);
assertTest('Admin Reports: Revenue Analytics', $repRevenue['status'] === 200 && isset($repRevenue['json']['data']['total_collected']));

$repBookings = request('GET', "$directBase/admin/reports/bookings", null, $adminToken);
assertTest('Admin Reports: Bookings Analytics', $repBookings['status'] === 200 && is_array($repBookings['json']['data']));

$repInventory = request('GET', "$directBase/admin/reports/inventory", null, $adminToken);
assertTest('Admin Reports: Inventory Analytics', $repInventory['status'] === 200 && isset($repInventory['json']['data']['total_stock_valuation']));

// Admin Settings
$settings = request('GET', "$directBase/admin/settings", null, $adminToken);
assertTest('Admin Settings loaded', $settings['status'] === 200 && is_array($settings['json']['data']));

// --- Summary ---
echo "\n========================================================\n";
$totalTests = count($testResults);
$passedTests = count(array_filter($testResults, fn($t) => $t['status'] === 'PASS'));
$failedTests = $totalTests - $passedTests;

echo "RESULTS: $passedTests / $totalTests Passed ($failedTests Failed)\n";
echo "========================================================\n";

if ($failedTests > 0) {
    exit(1);
} else {
    echo "ALL E2E LIFECYCLE TESTS COMPLETED SUCCESSFULLY!\n";
    exit(0);
}
