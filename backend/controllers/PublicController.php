<?php
// backend/controllers/PublicController.php
declare(strict_types=1);

namespace BikeFix\Controllers;

use BikeFix\Config\Database;
use BikeFix\Utils\Response;
use BikeFix\Utils\Validator;
use PDO;

class PublicController
{
    public static function getWorkshopInfo(): void
    {
        $db = Database::getConnection();
        $stmt = $db->query('SELECT setting_key, setting_value FROM workshop_settings');
        $settingsRaw = $stmt->fetchAll();

        $settings = [];
        foreach ($settingsRaw as $row) {
            $settings[$row['setting_key']] = $row['setting_value'];
        }

        $info = [
            'name' => 'BikeFix Club',
            'brand_name' => 'BikeFix Club',
            'tagline' => 'Your Bike. Your Club. Our Care.',
            'headline' => 'Your Bike. Our Priority.',
            'description' => 'Premium Motorcycle Service & Care.',
            'address' => '2/2, RS Puram, Aruppukkottai',
            'phone' => '9597881218',
            'mobile' => '9597881218',
            'business_hours' => $settings['business_hours'] ?? 'Monday - Saturday: 8:30 AM - 7:30 PM | Sunday: Closed',
            'currency_symbol' => $settings['currency_symbol'] ?? '₹',
            'currency_code' => $settings['currency_code'] ?? 'INR',
            'tax_rate' => (float)($settings['tax_rate'] ?? 18.00),
            'map_url' => 'https://maps.google.com/?q=2/2+RS+Puram+Aruppukkottai',
        ];

        Response::json($info, 'Workshop information retrieved.');
    }

    public static function getCategories(): void
    {
        $db = Database::getConnection();
        $stmt = $db->query('
            SELECT id, name, slug, description, icon, display_order
            FROM service_categories
            WHERE is_active = 1
            ORDER BY display_order ASC, name ASC
        ');
        Response::json($stmt->fetchAll(), 'Service categories retrieved.');
    }

    public static function getServices(?int $categoryId = null): void
    {
        $db = Database::getConnection();

        $sql = '
            SELECT s.id, s.category_id, s.name, s.slug, s.description, s.standard_price, s.estimated_duration,
                   sc.name as category_name, sc.slug as category_slug, sc.icon as category_icon
            FROM services s
            JOIN service_categories sc ON s.category_id = sc.id
            WHERE s.is_active = 1 AND sc.is_active = 1
        ';
        $params = [];

        if ($categoryId !== null) {
            $sql .= ' AND s.category_id = ?';
            $params[] = $categoryId;
        }

        $sql .= ' ORDER BY sc.display_order ASC, s.name ASC';

        $stmt = $db->prepare($sql);
        $stmt->execute($params);

        Response::json($stmt->fetchAll(), 'Public services retrieved.');
    }

    public static function getReviews(): void
    {
        $db = Database::getConnection();
        $stmt = $db->query('
            SELECT r.id, r.rating, r.comment, r.admin_response, r.created_at,
                   u.name as customer_name,
                   b.brand as bike_brand, b.model as bike_model
            FROM reviews r
            JOIN users u ON r.customer_user_id = u.id
            JOIN bookings bk ON r.booking_id = bk.id
            JOIN bikes b ON bk.bike_id = b.id
            WHERE r.moderation_status = "approved"
            ORDER BY r.created_at DESC
            LIMIT 20
        ');
        Response::json($stmt->fetchAll(), 'Customer reviews retrieved.');
    }

    public static function submitContact(array $body): void
    {
        $v = Validator::make($body)
            ->required('name', 'Name')
            ->required('email', 'Email')
            ->email('email', 'Email')
            ->required('phone', 'Phone')
            ->phone('phone', 'Phone')
            ->required('message', 'Message')
            ->minLength('message', 10, 'Message');

        if ($v->fails()) {
            Response::error($v->firstError(), 422, $v->errors());
        }

        // Notify admin about contact inquiry
        $db = Database::getConnection();
        $adminStmt = $db->query('SELECT id FROM users WHERE role = "admin" LIMIT 1');
        $adminId = $adminStmt->fetchColumn();

        if ($adminId) {
            $msg = "Inquiry from {$body['name']} ({$body['phone']} / {$body['email']}): " . substr($body['message'], 0, 150);
            $ins = $db->prepare('
                INSERT INTO notifications (user_id, title, message, type)
                VALUES (?, "New Website Contact Inquiry", ?, "system")
            ');
            $ins->execute([$adminId, $msg]);
        }

        Response::json(null, 'Thank you! Your message has been sent to BikeFix Club. Our team will contact you shortly.');
    }
}
