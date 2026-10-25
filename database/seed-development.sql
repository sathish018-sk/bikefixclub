-- ====================================================================
-- BikeFix Club — Development Seed Data
-- Brand: BikeFix Club | "Your Bike. Your Club. Our Care."
-- Passwords for seeded accounts: password123
-- Hash: $2y$10$teDvC.dpAkFaiFuv0KAWVOBcK0eCzv9uU1FnDw5faNI0cDYBANlSq
-- ====================================================================

-- 1. USERS
INSERT INTO users (id, name, email, phone, password_hash, role, account_status, email_verified_at, phone_verified_at, created_at) VALUES
(1, 'BikeFix Club Admin', 'admin@bikefixclub.com', '9597881218', '$2y$10$teDvC.dpAkFaiFuv0KAWVOBcK0eCzv9uU1FnDw5faNI0cDYBANlSq', 'admin', 'active', NOW(), NOW(), NOW()),
(2, 'Sathish Kumar', 'sathish@example.com', '9876543210', '$2y$10$teDvC.dpAkFaiFuv0KAWVOBcK0eCzv9uU1FnDw5faNI0cDYBANlSq', 'customer', 'active', NOW(), NOW(), NOW()),
(3, 'Priya Sharma', 'priya@example.com', '9876543211', '$2y$10$teDvC.dpAkFaiFuv0KAWVOBcK0eCzv9uU1FnDw5faNI0cDYBANlSq', 'customer', 'active', NOW(), NOW(), NOW()),
(4, 'Rahul Raman', 'rahul@example.com', '9876543212', '$2y$10$teDvC.dpAkFaiFuv0KAWVOBcK0eCzv9uU1FnDw5faNI0cDYBANlSq', 'customer', 'active', NOW(), NOW(), NOW()),
(5, 'Arunachalam S', 'walkin@example.com', '9876543213', '$2y$10$teDvC.dpAkFaiFuv0KAWVOBcK0eCzv9uU1FnDw5faNI0cDYBANlSq', 'customer', 'active', NOW(), NOW(), NOW());

-- 2. CUSTOMER PROFILES
INSERT INTO customer_profiles (user_id, address, city, state, postal_code, emergency_contact) VALUES
(2, '14, Gandhi Nagar Main Road', 'Aruppukkottai', 'Tamil Nadu', '626101', '9876543299'),
(3, '52, Kamarajar Street', 'Aruppukkottai', 'Tamil Nadu', '626101', '9876543298'),
(4, '108, Bypass Road', 'Madurai', 'Tamil Nadu', '625016', '9876543297'),
(5, '45, Market Street', 'Aruppukkottai', 'Tamil Nadu', '626101', '9876543296');

-- 3. MECHANICS
INSERT INTO mechanics (id, name, email, phone, skills, employment_status, current_workload) VALUES
(1, 'Muthu Kumar', 'muthu.tech@bikefixclub.com', '9876500001', 'Royal Enfield specialist, Engine & Transmission overhaul, Carburetor & FI diagnostics', 'active', 1),
(2, 'Senthil Nathan', 'senthil.tech@bikefixclub.com', '9876500002', 'Brakes, ABS systems, Hydraulic suspension, Chain drive maintenance', 'active', 1),
(3, 'Karthik Raja', 'karthik.tech@bikefixclub.com', '9876500003', 'Electrical harness, ECU diagnostics, LED systems, Battery health analysis', 'active', 0);

-- 4. BIKES
INSERT INTO bikes (id, customer_user_id, registration_number, brand, model, variant, manufacturing_year, fuel_type, current_odometer, notes, is_active) VALUES
(1, 2, 'TN-67-AB-1234', 'Royal Enfield', 'Classic 350', 'Signals Edition Dual Channel ABS', 2022, 'Petrol', 18450, 'Regular service with Motul fully synthetic oil preferred.', 1),
(2, 2, 'TN-67-CD-4321', 'Honda', 'Activa 6G', 'Standard BS6', 2021, 'Petrol', 12300, 'Used for daily local commuting.', 1),
(3, 3, 'TN-67-BC-5678', 'Yamaha', 'MT-15', 'Version 2.0 Metallic Black', 2023, 'Petrol', 9800, 'Check quick shifter and chain tension.', 1),
(4, 4, 'TN-58-XY-9999', 'KTM', 'Duke 390', 'Gen 2 Orange', 2020, 'Petrol', 24600, 'Coolant level check needed.', 1),
(5, 5, 'TN-67-EF-8765', 'TVS', 'Apache RTR 200 4V', 'Dual Channel ABS', 2021, 'Petrol', 16500, 'Walk-in customer motorcycle.', 1);

-- 5. SERVICE CATEGORIES
INSERT INTO service_categories (id, name, slug, description, icon, display_order, is_active) VALUES
(1, 'General Service & Maintenance', 'general-service', 'Complete motorcycle check-up, washing, adjustments, and oil change services.', 'Wrench', 1, 1),
(2, 'Oil & Fluids', 'oil-fluids', 'High-grade synthetic engine oil replacements, brake fluid, coolant and filter changes.', 'Droplet', 2, 1),
(3, 'Brakes & Suspension', 'brakes-suspension', 'Disc pad replacement, caliper overhaul, fork oil seals and suspension tuning.', 'Disc', 3, 1),
(4, 'Engine & Performance', 'engine-performance', 'Valve clearance, spark plug, carburetor tuning, clutch overhaul, FI cleaning.', 'Cpu', 4, 1),
(5, 'Tyres & Wheel Care', 'tyres-wheel', 'Puncture repairs, wheel balancing, tyre replacements, spoke truing.', 'CircleDot', 5, 1),
(6, 'Electricals & Diagnostics', 'electricals-diagnostics', 'Wiring check, battery charging, sensor diagnostics, lighting & horn repair.', 'Zap', 6, 1);

-- 6. SERVICES
INSERT INTO services (id, category_id, name, slug, description, standard_price, estimated_duration, is_active) VALUES
(1, 1, 'Standard Periodic Service', 'standard-periodic-service', 'Includes water wash, chain cleaning & lubrication, air filter clean, brake adjustment, 24-point safety check.', 799.00, 90, 1),
(2, 1, 'Premium Master Service', 'premium-master-service', 'Comprehensive service: complete foam wash, synthetic engine oil change labour, spark plug clean, throttle body flush, full electrical inspection.', 1499.00, 150, 1),
(3, 2, 'Synthetic Engine Oil Change', 'synthetic-oil-change', 'Drain old oil, flush sump, replace engine oil and replace oil filter with OEM seal.', 599.00, 45, 1),
(4, 2, 'Chain Cleaning & Motul Lubrication', 'chain-clean-lube', 'High-pressure chain degreasing, roller inspection, slack adjustment, Motul Off-Road/Road lube application.', 249.00, 30, 1),
(5, 3, 'Front & Rear Disc Brake Overhaul', 'disc-brake-overhaul', 'Caliper pin lubrication, disc pad replacement/deglazing, master cylinder bleed & fluid top-up.', 499.00, 60, 1),
(6, 3, 'Fork Oil & Seal Replacement', 'fork-oil-seal', 'Front suspension dismount, fork tube cleaning, inner oil replacement, OEM oil seal replacement.', 899.00, 120, 1),
(7, 4, 'Clutch Plate Overhaul', 'clutch-plate-overhaul', 'Inspection and replacement of friction and steel plates, clutch cable adjustment, basket inspection.', 1299.00, 120, 1),
(8, 4, 'FI & Throttle Body Ultrasonic Cleaning', 'fi-ultrasonic-cleaning', 'Electronic fuel injector spray test, throttle sensor recalibration, ultrasonic chamber clean.', 749.00, 60, 1),
(9, 5, 'Tubeless Puncture & Valve Care', 'tubeless-puncture-valve', 'Leak detection, internal mushroom plug, valve stem replacement, nitrogen tyre inflation.', 199.00, 25, 1),
(10, 6, 'Complete Electrical & Battery Diagnostics', 'electrical-battery-diagnostics', 'Charging stator coil test, regulator rectifier load test, parasitic battery drain test, terminal anti-corrosion coating.', 399.00, 45, 1);

-- 7. SPARE PARTS
INSERT INTO spare_parts (id, sku, name, category, brand, description, purchase_price, selling_price, stock_quantity, minimum_stock, is_active) VALUES
(1, 'OIL-MOTUL-7100', 'Motul 7100 4T 10W-40 100% Synthetic 1L', 'Lubricants', 'Motul', 'High performance ester-based 4-stroke engine oil.', 650.00, 850.00, 24, 6, 1),
(2, 'OIL-CASTROL-PWR1', 'Castrol Power1 Ultimate 10W-40 1L', 'Lubricants', 'Castrol', 'Full synthetic 4T engine lubricant.', 480.00, 650.00, 18, 5, 1),
(3, 'BRK-PAD-RE350', 'Front Disc Brake Pads - RE Classic/Hunter', 'Brakes', 'Brembo', 'Sintered ceramic high friction front disc pads.', 320.00, 480.00, 12, 4, 1),
(4, 'BRK-SHOE-HONDA', 'Rear Brake Shoe Set - Activa/Dio', 'Brakes', 'Honda Genuine', 'Non-asbestos high-wear brake shoe set.', 180.00, 280.00, 15, 4, 1),
(5, 'SPK-NGK-CPR8EA', 'NGK Spark Plug CPR8EA-9', 'Ignition', 'NGK', 'Resistor nickel alloy performance spark plug.', 110.00, 190.00, 22, 5, 1),
(6, 'CHN-LUBE-MOTUL', 'Motul C2 Chain Lube Road 400ml', 'Maintenance', 'Motul', 'Colorless sticky chain spray for high speed motorcycles.', 340.00, 490.00, 14, 4, 1),
(7, 'FIL-OIL-YAMAHA', 'OEM Engine Oil Filter Element', 'Filters', 'Yamaha Genuine', 'Spin-on precision oil filter.', 65.00, 120.00, 20, 6, 1),
(8, 'BAT-EXIDE-12V5', 'Exide Xpress 12V 5Ah VRLA Battery', 'Electricals', 'Exide', 'Sealed maintenance-free high crank motorcycle battery.', 1150.00, 1650.00, 5, 3, 1);

-- 8. STOCK MOVEMENTS (Initial Stock)
INSERT INTO stock_movements (part_id, movement_type, quantity_change, unit_cost, reference_type, reference_id, reason, user_id) VALUES
(1, 'initial', 25, 650.00, 'initial_seed', 'SEED-001', 'Initial stock entry', 1),
(2, 'initial', 20, 480.00, 'initial_seed', 'SEED-001', 'Initial stock entry', 1),
(3, 'initial', 14, 320.00, 'initial_seed', 'SEED-001', 'Initial stock entry', 1),
(4, 'initial', 15, 180.00, 'initial_seed', 'SEED-001', 'Initial stock entry', 1),
(5, 'initial', 22, 110.00, 'initial_seed', 'SEED-001', 'Initial stock entry', 1),
(6, 'initial', 15, 340.00, 'initial_seed', 'SEED-001', 'Initial stock entry', 1),
(7, 'initial', 22, 65.00, 'initial_seed', 'SEED-001', 'Initial stock entry', 1),
(8, 'initial', 5, 1150.00, 'initial_seed', 'SEED-001', 'Initial stock entry', 1);

-- 9. BOOKINGS
-- Booking 1: Delivered & Paid (Ready for/has Review)
INSERT INTO bookings (id, booking_reference, customer_user_id, bike_id, preferred_date, preferred_time, status, problem_description, current_odometer, estimated_amount, notes, is_walk_in, created_at) VALUES
(1, 'BFC-BK-2026-0001', 2, 1, DATE_SUB(CURRENT_DATE, INTERVAL 4 DAY), '09:30 AM', 'completed', 'Periodic maintenance, front brake squeaking, chain needs cleaning and lube.', 18450, 1647.00, 'Customer requested Motul 7100 oil.', 0, DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 4 DAY));

INSERT INTO booking_services (booking_id, service_id, requested_price) VALUES
(1, 1, 799.00),
(1, 4, 249.00);

-- Booking 2: In-Progress with Job Card
INSERT INTO bookings (id, booking_reference, customer_user_id, bike_id, preferred_date, preferred_time, status, problem_description, current_odometer, estimated_amount, notes, is_walk_in, created_at) VALUES
(2, 'BFC-BK-2026-0002', 3, 3, CURRENT_DATE, '10:00 AM', 'in_progress', 'Clutch feeling spongy, periodic 10,000 km general service.', 9800, 1499.00, 'Inspect clutch cable and lever play.', 0, DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 1 DAY));

INSERT INTO booking_services (booking_id, service_id, requested_price) VALUES
(2, 2, 1499.00);

-- Booking 3: Confirmed upcoming
INSERT INTO bookings (id, booking_reference, customer_user_id, bike_id, preferred_date, preferred_time, status, problem_description, current_odometer, estimated_amount, notes, is_walk_in, created_at) VALUES
(3, 'BFC-BK-2026-0003', 4, 4, DATE_ADD(CURRENT_DATE, INTERVAL 2 DAY), '11:30 AM', 'confirmed', 'Front fork feels soft over speed bumps, engine oil change.', 24600, 1498.00, 'Booking confirmed by workshop manager.', 0, CURRENT_TIMESTAMP);

INSERT INTO booking_services (booking_id, service_id, requested_price) VALUES
(3, 3, 599.00),
(3, 6, 899.00);

-- Booking 4: Pending customer booking
INSERT INTO bookings (id, booking_reference, customer_user_id, bike_id, preferred_date, preferred_time, status, problem_description, current_odometer, estimated_amount, notes, is_walk_in, created_at) VALUES
(4, 'BFC-BK-2026-0004', 2, 2, DATE_ADD(CURRENT_DATE, INTERVAL 3 DAY), '02:00 PM', 'pending', 'Rear brake not biting well, general checkup before highway travel.', 12300, 799.00, 'Awaiting admin confirmation.', 0, CURRENT_TIMESTAMP);

INSERT INTO booking_services (booking_id, service_id, requested_price) VALUES
(4, 1, 799.00);

-- 10. JOB CARDS
-- Job Card 1 (for Booking 1): Delivered
INSERT INTO job_cards (id, job_card_reference, booking_id, customer_user_id, bike_id, assigned_mechanic_id, reported_problem, inspection_findings, recommended_work, approved_work, internal_notes, customer_visible_notes, initial_odometer, final_odometer, status, check_in_at, diagnosis_at, repair_started_at, ready_at, delivered_at, created_by_user_id, created_at) VALUES
(1, 'JC-2026-0001', 1, 2, 1, 1, 'Periodic maintenance, front brake squeaking, chain slack.', 'Front disc pads worn past safe threshold (1.5mm remaining). Chain loose with dry rollers.', 'Replace front brake pads with Brembo pads. Motul chain clean and lube. Standard periodic service check.', 'All recommended work approved by customer via phone call.', 'Vehicle test ride smooth. Torque wrench used on caliper bolts.', 'Front brake pads replaced with Brembo ceramic pads. Full chain maintenance and periodic safety check completed.', 18450, 18454, 'delivered', DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 4 DAY), DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 4 DAY), DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 3 DAY), DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 3 DAY), DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 3 DAY), 1, DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 4 DAY));

INSERT INTO job_card_services (job_card_id, service_id, description, quantity, unit_price, line_total) VALUES
(1, 1, 'Standard Periodic Service Labour', 1.00, 799.00, 799.00),
(1, 4, 'Chain Cleaning & Motul Lubrication Labour', 1.00, 249.00, 249.00),
(1, 5, 'Front Brake Pad Replacement Labour', 1.00, 250.00, 250.00);

INSERT INTO job_card_parts (job_card_id, part_id, quantity, unit_price, line_total) VALUES
(1, 3, 1, 480.00, 480.00),
(1, 6, 1, 490.00, 490.00);

-- Job Card 2 (for Booking 2): Repair in progress
INSERT INTO job_cards (id, job_card_reference, booking_id, customer_user_id, bike_id, assigned_mechanic_id, reported_problem, inspection_findings, recommended_work, approved_work, internal_notes, customer_visible_notes, initial_odometer, status, check_in_at, diagnosis_at, repair_started_at, created_by_user_id, created_at) VALUES
(2, 'JC-2026-0002', 2, 3, 3, 2, 'Clutch feeling spongy, 10,000 km general service.', 'Clutch cable stretched near lower lever. Oil due for change.', 'Replace oil with Motul 7100, replace oil filter, adjust clutch cable tension.', 'Customer approved premium master service package.', 'Yamaha MT-15 clutch arm spring checked.', 'Master periodic service in progress. Technician Muthu Kumar assigned.', 9800, 'repair_in_progress', DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 3 HOUR), DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 2 HOUR), DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 1 HOUR), 1, DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 3 HOUR));

INSERT INTO job_card_services (job_card_id, service_id, description, quantity, unit_price, line_total) VALUES
(2, 2, 'Premium Master Service Labour', 1.00, 1499.00, 1499.00);

INSERT INTO job_card_parts (job_card_id, part_id, quantity, unit_price, line_total) VALUES
(2, 1, 1, 850.00, 850.00),
(2, 7, 1, 120.00, 120.00);

-- Walk-in Job Card 3 (Customer 5, Bike 5)
INSERT INTO job_cards (id, job_card_reference, booking_id, customer_user_id, bike_id, assigned_mechanic_id, reported_problem, inspection_findings, recommended_work, approved_work, internal_notes, customer_visible_notes, initial_odometer, status, check_in_at, diagnosis_at, created_by_user_id, created_at) VALUES
(3, 'JC-2026-0003', NULL, 5, 5, 2, 'Rear brake shoe making grinding noise on hard braking.', 'Rear drum brake shoes worn down to rivets. Drum surface requires light deglazing.', 'Rear brake shoe replacement and drum cleanup.', 'Customer approved replacement.', 'Customer waiting at workshop customer lounge.', 'Rear brake shoe service in progress.', 16500, 'diagnosis', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1, CURRENT_TIMESTAMP);

INSERT INTO job_card_services (job_card_id, service_id, description, quantity, unit_price, line_total) VALUES
(3, NULL, 'Rear Drum Brake Shoe Service Labour', 1.00, 350.00, 350.00);

INSERT INTO job_card_parts (job_card_id, part_id, quantity, unit_price, line_total) VALUES
(3, 4, 1, 280.00, 280.00);

-- 11. INVOICES
-- Invoice 1 for Job Card 1 (Fully Paid)
INSERT INTO invoices (id, invoice_number, job_card_id, customer_user_id, subtotal, discount, tax_rate, tax_amount, total_amount, amount_paid, outstanding_balance, status, issue_date, due_date, notes, created_by_user_id, created_at) VALUES
(1, 'INV-2026-0001', 1, 2, 2268.00, 100.00, 18.00, 390.24, 2558.24, 2558.24, 0.00, 'paid', DATE_SUB(CURRENT_DATE, INTERVAL 3 DAY), DATE_SUB(CURRENT_DATE, INTERVAL 3 DAY), 'Thank you for choosing BikeFix Club!', 1, DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 3 DAY));

INSERT INTO invoice_items (invoice_id, item_type, description, quantity, unit_price, discount, tax_rate, tax_amount, line_total, reference_id) VALUES
(1, 'labour', 'Standard Periodic Service Labour', 1.00, 799.00, 0.00, 18.00, 143.82, 942.82, '1'),
(1, 'labour', 'Chain Cleaning & Motul Lubrication Labour', 1.00, 249.00, 0.00, 18.00, 44.82, 293.82, '4'),
(1, 'labour', 'Front Brake Pad Replacement Labour', 1.00, 250.00, 0.00, 18.00, 45.00, 295.00, '5'),
(1, 'part', 'Brembo Front Brake Pads - Classic 350', 1.00, 480.00, 0.00, 18.00, 86.40, 566.40, '3'),
(1, 'part', 'Motul C2 Chain Lube Road 400ml', 1.00, 490.00, 0.00, 18.00, 88.20, 578.20, '6'),
(1, 'discount', 'Welcome Loyalty Discount', 1.00, -100.00, 0.00, 18.00, -18.00, -118.00, NULL);

-- 12. PAYMENTS
INSERT INTO payments (id, invoice_id, payment_reference, payment_method, provider, provider_transaction_id, amount, currency, status, receiving_staff_user_id, paid_at, notes) VALUES
(1, 1, 'PAY-2026-0001', 'online_gateway', 'razorpay', 'pay_sandbox_test_1001', 2558.24, 'INR', 'successful', NULL, DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 3 DAY), 'Razorpay Online Payment (Sandbox verified)');

-- 13. REVIEWS (Booking 1 is delivered and fully paid)
INSERT INTO reviews (id, booking_id, customer_user_id, rating, comment, moderation_status, admin_response, responding_admin_id, responded_at, created_at) VALUES
(1, 1, 2, 5, 'Outstanding service for my Royal Enfield Classic 350! The front brakes feel crisp now and the chain lubrication made the drive remarkably quiet. Highly recommend BikeFix Club to all motorcycle enthusiasts in Aruppukkottai.', 'approved', 'Thank you Sathish! Glad you enjoyed the ride. Ride safe and see you for the next service!', 1, DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 2 DAY), DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 2 DAY));

-- 14. EXPENSES
INSERT INTO expenses (id, category, description, amount, expense_date, payee, payment_method, recorded_by_user_id, created_at) VALUES
(1, 'workshop_supplies', 'Workshop Degreaser and Microfiber Towels Pack (10 pcs)', 1450.00, DATE_SUB(CURRENT_DATE, INTERVAL 5 DAY), 'Aruppukkottai Auto Tools Store', 'cash', 1, DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 5 DAY)),
(2, 'tools_equipment', 'Digital Tyre Pressure Gauge & Nitrogen Filler Chuck', 2800.00, DATE_SUB(CURRENT_DATE, INTERVAL 10 DAY), 'Bosch Equipment Dist', 'upi', 1, DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 10 DAY)),
(3, 'utilities', 'Workshop Electricity Bill - October', 3850.00, DATE_SUB(CURRENT_DATE, INTERVAL 12 DAY), 'TANGEDCO', 'online', 1, DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 12 DAY));

-- 15. NOTIFICATIONS
INSERT INTO notifications (user_id, title, message, type, related_entity_type, related_entity_id, is_read, created_at) VALUES
(2, 'Bike Delivered Successfully', 'Your Royal Enfield Classic 350 has been serviced and delivered. Thank you for trusting BikeFix Club!', 'service_status', 'job_card', '1', 1, DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 3 DAY)),
(2, 'Invoice #INV-2026-0001 Paid', 'Payment of ₹2,558.24 received successfully via Razorpay. Receipt is available for download.', 'payment', 'invoice', '1', 1, DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 3 DAY)),
(3, 'Service In Progress', 'Technician Muthu Kumar has begun work on your Yamaha MT-15.', 'service_status', 'job_card', '2', 0, DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 1 HOUR)),
(1, 'New Booking Received', 'Booking #BFC-BK-2026-0004 received from Sathish Kumar for Honda Activa 6G.', 'booking', 'booking', '4', 0, CURRENT_TIMESTAMP);

-- 16. WORKSHOP SETTINGS
INSERT INTO workshop_settings (setting_key, setting_value, setting_group, description, updated_by_user_id) VALUES
('workshop_name', 'BikeFix Club', 'general', 'Official brand name', 1),
('tagline', 'Your Bike. Your Club. Our Care.', 'general', 'Official brand tagline', 1),
('headline', 'Your Bike. Our Priority.', 'general', 'Public hero headline', 1),
('description', 'Premium Motorcycle Service & Care.', 'general', 'Brand positioning statement', 1),
('workshop_address', '2/2, RS Puram, Aruppukkottai', 'contact', 'Official workshop physical address', 1),
('workshop_phone', '9597881218', 'contact', 'Official customer support phone', 1),
('business_hours', 'Monday - Saturday: 8:30 AM - 7:30 PM | Sunday: Closed', 'general', 'Operational workshop hours', 1),
('tax_rate', '18.00', 'billing', 'Applicable GST / service tax percentage', 1),
('daily_booking_capacity', '12', 'booking', 'Maximum online appointments per calendar day', 1),
('auto_confirm_bookings', '0', 'booking', 'Whether online bookings are automatically confirmed (0=manual, 1=auto)', 1),
('allow_reviews_unpaid', '0', 'reviews', 'Strict policy: Reviews require delivered status and full payment (0=strict)', 1),
('currency_symbol', '₹', 'billing', 'Default currency symbol', 1),
('currency_code', 'INR', 'billing', 'Default currency code', 1),
('razorpay_key_id', 'rzp_test_bikefixclub_sandbox', 'payment', 'Razorpay Sandbox API Key ID', 1),
('razorpay_key_secret', 'rzp_secret_sandbox_bikefix', 'payment', 'Razorpay Sandbox Secret', 1);
