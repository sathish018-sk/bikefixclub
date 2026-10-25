# BikeFix Club — Full-Stack Motorcycle Workshop Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-orange.svg)](https://opensource.org/licenses/MIT)
[![PHP: 8.2+](https://img.shields.io/badge/PHP-8.2%2B-777BB4.svg?logo=php&logoColor=white)](https://www.php.net/)
[![React: 18](https://img.shields.io/badge/React-18-61DAFB.svg?logo=react&logoColor=black)](https://react.dev/)
[![MySQL: 8+/9.5](https://img.shields.io/badge/MySQL-8%2B%20%2F%209.5-4479A1.svg?logo=mysql&logoColor=white)](https://www.mysql.com/)
[![TailwindCSS: 3.4](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Tests: 64/64 Passed](https://img.shields.io/badge/Tests-64%2F64%20Passing-16A34A.svg)](https://github.com/bikefix-club)

> **Official Brand Name:** BikeFix Club  
> **Official Tagline:** Your Bike. Your Club. Our Care.  
> **Headline:** Your Bike. Our Priority.  
> **Workshop Address:** 2/2, RS Puram, Aruppukkottai  
> **Workshop Phone:** 9597881218  

---

## 🚀 Overview

**BikeFix Club** is an enterprise-grade, full-stack motorcycle workshop management web application. It connects motorcycle owners and workshop administration into a single cohesive ecosystem, replacing manual paperwork with transparent real-time tracking, atomic inventory control, multi-rate GST billing, and fraud-resistant review governance.

### Two Connected Portals
1. **Customer Portal:** Mobile-responsive self-service hub for riders to register bikes, book services in a guided 5-step flow, follow an 8-stage live repair timeline, download PDF/HTML invoices, and submit verified feedback.
2. **Admin Portal:** Secure, high-efficiency operational command center for workshop managers to register walk-ins, dispatch job cards (`JC-YYYY-XXXX`), assign mechanics, log spare parts and labour, reconcile payments, and analyze financial reports.

---

## 🎨 Visual Identity & Color Palette

- **Primary Orange:** `#F97316` (Actions, badges, active states)
- **Orange Hover:** `#EA580C`
- **Deep Black:** `#111111` (Headings, primary brand backgrounds)
- **Charcoal:** `#171717` (Admin sidebar, dark accents)
- **Light Surface:** `#F8F8F8` (App background)
- **Borders & Dividers:** `#E5E5E5`
- **Functional Semantics:** Success (`#16A34A`), Warning (`#EAB308`), Error (`#DC2626`), Info (`#2563EB`)

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite 6, React Router DOM v6, Tailwind CSS v3, Lucide React, Recharts |
| **Backend** | PHP 8.2+ RESTful Architecture, PDO, Stateless JWT (HMAC-SHA256), Transactions |
| **Database** | MySQL 8+ / 9.5, InnoDB, `utf8mb4_unicode_ci`, Foreign Key Cascades & Indexes |
| **Payments** | Razorpay Sandbox SDK (Online) + Counter Settlement (Cash, UPI, Card) |
| **PDF Generation** | Server-side semantic HTML/CSS Print Engine |

---

## ⚡ Quick Start & Local Setup

### 1. Prerequisites
- **XAMPP / PHP 8.2+** with `pdo_mysql`, `curl`, `mbstring`, `openssl` enabled.
- **MySQL 8+ or 9.5** running locally on port 3306.
- **Node.js LTS (v18+)** and `npm`.

### 2. Database Migration & Development Seeding
Run the automated migration runner:
```powershell
& "V:\XAMPP\php\php.exe" "database/migrate.php"
```
*Creates 24 relational tables and seeds full demo data (admin, customers, bikes, services, spare parts, job cards, invoices, reviews).*

### 3. Start Backend REST API
Launch the PHP built-in web server:
```powershell
& "V:\XAMPP\php\php.exe" -S 127.0.0.1:8000 -t "backend/public" "backend/public/index.php"
```
*Health check available at: `http://127.0.0.1:8000/api/v1/health`*

### 4. Start Frontend Application
In a separate terminal:
```powershell
cd frontend
npm install
npm run dev -- --host 127.0.0.1
```
*Access the application at: `http://127.0.0.1:5173/`*  
*(All `/api` requests are automatically reverse-proxied to `127.0.0.1:8000`)*

---

## 🔑 Admin Authentication & Credentials

| Role | Email / Phone | Password | Portal Entry |
|---|---|---|---|
| **Workshop Admin** | `admin@bikefixclub.com` / `9597881218` | `password123` | `/login` ➔ `/admin` |

*A convenient single-click autofill button is available on the Login page for Admin access.*  
*Demo customer records and test transactions have been purged. Real customers can register via `/register`.*

### Database Cleanup Utility
To reset operational data and purge old demo records at any time while keeping the admin login:
```powershell
& "V:\XAMPP\php\php.exe" "database/clear-demo.php"
```
Or run the migration with clean seed:
```powershell
& "V:\XAMPP\php\php.exe" "database/migrate.php"
```

---

## 🧪 Comprehensive Verification Suite

Both unit and full end-to-end test suites run directly from the command line:

### 1. Backend Security & Unit Suite
```powershell
& "V:\XAMPP\php\php.exe" "backend/tests/api_test.php"
```
*Output: 23 / 23 Tests Passing (Database, JWT, Password Verify, GST calculation, Review gating).*

### 2. Full End-to-End Lifecycle Suite
```powershell
& "V:\XAMPP\php\php.exe" "backend/tests/e2e_verification.php"
```
*Output: 41 / 41 Tests Passing (Vite proxy, Public API, Registration, 5-Step Booking, Job Card, Concurrency Lock, Invoicing, Counter Payment, Vehicle Delivery, Gated Review, Financial Reports).*

### 3. Production Build Check
```powershell
npm --prefix frontend run build
```
*Output: 2,305 modules transformed with 0 errors.*

---

## 📂 Project Structure

```
BikeFix Club/
├── backend/
│   ├── config/              # Environment parser and PDO Database connection pool
│   ├── controllers/         # Auth, Public, Customer, Admin, Report, Webhook controllers
│   ├── middleware/          # JWT AuthMiddleware, RoleMiddleware
│   ├── public/              # Front controller (index.php) and route dispatcher
│   ├── tests/               # Automated test suites (api_test.php, e2e_verification.php)
│   └── utils/               # JwtHelper, Response, Validator, PdfInvoice
├── database/
│   ├── schema.sql           # Complete 24-table DDL schema
│   ├── seed-development.sql # Realistic motorcycle workshop seed data
│   └── migrate.php          # Migration runner
├── docs/
│   ├── requirements.md      # Detailed system requirements specification
│   ├── database-design.md   # Schema ER diagrams, indexes, table definitions
│   ├── api-documentation.md # Exhaustive REST API reference
│   ├── deployment.md        # Ubuntu/Nginx/PHP-FPM production deployment guide
│   └── test-plan.md         # QA test plan and automated results report
├── frontend/
│   ├── src/
│   │   ├── components/      # Common components (Logo, Dialogs, Tables)
│   │   ├── context/         # AuthContext, NotificationContext
│   │   ├── layouts/         # PublicLayout, CustomerLayout, AdminLayout
│   │   ├── pages/
│   │   │   ├── public/      # Home, Services, About, Contact
│   │   │   ├── auth/        # Login, Register, ForgotPassword
│   │   │   ├── customer/    # Dashboard, Bikes, BookService, Tracking, Invoices, Reviews
│   │   │   └── admin/       # Dashboard, WalkIn, JobCards, Inventory, Billing, Reports
│   │   ├── services/        # Axios API client with bearer token interceptor
│   │   ├── styles/          # Tailwind CSS definitions
│   │   ├── App.jsx          # Protected route mapping
│   │   └── main.jsx         # Application entry
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
└── README.md
```

---

## 🔒 Security & Architectural Highlights

1. **Stateless JWT Security:** Authenticated tokens carry sub, role, and email claims signed using HMAC-SHA256. Tampered tokens are immediately rejected.
2. **Atomic Inventory Ledger:** Spare part allocations run inside transactions using `SELECT ... FOR UPDATE` row locks, preventing race conditions, phantom allocations, or negative stock.
3. **Fraud-Resistant Review Gating:** Reviews are strictly locked on the database and API level until the vehicle is marked `delivered` and the invoice is fully settled with `outstanding_balance == 0.00`.
4. **Clean Code & Separation:** Separation of concerns between stateless REST endpoints and React single-page client with zero coupling.

---

## 📄 License
This project is open-source under the [MIT License](LICENSE).
