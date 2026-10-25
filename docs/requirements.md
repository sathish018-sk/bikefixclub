# BikeFix Club — System Requirements Specification

**Official Brand Name:** BikeFix Club  
**Official Tagline:** Your Bike. Your Club. Our Care.  
**Headline:** Your Bike. Our Priority.  
**Workshop Address:** 2/2, RS Puram, Aruppukkottai  
**Mobile:** 9597881218  
**Platform Version:** 1.0.0 (Production-Ready)

---

## 1. Executive Summary

BikeFix Club is a full-stack, enterprise-grade motorcycle workshop management system. It bridges the gap between motorcycle owners and professional workshop administration, offering real-time repair progress tracking, inventory control, automated multi-rate invoicing with GST, staff management, and review governance.

The platform provides two primary user-facing interfaces:
1. **Customer Portal:** Dedicated self-service platform for bike owners (register bikes, multi-step booking, live service tracking, invoice downloads, and verified reviews).
2. **Admin Portal:** Secure operational hub for workshop technicians and managers (walk-in registration, job card dispatching, inventory control, atomic stock deductions, billing, mechanics assignment, and financial analytics).

---

## 2. Stakeholders & User Roles

| Role | Description | Access Permissions |
|---|---|---|
| **Public Visitor** | Prospective customer visiting the marketing portal | Browse services, view workshop contact info, check business hours, submit inquiries, view approved testimonials. |
| **Customer** | Authenticated bike owner | Manage motorcycle garage, book services, track 8-stage repair lifecycle, view/download PDF invoices, make sandbox/workshop payments, submit gated reviews. |
| **Mechanic / Technician** | Workshop service staff | Assigned to job cards, performs diagnostics, installs spare parts, records labor hours. |
| **Workshop Administrator** | Operations manager & owner | Full access to KPIs, customers, bookings, job cards, mechanics, inventory, billing, expenses, review moderation, financial reports, and settings. |

---

## 3. Functional Requirements

### 3.1 Public Marketing & Information
- **FR-PUB-01:** Prominently display brand name **BikeFix Club**, headline **"Your Bike. Our Priority."**, and official tagline **"Your Bike. Your Club. Our Care."**
- **FR-PUB-02:** Provide workshop address: **2/2, RS Puram, Aruppukkottai** and direct contact phone: **9597881218**.
- **FR-PUB-03:** Dynamic catalogue displaying active services categorized into General Service, Engine, Brakes, Electrical, Tyres/Battery, and Custom Fabrication.
- **FR-PUB-04:** Verified customer testimonial feed pulling only approved reviews from the database.
- **FR-PUB-05:** Contact and inquiry submission form with server-side field validation.

### 3.2 Authentication & Security
- **FR-AUTH-01:** Customer registration with unique email, phone verification format, password hashing using `BCRYPT`, and automated welcome notification generation.
- **FR-AUTH-02:** Multi-identifier login supporting either email or mobile number with brute-force resistant password verification.
- **FR-AUTH-03:** Stateless JWT authentication with HMAC-SHA256 signature, expiry enforcement, and role claims.
- **FR-AUTH-04:** Strict role-based middleware guarding `/api/v1/admin/*` and `/api/v1/customer/*` routes.
- **FR-AUTH-05:** Customer profile management (address, phone, name) with strict exclusion of role escalation.

### 3.3 Customer Garage & Booking Engine
- **FR-CUST-01:** Motorcycle garage management allowing customers to add, view, update, and archive motorcycles. Registration number standardized to uppercase hyphenated format (e.g., `TN-67-AB-1234`).
- **FR-CUST-02:** Guided 5-Step Booking Flow:
  - Step 1: Select bike from garage or add a new one.
  - Step 2: Multi-select services from catalogue with dynamic price estimation.
  - Step 3: Select appointment date and time slot.
  - Step 4: Record odometer reading and describe specific problems.
  - Step 5: Review summary, generate unique server reference `BFC-BK-YYYY-XXXX`, and confirm.
- **FR-CUST-03:** Real-time 8-stage service tracker with visual timeline:
  `Booking Placed` -> `Confirmed` -> `Vehicle Checked-In` -> `Diagnosis` -> `Repair In Progress` -> `Quality Check` -> `Ready for Delivery` -> `Delivered`.
- **FR-CUST-04:** Invoice download in high-resolution, print-ready HTML/PDF format with breakdown of spare parts, labour, and GST.

### 3.4 Workshop Operations & Job Cards
- **FR-OPS-01:** Walk-in fast registration converting counter customers directly into registered users, bikes, and job cards in a single step.
- **FR-OPS-02:** Generation of authoritative Job Cards with sequential code `JC-YYYY-XXXX`.
- **FR-OPS-03:** Mechanic assignment and real-time workload balancing.
- **FR-OPS-04:** Job card itemization:
  - Add labour services with description and hours/rate.
  - Add spare parts with atomic stock deduction and ledger logging.

### 3.5 Inventory & Stock Ledger
- **FR-INV-01:** Complete spare parts catalogue tracking SKU, category, brand, purchase price, selling price, and minimum reorder levels.
- **FR-INV-02:** Atomic concurrency control: Row locking (`SELECT ... FOR UPDATE`) prevents negative stock and ensures single-source-of-truth inventory counts.
- **FR-INV-03:** Immutable audit trail table `stock_movements` recording every stock addition, job card deduction, or counter adjustment with timestamp and operator ID.

### 3.6 Authoritative Invoicing & Billing
- **FR-BILL-01:** Financial calculations strictly computed on backend using 2-decimal arithmetic.
- **FR-BILL-02:** GST calculation: Subtotal minus discounts with 18% configurable tax computation.
- **FR-BILL-03:** Multi-method payment recording: Cash, UPI at workshop, Card, and Razorpay online gateway integration.
- **FR-BILL-04:** Real-time invoice balance tracking (`issued` -> `partially_paid` -> `paid`).

### 3.7 Review Governance & Anti-Fraud
- **FR-REV-01 (Strict Business Invariant):** Customers are strictly prevented from submitting reviews until:
  1. The job card / booking has been marked `delivered` or `completed`.
  2. The invoice has an outstanding balance of `0.00` and status `paid`.
- **FR-REV-02:** All submitted reviews enter `pending` state for admin moderation before displaying on the public homepage.
- **FR-REV-03:** Admin response capability for public review engagement.

### 3.8 Financial & Operational Analytics
- **FR-REP-01:** Revenue analytics segmented by date range, payment method, and daily transaction volume.
- **FR-REP-02:** Booking volume metrics and service popularity distribution.
- **FR-REP-03:** Inventory valuation and low-stock alerts.
- **FR-REP-04:** Mechanic efficiency and job completion rates.
- **FR-REP-05:** CSV data export for external accounting.

---

## 4. Non-Functional Requirements

### 4.1 Performance & Responsiveness
- Server response times < 150ms for authenticated REST endpoints under normal load.
- Single-page application bundle size < 300kB gzipped.
- Fully responsive interface adapting cleanly to mobile screens (375px+), tablets, and widescreen desktop monitors.

### 4.2 Security & Data Integrity
- Passwords hashed using BCRYPT with work factor 10.
- Database access exclusively via PDO prepared statements with parameterized queries to eliminate SQL injection vulnerabilities.
- Cross-Site Scripting (XSS) mitigated by React DOM sanitization and server-side text escaping.
- JWT tokens signed with SHA-256 secret key stored in environment variables.

### 4.3 Reliability & Transactions
- Multi-table modifications wrapped in `PDO::beginTransaction()` and `commit()` with rollback on failure (e.g., job card creation, parts allocation, invoice payments).
- Database foreign keys with `ON DELETE RESTRICT` on historical records (invoices, job cards, bikes) to prevent accidental data loss.
