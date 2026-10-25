-- ====================================================================
-- BikeFix Club — Clean Production / Staging Seed Data
-- Brand: BikeFix Club | "Your Bike. Your Club. Our Care."
-- Contains ONLY the Admin Account, Master Catalog, Mechanics, and Workshop Settings.
-- Demo customers, demo bikes, bookings, job cards, invoices, reviews & expenses are omitted.
-- ====================================================================

-- 1. ADMIN USER ONLY
INSERT INTO users (id, name, email, phone, password_hash, role, account_status, email_verified_at, phone_verified_at, created_at) VALUES
(1, 'BikeFix Club Admin', 'admin@bikefixclub.com', '9597881218', '$2y$10$teDvC.dpAkFaiFuv0KAWVOBcK0eCzv9uU1FnDw5faNI0cDYBANlSq', 'admin', 'active', NOW(), NOW(), NOW());

-- 2. MECHANICS / TECHNICIANS
INSERT INTO mechanics (id, name, email, phone, skills, employment_status, current_workload) VALUES
(1, 'Muthu Kumar', 'muthu.tech@bikefixclub.com', '9876500001', 'Royal Enfield specialist, Engine & Transmission overhaul, Carburetor & FI diagnostics', 'active', 0),
(2, 'Senthil Nathan', 'senthil.tech@bikefixclub.com', '9876500002', 'Brakes, ABS systems, Hydraulic suspension, Chain drive maintenance', 'active', 0),
(3, 'Karthik Raja', 'karthik.tech@bikefixclub.com', '9876500003', 'Electrical harness, ECU diagnostics, LED systems, Battery health analysis', 'active', 0);

-- 3. SERVICE CATEGORIES
INSERT INTO service_categories (id, name, slug, description, icon, display_order, is_active) VALUES
(1, 'General Service & Maintenance', 'general-service', 'Complete motorcycle check-up, washing, adjustments, and oil change services.', 'Wrench', 1, 1),
(2, 'Oil & Fluids', 'oil-fluids', 'High-grade synthetic engine oil replacements, brake fluid, coolant and filter changes.', 'Droplet', 2, 1),
(3, 'Brakes & Suspension', 'brakes-suspension', 'Disc pad replacement, caliper overhaul, fork oil seals and suspension tuning.', 'Disc', 3, 1),
(4, 'Engine & Performance', 'engine-performance', 'Valve clearance, spark plug, carburetor tuning, clutch overhaul, FI cleaning.', 'Cpu', 4, 1),
(5, 'Tyres & Wheel Care', 'tyres-wheel', 'Puncture repairs, wheel balancing, tyre replacements, spoke truing.', 'CircleDot', 5, 1),
(6, 'Electricals & Diagnostics', 'electricals-diagnostics', 'Wiring check, battery charging, sensor diagnostics, lighting & horn repair.', 'Zap', 6, 1);

-- 4. SERVICES CATALOGUE
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

-- 5. SPARE PARTS INVENTORY
INSERT INTO spare_parts (id, sku, name, category, brand, description, purchase_price, selling_price, stock_quantity, minimum_stock, is_active) VALUES
(1, 'OIL-MOTUL-7100', 'Motul 7100 4T 10W-40 100% Synthetic 1L', 'Lubricants', 'Motul', 'High performance ester-based 4-stroke engine oil.', 650.00, 850.00, 25, 6, 1),
(2, 'OIL-CASTROL-PWR1', 'Castrol Power1 Ultimate 10W-40 1L', 'Lubricants', 'Castrol', 'Full synthetic 4T engine lubricant.', 480.00, 650.00, 20, 5, 1),
(3, 'BRK-PAD-RE350', 'Front Disc Brake Pads - RE Classic/Hunter', 'Brakes', 'Brembo', 'Sintered ceramic high friction front disc pads.', 320.00, 480.00, 14, 4, 1),
(4, 'BRK-SHOE-HONDA', 'Rear Brake Shoe Set - Activa/Dio', 'Brakes', 'Honda Genuine', 'Non-asbestos high-wear brake shoe set.', 180.00, 280.00, 15, 4, 1),
(5, 'SPK-NGK-CPR8EA', 'NGK Spark Plug CPR8EA-9', 'Ignition', 'NGK', 'Resistor nickel alloy performance spark plug.', 110.00, 190.00, 22, 5, 1),
(6, 'CHN-LUBE-MOTUL', 'Motul C2 Chain Lube Road 400ml', 'Maintenance', 'Motul', 'Colorless sticky chain spray for high speed motorcycles.', 340.00, 490.00, 15, 4, 1),
(7, 'FIL-OIL-YAMAHA', 'OEM Engine Oil Filter Element', 'Filters', 'Yamaha Genuine', 'Spin-on precision oil filter.', 65.00, 120.00, 22, 6, 1),
(8, 'BAT-EXIDE-12V5', 'Exide Xpress 12V 5Ah VRLA Battery', 'Electricals', 'Exide', 'Sealed maintenance-free high crank motorcycle battery.', 1150.00, 1650.00, 5, 3, 1);

-- 6. INITIAL STOCK MOVEMENTS
INSERT INTO stock_movements (id, part_id, movement_type, quantity_change, unit_cost, reference_type, reference_id, reason, user_id) VALUES
(1, 1, 'initial', 25, 650.00, 'initial_seed', 'SEED-001', 'Initial stock entry', 1),
(2, 2, 'initial', 20, 480.00, 'initial_seed', 'SEED-001', 'Initial stock entry', 1),
(3, 3, 'initial', 14, 320.00, 'initial_seed', 'SEED-001', 'Initial stock entry', 1),
(4, 4, 'initial', 15, 180.00, 'initial_seed', 'SEED-001', 'Initial stock entry', 1),
(5, 5, 'initial', 22, 110.00, 'initial_seed', 'SEED-001', 'Initial stock entry', 1),
(6, 6, 'initial', 15, 340.00, 'initial_seed', 'SEED-001', 'Initial stock entry', 1),
(7, 7, 'initial', 22, 65.00, 'initial_seed', 'SEED-001', 'Initial stock entry', 1),
(8, 8, 'initial', 5, 1150.00, 'initial_seed', 'SEED-001', 'Initial stock entry', 1);

-- 7. WORKSHOP SETTINGS
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
