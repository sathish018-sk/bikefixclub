<?php
// backend/controllers/ReportController.php
declare(strict_types=1);

namespace BikeFix\Controllers;

use BikeFix\Config\Database;
use BikeFix\Utils\Response;
use PDO;

class ReportController
{
    public static function getRevenueReport(): void
    {
        $db = Database::getConnection();
        $startDate = $_GET['start_date'] ?? date('Y-m-01');
        $endDate = $_GET['end_date'] ?? date('Y-m-t');

        $stmt = $db->prepare('
            SELECT DATE(paid_at) as pay_date,
                   COUNT(id) as total_transactions,
                   COALESCE(SUM(amount), 0.00) as total_collected,
                   payment_method
            FROM payments
            WHERE status = "successful" AND DATE(paid_at) BETWEEN ? AND ?
            GROUP BY DATE(paid_at), payment_method
            ORDER BY pay_date DESC
        ');
        $stmt->execute([$startDate, $endDate]);
        $rows = $stmt->fetchAll();

        $sumStmt = $db->prepare('
            SELECT COALESCE(SUM(amount), 0.00) FROM payments WHERE status = "successful" AND DATE(paid_at) BETWEEN ? AND ?
        ');
        $sumStmt->execute([$startDate, $endDate]);
        $totalCollected = (float)$sumStmt->fetchColumn();

        Response::json([
            'start_date' => $startDate,
            'end_date' => $endDate,
            'total_collected' => $totalCollected,
            'breakdown' => $rows
        ], 'Revenue report generated.');
    }

    public static function getBookingsReport(): void
    {
        $db = Database::getConnection();
        $startDate = $_GET['start_date'] ?? date('Y-m-01');
        $endDate = $_GET['end_date'] ?? date('Y-m-t');

        $stmt = $db->prepare('
            SELECT bk.id, bk.booking_reference, bk.preferred_date, bk.status, bk.estimated_amount,
                   u.name as customer_name, u.phone as customer_phone,
                   b.brand, b.model, b.registration_number
            FROM bookings bk
            JOIN users u ON bk.customer_user_id = u.id
            JOIN bikes b ON bk.bike_id = b.id
            WHERE bk.preferred_date BETWEEN ? AND ?
            ORDER BY bk.preferred_date DESC
        ');
        $stmt->execute([$startDate, $endDate]);

        Response::json($stmt->fetchAll(), 'Bookings report generated.');
    }

    public static function getInventoryReport(): void
    {
        $db = Database::getConnection();
        $stmt = $db->query('
            SELECT id, sku, name, category, brand, purchase_price, selling_price,
                   stock_quantity, minimum_stock,
                   (purchase_price * stock_quantity) as total_valuation,
                   CASE WHEN stock_quantity <= minimum_stock THEN 1 ELSE 0 END as is_low_stock
            FROM spare_parts
            WHERE is_active = 1
            ORDER BY category ASC, name ASC
        ');
        $parts = $stmt->fetchAll();

        $totalValuation = 0.00;
        foreach ($parts as $p) {
            $totalValuation += (float)$p['total_valuation'];
        }

        Response::json([
            'parts' => $parts,
            'total_stock_valuation' => $totalValuation
        ], 'Inventory valuation report generated.');
    }

    public static function getMechanicPerformance(): void
    {
        $db = Database::getConnection();
        $stmt = $db->query('
            SELECT m.id, m.name, m.phone, m.skills, m.employment_status,
                   COUNT(jc.id) as total_jobs_assigned,
                   SUM(CASE WHEN jc.status = "delivered" THEN 1 ELSE 0 END) as jobs_completed,
                   SUM(CASE WHEN jc.status IN ("diagnosis", "repair_in_progress", "quality_check") THEN 1 ELSE 0 END) as jobs_active
            FROM mechanics m
            LEFT JOIN job_cards jc ON m.id = jc.assigned_mechanic_id
            GROUP BY m.id
            ORDER BY jobs_completed DESC
        ');
        Response::json($stmt->fetchAll(), 'Mechanic performance report generated.');
    }

    public static function exportCsv(): void
    {
        $type = $_GET['type'] ?? 'bookings';
        $db = Database::getConnection();

        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename=bikefix_' . $type . '_' . date('Ymd_His') . '.csv');

        $output = fopen('php://output', 'w');
        if ($output === false) {
            exit;
        }

        if ($type === 'invoices') {
            fputcsv($output, ['Invoice Number', 'Job Card', 'Customer Name', 'Customer Phone', 'Bike Reg', 'Subtotal', 'Tax', 'Total Amount', 'Amount Paid', 'Balance', 'Status', 'Issue Date']);
            $stmt = $db->query('
                SELECT inv.invoice_number, jc.job_card_reference, u.name, u.phone, b.registration_number,
                       inv.subtotal, inv.tax_amount, inv.total_amount, inv.amount_paid, inv.outstanding_balance, inv.status, inv.issue_date
                FROM invoices inv
                JOIN job_cards jc ON inv.job_card_id = jc.id
                JOIN users u ON inv.customer_user_id = u.id
                JOIN bikes b ON jc.bike_id = b.id
                ORDER BY inv.created_at DESC
            ');
            while ($row = $stmt->fetch(PDO::FETCH_NUM)) {
                fputcsv($output, $row);
            }
        } elseif ($type === 'inventory') {
            fputcsv($output, ['SKU', 'Part Name', 'Category', 'Brand', 'Purchase Price', 'Selling Price', 'Available Stock', 'Minimum Stock']);
            $stmt = $db->query('SELECT sku, name, category, brand, purchase_price, selling_price, stock_quantity, minimum_stock FROM spare_parts WHERE is_active = 1 ORDER BY name ASC');
            while ($row = $stmt->fetch(PDO::FETCH_NUM)) {
                fputcsv($output, $row);
            }
        } elseif ($type === 'expenses') {
            fputcsv($output, ['Date', 'Category', 'Description', 'Amount', 'Payee', 'Method', 'Recorded By']);
            $stmt = $db->query('
                SELECT e.expense_date, e.category, e.description, e.amount, e.payee, e.payment_method, u.name
                FROM expenses e
                JOIN users u ON e.recorded_by_user_id = u.id
                WHERE e.is_reversed = 0
                ORDER BY e.expense_date DESC
            ');
            while ($row = $stmt->fetch(PDO::FETCH_NUM)) {
                fputcsv($output, $row);
            }
        } else {
            // Default: Bookings
            fputcsv($output, ['Booking Reference', 'Customer Name', 'Phone', 'Motorcycle', 'Reg Number', 'Date', 'Time', 'Status', 'Estimated Amount']);
            $stmt = $db->query('
                SELECT bk.booking_reference, u.name, u.phone, CONCAT(b.brand, " ", b.model), b.registration_number,
                       bk.preferred_date, bk.preferred_time, bk.status, bk.estimated_amount
                FROM bookings bk
                JOIN users u ON bk.customer_user_id = u.id
                JOIN bikes b ON bk.bike_id = b.id
                ORDER BY bk.created_at DESC
            ');
            while ($row = $stmt->fetch(PDO::FETCH_NUM)) {
                fputcsv($output, $row);
            }
        }

        fclose($output);
        exit;
    }
}
