<?php
// backend/controllers/CustomerController.php
declare(strict_types=1);

namespace BikeFix\Controllers;

use BikeFix\Config\Database;
use BikeFix\Config\Env;
use BikeFix\Utils\Response;
use BikeFix\Utils\Validator;
use PDO;

class CustomerController
{
    // ==========================================
    // PROFILE MANAGEMENT
    // ==========================================
    public static function getProfile(array $user): void
    {
        $db = Database::getConnection();
        $stmt = $db->prepare('
            SELECT u.id, u.name, u.email, u.phone, u.role, u.account_status, u.created_at,
                   cp.address, cp.city, cp.state, cp.postal_code, cp.emergency_contact
            FROM users u
            LEFT JOIN customer_profiles cp ON u.id = cp.user_id
            WHERE u.id = ?
        ');
        $stmt->execute([$user['id']]);
        Response::json($stmt->fetch(), 'Profile retrieved.');
    }

    public static function updateProfile(array $user, array $body): void
    {
        $v = Validator::make($body)
            ->required('name', 'Full Name')
            ->minLength('name', 3, 'Full Name')
            ->phone('phone', 'Phone Number');

        if ($v->fails()) {
            Response::error($v->firstError(), 422, $v->errors());
        }

        $db = Database::getConnection();
        $db->beginTransaction();

        try {
            // Update user core
            $userStmt = $db->prepare('UPDATE users SET name = ?, phone = ? WHERE id = ?');
            $userStmt->execute([trim($body['name']), trim($body['phone']), $user['id']]);

            // Update or insert customer profile
            $profStmt = $db->prepare('
                INSERT INTO customer_profiles (user_id, address, city, state, postal_code, emergency_contact)
                VALUES (?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    address = VALUES(address),
                    city = VALUES(city),
                    state = VALUES(state),
                    postal_code = VALUES(postal_code),
                    emergency_contact = VALUES(emergency_contact)
            ');
            $profStmt->execute([
                $user['id'],
                trim($body['address'] ?? ''),
                trim($body['city'] ?? 'Aruppukkottai'),
                trim($body['state'] ?? 'Tamil Nadu'),
                trim($body['postal_code'] ?? '626101'),
                trim($body['emergency_contact'] ?? '')
            ]);

            $db->commit();
            Response::json(null, 'Profile updated successfully.');
        } catch (\Exception $e) {
            $db->rollBack();
            error_log('Profile update error: ' . $e->getMessage());
            Response::error('Failed to update profile.', 500);
        }
    }

    // ==========================================
    // BIKES MANAGEMENT
    // ==========================================
    public static function getBikes(array $user): void
    {
        $db = Database::getConnection();
        $stmt = $db->prepare('
            SELECT b.*,
                   (SELECT COUNT(*) FROM bookings bk WHERE bk.bike_id = b.id) as total_bookings,
                   (SELECT MAX(created_at) FROM bookings bk WHERE bk.bike_id = b.id) as last_service_date
            FROM bikes b
            WHERE b.customer_user_id = ? AND b.is_active = 1
            ORDER BY b.created_at DESC
        ');
        $stmt->execute([$user['id']]);
        Response::json($stmt->fetchAll(), 'Registered bikes retrieved.');
    }

    public static function getBike(array $user, int $bikeId): void
    {
        $db = Database::getConnection();
        $stmt = $db->prepare('
            SELECT * FROM bikes
            WHERE id = ? AND customer_user_id = ? AND is_active = 1
            LIMIT 1
        ');
        $stmt->execute([$bikeId, $user['id']]);
        $bike = $stmt->fetch();

        if (!$bike) {
            Response::error('Motorcycle record not found or access denied.', 404);
        }

        Response::json($bike, 'Bike details retrieved.');
    }

    public static function createBike(array $user, array $body): void
    {
        $v = Validator::make($body)
            ->required('registration_number', 'Registration Number')
            ->required('brand', 'Brand')
            ->required('model', 'Model')
            ->numeric('current_odometer', 'Current Odometer');

        if ($v->fails()) {
            Response::error($v->firstError(), 422, $v->errors());
        }

        $regNumber = strtoupper(trim(preg_replace('/\s+/', '-', $body['registration_number'])));

        $db = Database::getConnection();
        $check = $db->prepare('SELECT id FROM bikes WHERE customer_user_id = ? AND registration_number = ? AND is_active = 1 LIMIT 1');
        $check->execute([$user['id'], $regNumber]);
        if ($check->fetch()) {
            Response::error('You have already registered a bike with registration number ' . $regNumber, 409);
        }

        $stmt = $db->prepare('
            INSERT INTO bikes (customer_user_id, registration_number, brand, model, variant, manufacturing_year, fuel_type, current_odometer, notes, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        ');
        $stmt->execute([
            $user['id'],
            $regNumber,
            trim($body['brand']),
            trim($body['model']),
            trim($body['variant'] ?? ''),
            !empty($body['manufacturing_year']) ? (int)$body['manufacturing_year'] : null,
            trim($body['fuel_type'] ?? 'Petrol'),
            (int)($body['current_odometer'] ?? 0),
            trim($body['notes'] ?? '')
        ]);

        $bikeId = (int)$db->lastInsertId();
        Response::json(['id' => $bikeId, 'registration_number' => $regNumber], 'Motorcycle registered successfully.', 201);
    }

    public static function updateBike(array $user, int $bikeId, array $body): void
    {
        $v = Validator::make($body)
            ->required('brand', 'Brand')
            ->required('model', 'Model')
            ->numeric('current_odometer', 'Current Odometer');

        if ($v->fails()) {
            Response::error($v->firstError(), 422, $v->errors());
        }

        $db = Database::getConnection();
        // Check ownership
        $check = $db->prepare('SELECT id FROM bikes WHERE id = ? AND customer_user_id = ? AND is_active = 1 LIMIT 1');
        $check->execute([$bikeId, $user['id']]);
        if (!$check->fetch()) {
            Response::error('Motorcycle record not found or access denied.', 404);
        }

        $stmt = $db->prepare('
            UPDATE bikes
            SET brand = ?, model = ?, variant = ?, manufacturing_year = ?, fuel_type = ?, current_odometer = ?, notes = ?
            WHERE id = ? AND customer_user_id = ?
        ');
        $stmt->execute([
            trim($body['brand']),
            trim($body['model']),
            trim($body['variant'] ?? ''),
            !empty($body['manufacturing_year']) ? (int)$body['manufacturing_year'] : null,
            trim($body['fuel_type'] ?? 'Petrol'),
            (int)$body['current_odometer'],
            trim($body['notes'] ?? ''),
            $bikeId,
            $user['id']
        ]);

        Response::json(null, 'Motorcycle details updated successfully.');
    }

    public static function deleteBike(array $user, int $bikeId): void
    {
        $db = Database::getConnection();
        $check = $db->prepare('SELECT id FROM bikes WHERE id = ? AND customer_user_id = ? LIMIT 1');
        $check->execute([$bikeId, $user['id']]);
        if (!$check->fetch()) {
            Response::error('Motorcycle not found or access denied.', 404);
        }

        // Check if referenced in bookings or job cards
        $refCheck = $db->prepare('
            SELECT (SELECT COUNT(*) FROM bookings WHERE bike_id = ?) +
                   (SELECT COUNT(*) FROM job_cards WHERE bike_id = ?) as total_refs
        ');
        $refCheck->execute([$bikeId, $bikeId]);
        $hasRefs = (int)$refCheck->fetchColumn() > 0;

        if ($hasRefs) {
            // Soft-deactivate to preserve historical service records and invoices
            $db->prepare('UPDATE bikes SET is_active = 0 WHERE id = ?')->execute([$bikeId]);
            Response::json(null, 'Motorcycle archived safely to preserve service and invoice history.');
        } else {
            $db->prepare('DELETE FROM bikes WHERE id = ?')->execute([$bikeId]);
            Response::json(null, 'Motorcycle removed successfully.');
        }
    }

    // ==========================================
    // BOOKINGS MANAGEMENT
    // ==========================================
    public static function getBookings(array $user): void
    {
        $db = Database::getConnection();
        $stmt = $db->prepare('
            SELECT bk.*,
                   b.brand as bike_brand, b.model as bike_model, b.registration_number as bike_registration,
                   jc.id as job_card_id, jc.status as job_card_status, jc.job_card_reference,
                   inv.id as invoice_id, inv.invoice_number, inv.status as invoice_status, inv.total_amount as invoice_total, inv.outstanding_balance,
                   r.id as review_id, r.rating as review_rating
            FROM bookings bk
            JOIN bikes b ON bk.bike_id = b.id
            LEFT JOIN job_cards jc ON bk.id = jc.booking_id
            LEFT JOIN invoices inv ON jc.id = inv.job_card_id
            LEFT JOIN reviews r ON bk.id = r.booking_id
            WHERE bk.customer_user_id = ?
            ORDER BY bk.created_at DESC
        ');
        $stmt->execute([$user['id']]);
        $bookings = $stmt->fetchAll();

        // Attach services for each booking
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

        Response::json($bookings, 'Customer bookings retrieved.');
    }

    public static function getBooking(array $user, int $bookingId): void
    {
        $db = Database::getConnection();
        $stmt = $db->prepare('
            SELECT bk.*,
                   b.brand as bike_brand, b.model as bike_model, b.registration_number, b.variant, b.current_odometer as bike_odometer,
                   jc.id as job_card_id, jc.job_card_reference, jc.status as job_card_status,
                   m.name as mechanic_name, m.phone as mechanic_phone,
                   inv.id as invoice_id, inv.invoice_number, inv.status as invoice_status, inv.total_amount as invoice_total, inv.outstanding_balance
            FROM bookings bk
            JOIN bikes b ON bk.bike_id = b.id
            LEFT JOIN job_cards jc ON bk.id = jc.booking_id
            LEFT JOIN mechanics m ON jc.assigned_mechanic_id = m.id
            LEFT JOIN invoices inv ON jc.id = inv.job_card_id
            WHERE bk.id = ? AND bk.customer_user_id = ?
            LIMIT 1
        ');
        $stmt->execute([$bookingId, $user['id']]);
        $booking = $stmt->fetch();

        if (!$booking) {
            Response::error('Booking not found or access denied.', 404);
        }

        // Fetch services
        $svcStmt = $db->prepare('
            SELECT s.id, s.name, s.estimated_duration, bs.requested_price
            FROM booking_services bs
            JOIN services s ON bs.service_id = s.id
            WHERE bs.booking_id = ?
        ');
        $svcStmt->execute([$bookingId]);
        $booking['services'] = $svcStmt->fetchAll();

        Response::json($booking, 'Booking details retrieved.');
    }

    public static function createBooking(array $user, array $body): void
    {
        $v = Validator::make($body)
            ->required('bike_id', 'Motorcycle')
            ->numeric('bike_id', 'Motorcycle')
            ->required('preferred_date', 'Preferred Date')
            ->date('preferred_date', 'Preferred Date')
            ->required('preferred_time', 'Preferred Time')
            ->required('problem_description', 'Problem Description')
            ->minLength('problem_description', 5, 'Problem Description');

        if ($v->fails()) {
            Response::error($v->firstError(), 422, $v->errors());
        }

        if (empty($body['service_ids']) || !is_array($body['service_ids'])) {
            Response::error('Please select at least one workshop service for your booking.', 422);
        }

        $preferredDate = $body['preferred_date'];
        $today = date('Y-m-d');
        if ($preferredDate < $today) {
            Response::error('Preferred booking date cannot be in the past.', 422);
        }

        $db = Database::getConnection();

        // 1. Verify bike ownership
        $bikeStmt = $db->prepare('SELECT id, current_odometer FROM bikes WHERE id = ? AND customer_user_id = ? AND is_active = 1 LIMIT 1');
        $bikeStmt->execute([(int)$body['bike_id'], $user['id']]);
        $bike = $bikeStmt->fetch();
        if (!$bike) {
            Response::error('Selected motorcycle was not found or does not belong to your account.', 404);
        }

        // 2. Verify daily workshop capacity
        $capacitySetting = $db->query('SELECT setting_value FROM workshop_settings WHERE setting_key = "daily_booking_capacity"')->fetchColumn();
        $maxCapacity = (int)($capacitySetting ?: 12);

        $countStmt = $db->prepare('SELECT COUNT(*) FROM bookings WHERE preferred_date = ? AND status NOT IN ("cancelled")');
        $countStmt->execute([$preferredDate]);
        $bookedCount = (int)$countStmt->fetchColumn();

        if ($bookedCount >= $maxCapacity) {
            Response::error("Workshop is fully booked for {$preferredDate} ({$bookedCount}/{$maxCapacity} slots taken). Please select another date.", 422);
        }

        // 3. Verify services & calculate total
        $serviceIds = array_map('intval', $body['service_ids']);
        $inPlaceholders = implode(',', array_fill(0, count($serviceIds), '?'));
        $servicesStmt = $db->prepare("SELECT id, name, standard_price FROM services WHERE id IN ({$inPlaceholders}) AND is_active = 1");
        $servicesStmt->execute($serviceIds);
        $validServices = $servicesStmt->fetchAll();

        if (empty($validServices)) {
            Response::error('No valid active services were selected.', 422);
        }

        $estimatedTotal = 0.00;
        foreach ($validServices as $s) {
            $estimatedTotal += (float)$s['standard_price'];
        }

        // 4. Generate reference: BFC-BK-YYYY-XXXX
        $year = date('Y');
        $refStmt = $db->query("SELECT COUNT(*) FROM bookings WHERE YEAR(created_at) = {$year}");
        $nextNum = str_pad((string)((int)$refStmt->fetchColumn() + 1), 4, '0', STR_PAD_LEFT);
        $bookingRef = "BFC-BK-{$year}-{$nextNum}";

        // Check auto_confirm setting
        $autoConfirmSetting = (int)($db->query('SELECT setting_value FROM workshop_settings WHERE setting_key = "auto_confirm_bookings"')->fetchColumn() ?: 0);
        $initialStatus = ($autoConfirmSetting === 1) ? 'confirmed' : 'pending';

        $db->beginTransaction();
        try {
            $insBooking = $db->prepare('
                INSERT INTO bookings (booking_reference, customer_user_id, bike_id, preferred_date, preferred_time, status, problem_description, current_odometer, estimated_amount, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ');
            $insBooking->execute([
                $bookingRef,
                $user['id'],
                (int)$body['bike_id'],
                $preferredDate,
                trim($body['preferred_time']),
                $initialStatus,
                trim($body['problem_description']),
                !empty($body['current_odometer']) ? (int)$body['current_odometer'] : (int)$bike['current_odometer'],
                $estimatedTotal,
                trim($body['notes'] ?? '')
            ]);

            $bookingId = (int)$db->lastInsertId();

            // Insert booking services
            $insBS = $db->prepare('INSERT INTO booking_services (booking_id, service_id, requested_price) VALUES (?, ?, ?)');
            foreach ($validServices as $s) {
                $insBS->execute([$bookingId, $s['id'], $s['standard_price']]);
            }

            // Update bike odometer if greater than existing
            if (!empty($body['current_odometer']) && (int)$body['current_odometer'] > (int)$bike['current_odometer']) {
                $db->prepare('UPDATE bikes SET current_odometer = ? WHERE id = ?')->execute([(int)$body['current_odometer'], $bike['id']]);
            }

            // Record status history
            $db->prepare('
                INSERT INTO booking_status_history (booking_id, old_status, new_status, changed_by_user_id, notes)
                VALUES (?, NULL, ?, ?, "Booking placed online by customer")
            ')->execute([$bookingId, $initialStatus, $user['id']]);

            // Create notification for customer
            $db->prepare('
                INSERT INTO notifications (user_id, title, message, type, related_entity_type, related_entity_id)
                VALUES (?, ?, ?, "booking", "booking", ?)
            ')->execute([
                $user['id'],
                "Booking Confirmed: {$bookingRef}",
                "Your booking request for {$preferredDate} ({$body['preferred_time']}) has been registered with reference {$bookingRef}.",
                $bookingId
            ]);

            // Notify admin
            $adminId = $db->query('SELECT id FROM users WHERE role = "admin" LIMIT 1')->fetchColumn();
            if ($adminId) {
                $db->prepare('
                    INSERT INTO notifications (user_id, title, message, type, related_entity_type, related_entity_id)
                    VALUES (?, ?, ?, "booking", "booking", ?)
                ')->execute([
                    $adminId,
                    "New Service Booking: {$bookingRef}",
                    "{$user['name']} has booked a service appointment for {$preferredDate}.",
                    $bookingId
                ]);
            }

            $db->commit();

            Response::json([
                'booking_id' => $bookingId,
                'booking_reference' => $bookingRef,
                'status' => $initialStatus,
                'estimated_amount' => $estimatedTotal
            ], 'Your service appointment has been booked successfully!', 201);
        } catch (\Exception $e) {
            $db->rollBack();
            error_log('Booking creation failed: ' . $e->getMessage());
            Response::error('Failed to create booking. Please try again.', 500);
        }
    }

    public static function cancelBooking(array $user, int $bookingId, array $body): void
    {
        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT id, status, booking_reference FROM bookings WHERE id = ? AND customer_user_id = ? LIMIT 1');
        $stmt->execute([$bookingId, $user['id']]);
        $booking = $stmt->fetch();

        if (!$booking) {
            Response::error('Booking not found or access denied.', 404);
        }

        if (in_array($booking['status'], ['checked_in', 'in_progress', 'completed', 'cancelled'], true)) {
            Response::error("Cannot cancel booking with current status '{$booking['status']}'. Please call the workshop directly.", 400);
        }

        $reason = trim($body['reason'] ?? 'Cancelled by customer');

        $db->beginTransaction();
        try {
            $db->prepare('UPDATE bookings SET status = "cancelled", cancellation_reason = ? WHERE id = ?')
                ->execute([$reason, $bookingId]);

            $db->prepare('
                INSERT INTO booking_status_history (booking_id, old_status, new_status, changed_by_user_id, notes)
                VALUES (?, ?, "cancelled", ?, ?)
            ')->execute([$bookingId, $booking['status'], $user['id'], $reason]);

            $db->commit();
            Response::json(null, 'Booking has been cancelled.');
        } catch (\Exception $e) {
            $db->rollBack();
            Response::error('Failed to cancel booking.', 500);
        }
    }

    public static function rescheduleBooking(array $user, int $bookingId, array $body): void
    {
        $v = Validator::make($body)
            ->required('preferred_date', 'Preferred Date')
            ->date('preferred_date', 'Preferred Date')
            ->required('preferred_time', 'Preferred Time');

        if ($v->fails()) {
            Response::error($v->firstError(), 422, $v->errors());
        }

        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT id, status, booking_reference FROM bookings WHERE id = ? AND customer_user_id = ? LIMIT 1');
        $stmt->execute([$bookingId, $user['id']]);
        $booking = $stmt->fetch();

        if (!$booking) {
            Response::error('Booking not found or access denied.', 404);
        }

        if (in_array($booking['status'], ['checked_in', 'in_progress', 'completed', 'cancelled'], true)) {
            Response::error("Cannot reschedule booking with status '{$booking['status']}'.", 400);
        }

        $db->prepare('
            UPDATE bookings
            SET preferred_date = ?, preferred_time = ?, status = "rescheduled"
            WHERE id = ?
        ')->execute([$body['preferred_date'], trim($body['preferred_time']), $bookingId]);

        Response::json(null, 'Booking appointment rescheduled successfully.');
    }

    // ==========================================
    // SERVICE TRACKING & HISTORY
    // ==========================================
    public static function getJobCardTracking(array $user, int $jobCardId): void
    {
        $db = Database::getConnection();
        $stmt = $db->prepare('
            SELECT jc.*,
                   b.brand as bike_brand, b.model as bike_model, b.registration_number, b.variant,
                   m.name as mechanic_name, m.phone as mechanic_phone, m.skills as mechanic_skills,
                   bk.booking_reference, bk.preferred_date,
                   inv.id as invoice_id, inv.invoice_number, inv.status as invoice_status, inv.total_amount, inv.amount_paid, inv.outstanding_balance
            FROM job_cards jc
            JOIN bikes b ON jc.bike_id = b.id
            LEFT JOIN mechanics m ON jc.assigned_mechanic_id = m.id
            LEFT JOIN bookings bk ON jc.booking_id = bk.id
            LEFT JOIN invoices inv ON jc.id = inv.job_card_id
            WHERE jc.id = ? AND jc.customer_user_id = ?
            LIMIT 1
        ');
        $stmt->execute([$jobCardId, $user['id']]);
        $jobCard = $stmt->fetch();

        if (!$jobCard) {
            Response::error('Service job card not found or access denied.', 404);
        }

        // Fetch labour services
        $svcStmt = $db->prepare('SELECT id, description, quantity, unit_price, line_total FROM job_card_services WHERE job_card_id = ?');
        $svcStmt->execute([$jobCardId]);
        $jobCard['services'] = $svcStmt->fetchAll();

        // Fetch parts used
        $partsStmt = $db->prepare('
            SELECT jcp.id, sp.name as part_name, sp.sku, jcp.quantity, jcp.unit_price, jcp.line_total
            FROM job_card_parts jcp
            JOIN spare_parts sp ON jcp.part_id = sp.id
            WHERE jcp.job_card_id = ?
        ');
        $partsStmt->execute([$jobCardId]);
        $jobCard['parts'] = $partsStmt->fetchAll();

        // Status history
        $histStmt = $db->prepare('SELECT old_status, new_status, notes, created_at FROM job_card_status_history WHERE job_card_id = ? ORDER BY created_at ASC');
        $histStmt->execute([$jobCardId]);
        $jobCard['status_history'] = $histStmt->fetchAll();

        // Compute step index (0 to 7) for frontend visual progress bar:
        // [0: Booking Received, 1: Confirmed, 2: Bike Checked In, 3: Diagnosis, 4: Repair in Progress, 5: Quality Check, 6: Ready for Delivery, 7: Delivered]
        $stageOrder = [
            'created' => 1,
            'checked_in' => 2,
            'diagnosis' => 3,
            'repair_in_progress' => 4,
            'quality_check' => 5,
            'ready_for_delivery' => 6,
            'delivered' => 7,
            'cancelled' => -1
        ];
        $jobCard['current_step_index'] = $stageOrder[$jobCard['status']] ?? 0;

        Response::json($jobCard, 'Service tracking details retrieved.');
    }

    public static function getServiceHistory(array $user): void
    {
        $db = Database::getConnection();
        $stmt = $db->prepare('
            SELECT jc.id as job_card_id, jc.job_card_reference, jc.status as job_card_status,
                   jc.initial_odometer, jc.final_odometer, jc.check_in_at, jc.delivered_at, jc.customer_visible_notes,
                   b.brand as bike_brand, b.model as bike_model, b.registration_number,
                   bk.id as booking_id, bk.booking_reference,
                   inv.id as invoice_id, inv.invoice_number, inv.total_amount, inv.outstanding_balance, inv.status as invoice_status,
                   r.id as review_id, r.rating as review_rating
            FROM job_cards jc
            JOIN bikes b ON jc.bike_id = b.id
            LEFT JOIN bookings bk ON jc.booking_id = bk.id
            LEFT JOIN invoices inv ON jc.id = inv.job_card_id
            LEFT JOIN reviews r ON bk.id = r.booking_id
            WHERE jc.customer_user_id = ?
            ORDER BY jc.created_at DESC
        ');
        $stmt->execute([$user['id']]);
        Response::json($stmt->fetchAll(), 'Service history retrieved.');
    }

    // ==========================================
    // INVOICES & PAYMENTS
    // ==========================================
    public static function getInvoices(array $user): void
    {
        $db = Database::getConnection();
        $stmt = $db->prepare('
            SELECT inv.*,
                   jc.job_card_reference,
                   b.brand as bike_brand, b.model as bike_model, b.registration_number
            FROM invoices inv
            JOIN job_cards jc ON inv.job_card_id = jc.id
            JOIN bikes b ON jc.bike_id = b.id
            WHERE inv.customer_user_id = ?
            ORDER BY inv.created_at DESC
        ');
        $stmt->execute([$user['id']]);
        Response::json($stmt->fetchAll(), 'Invoices retrieved.');
    }

    public static function getInvoice(array $user, int $invoiceId): void
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
            WHERE inv.id = ? AND inv.customer_user_id = ?
            LIMIT 1
        ');
        $stmt->execute([$invoiceId, $user['id']]);
        $invoice = $stmt->fetch();

        if (!$invoice) {
            Response::error('Invoice not found or access denied.', 404);
        }

        // Fetch line items
        $itemsStmt = $db->prepare('SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY id ASC');
        $itemsStmt->execute([$invoiceId]);
        $invoice['items'] = $itemsStmt->fetchAll();

        // Fetch payments made
        $payStmt = $db->prepare('SELECT * FROM payments WHERE invoice_id = ? ORDER BY paid_at DESC');
        $payStmt->execute([$invoiceId]);
        $invoice['payments'] = $payStmt->fetchAll();

        Response::json($invoice, 'Invoice retrieved.');
    }

    public static function createPaymentOrder(array $user, int $invoiceId, array $body): void
    {
        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT id, invoice_number, total_amount, amount_paid, outstanding_balance, status FROM invoices WHERE id = ? AND customer_user_id = ? LIMIT 1');
        $stmt->execute([$invoiceId, $user['id']]);
        $invoice = $stmt->fetch();

        if (!$invoice) {
            Response::error('Invoice not found or access denied.', 404);
        }

        if ((float)$invoice['outstanding_balance'] <= 0) {
            Response::error('This invoice has already been fully paid.', 400);
        }

        $amountToPay = isset($body['amount']) ? (float)$body['amount'] : (float)$invoice['outstanding_balance'];
        if ($amountToPay <= 0 || $amountToPay > (float)$invoice['outstanding_balance']) {
            Response::error('Invalid payment amount. Must be between ₹1 and ₹' . number_format((float)$invoice['outstanding_balance'], 2), 422);
        }

        // Create an internal Razorpay Order ID for sandbox integration
        $orderId = 'order_sandbox_' . substr(md5(uniqid((string)$invoiceId, true)), 0, 16);
        $keyId = Env::get('RAZORPAY_KEY_ID', 'rzp_test_bikefixclub_sandbox');

        Response::json([
            'order_id' => $orderId,
            'amount' => $amountToPay,
            'amount_in_paise' => (int)($amountToPay * 100),
            'currency' => 'INR',
            'key_id' => $keyId,
            'invoice_id' => $invoiceId,
            'invoice_number' => $invoice['invoice_number'],
            'customer' => [
                'name' => $user['name'],
                'email' => $user['email'],
                'phone' => $user['phone']
            ]
        ], 'Payment order initialized successfully.');
    }

    public static function verifyPayment(array $user, int $invoiceId, array $body): void
    {
        $v = Validator::make($body)
            ->required('payment_id', 'Payment ID')
            ->numeric('amount', 'Payment Amount');

        if ($v->fails()) {
            Response::error($v->firstError(), 422, $v->errors());
        }

        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT id, invoice_number, total_amount, amount_paid, outstanding_balance, status FROM invoices WHERE id = ? AND customer_user_id = ? LIMIT 1');
        $stmt->execute([$invoiceId, $user['id']]);
        $invoice = $stmt->fetch();

        if (!$invoice) {
            Response::error('Invoice not found or access denied.', 404);
        }

        $paidAmount = (float)$body['amount'];
        if ($paidAmount <= 0) {
            Response::error('Invalid payment amount.', 422);
        }

        // Server-side verification: in real production Razorpay, verify HMAC SHA256 of order_id + "|" + payment_id with key_secret
        // In sandbox mode, verify signature if present or validate payment structure
        $razorpayPaymentId = trim($body['payment_id']);
        $razorpayOrderId = trim($body['order_id'] ?? '');
        $razorpaySignature = trim($body['signature'] ?? '');

        if ($razorpaySignature !== '') {
            $secret = Env::get('RAZORPAY_KEY_SECRET', 'rzp_secret_sandbox_bikefix');
            $expectedSignature = hash_hmac('sha256', "{$razorpayOrderId}|{$razorpayPaymentId}", $secret);
            // Verify if provided signature matches or accept sandbox signature
            if (!hash_equals($expectedSignature, $razorpaySignature) && !str_starts_with($razorpaySignature, 'sandbox_sig_')) {
                Response::error('Payment signature verification failed.', 400);
            }
        }

        $db->beginTransaction();
        try {
            // Check duplicate payment ID
            $checkDup = $db->prepare('SELECT id FROM payments WHERE provider_transaction_id = ? LIMIT 1');
            $checkDup->execute([$razorpayPaymentId]);
            if ($checkDup->fetch()) {
                Response::error('This payment transaction has already been recorded.', 409);
            }

            // Generate payment reference
            $payRef = 'PAY-' . date('Y') . '-' . strtoupper(bin2hex(random_bytes(3)));

            // Insert payment
            $insPay = $db->prepare('
                INSERT INTO payments (invoice_id, payment_reference, payment_method, provider, provider_transaction_id, provider_order_id, amount, currency, status, paid_at, notes)
                VALUES (?, ?, "online_gateway", "razorpay", ?, ?, ?, "INR", "successful", NOW(), ?)
            ');
            $insPay->execute([
                $invoiceId,
                $payRef,
                $razorpayPaymentId,
                $razorpayOrderId ?: null,
                $paidAmount,
                'Online payment via Razorpay Sandbox verified'
            ]);

            // Re-calculate invoice financial totals authoritative on backend
            $newPaid = (float)$invoice['amount_paid'] + $paidAmount;
            $newBalance = max(0.00, (float)$invoice['total_amount'] - $newPaid);
            $newStatus = ($newBalance <= 0.00) ? 'paid' : 'partially_paid';

            $db->prepare('
                UPDATE invoices
                SET amount_paid = ?, outstanding_balance = ?, status = ?
                WHERE id = ?
            ')->execute([$newPaid, $newBalance, $newStatus, $invoiceId]);

            // Record payment event
            $db->prepare('
                INSERT INTO payment_events (provider_event_id, event_type, payload, processing_status, payment_reference, received_at, processed_at)
                VALUES (?, "payment.captured", ?, "processed", ?, NOW(), NOW())
            ')->execute([
                $razorpayPaymentId,
                json_encode($body),
                $payRef
            ]);

            // Create notification for customer
            $db->prepare('
                INSERT INTO notifications (user_id, title, message, type, related_entity_type, related_entity_id)
                VALUES (?, ?, ?, "payment", "invoice", ?)
            ')->execute([
                $user['id'],
                "Payment Received: ₹{$paidAmount}",
                "We received your online payment of ₹" . number_format($paidAmount, 2) . " for Invoice #{$invoice['invoice_number']}. Outstanding balance: ₹" . number_format($newBalance, 2),
                $invoiceId
            ]);

            $db->commit();

            Response::json([
                'payment_reference' => $payRef,
                'amount_paid' => $paidAmount,
                'new_outstanding_balance' => $newBalance,
                'invoice_status' => $newStatus
            ], 'Payment verified and recorded successfully.');
        } catch (\Exception $e) {
            $db->rollBack();
            error_log('Payment verification failed: ' . $e->getMessage());
            Response::error('Failed to record payment.', 500);
        }
    }

    public static function getPayments(array $user): void
    {
        $db = Database::getConnection();
        $stmt = $db->prepare('
            SELECT p.*, inv.invoice_number, inv.total_amount as invoice_total
            FROM payments p
            JOIN invoices inv ON p.invoice_id = inv.id
            WHERE inv.customer_user_id = ?
            ORDER BY p.paid_at DESC
        ');
        $stmt->execute([$user['id']]);
        Response::json($stmt->fetchAll(), 'Payment history retrieved.');
    }

    // ==========================================
    // CUSTOMER REVIEWS
    // ==========================================
    public static function getReviews(array $user): void
    {
        $db = Database::getConnection();
        $stmt = $db->prepare('
            SELECT r.*, bk.booking_reference, b.brand as bike_brand, b.model as bike_model
            FROM reviews r
            JOIN bookings bk ON r.booking_id = bk.id
            JOIN bikes b ON bk.bike_id = b.id
            WHERE r.customer_user_id = ?
            ORDER BY r.created_at DESC
        ');
        $stmt->execute([$user['id']]);
        Response::json($stmt->fetchAll(), 'My reviews retrieved.');
    }

    public static function submitReview(array $user, int $bookingId, array $body): void
    {
        $v = Validator::make($body)
            ->required('rating', 'Rating')
            ->numeric('rating', 'Rating')
            ->required('comment', 'Review Feedback')
            ->minLength('comment', 10, 'Review Feedback');

        if ($v->fails()) {
            Response::error($v->firstError(), 422, $v->errors());
        }

        $rating = (int)$body['rating'];
        if ($rating < 1 || $rating > 5) {
            Response::error('Rating must be between 1 and 5 stars.', 422);
        }

        $db = Database::getConnection();

        // 1. Verify booking ownership
        $stmt = $db->prepare('
            SELECT bk.id, bk.status, bk.booking_reference,
                   jc.id as job_card_id, jc.status as job_card_status,
                   inv.id as invoice_id, inv.status as invoice_status, inv.outstanding_balance
            FROM bookings bk
            LEFT JOIN job_cards jc ON bk.id = jc.booking_id
            LEFT JOIN invoices inv ON jc.id = inv.job_card_id
            WHERE bk.id = ? AND bk.customer_user_id = ?
            LIMIT 1
        ');
        $stmt->execute([$bookingId, $user['id']]);
        $record = $stmt->fetch();

        if (!$record) {
            Response::error('Booking record not found or access denied.', 404);
        }

        // Strict Requirement Check 1: Service is marked Delivered / Completed
        $isDelivered = ($record['job_card_status'] === 'delivered' || $record['status'] === 'completed');
        if (!$isDelivered) {
            Response::error('Reviews can only be submitted after your motorcycle service has been completed and delivered.', 403);
        }

        // Strict Requirement Check 2: Invoice is fully paid
        if (!$record['invoice_id'] || (float)$record['outstanding_balance'] > 0 || $record['invoice_status'] !== 'paid') {
            Response::error('Reviews can only be submitted after the service invoice has been fully paid.', 403);
        }

        // Strict Requirement Check 3: No duplicate review
        $checkDup = $db->prepare('SELECT id FROM reviews WHERE booking_id = ? LIMIT 1');
        $checkDup->execute([$bookingId]);
        if ($checkDup->fetch()) {
            Response::error('A review has already been submitted for this booking.', 409);
        }

        $ins = $db->prepare('
            INSERT INTO reviews (booking_id, customer_user_id, rating, comment, moderation_status)
            VALUES (?, ?, ?, ?, "approved")
        ');
        $ins->execute([
            $bookingId,
            $user['id'],
            $rating,
            trim($body['comment'])
        ]);

        $newRevId = (int)$db->lastInsertId();
        Response::json([
            'id' => $newRevId,
            'review_id' => $newRevId
        ], 'Thank you for your valuable feedback! Your review has been submitted.', 201);
    }

    // ==========================================
    // NOTIFICATIONS
    // ==========================================
    public static function getNotifications(array $user): void
    {
        $db = Database::getConnection();
        $stmt = $db->prepare('
            SELECT * FROM notifications
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT 50
        ');
        $stmt->execute([$user['id']]);
        Response::json($stmt->fetchAll(), 'Notifications retrieved.');
    }

    public static function markNotificationRead(array $user, int $id): void
    {
        $db = Database::getConnection();
        $db->prepare('UPDATE notifications SET is_read = 1, read_at = NOW() WHERE id = ? AND user_id = ?')->execute([$id, $user['id']]);
        Response::json(null, 'Notification marked as read.');
    }

    public static function markAllNotificationsRead(array $user): void
    {
        $db = Database::getConnection();
        $db->prepare('UPDATE notifications SET is_read = 1, read_at = NOW() WHERE user_id = ? AND is_read = 0')->execute([$user['id']]);
        Response::json(null, 'All notifications marked as read.');
    }
}
