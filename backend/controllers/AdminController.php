<?php
// backend/controllers/AdminController.php
declare(strict_types=1);

namespace BikeFix\Controllers;

use BikeFix\Config\Database;
use BikeFix\Utils\Response;
use BikeFix\Utils\Validator;
use PDO;

class AdminController
{
    // ==========================================
    // DASHBOARD & ANALYTICS
    // ==========================================
    public static function getDashboard(): void
    {
        $db = Database::getConnection();

        // 1. KPI Counts
        $totalBookings = (int)$db->query('SELECT COUNT(*) FROM bookings')->fetchColumn();
        $todayBookings = (int)$db->query('SELECT COUNT(*) FROM bookings WHERE preferred_date = CURRENT_DATE AND status != "cancelled"')->fetchColumn();
        $pendingBookings = (int)$db->query('SELECT COUNT(*) FROM bookings WHERE status = "pending"')->fetchColumn();
        $inProgressServices = (int)$db->query('SELECT COUNT(*) FROM job_cards WHERE status IN ("diagnosis", "repair_in_progress", "quality_check")')->fetchColumn();
        $readyForDelivery = (int)$db->query('SELECT COUNT(*) FROM job_cards WHERE status = "ready_for_delivery"')->fetchColumn();
        $completedServices = (int)$db->query('SELECT COUNT(*) FROM job_cards WHERE status = "delivered"')->fetchColumn();

        $totalCustomers = (int)$db->query('SELECT COUNT(*) FROM users WHERE role = "customer" AND account_status = "active"')->fetchColumn();
        $registeredBikes = (int)$db->query('SELECT COUNT(*) FROM bikes WHERE is_active = 1')->fetchColumn();
        $activeMechanics = (int)$db->query('SELECT COUNT(*) FROM mechanics WHERE employment_status = "active"')->fetchColumn();

        // 2. Financial KPIs (Authoritative calculations)
        $invoicedRevenue = (float)$db->query('SELECT COALESCE(SUM(total_amount), 0.00) FROM invoices WHERE status != "cancelled"')->fetchColumn();
        $collectedPayments = (float)$db->query('SELECT COALESCE(SUM(amount), 0.00) FROM payments WHERE status = "successful"')->fetchColumn();
        $outstandingBalances = (float)$db->query('SELECT COALESCE(SUM(outstanding_balance), 0.00) FROM invoices WHERE status IN ("issued", "partially_paid")')->fetchColumn();
        $totalExpenses = (float)$db->query('SELECT COALESCE(SUM(amount), 0.00) FROM expenses WHERE is_reversed = 0')->fetchColumn();
        $netProfit = $collectedPayments - $totalExpenses;

        $lowStockParts = (int)$db->query('SELECT COUNT(*) FROM spare_parts WHERE stock_quantity <= minimum_stock AND is_active = 1')->fetchColumn();

        // 3. Recent bookings
        $recentBookings = $db->query('
            SELECT bk.id, bk.booking_reference, bk.preferred_date, bk.preferred_time, bk.status, bk.estimated_amount,
                   u.name as customer_name, b.brand as bike_brand, b.model as bike_model, b.registration_number
            FROM bookings bk
            JOIN users u ON bk.customer_user_id = u.id
            JOIN bikes b ON bk.bike_id = b.id
            ORDER BY bk.created_at DESC
            LIMIT 5
        ')->fetchAll();

        // 4. Recent payments
        $recentPayments = $db->query('
            SELECT p.id, p.payment_reference, p.payment_method, p.amount, p.status, p.paid_at,
                   inv.invoice_number, u.name as customer_name
            FROM payments p
            JOIN invoices inv ON p.invoice_id = inv.id
            JOIN users u ON inv.customer_user_id = u.id
            ORDER BY p.paid_at DESC
            LIMIT 5
        ')->fetchAll();

        // 5. Monthly Revenue Chart (last 6 months)
        $revenueChart = $db->query('
            SELECT DATE_FORMAT(paid_at, "%b %Y") as month_label,
                   DATE_FORMAT(paid_at, "%Y-%m") as month_sort,
                   COALESCE(SUM(amount), 0.00) as collected_amount
            FROM payments
            WHERE status = "successful" AND paid_at >= DATE_SUB(CURRENT_DATE, INTERVAL 6 MONTH)
            GROUP BY month_sort, month_label
            ORDER BY month_sort ASC
        ')->fetchAll();

        // If revenueChart has < 2 entries, provide fallback current month
        if (empty($revenueChart)) {
            $revenueChart = [
                ['month_label' => date('M Y'), 'collected_amount' => $collectedPayments]
            ];
        }

        // 6. Booking Status Breakdown
        $statusBreakdown = $db->query('
            SELECT status, COUNT(*) as count
            FROM bookings
            GROUP BY status
        ')->fetchAll();

        // 7. Payment Methods Distribution
        $paymentMethods = $db->query('
            SELECT payment_method, COUNT(*) as transaction_count, COALESCE(SUM(amount), 0.00) as total_collected
            FROM payments
            WHERE status = "successful"
            GROUP BY payment_method
        ')->fetchAll();

        // 8. Popular Services
        $popularServices = $db->query('
            SELECT s.name as service_name, COUNT(bs.id) as booking_count
            FROM services s
            JOIN booking_services bs ON s.id = bs.service_id
            GROUP BY s.id, s.name
            ORDER BY booking_count DESC
            LIMIT 5
        ')->fetchAll();

        $data = [
            'metrics' => [
                'total_bookings' => $totalBookings,
                'today_bookings' => $todayBookings,
                'pending_bookings' => $pendingBookings,
                'in_progress_services' => $inProgressServices,
                'ready_for_delivery' => $readyForDelivery,
                'completed_services' => $completedServices,
                'total_customers' => $totalCustomers,
                'registered_bikes' => $registeredBikes,
                'active_mechanics' => $activeMechanics,
                'invoiced_revenue' => $invoicedRevenue,
                'collected_payments' => $collectedPayments,
                'outstanding_balances' => $outstandingBalances,
                'total_expenses' => $totalExpenses,
                'net_profit' => $netProfit,
                'low_stock_parts' => $lowStockParts
            ],
            'recent_bookings' => $recentBookings,
            'recent_payments' => $recentPayments,
            'charts' => [
                'revenue_trend' => $revenueChart,
                'status_distribution' => $statusBreakdown,
                'payment_methods' => $paymentMethods,
                'popular_services' => $popularServices
            ]
        ];

        Response::json($data, 'Admin dashboard metrics retrieved.');
    }

    // ==========================================
    // CUSTOMER MANAGEMENT
    // ==========================================
    public static function getCustomers(): void
    {
        $db = Database::getConnection();
        $search = trim($_GET['search'] ?? '');

        $sql = '
            SELECT u.id, u.name, u.email, u.phone, u.account_status, u.created_at, u.last_login,
                   cp.address, cp.city, cp.state, cp.postal_code,
                   (SELECT COUNT(*) FROM bikes b WHERE b.customer_user_id = u.id AND b.is_active = 1) as total_bikes,
                   (SELECT COUNT(*) FROM bookings bk WHERE bk.customer_user_id = u.id) as total_bookings
            FROM users u
            LEFT JOIN customer_profiles cp ON u.id = cp.user_id
            WHERE u.role = "customer"
        ';
        $params = [];

        if ($search !== '') {
            $sql .= ' AND (u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)';
            $like = "%{$search}%";
            $params = [$like, $like, $like];
        }

        $sql .= ' ORDER BY u.created_at DESC';
        $stmt = $db->prepare($sql);
        $stmt->execute($params);

        Response::json($stmt->fetchAll(), 'Customers list retrieved.');
    }

    public static function getCustomer(int $id): void
    {
        $db = Database::getConnection();
        $stmt = $db->prepare('
            SELECT u.id, u.name, u.email, u.phone, u.account_status, u.created_at, u.last_login,
                   cp.address, cp.city, cp.state, cp.postal_code, cp.emergency_contact
            FROM users u
            LEFT JOIN customer_profiles cp ON u.id = cp.user_id
            WHERE u.id = ? AND u.role = "customer"
            LIMIT 1
        ');
        $stmt->execute([$id]);
        $customer = $stmt->fetch();

        if (!$customer) {
            Response::error('Customer not found.', 404);
        }

        // Fetch customer bikes
        $bikeStmt = $db->prepare('SELECT * FROM bikes WHERE customer_user_id = ? AND is_active = 1 ORDER BY created_at DESC');
        $bikeStmt->execute([$id]);
        $customer['bikes'] = $bikeStmt->fetchAll();

        // Fetch customer bookings
        $bkStmt = $db->prepare('
            SELECT bk.*, b.brand as bike_brand, b.model as bike_model, b.registration_number
            FROM bookings bk
            JOIN bikes b ON bk.bike_id = b.id
            WHERE bk.customer_user_id = ?
            ORDER BY bk.created_at DESC
        ');
        $bkStmt->execute([$id]);
        $customer['bookings'] = $bkStmt->fetchAll();

        // Fetch customer invoices
        $invStmt = $db->prepare('SELECT * FROM invoices WHERE customer_user_id = ? ORDER BY created_at DESC');
        $invStmt->execute([$id]);
        $customer['invoices'] = $invStmt->fetchAll();

        Response::json($customer, 'Customer details retrieved.');
    }

    public static function updateCustomerStatus(int $id, array $body): void
    {
        $v = Validator::make($body)->in('status', ['active', 'inactive', 'suspended']);
        if ($v->fails()) {
            Response::error($v->firstError(), 422);
        }

        $db = Database::getConnection();
        $stmt = $db->prepare('UPDATE users SET account_status = ? WHERE id = ? AND role = "customer"');
        $stmt->execute([$body['status'], $id]);

        Response::json(null, "Customer account status updated to {$body['status']}.");
    }

    public static function registerWalkInCustomer(array $body): void
    {
        $v = Validator::make($body)
            ->required('name', 'Customer Name')
            ->required('phone', 'Phone Number')
            ->phone('phone', 'Phone Number')
            ->required('registration_number', 'Registration Number')
            ->required('brand', 'Brand')
            ->required('model', 'Model');

        if ($v->fails()) {
            Response::error($v->firstError(), 422, $v->errors());
        }

        $phone = trim($body['phone']);
        $email = trim($body['email'] ?? "walkin_" . preg_replace('/[^0-9]/', '', $phone) . "@bikefixclub.local");
        $regNumber = strtoupper(trim(preg_replace('/\s+/', '-', $body['registration_number'])));

        $db = Database::getConnection();
        $db->beginTransaction();

        try {
            // Find or create user
            $userStmt = $db->prepare('SELECT id, name FROM users WHERE phone = ? LIMIT 1');
            $userStmt->execute([$phone]);
            $user = $userStmt->fetch();

            if (!$user) {
                $pwd = password_hash('BikeFix@2026', PASSWORD_BCRYPT);
                $insUser = $db->prepare('
                    INSERT INTO users (name, email, phone, password_hash, role, account_status)
                    VALUES (?, ?, ?, ?, "customer", "active")
                ');
                $insUser->execute([trim($body['name']), $email, $phone, $pwd]);
                $userId = (int)$db->lastInsertId();

                $db->prepare('
                    INSERT INTO customer_profiles (user_id, address, city, state, postal_code)
                    VALUES (?, ?, "Aruppukkottai", "Tamil Nadu", "626101")
                ')->execute([$userId, trim($body['address'] ?? '')]);
            } else {
                $userId = (int)$user['id'];
            }

            // Find or create bike
            $bikeStmt = $db->prepare('SELECT id FROM bikes WHERE registration_number = ? LIMIT 1');
            $bikeStmt->execute([$regNumber]);
            $bike = $bikeStmt->fetch();

            if (!$bike) {
                $insBike = $db->prepare('
                    INSERT INTO bikes (customer_user_id, registration_number, brand, model, current_odometer, is_active)
                    VALUES (?, ?, ?, ?, ?, 1)
                ');
                $insBike->execute([
                    $userId,
                    $regNumber,
                    trim($body['brand']),
                    trim($body['model']),
                    (int)($body['current_odometer'] ?? 0)
                ]);
                $bikeId = (int)$db->lastInsertId();
            } else {
                $bikeId = (int)$bike['id'];
            }

            $db->commit();
            Response::json([
                'customer_user_id' => $userId,
                'bike_id' => $bikeId,
                'registration_number' => $regNumber
            ], 'Walk-in customer & motorcycle record prepared.', 201);
        } catch (\Exception $e) {
            $db->rollBack();
            error_log('Walk-in intake error: ' . $e->getMessage());
            Response::error('Failed to register walk-in customer.', 500);
        }
    }

    // ==========================================
    // BOOKINGS MANAGEMENT
    // ==========================================
    public static function getBookings(): void
    {
        $db = Database::getConnection();
        $status = $_GET['status'] ?? '';
        $date = $_GET['date'] ?? '';
        $search = trim($_GET['search'] ?? '');

        $sql = '
            SELECT bk.*,
                   u.name as customer_name, u.phone as customer_phone, u.email as customer_email,
                   b.brand as bike_brand, b.model as bike_model, b.registration_number,
                   jc.id as job_card_id, jc.job_card_reference, jc.status as job_card_status
            FROM bookings bk
            JOIN users u ON bk.customer_user_id = u.id
            JOIN bikes b ON bk.bike_id = b.id
            LEFT JOIN job_cards jc ON bk.id = jc.booking_id
            WHERE 1=1
        ';
        $params = [];

        if ($status !== '') {
            $sql .= ' AND bk.status = ?';
            $params[] = $status;
        }

        if ($date !== '') {
            $sql .= ' AND bk.preferred_date = ?';
            $params[] = $date;
        }

        if ($search !== '') {
            $sql .= ' AND (bk.booking_reference LIKE ? OR u.name LIKE ? OR u.phone LIKE ? OR b.registration_number LIKE ?)';
            $like = "%{$search}%";
            $params[] = $like;
            $params[] = $like;
            $params[] = $like;
            $params[] = $like;
        }

        $sql .= ' ORDER BY bk.preferred_date DESC, bk.created_at DESC';
        $stmt = $db->prepare($sql);
        $stmt->execute($params);

        $bookings = $stmt->fetchAll();

        foreach ($bookings as &$b) {
            $svcStmt = $db->prepare('
                SELECT s.id, s.name, bs.requested_price
                FROM booking_services bs
                JOIN services s ON bs.service_id = s.id
                WHERE bs.booking_id = ?
            ');
            $svcStmt->execute([$b['id']]);
            $b['services'] = $svcStmt->fetchAll();
        }

        Response::json($bookings, 'Admin bookings list retrieved.');
    }

    public static function getBooking(int $id): void
    {
        $db = Database::getConnection();
        $stmt = $db->prepare('
            SELECT bk.*,
                   u.name as customer_name, u.phone as customer_phone, u.email as customer_email,
                   b.brand as bike_brand, b.model as bike_model, b.registration_number, b.variant, b.current_odometer as bike_odometer,
                   jc.id as job_card_id, jc.job_card_reference, jc.status as job_card_status,
                   m.id as mechanic_id, m.name as mechanic_name
            FROM bookings bk
            JOIN users u ON bk.customer_user_id = u.id
            JOIN bikes b ON bk.bike_id = b.id
            LEFT JOIN job_cards jc ON bk.id = jc.booking_id
            LEFT JOIN mechanics m ON jc.assigned_mechanic_id = m.id
            WHERE bk.id = ?
            LIMIT 1
        ');
        $stmt->execute([$id]);
        $booking = $stmt->fetch();

        if (!$booking) {
            Response::error('Booking not found.', 404);
        }

        $svcStmt = $db->prepare('
            SELECT s.id, s.name, s.estimated_duration, bs.requested_price
            FROM booking_services bs
            JOIN services s ON bs.service_id = s.id
            WHERE bs.booking_id = ?
        ');
        $svcStmt->execute([$id]);
        $booking['services'] = $svcStmt->fetchAll();

        $histStmt = $db->prepare('SELECT * FROM booking_status_history WHERE booking_id = ? ORDER BY created_at ASC');
        $histStmt->execute([$id]);
        $booking['status_history'] = $histStmt->fetchAll();

        Response::json($booking, 'Booking details retrieved.');
    }

    public static function updateBookingStatus(array $admin, int $id, array $body): void
    {
        $v = Validator::make($body)->in('status', ['pending', 'confirmed', 'checked_in', 'in_progress', 'completed', 'cancelled', 'rescheduled']);
        if ($v->fails()) {
            Response::error($v->firstError(), 422);
        }

        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT status, customer_user_id, booking_reference FROM bookings WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        $booking = $stmt->fetch();

        if (!$booking) {
            Response::error('Booking not found.', 404);
        }

        $newStatus = $body['status'];
        $notes = trim($body['notes'] ?? "Status updated to {$newStatus} by workshop admin");

        $db->beginTransaction();
        try {
            $db->prepare('UPDATE bookings SET status = ? WHERE id = ?')->execute([$newStatus, $id]);

            $db->prepare('
                INSERT INTO booking_status_history (booking_id, old_status, new_status, changed_by_user_id, notes)
                VALUES (?, ?, ?, ?, ?)
            ')->execute([$id, $booking['status'], $newStatus, $admin['id'], $notes]);

            // Notify customer
            $db->prepare('
                INSERT INTO notifications (user_id, title, message, type, related_entity_type, related_entity_id)
                VALUES (?, ?, ?, "booking", "booking", ?)
            ')->execute([
                $booking['customer_user_id'],
                "Booking Status: " . ucfirst(str_replace('_', ' ', $newStatus)),
                "Your booking #{$booking['booking_reference']} is now marked as " . strtoupper(str_replace('_', ' ', $newStatus)) . ".",
                $id
            ]);

            $db->commit();
            Response::json(null, "Booking status updated to {$newStatus}.");
        } catch (\Exception $e) {
            $db->rollBack();
            Response::error('Failed to update booking status.', 500);
        }
    }

    // ==========================================
    // JOB CARDS MANAGEMENT
    // ==========================================
    public static function getJobCards(): void
    {
        $db = Database::getConnection();
        $status = $_GET['status'] ?? '';
        $search = trim($_GET['search'] ?? '');

        $sql = '
            SELECT jc.*,
                   u.name as customer_name, u.phone as customer_phone,
                   b.brand as bike_brand, b.model as bike_model, b.registration_number,
                   m.name as mechanic_name,
                   inv.id as invoice_id, inv.invoice_number, inv.status as invoice_status, inv.total_amount, inv.outstanding_balance
            FROM job_cards jc
            JOIN users u ON jc.customer_user_id = u.id
            JOIN bikes b ON jc.bike_id = b.id
            LEFT JOIN mechanics m ON jc.assigned_mechanic_id = m.id
            LEFT JOIN invoices inv ON jc.id = inv.job_card_id
            WHERE 1=1
        ';
        $params = [];

        if ($status !== '') {
            $sql .= ' AND jc.status = ?';
            $params[] = $status;
        }

        if ($search !== '') {
            $sql .= ' AND (jc.job_card_reference LIKE ? OR u.name LIKE ? OR b.registration_number LIKE ?)';
            $like = "%{$search}%";
            $params[] = $like;
            $params[] = $like;
            $params[] = $like;
        }

        $sql .= ' ORDER BY jc.created_at DESC';
        $stmt = $db->prepare($sql);
        $stmt->execute($params);

        Response::json($stmt->fetchAll(), 'Job cards retrieved.');
    }

    public static function getJobCard(int $id): void
    {
        $db = Database::getConnection();
        $stmt = $db->prepare('
            SELECT jc.*,
                   u.name as customer_name, u.phone as customer_phone, u.email as customer_email,
                   b.brand as bike_brand, b.model as bike_model, b.registration_number, b.variant,
                   m.name as mechanic_name, m.phone as mechanic_phone,
                   bk.booking_reference, bk.preferred_date,
                   inv.id as invoice_id, inv.invoice_number, inv.status as invoice_status, inv.subtotal, inv.discount, inv.tax_amount, inv.total_amount, inv.amount_paid, inv.outstanding_balance
            FROM job_cards jc
            JOIN users u ON jc.customer_user_id = u.id
            JOIN bikes b ON jc.bike_id = b.id
            LEFT JOIN mechanics m ON jc.assigned_mechanic_id = m.id
            LEFT JOIN bookings bk ON jc.booking_id = bk.id
            LEFT JOIN invoices inv ON jc.id = inv.job_card_id
            WHERE jc.id = ?
            LIMIT 1
        ');
        $stmt->execute([$id]);
        $jc = $stmt->fetch();

        if (!$jc) {
            Response::error('Job card not found.', 404);
        }

        // Fetch services & parts
        $svcStmt = $db->prepare('SELECT * FROM job_card_services WHERE job_card_id = ?');
        $svcStmt->execute([$id]);
        $jc['services'] = $svcStmt->fetchAll();

        $partsStmt = $db->prepare('
            SELECT jcp.*, sp.name as part_name, sp.sku
            FROM job_card_parts jcp
            JOIN spare_parts sp ON jcp.part_id = sp.id
            WHERE jcp.job_card_id = ?
        ');
        $partsStmt->execute([$id]);
        $jc['parts'] = $partsStmt->fetchAll();

        $histStmt = $db->prepare('SELECT * FROM job_card_status_history WHERE job_card_id = ? ORDER BY created_at ASC');
        $histStmt->execute([$id]);
        $jc['status_history'] = $histStmt->fetchAll();

        Response::json($jc, 'Job card details retrieved.');
    }

    public static function createJobCard(array $admin, array $body): void
    {
        $v = Validator::make($body)
            ->required('customer_user_id', 'Customer')
            ->required('bike_id', 'Motorcycle')
            ->required('reported_problem', 'Reported Problem');

        if ($v->fails()) {
            Response::error($v->firstError(), 422, $v->errors());
        }

        $db = Database::getConnection();

        // Generate Job Card Reference: JC-YYYY-XXXX
        $year = date('Y');
        $count = (int)$db->query("SELECT COUNT(*) FROM job_cards WHERE YEAR(created_at) = {$year}")->fetchColumn() + 1;
        $jcRef = "JC-{$year}-" . str_pad((string)$count, 4, '0', STR_PAD_LEFT);

        $bookingId = !empty($body['booking_id']) ? (int)$body['booking_id'] : null;
        $mechanicId = !empty($body['assigned_mechanic_id']) ? (int)$body['assigned_mechanic_id'] : null;
        $initialOdometer = (int)($body['initial_odometer'] ?? 0);

        $db->beginTransaction();
        try {
            $stmt = $db->prepare('
                INSERT INTO job_cards (
                    job_card_reference, booking_id, customer_user_id, bike_id, assigned_mechanic_id,
                    reported_problem, inspection_findings, recommended_work, approved_work, internal_notes, customer_visible_notes,
                    initial_odometer, status, check_in_at, created_by_user_id
                ) VALUES (
                    ?, ?, ?, ?, ?,
                    ?, ?, ?, ?, ?, ?,
                    ?, "checked_in", NOW(), ?
                )
            ');
            $stmt->execute([
                $jcRef,
                $bookingId,
                (int)$body['customer_user_id'],
                (int)$body['bike_id'],
                $mechanicId,
                trim($body['reported_problem']),
                trim($body['inspection_findings'] ?? ''),
                trim($body['recommended_work'] ?? ''),
                trim($body['approved_work'] ?? ''),
                trim($body['internal_notes'] ?? ''),
                trim($body['customer_visible_notes'] ?? 'Vehicle checked in at workshop.'),
                $initialOdometer,
                $admin['id']
            ]);

            $jobCardId = (int)$db->lastInsertId();

            // Record status history
            $db->prepare('
                INSERT INTO job_card_status_history (job_card_id, old_status, new_status, changed_by_user_id, notes)
                VALUES (?, NULL, "checked_in", ?, "Motorcycle checked in and job card opened.")
            ')->execute([$jobCardId, $admin['id']]);

            // If created from online booking, update booking status to 'checked_in'
            if ($bookingId) {
                $db->prepare('UPDATE bookings SET status = "checked_in" WHERE id = ?')->execute([$bookingId]);
                // Copy services from booking to job card
                $bServices = $db->prepare('
                    SELECT s.id, s.name, bs.requested_price
                    FROM booking_services bs
                    JOIN services s ON bs.service_id = s.id
                    WHERE bs.booking_id = ?
                ');
                $bServices->execute([$bookingId]);
                $servicesList = $bServices->fetchAll();

                $insJCS = $db->prepare('
                    INSERT INTO job_card_services (job_card_id, service_id, description, quantity, unit_price, line_total)
                    VALUES (?, ?, ?, 1.00, ?, ?)
                ');
                foreach ($servicesList as $svc) {
                    $insJCS->execute([$jobCardId, $svc['id'], $svc['name'] . ' Labour', $svc['requested_price'], $svc['requested_price']]);
                }
            }

            // Update mechanic workload if assigned
            if ($mechanicId) {
                $db->prepare('UPDATE mechanics SET current_workload = current_workload + 1 WHERE id = ?')->execute([$mechanicId]);
            }

            $db->commit();
            Response::json([
                'id' => $jobCardId,
                'job_card_id' => $jobCardId,
                'job_card_reference' => $jcRef
            ], 'Job card created successfully.', 201);
        } catch (\Exception $e) {
            $db->rollBack();
            error_log('Job card creation error: ' . $e->getMessage());
            Response::error('Failed to create job card.', 500);
        }
    }

    public static function updateJobCard(array $admin, int $id, array $body): void
    {
        $db = Database::getConnection();
        $stmt = $db->prepare('
            UPDATE job_cards
            SET inspection_findings = ?, recommended_work = ?, approved_work = ?,
                internal_notes = ?, customer_visible_notes = ?,
                initial_odometer = ?, final_odometer = ?,
                assigned_mechanic_id = ?
            WHERE id = ?
        ');
        $stmt->execute([
            trim($body['inspection_findings'] ?? ''),
            trim($body['recommended_work'] ?? ''),
            trim($body['approved_work'] ?? ''),
            trim($body['internal_notes'] ?? ''),
            trim($body['customer_visible_notes'] ?? ''),
            (int)($body['initial_odometer'] ?? 0),
            !empty($body['final_odometer']) ? (int)$body['final_odometer'] : null,
            !empty($body['assigned_mechanic_id']) ? (int)$body['assigned_mechanic_id'] : null,
            $id
        ]);

        Response::json(null, 'Job card updated successfully.');
    }

    public static function updateJobCardStatus(array $admin, int $id, array $body): void
    {
        $allowed = ['created', 'checked_in', 'diagnosis', 'repair_in_progress', 'quality_check', 'ready_for_delivery', 'delivered', 'cancelled'];
        $v = Validator::make($body)->in('status', $allowed);
        if ($v->fails()) {
            Response::error($v->firstError(), 422);
        }

        $newStatus = $body['status'];
        $notes = trim($body['notes'] ?? "Status updated to {$newStatus}");

        $db = Database::getConnection();
        $check = $db->prepare('SELECT status, booking_id, customer_user_id, job_card_reference FROM job_cards WHERE id = ? LIMIT 1');
        $check->execute([$id]);
        $jc = $check->fetch();

        if (!$jc) {
            Response::error('Job card not found.', 404);
        }

        // Special timestamps
        $timestampColumn = match ($newStatus) {
            'diagnosis' => ', diagnosis_at = COALESCE(diagnosis_at, NOW())',
            'repair_in_progress' => ', repair_started_at = COALESCE(repair_started_at, NOW())',
            'ready_for_delivery' => ', ready_at = COALESCE(ready_at, NOW())',
            'delivered' => ', delivered_at = COALESCE(delivered_at, NOW())',
            default => ''
        };

        $db->beginTransaction();
        try {
            $db->prepare("UPDATE job_cards SET status = ? {$timestampColumn} WHERE id = ?")->execute([$newStatus, $id]);

            // If ready for delivery or delivered, sync booking status
            if ($jc['booking_id']) {
                $bookingSyncStatus = match ($newStatus) {
                    'delivered' => 'completed',
                    'ready_for_delivery' => 'completed',
                    'repair_in_progress', 'diagnosis', 'quality_check' => 'in_progress',
                    default => 'checked_in'
                };
                $db->prepare('UPDATE bookings SET status = ? WHERE id = ?')->execute([$bookingSyncStatus, $jc['booking_id']]);
            }

            // Record status history
            $db->prepare('
                INSERT INTO job_card_status_history (job_card_id, old_status, new_status, changed_by_user_id, notes)
                VALUES (?, ?, ?, ?, ?)
            ')->execute([$id, $jc['status'], $newStatus, $admin['id'], $notes]);

            // Notify customer
            $friendlyStatus = ucwords(str_replace('_', ' ', $newStatus));
            $db->prepare('
                INSERT INTO notifications (user_id, title, message, type, related_entity_type, related_entity_id)
                VALUES (?, ?, ?, "service_status", "job_card", ?)
            ')->execute([
                $jc['customer_user_id'],
                "Service Update: {$friendlyStatus}",
                "Your motorcycle repair job #{$jc['job_card_reference']} is now: {$friendlyStatus}.",
                $id
            ]);

            $db->commit();
            Response::json(null, "Job card status updated to {$newStatus}.");
        } catch (\Exception $e) {
            $db->rollBack();
            Response::error('Failed to update status.', 500);
        }
    }

    public static function addJobCardService(int $id, array $body): void
    {
        $v = Validator::make($body)
            ->required('description', 'Service Description')
            ->numeric('unit_price', 'Price');

        if ($v->fails()) {
            Response::error($v->firstError(), 422, $v->errors());
        }

        $qty = (float)($body['quantity'] ?? 1.00);
        $price = (float)$body['unit_price'];
        $lineTotal = $qty * $price;
        $serviceId = !empty($body['service_id']) ? (int)$body['service_id'] : null;

        $db = Database::getConnection();
        $ins = $db->prepare('
            INSERT INTO job_card_services (job_card_id, service_id, description, quantity, unit_price, line_total)
            VALUES (?, ?, ?, ?, ?, ?)
        ');
        $ins->execute([$id, $serviceId, trim($body['description']), $qty, $price, $lineTotal]);

        Response::json(['id' => (int)$db->lastInsertId(), 'line_total' => $lineTotal], 'Labour service added to job card.');
    }

    public static function addJobCardPart(array $admin, int $id, array $body): void
    {
        $v = Validator::make($body)
            ->required('part_id', 'Spare Part')
            ->numeric('part_id', 'Spare Part')
            ->required('quantity', 'Quantity')
            ->numeric('quantity', 'Quantity');

        if ($v->fails()) {
            Response::error($v->firstError(), 422, $v->errors());
        }

        $partId = (int)$body['part_id'];
        $qty = (int)$body['quantity'];
        if ($qty <= 0) {
            Response::error('Quantity must be at least 1.', 422);
        }

        $db = Database::getConnection();
        $db->beginTransaction();

        try {
            // Lock part record for atomic stock check and decrement
            $partStmt = $db->prepare('SELECT id, name, sku, purchase_price, selling_price, stock_quantity FROM spare_parts WHERE id = ? FOR UPDATE');
            $partStmt->execute([$partId]);
            $part = $partStmt->fetch();

            if (!$part) {
                $db->rollBack();
                Response::error('Spare part not found.', 404);
            }

            if ((int)$part['stock_quantity'] < $qty) {
                $db->rollBack();
                Response::error("Insufficient stock for '{$part['name']}'. Available: {$part['stock_quantity']}, Requested: {$qty}", 422);
            }

            $unitPrice = isset($body['unit_price']) ? (float)$body['unit_price'] : (float)$part['selling_price'];
            $lineTotal = $qty * $unitPrice;

            // Insert job card part
            $insJCP = $db->prepare('
                INSERT INTO job_card_parts (job_card_id, part_id, quantity, unit_price, line_total)
                VALUES (?, ?, ?, ?, ?)
            ');
            $insJCP->execute([$id, $partId, $qty, $unitPrice, $lineTotal]);
            $jcpId = (int)$db->lastInsertId();

            // Decrement spare part stock
            $db->prepare('UPDATE spare_parts SET stock_quantity = stock_quantity - ? WHERE id = ?')->execute([$qty, $partId]);

            // Record stock movement atomically
            $db->prepare('
                INSERT INTO stock_movements (part_id, movement_type, quantity_change, unit_cost, reference_type, reference_id, reason, user_id)
                VALUES (?, "usage", ?, ?, "job_card", ?, "Allocated to Job Card", ?)
            ')->execute([$partId, -$qty, $part['purchase_price'], (string)$id, $admin['id']]);

            $db->commit();
            Response::json([
                'id' => $jcpId,
                'part_name' => $part['name'],
                'line_total' => $lineTotal,
                'remaining_stock' => (int)$part['stock_quantity'] - $qty
            ], 'Spare part allocated and stock updated successfully.');
        } catch (\Exception $e) {
            $db->rollBack();
            error_log('Job card part addition error: ' . $e->getMessage());
            Response::error('Failed to add part to job card.', 500);
        }
    }

    public static function deliverJobCard(array $admin, int $id, array $body): void
    {
        $db = Database::getConnection();
        $stmt = $db->prepare('
            SELECT jc.*, inv.id as invoice_id, inv.status as invoice_status, inv.outstanding_balance
            FROM job_cards jc
            LEFT JOIN invoices inv ON jc.id = inv.job_card_id
            WHERE jc.id = ?
            LIMIT 1
        ');
        $stmt->execute([$id]);
        $jc = $stmt->fetch();

        if (!$jc) {
            Response::error('Job card not found.', 404);
        }

        // Check if invoice exists and whether it's fully paid
        $hasInvoice = !empty($jc['invoice_id']);
        $isPaid = $hasInvoice && (float)$jc['outstanding_balance'] <= 0 && $jc['invoice_status'] === 'paid';
        $allowOverride = !empty($body['override_unpaid']) && $body['override_unpaid'] === true;

        if (!$isPaid && !$allowOverride) {
            Response::error('Cannot mark motorcycle as delivered. The invoice has not been generated or is not fully paid. (Admin override with reason required).', 400);
        }

        $overrideReason = $allowOverride ? trim($body['override_reason'] ?? 'Delivered with approved workshop credit/post-payment agreement') : null;

        $db->beginTransaction();
        try {
            $db->prepare('
                UPDATE job_cards
                SET status = "delivered", delivered_at = NOW(), delivery_override_notes = ?
                WHERE id = ?
            ')->execute([$overrideReason, $id]);

            if ($jc['booking_id']) {
                $db->prepare('UPDATE bookings SET status = "completed" WHERE id = ?')->execute([$jc['booking_id']]);
            }

            $db->prepare('
                INSERT INTO job_card_status_history (job_card_id, old_status, new_status, changed_by_user_id, notes)
                VALUES (?, ?, "delivered", ?, ?)
            ')->execute([$id, $jc['status'], $admin['id'], $overrideReason ?: 'Vehicle delivered to customer.']);

            // Notify customer
            $db->prepare('
                INSERT INTO notifications (user_id, title, message, type, related_entity_type, related_entity_id)
                VALUES (?, "Vehicle Delivered", "Your motorcycle has been officially delivered. Thank you for choosing BikeFix Club! You can now rate and review your experience.", "service_status", "job_card", ?)
            ')->execute([$jc['customer_user_id'], $id]);

            $db->commit();
            Response::json(null, 'Motorcycle marked as delivered successfully.');
        } catch (\Exception $e) {
            $db->rollBack();
            Response::error('Failed to mark delivered.', 500);
        }
    }

    // ==========================================
    // BILLING & INVOICES
    // ==========================================
    public static function getInvoices(): void
    {
        $db = Database::getConnection();
        $status = $_GET['status'] ?? '';
        $search = trim($_GET['search'] ?? '');

        $sql = '
            SELECT inv.*,
                   jc.job_card_reference,
                   u.name as customer_name, u.phone as customer_phone,
                   b.brand as bike_brand, b.model as bike_model, b.registration_number
            FROM invoices inv
            JOIN job_cards jc ON inv.job_card_id = jc.id
            JOIN users u ON inv.customer_user_id = u.id
            JOIN bikes b ON jc.bike_id = b.id
            WHERE 1=1
        ';
        $params = [];

        if ($status !== '') {
            $sql .= ' AND inv.status = ?';
            $params[] = $status;
        }

        if ($search !== '') {
            $sql .= ' AND (inv.invoice_number LIKE ? OR u.name LIKE ? OR b.registration_number LIKE ?)';
            $like = "%{$search}%";
            $params[] = $like;
            $params[] = $like;
            $params[] = $like;
        }

        $sql .= ' ORDER BY inv.created_at DESC';
        $stmt = $db->prepare($sql);
        $stmt->execute($params);

        Response::json($stmt->fetchAll(), 'Invoices retrieved.');
    }

    public static function getInvoice(int $id): void
    {
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
        $stmt->execute([$id]);
        $inv = $stmt->fetch();

        if (!$inv) {
            Response::error('Invoice not found.', 404);
        }

        $itemsStmt = $db->prepare('SELECT * FROM invoice_items WHERE invoice_id = ?');
        $itemsStmt->execute([$id]);
        $inv['items'] = $itemsStmt->fetchAll();

        $payStmt = $db->prepare('
            SELECT p.*, u.name as staff_name
            FROM payments p
            LEFT JOIN users u ON p.receiving_staff_user_id = u.id
            WHERE p.invoice_id = ?
            ORDER BY p.paid_at DESC
        ');
        $payStmt->execute([$id]);
        $inv['payments'] = $payStmt->fetchAll();

        Response::json($inv, 'Invoice details retrieved.');
    }

    public static function generateInvoice(array $admin, int $jobCardId, array $body): void
    {
        $db = Database::getConnection();

        // 1. Verify job card
        $jcStmt = $db->prepare('SELECT * FROM job_cards WHERE id = ? LIMIT 1');
        $jcStmt->execute([$jobCardId]);
        $jc = $jcStmt->fetch();

        if (!$jc) {
            Response::error('Job card not found.', 404);
        }

        // Check if invoice already exists
        $checkInv = $db->prepare('SELECT id, invoice_number FROM invoices WHERE job_card_id = ? LIMIT 1');
        $checkInv->execute([$jobCardId]);
        $existing = $checkInv->fetch();
        if ($existing) {
            Response::error("An invoice ({$existing['invoice_number']}) already exists for this job card.", 409);
        }

        // 2. Fetch labour items and spare parts
        $svcStmt = $db->prepare('SELECT * FROM job_card_services WHERE job_card_id = ?');
        $svcStmt->execute([$jobCardId]);
        $services = $svcStmt->fetchAll();

        $partsStmt = $db->prepare('
            SELECT jcp.*, sp.name as part_name
            FROM job_card_parts jcp
            JOIN spare_parts sp ON jcp.part_id = sp.id
            WHERE jcp.job_card_id = ?
        ');
        $partsStmt->execute([$jobCardId]);
        $parts = $partsStmt->fetchAll();

        if (empty($services) && empty($parts)) {
            Response::error('Job card must have at least one service labour item or spare part before generating an invoice.', 422);
        }

        // Configurable tax rate
        $taxRateSetting = (float)($db->query('SELECT setting_value FROM workshop_settings WHERE setting_key = "tax_rate"')->fetchColumn() ?: 18.00);
        $taxRate = isset($body['tax_rate']) ? (float)$body['tax_rate'] : $taxRateSetting;
        $discount = (float)($body['discount'] ?? 0.00);

        // 3. Decimal calculation
        $subtotal = 0.00;
        foreach ($services as $s) {
            $subtotal += (float)$s['line_total'];
        }
        foreach ($parts as $p) {
            $subtotal += (float)$p['line_total'];
        }

        $taxableAmount = max(0.00, $subtotal - $discount);
        $taxAmount = round(($taxableAmount * $taxRate) / 100, 2);
        $totalAmount = round($taxableAmount + $taxAmount, 2);

        // 4. Generate unique invoice number: INV-YYYY-XXXX
        $year = date('Y');
        $count = (int)$db->query("SELECT COUNT(*) FROM invoices WHERE YEAR(created_at) = {$year}")->fetchColumn() + 1;
        $invNumber = "INV-{$year}-" . str_pad((string)$count, 4, '0', STR_PAD_LEFT);

        $db->beginTransaction();
        try {
            $insInv = $db->prepare('
                INSERT INTO invoices (
                    invoice_number, job_card_id, customer_user_id, subtotal, discount,
                    tax_rate, tax_amount, total_amount, amount_paid, outstanding_balance,
                    status, issue_date, due_date, notes, created_by_user_id
                ) VALUES (
                    ?, ?, ?, ?, ?,
                    ?, ?, ?, 0.00, ?,
                    "issued", CURRENT_DATE, DATE_ADD(CURRENT_DATE, INTERVAL 7 DAY), ?, ?
                )
            ');
            $insInv->execute([
                $invNumber,
                $jobCardId,
                $jc['customer_user_id'],
                $subtotal,
                $discount,
                $taxRate,
                $taxAmount,
                $totalAmount,
                $totalAmount,
                trim($body['notes'] ?? 'Thank you for choosing BikeFix Club! Your Bike. Your Club. Our Care.'),
                $admin['id']
            ]);

            $invoiceId = (int)$db->lastInsertId();

            // Insert labour invoice items
            $insItem = $db->prepare('
                INSERT INTO invoice_items (invoice_id, item_type, description, quantity, unit_price, discount, tax_rate, tax_amount, line_total, reference_id)
                VALUES (?, ?, ?, ?, ?, 0.00, ?, ?, ?, ?)
            ');

            foreach ($services as $s) {
                $itemTax = round(((float)$s['line_total'] * $taxRate) / 100, 2);
                $insItem->execute([
                    $invoiceId,
                    'labour',
                    $s['description'],
                    $s['quantity'],
                    $s['unit_price'],
                    $taxRate,
                    $itemTax,
                    (float)$s['line_total'] + $itemTax,
                    (string)$s['id']
                ]);
            }

            // Insert part invoice items
            foreach ($parts as $p) {
                $itemTax = round(((float)$p['line_total'] * $taxRate) / 100, 2);
                $insItem->execute([
                    $invoiceId,
                    'part',
                    $p['part_name'],
                    $p['quantity'],
                    $p['unit_price'],
                    $taxRate,
                    $itemTax,
                    (float)$p['line_total'] + $itemTax,
                    (string)$p['id']
                ]);
            }

            // If discount given, record discount line item
            if ($discount > 0) {
                $insItem->execute([
                    $invoiceId,
                    'discount',
                    'Promotional / Loyalty Discount',
                    1.00,
                    -$discount,
                    0.00,
                    0.00,
                    -$discount,
                    null
                ]);
            }

            // Notify customer
            $db->prepare('
                INSERT INTO notifications (user_id, title, message, type, related_entity_type, related_entity_id)
                VALUES (?, ?, ?, "invoice", "invoice", ?)
            ')->execute([
                $jc['customer_user_id'],
                "Invoice Issued: {$invNumber}",
                "Invoice #{$invNumber} for ₹" . number_format($totalAmount, 2) . " has been issued for your motorcycle service.",
                $invoiceId
            ]);

            $db->commit();
            Response::json([
                'id' => $invoiceId,
                'invoice_id' => $invoiceId,
                'invoice_number' => $invNumber,
                'total_amount' => $totalAmount
            ], 'Invoice generated successfully.', 201);
        } catch (\Exception $e) {
            $db->rollBack();
            error_log('Invoice generation failed: ' . $e->getMessage());
            Response::error('Failed to generate invoice.', 500);
        }
    }

    public static function recordPayment(array $admin, int $invoiceId, array $body): void
    {
        $v = Validator::make($body)
            ->required('payment_method', 'Payment Method')
            ->in('payment_method', ['cash', 'upi_workshop', 'card_workshop', 'bank_transfer'])
            ->required('amount', 'Payment Amount')
            ->numeric('amount', 'Payment Amount');

        if ($v->fails()) {
            Response::error($v->firstError(), 422, $v->errors());
        }

        $amount = (float)$body['amount'];
        if ($amount <= 0) {
            Response::error('Payment amount must be greater than zero.', 422);
        }

        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT id, invoice_number, customer_user_id, total_amount, amount_paid, outstanding_balance, status FROM invoices WHERE id = ? LIMIT 1');
        $stmt->execute([$invoiceId]);
        $inv = $stmt->fetch();

        if (!$inv) {
            Response::error('Invoice not found.', 404);
        }

        if ((float)$inv['outstanding_balance'] <= 0) {
            Response::error('Invoice is already fully paid.', 400);
        }

        if ($amount > (float)$inv['outstanding_balance']) {
            Response::error('Payment amount exceeds outstanding balance of ₹' . number_format((float)$inv['outstanding_balance'], 2), 422);
        }

        $method = $body['payment_method'];
        $txnId = trim($body['provider_transaction_id'] ?? ('MANUAL-' . strtoupper(bin2hex(random_bytes(3)))));
        $notes = trim($body['notes'] ?? "Recorded at workshop counter by {$admin['name']}");
        $payRef = 'PAY-' . date('Y') . '-' . strtoupper(bin2hex(random_bytes(3)));

        $db->beginTransaction();
        try {
            $insPay = $db->prepare('
                INSERT INTO payments (invoice_id, payment_reference, payment_method, provider, provider_transaction_id, amount, currency, status, receiving_staff_user_id, paid_at, notes)
                VALUES (?, ?, ?, "workshop_manual", ?, ?, "INR", "successful", ?, NOW(), ?)
            ');
            $insPay->execute([$invoiceId, $payRef, $method, $txnId, $amount, $admin['id'], $notes]);

            // Re-calculate invoice financial balances
            $newPaid = (float)$inv['amount_paid'] + $amount;
            $newBalance = max(0.00, (float)$inv['total_amount'] - $newPaid);
            $newStatus = ($newBalance <= 0.00) ? 'paid' : 'partially_paid';

            $db->prepare('UPDATE invoices SET amount_paid = ?, outstanding_balance = ?, status = ? WHERE id = ?')
                ->execute([$newPaid, $newBalance, $newStatus, $invoiceId]);

            // Notify customer
            $db->prepare('
                INSERT INTO notifications (user_id, title, message, type, related_entity_type, related_entity_id)
                VALUES (?, ?, ?, "payment", "invoice", ?)
            ')->execute([
                $inv['customer_user_id'],
                "Payment Received at Workshop",
                "Payment of ₹" . number_format($amount, 2) . " ({$method}) recorded for Invoice #{$inv['invoice_number']}. Remaining balance: ₹" . number_format($newBalance, 2),
                $invoiceId
            ]);

            $db->commit();
            Response::json([
                'payment_reference' => $payRef,
                'amount' => $amount,
                'new_outstanding_balance' => $newBalance,
                'invoice_status' => $newStatus
            ], 'Workshop payment recorded successfully.');
        } catch (\Exception $e) {
            $db->rollBack();
            error_log('Payment recording error: ' . $e->getMessage());
            Response::error('Failed to record payment.', 500);
        }
    }

    public static function getPayments(): void
    {
        $db = Database::getConnection();
        $method = $_GET['payment_method'] ?? '';

        $sql = '
            SELECT p.*,
                   inv.invoice_number, inv.total_amount as invoice_total,
                   u.name as customer_name,
                   staff.name as receiving_staff_name
            FROM payments p
            JOIN invoices inv ON p.invoice_id = inv.id
            JOIN users u ON inv.customer_user_id = u.id
            LEFT JOIN users staff ON p.receiving_staff_user_id = staff.id
            WHERE 1=1
        ';
        $params = [];

        if ($method !== '') {
            $sql .= ' AND p.payment_method = ?';
            $params[] = $method;
        }

        $sql .= ' ORDER BY p.paid_at DESC';
        $stmt = $db->prepare($sql);
        $stmt->execute($params);

        Response::json($stmt->fetchAll(), 'Payments ledger retrieved.');
    }

    // ==========================================
    // SPARE PARTS & INVENTORY
    // ==========================================
    public static function getParts(): void
    {
        $db = Database::getConnection();
        $search = trim($_GET['search'] ?? '');
        $lowStockOnly = !empty($_GET['low_stock']);

        $sql = 'SELECT * FROM spare_parts WHERE is_active = 1';
        $params = [];

        if ($lowStockOnly) {
            $sql .= ' AND stock_quantity <= minimum_stock';
        }

        if ($search !== '') {
            $sql .= ' AND (sku LIKE ? OR name LIKE ? OR category LIKE ? OR brand LIKE ?)';
            $like = "%{$search}%";
            $params = [$like, $like, $like, $like];
        }

        $sql .= ' ORDER BY name ASC';
        $stmt = $db->prepare($sql);
        $stmt->execute($params);

        Response::json($stmt->fetchAll(), 'Spare parts retrieved.');
    }

    public static function createPart(array $admin, array $body): void
    {
        $v = Validator::make($body)
            ->required('sku', 'SKU')
            ->required('name', 'Part Name')
            ->required('category', 'Category')
            ->required('brand', 'Brand')
            ->numeric('purchase_price', 'Purchase Price')
            ->numeric('selling_price', 'Selling Price')
            ->numeric('stock_quantity', 'Stock Quantity')
            ->numeric('minimum_stock', 'Minimum Stock');

        if ($v->fails()) {
            Response::error($v->firstError(), 422, $v->errors());
        }

        $sku = strtoupper(trim($body['sku']));
        $db = Database::getConnection();

        $check = $db->prepare('SELECT id FROM spare_parts WHERE sku = ? LIMIT 1');
        $check->execute([$sku]);
        if ($check->fetch()) {
            Response::error("Spare part with SKU '{$sku}' already exists.", 409);
        }

        $qty = (int)$body['stock_quantity'];

        $db->beginTransaction();
        try {
            $ins = $db->prepare('
                INSERT INTO spare_parts (sku, name, category, brand, description, purchase_price, selling_price, stock_quantity, minimum_stock, is_active)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
            ');
            $ins->execute([
                $sku,
                trim($body['name']),
                trim($body['category']),
                trim($body['brand']),
                trim($body['description'] ?? ''),
                (float)$body['purchase_price'],
                (float)$body['selling_price'],
                $qty,
                (int)$body['minimum_stock']
            ]);

            $partId = (int)$db->lastInsertId();

            if ($qty > 0) {
                $db->prepare('
                    INSERT INTO stock_movements (part_id, movement_type, quantity_change, unit_cost, reference_type, reason, user_id)
                    VALUES (?, "initial", ?, ?, "manual_adjustment", "Initial opening stock", ?)
                ')->execute([$partId, $qty, (float)$body['purchase_price'], $admin['id']]);
            }

            $db->commit();
            Response::json(['id' => $partId, 'sku' => $sku], 'Spare part created successfully.', 201);
        } catch (\Exception $e) {
            $db->rollBack();
            Response::error('Failed to create spare part.', 500);
        }
    }

    public static function updatePart(int $id, array $body): void
    {
        $db = Database::getConnection();
        $stmt = $db->prepare('
            UPDATE spare_parts
            SET name = ?, category = ?, brand = ?, description = ?,
                purchase_price = ?, selling_price = ?, minimum_stock = ?
            WHERE id = ?
        ');
        $stmt->execute([
            trim($body['name']),
            trim($body['category']),
            trim($body['brand']),
            trim($body['description'] ?? ''),
            (float)$body['purchase_price'],
            (float)$body['selling_price'],
            (int)$body['minimum_stock'],
            $id
        ]);

        Response::json(null, 'Spare part details updated.');
    }

    public static function recordStockAdjustment(array $admin, int $id, array $body): void
    {
        $v = Validator::make($body)
            ->required('movement_type', 'Movement Type')
            ->in('movement_type', ['purchase', 'usage', 'return', 'adjustment'])
            ->required('quantity_change', 'Quantity Change')
            ->numeric('quantity_change', 'Quantity Change');

        if ($v->fails()) {
            Response::error($v->firstError(), 422, $v->errors());
        }

        $change = (int)$body['quantity_change'];
        $type = $body['movement_type'];
        $reason = trim($body['reason'] ?? 'Manual stock adjustment');

        $db = Database::getConnection();
        $db->beginTransaction();

        try {
            $partStmt = $db->prepare('SELECT id, name, stock_quantity, purchase_price FROM spare_parts WHERE id = ? FOR UPDATE');
            $partStmt->execute([$id]);
            $part = $partStmt->fetch();

            if (!$part) {
                $db->rollBack();
                Response::error('Part not found.', 404);
            }

            $newStock = (int)$part['stock_quantity'] + $change;
            if ($newStock < 0) {
                $db->rollBack();
                Response::error("Adjustment would result in negative stock ({$newStock}). Current available stock is {$part['stock_quantity']}.", 422);
            }

            $db->prepare('UPDATE spare_parts SET stock_quantity = ? WHERE id = ?')->execute([$newStock, $id]);

            $db->prepare('
                INSERT INTO stock_movements (part_id, movement_type, quantity_change, unit_cost, reference_type, reason, user_id)
                VALUES (?, ?, ?, ?, "manual_adjustment", ?, ?)
            ')->execute([$id, $type, $change, $part['purchase_price'], $reason, $admin['id']]);

            $db->commit();
            Response::json(['new_stock' => $newStock], "Stock adjusted successfully. New stock: {$newStock}");
        } catch (\Exception $e) {
            $db->rollBack();
            Response::error('Failed to adjust stock.', 500);
        }
    }

    public static function getStockMovements(): void
    {
        $db = Database::getConnection();
        $partId = isset($_GET['part_id']) ? (int)$_GET['part_id'] : null;

        $sql = '
            SELECT sm.*, sp.name as part_name, sp.sku, u.name as user_name
            FROM stock_movements sm
            JOIN spare_parts sp ON sm.part_id = sp.id
            LEFT JOIN users u ON sm.user_id = u.id
        ';
        $params = [];

        if ($partId) {
            $sql .= ' WHERE sm.part_id = ?';
            $params[] = $partId;
        }

        $sql .= ' ORDER BY sm.created_at DESC LIMIT 100';
        $stmt = $db->prepare($sql);
        $stmt->execute($params);

        Response::json($stmt->fetchAll(), 'Stock movements history retrieved.');
    }

    // ==========================================
    // MECHANICS MANAGEMENT
    // ==========================================
    public static function getMechanics(): void
    {
        $db = Database::getConnection();
        $stmt = $db->query('
            SELECT m.*,
                   (SELECT COUNT(*) FROM job_cards jc WHERE jc.assigned_mechanic_id = m.id AND jc.status IN ("diagnosis", "repair_in_progress", "quality_check")) as active_jobs_count,
                   (SELECT COUNT(*) FROM job_cards jc WHERE jc.assigned_mechanic_id = m.id AND jc.status = "delivered") as completed_jobs_count
            FROM mechanics m
            ORDER BY m.name ASC
        ');
        Response::json($stmt->fetchAll(), 'Mechanics retrieved.');
    }

    public static function createMechanic(array $body): void
    {
        $v = Validator::make($body)
            ->required('name', 'Mechanic Name')
            ->required('phone', 'Phone Number')
            ->phone('phone', 'Phone Number');

        if ($v->fails()) {
            Response::error($v->firstError(), 422, $v->errors());
        }

        $db = Database::getConnection();
        $ins = $db->prepare('
            INSERT INTO mechanics (name, email, phone, skills, employment_status)
            VALUES (?, ?, ?, ?, ?)
        ');
        $ins->execute([
            trim($body['name']),
            trim($body['email'] ?? ''),
            trim($body['phone']),
            trim($body['skills'] ?? ''),
            $body['employment_status'] ?? 'active'
        ]);

        Response::json(['id' => (int)$db->lastInsertId()], 'Mechanic added successfully.', 201);
    }

    public static function updateMechanic(int $id, array $body): void
    {
        $db = Database::getConnection();
        $stmt = $db->prepare('
            UPDATE mechanics
            SET name = ?, email = ?, phone = ?, skills = ?, employment_status = ?
            WHERE id = ?
        ');
        $stmt->execute([
            trim($body['name']),
            trim($body['email'] ?? ''),
            trim($body['phone']),
            trim($body['skills'] ?? ''),
            $body['employment_status'] ?? 'active',
            $id
        ]);

        Response::json(null, 'Mechanic updated successfully.');
    }

    // ==========================================
    // SERVICE CATALOGUE MANAGEMENT
    // ==========================================
    public static function getServices(): void
    {
        $db = Database::getConnection();
        $stmt = $db->query('
            SELECT s.*, sc.name as category_name
            FROM services s
            JOIN service_categories sc ON s.category_id = sc.id
            ORDER BY sc.display_order ASC, s.name ASC
        ');
        Response::json($stmt->fetchAll(), 'Catalogue services retrieved.');
    }

    public static function createService(array $body): void
    {
        $v = Validator::make($body)
            ->required('name', 'Service Name')
            ->required('category_id', 'Category')
            ->numeric('category_id', 'Category')
            ->required('standard_price', 'Standard Price')
            ->numeric('standard_price', 'Standard Price');

        if ($v->fails()) {
            Response::error($v->firstError(), 422, $v->errors());
        }

        $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $body['name'])));
        $db = Database::getConnection();

        $ins = $db->prepare('
            INSERT INTO services (category_id, name, slug, description, standard_price, estimated_duration, is_active)
            VALUES (?, ?, ?, ?, ?, ?, 1)
        ');
        $ins->execute([
            (int)$body['category_id'],
            trim($body['name']),
            $slug,
            trim($body['description'] ?? ''),
            (float)$body['standard_price'],
            (int)($body['estimated_duration'] ?? 60)
        ]);

        Response::json(['id' => (int)$db->lastInsertId()], 'Service added to catalogue.', 201);
    }

    public static function updateService(int $id, array $body): void
    {
        $db = Database::getConnection();
        $stmt = $db->prepare('
            UPDATE services
            SET name = ?, category_id = ?, description = ?, standard_price = ?, estimated_duration = ?, is_active = ?
            WHERE id = ?
        ');
        $stmt->execute([
            trim($body['name']),
            (int)$body['category_id'],
            trim($body['description'] ?? ''),
            (float)$body['standard_price'],
            (int)($body['estimated_duration'] ?? 60),
            isset($body['is_active']) ? (int)$body['is_active'] : 1,
            $id
        ]);

        Response::json(null, 'Service updated successfully.');
    }

    // ==========================================
    // EXPENSES MANAGEMENT
    // ==========================================
    public static function getExpenses(): void
    {
        $db = Database::getConnection();
        $category = $_GET['category'] ?? '';

        $sql = '
            SELECT e.*, u.name as recorded_by_name
            FROM expenses e
            JOIN users u ON e.recorded_by_user_id = u.id
            WHERE e.is_reversed = 0
        ';
        $params = [];

        if ($category !== '') {
            $sql .= ' AND e.category = ?';
            $params[] = $category;
        }

        $sql .= ' ORDER BY e.expense_date DESC, e.created_at DESC';
        $stmt = $db->prepare($sql);
        $stmt->execute($params);

        Response::json($stmt->fetchAll(), 'Expenses retrieved.');
    }

    public static function createExpense(array $admin, array $body): void
    {
        $v = Validator::make($body)
            ->required('category', 'Category')
            ->required('description', 'Description')
            ->required('amount', 'Amount')
            ->numeric('amount', 'Amount')
            ->required('expense_date', 'Expense Date')
            ->date('expense_date', 'Expense Date')
            ->required('payee', 'Payee');

        if ($v->fails()) {
            Response::error($v->firstError(), 422, $v->errors());
        }

        $db = Database::getConnection();
        $ins = $db->prepare('
            INSERT INTO expenses (category, description, amount, expense_date, payee, payment_method, recorded_by_user_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ');
        $ins->execute([
            $body['category'],
            trim($body['description']),
            (float)$body['amount'],
            $body['expense_date'],
            trim($body['payee']),
            $body['payment_method'] ?? 'cash',
            $admin['id']
        ]);

        Response::json(['id' => (int)$db->lastInsertId()], 'Expense recorded successfully.', 201);
    }

    // ==========================================
    // REVIEWS MODERATION
    // ==========================================
    public static function getReviews(): void
    {
        $db = Database::getConnection();
        $stmt = $db->query('
            SELECT r.*,
                   u.name as customer_name, u.phone as customer_phone,
                   b.brand as bike_brand, b.model as bike_model,
                   bk.booking_reference
            FROM reviews r
            JOIN users u ON r.customer_user_id = u.id
            JOIN bookings bk ON r.booking_id = bk.id
            JOIN bikes b ON bk.bike_id = b.id
            ORDER BY r.created_at DESC
        ');
        Response::json($stmt->fetchAll(), 'Reviews retrieved.');
    }

    public static function moderateReview(int $id, array $body): void
    {
        $v = Validator::make($body)->in('status', ['approved', 'rejected', 'pending']);
        if ($v->fails()) {
            Response::error($v->firstError(), 422);
        }

        $db = Database::getConnection();
        $db->prepare('UPDATE reviews SET moderation_status = ? WHERE id = ?')->execute([$body['status'], $id]);
        Response::json(null, "Review status set to {$body['status']}.");
    }

    public static function respondReview(array $admin, int $id, array $body): void
    {
        $v = Validator::make($body)->required('response', 'Admin Response');
        if ($v->fails()) {
            Response::error($v->firstError(), 422);
        }

        $db = Database::getConnection();
        $stmt = $db->prepare('UPDATE reviews SET admin_response = ?, responding_admin_id = ?, responded_at = NOW() WHERE id = ?');
        $stmt->execute([trim($body['response']), $admin['id'], $id]);

        Response::json(null, 'Response posted successfully.');
    }

    // ==========================================
    // SETTINGS MANAGEMENT
    // ==========================================
    public static function getSettings(): void
    {
        $db = Database::getConnection();
        $stmt = $db->query('SELECT setting_key, setting_value, setting_group, description FROM workshop_settings ORDER BY setting_group ASC, setting_key ASC');
        Response::json($stmt->fetchAll(), 'Workshop settings retrieved.');
    }

    public static function updateSettings(array $admin, array $body): void
    {
        $db = Database::getConnection();
        $db->beginTransaction();

        try {
            $stmt = $db->prepare('
                INSERT INTO workshop_settings (setting_key, setting_value, updated_by_user_id)
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    setting_value = VALUES(setting_value),
                    updated_by_user_id = VALUES(updated_by_user_id)
            ');

            foreach ($body as $key => $val) {
                $stmt->execute([$key, (string)$val, $admin['id']]);
            }

            $db->commit();
            Response::json(null, 'Settings updated successfully.');
        } catch (\Exception $e) {
            $db->rollBack();
            Response::error('Failed to update settings.', 500);
        }
    }
}
