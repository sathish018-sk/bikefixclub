-- ====================================================================
-- BikeFix Club — Clear Demo & Old Records
-- Cleans up all demo/test customers, bikes, bookings, job cards,
-- invoices, payments, reviews, expenses, and notifications.
-- Preserves:
--  - Admin login account (id=1, email=admin@bikefixclub.com)
--  - Workshop Settings
--  - Service Categories & Services Catalogue
--  - Spare Parts Catalogue (restored to initial inventory)
--  - Mechanics (workload reset to 0)
-- ====================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Clear operational transaction tables
TRUNCATE TABLE audit_logs;
TRUNCATE TABLE payment_events;
TRUNCATE TABLE payments;
TRUNCATE TABLE invoice_items;
TRUNCATE TABLE invoices;
TRUNCATE TABLE job_card_parts;
TRUNCATE TABLE job_card_services;
TRUNCATE TABLE job_card_status_history;
TRUNCATE TABLE job_cards;
TRUNCATE TABLE reviews;
TRUNCATE TABLE booking_services;
TRUNCATE TABLE booking_status_history;
TRUNCATE TABLE bookings;
TRUNCATE TABLE notifications;
TRUNCATE TABLE expenses;

-- 2. Clear customer bikes and customer profiles
TRUNCATE TABLE bikes;
TRUNCATE TABLE customer_profiles;

-- 3. Delete non-admin users (Strictly keep the admin user id=1)
DELETE FROM users WHERE role != 'admin' OR id != 1;
ALTER TABLE users AUTO_INCREMENT = 2;

-- 4. Reset stock movements to clean initial state
TRUNCATE TABLE stock_movements;
INSERT INTO stock_movements (id, part_id, movement_type, quantity_change, unit_cost, reference_type, reference_id, reason, user_id, created_at) VALUES
(1, 1, 'initial', 25, 650.00, 'initial_seed', 'SEED-001', 'Initial stock entry', 1, NOW()),
(2, 2, 'initial', 20, 480.00, 'initial_seed', 'SEED-001', 'Initial stock entry', 1, NOW()),
(3, 3, 'initial', 14, 320.00, 'initial_seed', 'SEED-001', 'Initial stock entry', 1, NOW()),
(4, 4, 'initial', 15, 180.00, 'initial_seed', 'SEED-001', 'Initial stock entry', 1, NOW()),
(5, 5, 'initial', 22, 110.00, 'initial_seed', 'SEED-001', 'Initial stock entry', 1, NOW()),
(6, 6, 'initial', 15, 340.00, 'initial_seed', 'SEED-001', 'Initial stock entry', 1, NOW()),
(7, 7, 'initial', 22, 65.00, 'initial_seed', 'SEED-001', 'Initial stock entry', 1, NOW()),
(8, 8, 'initial', 5, 1150.00, 'initial_seed', 'SEED-001', 'Initial stock entry', 1, NOW());

-- 5. Restore spare parts stock quantities
UPDATE spare_parts SET stock_quantity = 25 WHERE id = 1;
UPDATE spare_parts SET stock_quantity = 20 WHERE id = 2;
UPDATE spare_parts SET stock_quantity = 14 WHERE id = 3;
UPDATE spare_parts SET stock_quantity = 15 WHERE id = 4;
UPDATE spare_parts SET stock_quantity = 22 WHERE id = 5;
UPDATE spare_parts SET stock_quantity = 15 WHERE id = 6;
UPDATE spare_parts SET stock_quantity = 22 WHERE id = 7;
UPDATE spare_parts SET stock_quantity = 5 WHERE id = 8;

-- 6. Reset mechanics workload
UPDATE mechanics SET current_workload = 0;

SET FOREIGN_KEY_CHECKS = 1;
