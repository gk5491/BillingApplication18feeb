# Billing Accounting Application

## Overview
A full-stack accounting application designed for comprehensive financial management, including invoices, customers, products, vendors, and expenses. It aims to provide an enterprise-grade solution for businesses, leveraging a modern tech stack and modular architecture to ensure scalability and maintainability.

## User Preferences
I want iterative development. Ask before making major changes. I prefer detailed explanations. Do not make changes to the folder `Z`. Do not make changes to the file `Y`.

## System Architecture

### UI/UX Decisions
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 7
- **UI Components**: Radix UI components with Tailwind CSS for a modern and consistent design.
- **Routing**: Wouter with lazy loading for efficient navigation.
- **State Management**: Zustand for global state and TanStack Query for server state.
- **Forms**: React Hook Form with Zod validation for robust form handling.

### Technical Implementations
- **Backend Server**: Express 4
- **Database**: PostgreSQL (Replit built-in) managed with Drizzle ORM using `pg` driver.
- **API Versioning**: All API routes are prefixed with `/api/v1`.
- **Authentication**: JWT-based authentication (prepared for implementation).
- **Validation**: Zod schemas used for both frontend and backend validation.
- **Deployment**: Designed for stateless web application deployment with `npm run build` and `npm start`.

### Feature Specifications
- **Core Modules**: Dashboard, Invoice, Customer, Product & Services, Estimates, Vendor, Expense, Purchase Order, Bill, Payment, Time Tracking, Banking, Filing & Compliance, Accountant Collaboration, Document Management, Reports, and Settings.
- **Frontend Structure**: Enterprise modular structure (`client/src/modules/`) where each feature is a module with its own components, pages, hooks, API, types, and services. Global elements like API client, config, constants, layouts, routes, and shared utilities are managed centrally.
- **Backend Structure**: Clean Architecture / Modular Monolith (`server/src/modules/`) with each module containing its own controller, service, model, routes, validators, and repository. Middleware for authentication, error handling, logging, and validation is centrally managed.

### System Design Choices
- **Development Mode**: Express server with Vite middleware for Hot Module Replacement (HMR).
- **Production Mode**: Express serves pre-built static files from `dist/public`.
- **API Pattern**: All modules expose their functionalities through versioned API endpoints, following a consistent `/{module}/{resource}` pattern.
- **Module Architecture**: Frontend modules export pages, types, API functions, services, and hooks. Backend modules adhere to Clean Architecture principles with distinct layers for controllers, services, repositories, models, and validators.

## Vendor Credit Flow (Zoho Books Accounting Logic)

### Overview
Vendor Credits represent amounts owed BY the vendor TO the company. They are applied to reduce outstanding bills and can be refunded. The credit reflects at different stages of its lifecycle:

### 1. VENDOR CREDIT CREATION

**What happens:**
- Vendor Credit is created and saved to `vendorCredits.json`
- Initial status: `OPEN` (or `DRAFT` if saved as draft)
- `balance` field equals `amount` (total credit amount available)

**Where it reflects:**
- ✅ **Vendor Credits list** - Shows as OPEN status
- ✅ **Vendor Ledger** - Shows as a credit entry increasing vendor credit balance
- ✅ **Vendor balance** - `unusedCredits` increases by credit amount
- ❌ **Bills** - NO change yet
- ❌ **Bank/Cash** - NO change

**Accounting Entry (Journal):**
```
Date: Credit creation date
Account Payable (Vendor name) [Debit]  | Amount: VC total
  TO
Accounts Receivable or Adjustments [Credit] | Amount: VC total

Note: This is a "Suspense" entry until the credit is applied/used
```

**Data Structure:**
```json
{
  "id": "vc-xxx",
  "creditNumber": "VC-00010",
  "vendorId": "6",
  "vendorName": "Sharma Traders Pvt Ltd",
  "items": [...],
  "amount": 2456.5,          // Total credit amount
  "balance": 2456.5,         // Remaining credit (unused portion)
  "status": "OPEN",          // Status when created
  "createdAt": "2025-12-22T11:14:31.399Z"
}
```

---

### 2. VENDOR CREDIT ADJUSTMENT (Applied against Bill)

**What happens:**
- Vendor Credit is applied to reduce a specific bill's amount due
- Credit is linked to bill via `appliedToBillId` field
- `balance` field in VC decreases
- Bill's `balanceDue` decreases

**Where it reflects:**
- ✅ **Vendor Credits list** - Shows partially applied (status: `PARTIALLY_APPLIED` or `APPLIED`)
- ✅ **Vendor Ledger** - Shows reduction of credit balance
- ✅ **Bill detail** - Shows applied credit reducing Amount Due
- ✅ **Vendor balance** - `unusedCredits` decreases by applied amount
- ❌ **Bank/Cash** - NO change
- ❌ **Payments Made** - NO entry created

**Accounting Entry (Journal):**
```
Date: When credit is applied
Accounts Payable (Vendor) [Debit]  | Amount: Applied credit amount
  TO
Accounts Payable Adjustment [Credit] | Amount: Applied credit amount

Or simplified:
Accounts Payable [Debit] | Applied amount
  TO
Vendor Credits Liability [Credit] | Applied amount
```

**Data Structure - Vendor Credit:**
```json
{
  "id": "vc-xxx",
  "creditNumber": "VC-00010",
  "amount": 2456.5,
  "balance": 456.5,          // ← DECREASED from original 2456.5
  "status": "PARTIALLY_APPLIED",  // ← Status updated
  "appliedCredits": [
    {
      "billId": "1766399984974",
      "billNumber": "13",
      "appliedAmount": 2000,
      "appliedDate": "2025-12-22T12:00:00.000Z"
    }
  ]
}
```

**Data Structure - Bill:**
```json
{
  "id": "1766399984974",
  "billNumber": "13",
  "total": 2456.5,
  "amountPaid": 456,
  "balanceDue": 2000.5,      // ← DECREASED by applied credit
  "appliedCredits": [
    {
      "vendorCreditId": "vc-xxx",
      "creditNumber": "VC-00010",
      "appliedAmount": 2000
    }
  ]
}
```

---

### 3. VENDOR CREDIT REFUND

**What happens:**
- Vendor Credit balance (unused portion) is refunded to company
- A payment entry is created in `Payments Made` (paymentsMade.json)
- VC status becomes `REFUNDED`
- Bank balance increases

**Where it reflects:**
- ✅ **Vendor Credits list** - Shows as REFUNDED status, balance becomes 0
- ✅ **Payments Made list** - New payment entry created with type "Vendor Credit Refund"
- ✅ **Vendor balance** - `unusedCredits` decreases to 0
- ✅ **Bank/Cash** - Balance increases (if payment mode is "Bank Transfer", cash account updates)
- ❌ **Bills** - Existing adjustments remain, NOT affected by refund
- ❌ **Vendor Ledger** - Shows credit closure

**Accounting Entry (Journal):**
```
Date: Refund date
Bank/Cash Account [Debit] | Amount: Refunded amount
  TO
Accounts Payable or Vendor Credit Liability [Credit] | Amount: Refunded amount
```

**Data Structure - Vendor Credit:**
```json
{
  "id": "vc-xxx",
  "creditNumber": "VC-00010",
  "amount": 2456.5,
  "balance": 0,              // ← Set to 0 after refund
  "status": "REFUNDED",      // ← Status changed to REFUNDED
  "refundedAmount": 456.5,   // ← Amount that was refunded
  "refundDetails": {
    "paymentId": "pm-xxx",
    "paymentNumber": "PM-00025",
    "refundDate": "2025-12-22T13:00:00.000Z",
    "refundMode": "Bank Transfer",
    "refundAccount": "HDFC Business Account"
  }
}
```

**Data Structure - Payments Made (New Entry):**
```json
{
  "id": "pm-xxx",
  "paymentNumber": "PM-00025",
  "paymentType": "VENDOR_CREDIT_REFUND",
  "vendorId": "6",
  "vendorName": "Sharma Traders Pvt Ltd",
  "vendorCreditId": "vc-xxx",
  "vendorCreditNumber": "VC-00010",
  "date": "2025-12-22",
  "paymentMode": "Bank Transfer",
  "paidThrough": "HDFC Business Account",
  "amount": 456.5,            // ← Refunded amount
  "status": "PAID",
  "reference": "VC-00010 Refund"
}
```

---

### Complete Vendor Credit Lifecycle Summary

| Stage | VC Status | Balance | Bill Impact | Bank Impact | Vendor Balance | Where It Shows |
|-------|-----------|---------|------------|------------|-----------------|-----------------|
| **Created** | OPEN | Full amount | None | None | ↑ unusedCredits | VC List, Vendor Ledger |
| **Partially Applied** | PARTIALLY_APPLIED | Reduced | Balanceddue↓ | None | ↓ unusedCredits | VC List, Bill Detail, Vendor Ledger |
| **Fully Applied** | APPLIED | 0 | Balanceddue↓ | None | unusedCredits at 0 | VC List, Bill Detail |
| **Refunded** | REFUNDED | 0 | No change | ↑ Bank balance | Cleared | VC List, Payments Made |

---

### Implementation Requirements Checklist

- [ ] **VC Creation**: Save to `vendorCredits.json`, set `status: OPEN`, `balance: amount`
- [ ] **Update Vendor**: Increase `vendor.unusedCredits` by credit amount
- [ ] **VC Adjustment**: 
  - Add bill reference to `appliedCredits` array in VC
  - Reduce VC `balance` by applied amount
  - Update Bill `balanceDue`
  - Update Vendor `unusedCredits`
- [ ] **VC Refund**:
  - Create entry in `Payments Made`
  - Set VC `status: REFUNDED`
  - Set VC `balance: 0`
  - Update Vendor `unusedCredits` to 0
  - Update Bank account balance
- [ ] **Vendor Ledger**: Show all VC transactions (creation, adjustments, refunds)
- [ ] **Reports**: Track unused vs applied vs refunded credits by vendor

---

## Recent Changes (December 2025)

### Vendor Credit and Purchase Order Improvements
- **Vendor Credit Edit Page**: Added `/vendor-credits/:id/edit` route with full edit functionality
  - Fetches existing vendor credit data and pre-populates form
  - PUT request to `/api/vendor-credits/:id` for saving changes
  - Proper tax amount recalculation when quantity/rate changes

- **Vendor Credit Tax Calculation**:
  - Added `taxAmount` field to LineItem interface
  - `calculateItemTaxAmount` uses stored taxAmount first, falls back to calculation
  - `updateItem` recalculates taxAmount when quantity, rate, or tax code changes
  - Tax amounts properly included in total calculations and payloads

- **Bill Creation from Purchase Orders**:
  - Navigate to `/bills/new?purchaseOrderId=X` to create bill from PO
  - Pre-populates vendor, items, and totals from purchase order data
  - Refreshes PO list after conversion to reflect updated status

- **Vendor Credit Creation from Bills**:
  - Navigate to `/vendor-credits/new?billId=X` to create credit from bill
  - Pre-populates vendor, items with taxAmount calculations
  - Shows info banner indicating creation from bill

### Sales Entry Point Flow Implementation
- **Transaction Bootstrap Hooks**: Centralized customer auto-population for all transaction create pages
  - `useTransactionBootstrap`: Main hook for transaction pages - reads customerId from URL, manages customer snapshot
  - `useCustomerSnapshot`: Fetches and caches customer data as immutable snapshot
  - `customer-snapshot.ts`: Utility functions for tax regime determination and address formatting

- **Tax Calculation Logic**:
  - Automatic CGST+SGST calculation for intra-state transactions (same state as company)
  - Automatic IGST calculation for inter-state transactions (different state)
  - Tax-exempt handling for customers with tax_exempt preference

- **Customer Snapshot Architecture**:
  - Immutable customer data preserved at transaction creation time
  - Prevents retroactive changes when customer details are updated later
  - Includes: billing address, shipping address, GSTIN, tax preference, payment terms, place of supply

### Updated Create Pages
All transaction create pages now integrate with transaction bootstrap hooks:
- Invoice Create (`/invoices/create`)
- Quote Create (`/quotes/create`)
- Sales Order Create (`/sales-orders/create`)
- Delivery Challan Create (`/delivery-challans/create`)
- Credit Note Create (`/credit-notes/create`)
- Payments Received Create (`/payments-received/create`)

## External Dependencies
- **Database**: PostgreSQL (via Neon)
- **ORM**: Drizzle ORM
- **Frontend Libraries**: React, Vite, Radix UI, Tailwind CSS, Wouter, Zustand, TanStack Query, React Hook Form, Zod.
- **Backend Libraries**: Express, Zod.