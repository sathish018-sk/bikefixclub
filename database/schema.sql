-- ====================================================================
-- BikeFix Club — Official Database Schema
-- Brand: BikeFix Club | "Your Bike. Your Club. Our Care."
-- Engine: InnoDB | Charset: utf8mb4 | Collation: utf8mb4_unicode_ci
-- ====================================================================

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS job_card_status_history;
DROP TABLE IF EXISTS booking_status_history;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS expenses;
DROP TABLE IF EXISTS payment_events;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS invoice_items;
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS stock_movements;
DROP TABLE IF EXISTS job_card_parts;
DROP TABLE IF EXISTS spare_parts;
DROP TABLE IF EXISTS job_card_services;
DROP TABLE IF EXISTS job_cards;
DROP TABLE IF EXISTS mechanics;
DROP TABLE IF EXISTS booking_services;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS services;
DROP TABLE IF EXISTS service_categories;
DROP TABLE IF EXISTS bikes;
DROP TABLE IF EXISTS customer_profiles;
DROP TABLE IF EXISTS workshop_settings;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- 1. USERS
CREATE TABLE users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(191) NOT NULL UNIQUE,
    phone VARCHAR(30) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'customer', 'mechanic') NOT NULL DEFAULT 'customer',
    account_status ENUM('active', 'inactive', 'suspended') NOT NULL DEFAULT 'active',
    email_verified_at TIMESTAMP NULL DEFAULT NULL,
    phone_verified_at TIMESTAMP NULL DEFAULT NULL,
    last_login TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_role (role),
    INDEX idx_users_status (account_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. CUSTOMER PROFILES
CREATE TABLE customer_profiles (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL UNIQUE,
    address TEXT NULL,
    city VARCHAR(100) NULL DEFAULT 'Aruppukkottai',
    state VARCHAR(100) NULL DEFAULT 'Tamil Nadu',
    postal_code VARCHAR(20) NULL,
    emergency_contact VARCHAR(30) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_customer_profile_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. BIKES
CREATE TABLE bikes (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    customer_user_id INT UNSIGNED NOT NULL,
    registration_number VARCHAR(30) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    variant VARCHAR(100) NULL,
    manufacturing_year INT UNSIGNED NULL,
    fuel_type VARCHAR(30) NULL DEFAULT 'Petrol',
    current_odometer INT UNSIGNED NOT NULL DEFAULT 0,
    notes TEXT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_customer_bike_reg (customer_user_id, registration_number),
    INDEX idx_bikes_reg (registration_number),
    INDEX idx_bikes_brand (brand),
    CONSTRAINT fk_bikes_customer FOREIGN KEY (customer_user_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. SERVICE CATEGORIES
CREATE TABLE service_categories (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(120) NOT NULL UNIQUE,
    description TEXT NULL,
    icon VARCHAR(60) NULL DEFAULT 'Wrench',
    display_order INT UNSIGNED NOT NULL DEFAULT 0,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. SERVICES
CREATE TABLE services (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    category_id INT UNSIGNED NOT NULL,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(160) NOT NULL UNIQUE,
    description TEXT NULL,
    standard_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    estimated_duration INT UNSIGNED NOT NULL DEFAULT 60 COMMENT 'duration in minutes',
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_services_category (category_id),
    CONSTRAINT fk_services_category FOREIGN KEY (category_id) REFERENCES service_categories(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. BOOKINGS
CREATE TABLE bookings (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    booking_reference VARCHAR(40) NOT NULL UNIQUE,
    customer_user_id INT UNSIGNED NOT NULL,
    bike_id INT UNSIGNED NOT NULL,
    preferred_date DATE NOT NULL,
    preferred_time VARCHAR(20) NOT NULL,
    status ENUM('pending', 'confirmed', 'checked_in', 'in_progress', 'completed', 'cancelled', 'rescheduled') NOT NULL DEFAULT 'pending',
    problem_description TEXT NOT NULL,
    current_odometer INT UNSIGNED NULL,
    estimated_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    cancellation_reason TEXT NULL,
    notes TEXT NULL,
    is_walk_in TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_bookings_date (preferred_date),
    INDEX idx_bookings_status (status),
    INDEX idx_bookings_customer (customer_user_id),
    CONSTRAINT fk_bookings_customer FOREIGN KEY (customer_user_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_bookings_bike FOREIGN KEY (bike_id) REFERENCES bikes(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. BOOKING SERVICES
CREATE TABLE booking_services (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    booking_id INT UNSIGNED NOT NULL,
    service_id INT UNSIGNED NOT NULL,
    requested_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_bs_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    CONSTRAINT fk_bs_service FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. MECHANICS
CREATE TABLE mechanics (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(191) NULL,
    phone VARCHAR(30) NOT NULL,
    skills TEXT NULL,
    employment_status ENUM('active', 'on_leave', 'inactive') NOT NULL DEFAULT 'active',
    current_workload INT UNSIGNED NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_mechanics_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. JOB CARDS
CREATE TABLE job_cards (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    job_card_reference VARCHAR(40) NOT NULL UNIQUE,
    booking_id INT UNSIGNED NULL,
    customer_user_id INT UNSIGNED NOT NULL,
    bike_id INT UNSIGNED NOT NULL,
    assigned_mechanic_id INT UNSIGNED NULL,
    reported_problem TEXT NOT NULL,
    inspection_findings TEXT NULL,
    recommended_work TEXT NULL,
    approved_work TEXT NULL,
    internal_notes TEXT NULL,
    customer_visible_notes TEXT NULL,
    initial_odometer INT UNSIGNED NOT NULL DEFAULT 0,
    final_odometer INT UNSIGNED NULL,
    status ENUM('created', 'checked_in', 'diagnosis', 'repair_in_progress', 'quality_check', 'ready_for_delivery', 'delivered', 'cancelled') NOT NULL DEFAULT 'created',
    check_in_at TIMESTAMP NULL DEFAULT NULL,
    diagnosis_at TIMESTAMP NULL DEFAULT NULL,
    repair_started_at TIMESTAMP NULL DEFAULT NULL,
    ready_at TIMESTAMP NULL DEFAULT NULL,
    delivered_at TIMESTAMP NULL DEFAULT NULL,
    delivery_override_notes TEXT NULL,
    created_by_user_id INT UNSIGNED NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_job_cards_status (status),
    INDEX idx_job_cards_customer (customer_user_id),
    INDEX idx_job_cards_mechanic (assigned_mechanic_id),
    CONSTRAINT fk_jc_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
    CONSTRAINT fk_jc_customer FOREIGN KEY (customer_user_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_jc_bike FOREIGN KEY (bike_id) REFERENCES bikes(id) ON DELETE RESTRICT,
    CONSTRAINT fk_jc_mechanic FOREIGN KEY (assigned_mechanic_id) REFERENCES mechanics(id) ON DELETE SET NULL,
    CONSTRAINT fk_jc_created_by FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. JOB CARD SERVICES (Labour items)
CREATE TABLE job_card_services (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    job_card_id INT UNSIGNED NOT NULL,
    service_id INT UNSIGNED NULL,
    description VARCHAR(255) NOT NULL,
    quantity DECIMAL(8,2) NOT NULL DEFAULT 1.00,
    unit_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    line_total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_jcs_job_card FOREIGN KEY (job_card_id) REFERENCES job_cards(id) ON DELETE CASCADE,
    CONSTRAINT fk_jcs_service FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. SPARE PARTS
CREATE TABLE spare_parts (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    sku VARCHAR(60) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(100) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    description TEXT NULL,
    purchase_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    selling_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    stock_quantity INT NOT NULL DEFAULT 0,
    minimum_stock INT NOT NULL DEFAULT 5,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_parts_sku (sku),
    INDEX idx_parts_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. JOB CARD PARTS (Parts used on a job card)
CREATE TABLE job_card_parts (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    job_card_id INT UNSIGNED NOT NULL,
    part_id INT UNSIGNED NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    line_total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_jcp_job_card FOREIGN KEY (job_card_id) REFERENCES job_cards(id) ON DELETE CASCADE,
    CONSTRAINT fk_jcp_part FOREIGN KEY (part_id) REFERENCES spare_parts(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. STOCK MOVEMENTS
CREATE TABLE stock_movements (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    part_id INT UNSIGNED NOT NULL,
    movement_type ENUM('purchase', 'usage', 'return', 'adjustment', 'initial') NOT NULL,
    quantity_change INT NOT NULL,
    unit_cost DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    reference_type ENUM('job_card', 'purchase_order', 'manual_adjustment', 'initial_seed') NOT NULL DEFAULT 'manual_adjustment',
    reference_id VARCHAR(50) NULL,
    reason TEXT NULL,
    user_id INT UNSIGNED NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_sm_part (part_id),
    CONSTRAINT fk_sm_part FOREIGN KEY (part_id) REFERENCES spare_parts(id) ON DELETE RESTRICT,
    CONSTRAINT fk_sm_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. INVOICES
CREATE TABLE invoices (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    job_card_id INT UNSIGNED NOT NULL UNIQUE,
    customer_user_id INT UNSIGNED NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    discount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    tax_rate DECIMAL(5,2) NOT NULL DEFAULT 18.00,
    tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    amount_paid DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    outstanding_balance DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    status ENUM('draft', 'issued', 'partially_paid', 'paid', 'cancelled') NOT NULL DEFAULT 'issued',
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    notes TEXT NULL,
    created_by_user_id INT UNSIGNED NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_invoices_customer (customer_user_id),
    INDEX idx_invoices_status (status),
    CONSTRAINT fk_invoices_job_card FOREIGN KEY (job_card_id) REFERENCES job_cards(id) ON DELETE RESTRICT,
    CONSTRAINT fk_invoices_customer FOREIGN KEY (customer_user_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_invoices_created_by FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. INVOICE ITEMS
CREATE TABLE invoice_items (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT UNSIGNED NOT NULL,
    item_type ENUM('labour', 'part', 'custom_charge', 'discount') NOT NULL,
    description VARCHAR(255) NOT NULL,
    quantity DECIMAL(8,2) NOT NULL DEFAULT 1.00,
    unit_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    discount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    tax_rate DECIMAL(5,2) NOT NULL DEFAULT 18.00,
    tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    line_total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    reference_id VARCHAR(50) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_inv_items_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. PAYMENTS
CREATE TABLE payments (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT UNSIGNED NOT NULL,
    payment_reference VARCHAR(60) NOT NULL UNIQUE,
    payment_method ENUM('online_gateway', 'cash', 'upi_workshop', 'card_workshop', 'bank_transfer') NOT NULL,
    provider ENUM('razorpay', 'workshop_manual') NOT NULL DEFAULT 'workshop_manual',
    provider_transaction_id VARCHAR(100) NULL,
    provider_order_id VARCHAR(100) NULL,
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    status ENUM('pending', 'successful', 'failed', 'refunded') NOT NULL DEFAULT 'successful',
    receiving_staff_user_id INT UNSIGNED NULL,
    paid_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notes TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_payments_invoice (invoice_id),
    INDEX idx_payments_status (status),
    CONSTRAINT fk_payments_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE RESTRICT,
    CONSTRAINT fk_payments_staff FOREIGN KEY (receiving_staff_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 17. PAYMENT EVENTS (Webhooks & Provider logs)
CREATE TABLE payment_events (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    provider_event_id VARCHAR(100) NOT NULL UNIQUE,
    event_type VARCHAR(100) NOT NULL,
    payload JSON NOT NULL,
    processing_status ENUM('received', 'processed', 'ignored', 'failed') NOT NULL DEFAULT 'received',
    payment_reference VARCHAR(60) NULL,
    error_message TEXT NULL,
    received_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP NULL DEFAULT NULL,
    INDEX idx_pe_status (processing_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 18. EXPENSES
CREATE TABLE expenses (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    category ENUM('workshop_supplies', 'utilities', 'tools_equipment', 'rent', 'salaries', 'maintenance', 'miscellaneous') NOT NULL,
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    expense_date DATE NOT NULL,
    payee VARCHAR(150) NOT NULL,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'cash',
    receipt_path VARCHAR(255) NULL,
    recorded_by_user_id INT UNSIGNED NOT NULL,
    is_reversed TINYINT(1) NOT NULL DEFAULT 0,
    reversal_reason TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_expenses_date (expense_date),
    INDEX idx_expenses_category (category),
    CONSTRAINT fk_expenses_user FOREIGN KEY (recorded_by_user_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 19. REVIEWS
CREATE TABLE reviews (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    booking_id INT UNSIGNED NOT NULL UNIQUE,
    customer_user_id INT UNSIGNED NOT NULL,
    rating TINYINT UNSIGNED NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT NOT NULL,
    moderation_status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'approved',
    admin_response TEXT NULL,
    responding_admin_id INT UNSIGNED NULL,
    responded_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_reviews_status (moderation_status),
    CONSTRAINT fk_reviews_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    CONSTRAINT fk_reviews_customer FOREIGN KEY (customer_user_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_reviews_admin FOREIGN KEY (responding_admin_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 20. NOTIFICATIONS
CREATE TABLE notifications (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('booking', 'service_status', 'invoice', 'payment', 'system', 'reminder') NOT NULL DEFAULT 'system',
    related_entity_type VARCHAR(50) NULL,
    related_entity_id VARCHAR(50) NULL,
    is_read TINYINT(1) NOT NULL DEFAULT 0,
    read_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_notif_user (user_id),
    INDEX idx_notif_read (is_read),
    CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 21. BOOKING STATUS HISTORY
CREATE TABLE booking_status_history (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    booking_id INT UNSIGNED NOT NULL,
    old_status VARCHAR(50) NULL,
    new_status VARCHAR(50) NOT NULL,
    changed_by_user_id INT UNSIGNED NULL,
    notes TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_bsh_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    CONSTRAINT fk_bsh_user FOREIGN KEY (changed_by_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 22. JOB CARD STATUS HISTORY
CREATE TABLE job_card_status_history (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    job_card_id INT UNSIGNED NOT NULL,
    old_status VARCHAR(50) NULL,
    new_status VARCHAR(50) NOT NULL,
    changed_by_user_id INT UNSIGNED NULL,
    notes TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_jcsh_job_card FOREIGN KEY (job_card_id) REFERENCES job_cards(id) ON DELETE CASCADE,
    CONSTRAINT fk_jcsh_user FOREIGN KEY (changed_by_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 23. AUDIT LOGS
CREATE TABLE audit_logs (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(50) NULL,
    old_values JSON NULL,
    new_values JSON NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_action (action),
    INDEX idx_audit_entity (entity_type, entity_id),
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 24. WORKSHOP SETTINGS
CREATE TABLE workshop_settings (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    setting_group VARCHAR(50) NOT NULL DEFAULT 'general',
    description VARCHAR(255) NULL,
    updated_by_user_id INT UNSIGNED NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_settings_user FOREIGN KEY (updated_by_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
