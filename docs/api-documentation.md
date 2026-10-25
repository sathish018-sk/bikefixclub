# BikeFix Club — RESTful API Specification

**Base URL (Direct PHP):** `http://127.0.0.1:8000/api/v1`  
**Base URL (Vite Reverse Proxy):** `http://127.0.0.1:5173/api/v1`  
**Content-Type:** `application/json`  
**Authentication Scheme:** `Bearer <JWT_TOKEN>`

---

## 1. Response Standard

All endpoints return uniform JSON payloads:

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully.",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Validation failed or resource not found.",
  "errors": {
    "field_name": "Specific constraint violation"
  }
}
```

---

## 2. Authentication & Public Endpoints

### 2.1 Public Workshop Information
`GET /public/workshop-info`
- **Auth:** None
- **Response `200`:**
  ```json
  {
    "success": true,
    "data": {
      "brand_name": "BikeFix Club",
      "tagline": "Your Bike. Your Club. Our Care.",
      "headline": "Your Bike. Our Priority.",
      "description": "Premium Motorcycle Service & Care.",
      "address": "2/2, RS Puram, Aruppukkottai",
      "mobile": "9597881218",
      "business_hours": "Monday - Saturday: 8:30 AM - 7:30 PM | Sunday: Closed",
      "currency_symbol": "₹",
      "currency_code": "INR",
      "tax_rate": 18
    }
  }
  ```

### 2.2 Public Services Catalogue
`GET /public/services`
- **Query Params:** `?category_id=1` (optional)
- **Response `200`:** List of active services with duration, category, and base price.

### 2.3 Public Approved Reviews
`GET /public/reviews`
- **Response `200`:** Verified customer reviews moderated with status `approved`.

### 2.4 Contact Inquiry Submission
`POST /public/contact`
- **Payload:**
  ```json
  {
    "name": "Kavitha Devi",
    "phone": "9840123456",
    "email": "kavitha@example.com",
    "subject": "Service Inquiry",
    "message": "Do you provide roadside pickup for Royal Enfield bikes?"
  }
  ```
- **Response `200`:** `{ "success": true, "message": "Your message has been sent successfully." }`

### 2.5 User Login
`POST /auth/login`
- **Payload:**
  ```json
  {
    "login": "sathish@example.com",
    "password": "password123"
  }
  ```
- **Response `200`:** Returns JWT token and user profile object.

### 2.6 User Registration
`POST /auth/register`
- **Payload:**
  ```json
  {
    "name": "Praveen Kumar",
    "email": "praveen@example.com",
    "phone": "9443312345",
    "password": "securepassword",
    "address": "10 Bazaar Street, Aruppukkottai"
  }
  ```
- **Response `201`:** Returns JWT token and newly created profile.

### 2.7 Current Session Me
`GET /auth/me`
- **Auth:** `Bearer <token>`
- **Response `200`:** Returns authenticated user context.

---

## 3. Customer Portal Endpoints

### 3.1 Customer Profile
- `GET /customer/profile`: Get customer profile and address.
- `PUT /customer/profile`: Update name, phone, address, and city.

### 3.2 Customer Garage (My Bikes)
- `GET /customer/bikes`: List registered motorcycles owned by the authenticated customer.
- `POST /customer/bikes`:
  ```json
  {
    "registration_number": "TN-67-AB-1234",
    "brand": "Yamaha",
    "model": "MT-15 V2",
    "manufacturing_year": 2023,
    "fuel_type": "Petrol",
    "current_odometer": 6400,
    "notes": "First chain service"
  }
  ```
- `GET /customer/bikes/{id}`: Detailed bike record.
- `PUT /customer/bikes/{id}`: Update bike specs and odometer reading.
- `DELETE /customer/bikes/{id}`: Soft delete / archive bike if no dependent invoices exist.

### 3.3 Guided Service Booking
- `POST /customer/bookings`:
  ```json
  {
    "bike_id": 1,
    "service_ids": [1, 2],
    "preferred_date": "2026-10-26",
    "preferred_time": "10:00:00",
    "current_odometer": 6450,
    "problem_description": "Rear disc brake noise"
  }
  ```
- **Response `201`:** `{ "booking_id": 12, "booking_reference": "BFC-BK-2026-0012", "status": "requested", "estimated_amount": 2298.00 }`
- `GET /customer/bookings`: List of customer's active and historical bookings.
- `GET /customer/bookings/{id}`: Booking details with live stage tracking and mechanic assignments.
- `POST /customer/bookings/{id}/cancel`: Cancel booking with reason.
- `POST /customer/bookings/{id}/reschedule`: Change date and time slot.

### 3.4 Invoices & Payment
- `GET /customer/invoices`: List customer invoices.
- `GET /customer/invoices/{id}`: Itemized breakdown (labour, parts, GST, payments).
- `GET /customer/invoices/{id}/pdf`: Print-ready, high-resolution HTML/PDF rendered invoice.
- `POST /customer/invoices/{id}/payment-orders`: Create Razorpay payment order for online settlement.
- `POST /customer/payments/{id}/verify`: Verify cryptographic Razorpay signature and settle invoice balance.

### 3.5 Verified Reviews (Gated Rule)
- `POST /customer/bookings/{id}/review`:
  ```json
  {
    "rating": 5,
    "comment": "BikeFix Club did an incredible job solving the brake squeal! Prompt and courteous."
  }
  ```
  > **Note:** Server returns `403 Forbidden` if the service is not yet marked `delivered` OR if the invoice is not fully settled (`outstanding_balance == 0.00`).

---

## 4. Admin Portal Endpoints

### 4.1 Dashboard Analytics
`GET /admin/dashboard`
- **Auth:** Admin
- **Response `200`:** Real-time metrics including Active Job Cards, Today's Bookings, Revenue MTD, Low Stock Alerts, and recent workshop activity.

### 4.2 Job Card Management
- `GET /admin/job-cards`: Filterable list of job cards with status and vehicle details.
- `POST /admin/job-cards`: Create new job card from booking or walk-in.
  ```json
  {
    "customer_user_id": 2,
    "bike_id": 1,
    "reported_problem": "Chain slack and oil change",
    "initial_odometer": 6450
  }
  ```
- `PATCH /admin/job-cards/{id}`: Update notes and assign mechanic (`assigned_mechanic_id`).
- `PATCH /admin/job-cards/{id}/status`: Progress job through stages (`diagnosis`, `repair_in_progress`, `quality_check`, `ready_for_delivery`).
- `POST /admin/job-cards/{id}/services`: Add labour line item.
- `POST /admin/job-cards/{id}/parts`: Add spare part (atomically decrements inventory balance).
- `POST /admin/job-cards/{id}/invoice`: Generate final invoice with configurable GST and discount.
- `POST /admin/job-cards/{id}/deliver`: Hand over vehicle and record final odometer reading.

### 4.3 Spare Parts & Concurrency Ledger
- `GET /admin/parts`: All inventory parts with valuation and stock level.
- `POST /admin/parts`: Add new SKU to inventory.
- `PUT /admin/parts/{id}`: Update pricing and supplier information.
- `POST /admin/parts/{id}/stock-adjustments`: Record manual restock or discrepancy adjustment.
- `GET /admin/stock-movements`: Immutable audit ledger showing all stock changes.

### 4.4 Billing & Counter Payments
- `GET /admin/invoices`: List all customer invoices.
- `POST /admin/invoices/{id}/record-payment`: Record counter settlement:
  ```json
  {
    "payment_method": "upi_workshop",
    "amount": 3950.64,
    "notes": "Verified GPay at workshop counter"
  }
  ```

### 4.5 Reports & Business Analytics
- `GET /admin/reports/revenue`: Financial breakdown by date and payment method.
- `GET /admin/reports/bookings`: Booking volumes and conversion metrics.
- `GET /admin/reports/inventory`: Valuation ledger and restock forecasts.
- `GET /admin/reports/mechanics`: Workload efficiency and job delivery metrics.
- `GET /admin/reports/export`: CSV download of operational dataset.
