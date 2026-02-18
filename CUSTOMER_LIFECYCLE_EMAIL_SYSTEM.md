# Customer Lifecycle × Email Interaction System Design

**Version:** 1.0  
**Date:** January 6, 2026  
**Status:** Technical Specification

---

## 🎯 Executive Summary

This document defines the **transaction-driven, opt-in email system** for a billing/accounting application. The system prevents accidental customer emails, separates internal events from customer communications, and ensures legal compliance through explicit consent mechanisms.

**Core Principle:** *Default to NO email. Customer emails must be intentional, explicit, and audited.*

---

## 📋 Table of Contents

1. [Exact Email Rules by Lifecycle Stage](#exact-email-rules-by-lifecycle-stage)
2. [Backend Data Models](#backend-data-models)
3. [API Endpoints](#api-endpoints)
4. [Workflow Engine Design](#workflow-engine-design)
5. [Email Guard Middleware](#email-guard-middleware)
6. [Role-Based Contact Selection](#role-based-contact-selection)
7. [Audit & Compliance](#audit--compliance)
8. [Edge Cases & Error Handling](#edge-cases--error-handling)
9. [Implementation Checklist](#implementation-checklist)
10. [Testing Strategy](#testing-strategy)

---

## 1. Exact Email Rules by Lifecycle Stage

### 1.1 Customer Creation

**Action:** User creates a new customer with name, email, contact details, GST info.

**Email Rule:** ❌ **NO automatic email**

**Rationale:**
- Customer creation is an internal business action
- Prevents spam and consent violations
- Customer may not have agreed to receive communications yet

**Optional (Advanced):**
- Allow manual "Welcome Email" via explicit workflow with opt-in flag
- Must never be default behavior

**Implementation:**
```typescript
// ❌ FORBIDDEN
async function createCustomer(data: CustomerData) {
  const customer = await db.insert(customers).values(data);
  await sendWelcomeEmail(customer.email); // NEVER DO THIS
}

// ✅ CORRECT
async function createCustomer(data: CustomerData) {
  const customer = await db.insert(customers).values(data);
  // No email sent
  return customer;
}
```

---

### 1.2 Customer Update (Edit)

**Actions:** Email changed, address updated, GST modified, status toggled.

**Email Rule:** ❌ **NO email to customer**

**Rationale:**
- Internal business updates must not notify customers
- Prevents confusion and maintains professional boundaries

**Allowed:**
- ✅ Internal notifications to staff (e.g., "Finance team: customer email changed")
- Must be explicitly configured in admin settings

**Implementation:**
```typescript
async function updateCustomer(id: string, data: Partial<CustomerData>) {
  const oldCustomer = await db.query.customers.findFirst({ where: eq(customers.id, id) });
  const updated = await db.update(customers).set(data).where(eq(customers.id, id));
  
  // Internal notification only (if configured)
  if (data.email && data.email !== oldCustomer.email) {
    await notifyInternalTeam('customer_email_changed', { 
      customerId: id, 
      oldEmail: oldCustomer.email, 
      newEmail: data.email 
    });
  }
  
  // ❌ NEVER send email to customer
  return updated;
}
```

---

### 1.3 Contact Persons (Sub-Contacts)

**Action:** Add/update contact person with role (Billing, Finance, Owner) and email.

**Email Rule:** ❌ **NO email on creation or update**

**Usage:** Contact persons are selected as recipients when sending transaction emails.

**Implementation:**
- Contact person records stored with `receives_document_emails` boolean flag
- Must be explicitly selected in transaction email UI
- Each contact has `unsubscribed` flag to honor opt-outs

---

### 1.4 Transaction Creation (Invoice, Estimate, Sales Order, Credit Note)

**Action:** User creates a new transaction (invoice, quote, etc.)

**Email Rule:** ❌ **NO automatic email** (default state)

**Required User Choice:**
- **Send now** – immediate email with PDF
- **Schedule send** – queue for specific date/time
- **Do not send** – transaction saved without email (default if no selection)

**Rationale:**
- Prevents accidental billing emails during draft phase
- Maintains legal and financial correctness
- User must explicitly confirm readiness to send

**UI Requirement:**
- Clear 3-state toggle with warning: "Default: No email will be sent"
- Confirm dialog for "Send now" with recipient preview

**Implementation:**
```typescript
async function createTransaction(data: TransactionData) {
  const transaction = await db.insert(transactions).values({
    ...data,
    isDraft: true,
    autoEmailFlag: false // NEVER default to true
  });
  
  // Email only if explicitly requested by user
  if (data.sendAction === 'send_now' && data.recipients?.length > 0) {
    await createEmailTrigger({
      transactionId: transaction.id,
      recipients: data.recipients,
      sendMode: 'immediate',
      userId: data.createdBy
    });
  }
  
  return transaction;
}
```

---

### 1.5 Manual Email Send (User-Triggered)

**Action:** User clicks "Email" button on a transaction.

**Email Rule:** ✅ **Send email immediately** with explicit confirmation.

**Customer Receives:**
- Email body (templated)
- PDF attachment
- Payment link (if invoice and unpaid)

**Required Parameters:**
- Transaction ID
- List of recipient contact IDs
- Template ID (optional, uses default)
- Include PDF flag
- Include payment link flag (invoices only)

**Audit:**
- Log who triggered send
- Snapshot of transaction state
- List of recipients
- Delivery status

---

### 1.6 Automated Emails (Opt-In Only)

**Allowed Scenarios:**

#### A) Invoice Reminders
- **Before due date** (e.g., 3 days before)
- **On due date**
- **After due date** (overdue reminders)

**Conditions (ALL must be true):**
- Invoice is unpaid (`outstanding > 0`)
- Customer status is `active`
- Customer has not unsubscribed from reminders
- Reminder workflow is **explicitly enabled** by admin
- Customer or organization has opted into auto-reminders

#### B) Recurring Invoices
- Auto-generated invoices can be auto-emailed
- **Only if** recurring schedule has `auto_email = true` (per-schedule setting)
- Each recurring invoice creation logs independent email trigger

#### C) Workflow-Based Emails
- Custom workflow rules (e.g., "Send thank you email when payment received")
- Must be explicitly created and enabled by admin
- Requires opt-in scope: organization-wide, customer group, or per-customer
- Each workflow shows preview of what will be sent before enabling

**Implementation:**
```typescript
interface WorkflowRule {
  id: string;
  name: string;
  triggerCondition: string; // e.g., "invoice.status == 'overdue'"
  actions: WorkflowAction[];
  enabled: boolean; // Must be explicitly enabled
  scope: 'organization' | 'customer_group' | 'customer';
  scopeIds: string[]; // Empty for org-wide
  optInRequired: boolean;
  createdBy: string;
  enabledBy?: string;
  enabledAt?: Date;
}
```

---

### 1.7 Customer Statement Handling

**Flow:**
1. Statement generated manually by user
2. Previewed by staff (PDF shown in UI)
3. Emailed manually via "Send Statement" button

**Customer Receives:**
- Clean PDF only with date-filtered transactions
- Professional formatting

**Customer Must NOT Receive:**
- UI screenshots
- Internal notes or comments
- System metadata
- Draft watermarks

**Implementation:**
- Statement generation creates PDF snapshot
- Email send requires explicit button click
- PDF stored separately from internal views

---

### 1.8 Payments & Receipts

**Action:** Payment recorded against invoice.

**Email Rule:** ❌ **NO automatic email by default**

**Email Sent Only If:**
- User checks "Send payment receipt" during payment entry
- OR user manually clicks "Email Receipt" after recording

**Customer Receives:**
- Payment confirmation message
- Receipt PDF
- Updated outstanding balance

**Implementation:**
```typescript
async function recordPayment(data: PaymentData) {
  const payment = await db.insert(payments).values(data);
  
  // Update invoice outstanding
  await updateInvoiceBalance(data.invoiceId, data.amount);
  
  // Email ONLY if explicitly requested
  if (data.sendReceipt === true) {
    await createEmailTrigger({
      type: 'payment_receipt',
      paymentId: payment.id,
      recipients: data.recipients,
      sendMode: 'immediate',
      userId: data.createdBy
    });
  }
  
  return payment;
}
```

---

### 1.9 Client Portal

**Model:** Client portal is a separate channel for document access, not document delivery.

**When Portal Enabled for Customer:**
- ✅ Send one-time portal login email with credentials (if opt-in)
- Contains login link, username, password reset

**Portal Capabilities:**
- View invoices
- Download PDFs
- Make online payments
- View statements

**Email Role in Portal:**
- **Activity notifications only** (optional, configurable per-customer):
  - "New invoice available in portal"
  - "Payment confirmed"
  - Login alerts
- NOT used to push full document content (documents live in portal)

**Implementation:**
- Portal notifications are separate from transaction emails
- Must respect per-customer notification preferences
- Customer can toggle: "Email me when new documents are available"

---

### 1.10 Explicitly Forbidden Emails

Customers must **NEVER** receive emails for:

❌ Customer creation alerts  
❌ Internal field updates  
❌ Draft document changes  
❌ Internal notes or comments  
❌ Deleted record notifications  
❌ User activity logs  
❌ System health alerts  
❌ Backup confirmations  

**These are system/business events, not customer communications.**

---

## 2. Backend Data Models

### 2.1 Customer Extensions

```typescript
interface Customer {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive';
  
  // Email preferences
  emailOptInFlags: {
    documentEmails: boolean;        // Invoices, quotes, etc.
    reminderEmails: boolean;        // Overdue reminders
    marketingEmails: boolean;       // Newsletters (if applicable)
    portalNotifications: boolean;   // Portal activity alerts
  };
  
  preferredLanguage: string;  // 'en', 'es', etc.
  timezone: string;           // For scheduling
  
  // Audit
  createdAt: Date;
  updatedAt: Date;
}
```

### 2.2 Contact Person

```typescript
interface ContactPerson {
  id: string;
  customerId: string;
  
  // Identity
  name: string;
  email: string;
  phone?: string;
  
  // Role & Permissions
  role: 'owner' | 'billing' | 'finance' | 'accounting' | 'other';
  isPrimary: boolean;  // Primary contact for customer
  
  // Email Preferences
  receivesDocumentEmails: boolean;  // Opted in to receive invoices, quotes
  receivesReminderEmails: boolean;  // Opted in to receive overdue reminders
  unsubscribed: boolean;            // Global unsubscribe
  unsubscribedAt?: Date;
  
  // Audit
  createdAt: Date;
  updatedAt: Date;
}
```

### 2.3 Transaction (Invoice, Estimate, etc.)

```typescript
interface Transaction {
  id: string;
  type: 'invoice' | 'estimate' | 'sales_order' | 'credit_note';
  customerId: string;
  
  // Status
  status: 'draft' | 'sent' | 'viewed' | 'approved' | 'paid' | 'overdue' | 'void';
  isDraft: boolean;
  
  // Email Control
  autoEmailFlag: boolean;  // Used by recurring invoices only
  
  // Financial
  total: number;
  outstanding: number;
  
  // Audit
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### 2.4 Workflow Rule

```typescript
interface WorkflowRule {
  id: string;
  name: string;
  description: string;
  
  // Owner
  organizationId: string;
  createdBy: string;
  
  // Trigger
  triggerEvent: string; // 'invoice_overdue', 'payment_received', 'invoice_created'
  triggerConditions: Record<string, any>; // JSON conditions
  
  // Actions
  actions: WorkflowAction[];
  
  // State
  enabled: boolean;
  scope: 'organization' | 'customer_group' | 'customer';
  scopeIds: string[];  // Specific customer IDs or group IDs
  
  // Opt-In
  optInRequired: boolean;  // If true, customers must explicitly opt in
  
  // Audit
  enabledBy?: string;
  enabledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface WorkflowAction {
  type: 'send_email' | 'update_status' | 'create_task' | 'webhook';
  config: Record<string, any>;
  
  // Email-specific config
  templateId?: string;
  recipientSelection?: 'primary' | 'all_contacts' | 'role_based';
  includeAttachments?: boolean;
}
```

### 2.5 Email Trigger (Intent)

```typescript
interface EmailTrigger {
  id: string;
  
  // Source
  transactionId?: string;       // If triggered by transaction
  paymentId?: string;           // If triggered by payment
  statementId?: string;         // If triggered by statement
  workflowId?: string;          // If triggered by workflow
  userId?: string;              // If manually triggered by user
  
  // Recipients
  recipients: string[];         // Contact person IDs
  ccRecipients?: string[];
  bccRecipients?: string[];
  
  // Content
  templateId?: string;          // Email template
  customSubject?: string;
  customBody?: string;
  
  // Attachments
  includePdf: boolean;
  includePaymentLink: boolean;
  additionalAttachments?: string[];
  
  // Scheduling
  sendMode: 'immediate' | 'scheduled' | 'workflow';
  scheduledAt?: Date;
  
  // Metadata
  metadata: Record<string, any>;
  
  // Audit
  createdAt: Date;
}
```

### 2.6 Email Audit (Execution Record)

```typescript
interface EmailAudit {
  id: string;
  triggerId: string;  // Links to EmailTrigger
  
  // Recipients (resolved emails)
  to: string[];       // Actual email addresses
  cc: string[];
  bcc: string[];
  
  // Content Snapshot
  subject: string;
  bodyHash: string;          // SHA256 of email body
  attachments: {
    filename: string;
    contentHash: string;     // SHA256 of file content
    size: number;
  }[];
  
  // Delivery
  status: 'queued' | 'sent' | 'failed' | 'bounced' | 'unsubscribed';
  attempts: number;
  sentAt?: Date;
  errorMessage?: string;
  
  // Provider Response
  providerMessageId?: string;  // SendGrid/SES message ID
  providerResponse?: Record<string, any>;
  
  // Audit
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 3. API Endpoints

### 3.1 Manual Email Send

```typescript
/**
 * POST /api/transactions/:id/email
 * 
 * Manually send transaction email to selected recipients
 */
interface SendTransactionEmailRequest {
  recipients: string[];           // Contact person IDs (required)
  ccRecipients?: string[];        // Additional CC emails
  templateId?: string;            // Optional custom template
  customSubject?: string;
  customBody?: string;
  includePdf: boolean;            // Default true
  includePaymentLink?: boolean;   // For invoices only
  sendMode: 'immediate' | 'scheduled';
  scheduledAt?: string;           // ISO datetime if scheduled
}

interface SendTransactionEmailResponse {
  success: boolean;
  triggerId: string;
  auditId: string;
  queuedAt: string;
  estimatedSendAt: string;
  recipients: {
    contactId: string;
    email: string;
    name: string;
  }[];
}
```

**Validation Rules:**
- Transaction must not be in draft state
- At least one recipient required
- All recipient IDs must belong to the transaction's customer
- Recipients must not be unsubscribed
- Customer must be active

### 3.2 Email Preview

```typescript
/**
 * GET /api/transactions/:id/email/preview
 * 
 * Preview email before sending (renders template with transaction data)
 */
interface EmailPreviewRequest {
  templateId?: string;
  recipientId: string;  // To personalize for specific contact
}

interface EmailPreviewResponse {
  subject: string;
  bodyHtml: string;
  bodyText: string;
  attachments: {
    filename: string;
    size: number;
    type: string;
  }[];
}
```

### 3.3 Workflow Management

```typescript
/**
 * POST /api/workflows
 * Create new workflow rule
 */
interface CreateWorkflowRequest {
  name: string;
  description: string;
  triggerEvent: string;
  triggerConditions: Record<string, any>;
  actions: WorkflowAction[];
  scope: 'organization' | 'customer_group' | 'customer';
  scopeIds?: string[];
  optInRequired: boolean;
}

/**
 * POST /api/workflows/:id/enable
 * Enable a workflow (requires explicit action)
 */
interface EnableWorkflowRequest {
  confirmation: boolean;  // Must be true
  impactPreview?: boolean; // Show how many customers affected
}

interface EnableWorkflowResponse {
  enabled: boolean;
  enabledAt: string;
  enabledBy: string;
  impactedCustomers: number;
  warningMessage?: string;
}
```

### 3.4 Email Audit Query

```typescript
/**
 * GET /api/email-audit
 * Query email send history
 */
interface EmailAuditQuery {
  transactionId?: string;
  customerId?: string;
  startDate?: string;
  endDate?: string;
  status?: 'queued' | 'sent' | 'failed';
  limit?: number;
  offset?: number;
}

interface EmailAuditResponse {
  audits: EmailAudit[];
  total: number;
  page: number;
  pageSize: number;
}
```

---

## 4. Workflow Engine Design

### 4.1 Architecture

```
┌─────────────────┐
│  Transaction    │
│  Event Emitter  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Workflow       │
│  Evaluator      │ ──── Checks enabled workflows
└────────┬────────┘      matching event + conditions
         │
         ▼
┌─────────────────┐
│  Email Guard    │ ──── Validates send permission
│  Middleware     │      (opt-in, unsubscribed, etc.)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Email Trigger  │
│  Creator        │ ──── Creates EmailTrigger record
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Email Queue    │ ──── Processes and sends
│  Worker         │      Creates EmailAudit
└─────────────────┘
```

### 4.2 Workflow Evaluation Logic

```typescript
async function evaluateWorkflows(event: string, context: any) {
  // 1. Find all enabled workflows for this event
  const workflows = await db.query.workflowRules.findMany({
    where: and(
      eq(workflowRules.enabled, true),
      eq(workflowRules.triggerEvent, event)
    )
  });
  
  for (const workflow of workflows) {
    // 2. Check if conditions match
    if (!evaluateConditions(workflow.triggerConditions, context)) {
      continue;
    }
    
    // 3. Check scope (organization, customer group, specific customer)
    if (!isInScope(workflow, context.customerId)) {
      continue;
    }
    
    // 4. Process each action
    for (const action of workflow.actions) {
      if (action.type === 'send_email') {
        // Email action goes through guard middleware
        await processEmailAction(workflow, action, context);
      }
    }
  }
}
```

### 4.3 Example Workflow Rules

#### Overdue Invoice Reminder

```json
{
  "id": "wf_001",
  "name": "7-Day Overdue Invoice Reminder",
  "triggerEvent": "invoice_overdue_check",
  "triggerConditions": {
    "daysOverdue": { "$gte": 7 },
    "outstanding": { "$gt": 0 },
    "status": "overdue"
  },
  "actions": [
    {
      "type": "send_email",
      "config": {
        "templateId": "overdue_reminder_1",
        "recipientSelection": "primary",
        "includeAttachments": true,
        "includePaymentLink": true
      }
    }
  ],
  "enabled": true,
  "scope": "organization",
  "scopeIds": [],
  "optInRequired": true
}
```

#### Payment Thank You

```json
{
  "id": "wf_002",
  "name": "Payment Received Thank You",
  "triggerEvent": "payment_received",
  "triggerConditions": {
    "amount": { "$gt": 0 },
    "paymentMethod": { "$ne": "write_off" }
  },
  "actions": [
    {
      "type": "send_email",
      "config": {
        "templateId": "payment_thank_you",
        "recipientSelection": "primary",
        "includeAttachments": true
      }
    }
  ],
  "enabled": false,
  "scope": "customer_group",
  "scopeIds": ["premium_customers"],
  "optInRequired": false
}
```

---

## 5. Email Guard Middleware

### 5.1 Guard Checks (ALL must pass)

```typescript
async function emailGuardMiddleware(
  trigger: Partial<EmailTrigger>,
  context: any
): Promise<{ allowed: boolean; reason?: string }> {
  
  // 1. Check customer status
  const customer = await getCustomer(context.customerId);
  if (customer.status !== 'active') {
    return { allowed: false, reason: 'Customer inactive' };
  }
  
  // 2. Check transaction state
  if (context.transaction?.isDraft) {
    return { allowed: false, reason: 'Transaction is draft' };
  }
  
  // 3. Validate recipients exist and belong to customer
  const contacts = await getContactPersons(trigger.recipients);
  if (contacts.length === 0) {
    return { allowed: false, reason: 'No valid recipients' };
  }
  
  for (const contact of contacts) {
    if (contact.customerId !== context.customerId) {
      return { allowed: false, reason: 'Recipient not from customer' };
    }
    
    if (contact.unsubscribed) {
      return { allowed: false, reason: `Recipient ${contact.email} unsubscribed` };
    }
  }
  
  // 4. Check send policy
  const policy = await getSendPolicy(context.transaction.type);
  if (policy.requiresExplicitSend && !trigger.userId && !trigger.workflowId) {
    return { allowed: false, reason: 'Explicit send required' };
  }
  
  // 5. Check opt-in for workflow sends
  if (trigger.workflowId) {
    const workflow = await getWorkflow(trigger.workflowId);
    if (workflow.optInRequired) {
      const hasOptIn = await checkCustomerOptIn(customer.id, workflow.id);
      if (!hasOptIn) {
        return { allowed: false, reason: 'Customer not opted into workflow' };
      }
    }
  }
  
  // 6. Check rate limits
  const recentEmails = await getRecentEmails(customer.id, '24h');
  if (recentEmails.length >= MAX_EMAILS_PER_DAY) {
    return { allowed: false, reason: 'Rate limit exceeded' };
  }
  
  return { allowed: true };
}
```

### 5.2 Rate Limiting

**Per-Customer Limits:**
- Max 10 document emails per day
- Max 3 reminder emails per week
- Max 1 duplicate email within 1 hour

**Organization-Wide Limits:**
- Max 1000 emails per hour
- Max 10,000 emails per day
- Exponential backoff on provider errors

---

## 6. Role-Based Contact Selection

### 6.1 Contact Roles

```typescript
enum ContactRole {
  OWNER = 'owner',           // Business owner
  BILLING = 'billing',       // Billing contact
  FINANCE = 'finance',       // Finance/accounting
  ACCOUNTING = 'accounting', // Accountant
  OTHER = 'other'            // Generic contact
}
```

### 6.2 Recipient Selection UI

**Default Behavior:**
- Show primary contact selected by default
- Allow adding additional contacts via multiselect
- Display role badge next to each contact
- Show warning if contact is unsubscribed or missing email

**API Contract:**
```typescript
// Recipients must be explicitly listed (no implicit "all contacts")
{
  "recipients": ["cpt_abc123", "cpt_def456"],  // Explicit IDs only
  "recipientSelectionMode": "explicit"         // Never "all"
}
```

### 6.3 Template Personalization

Templates can reference contact properties:

```handlebars
Hi {{contact.name}},

{{#if contact.role === 'billing'}}
  Please review the attached invoice and process payment.
{{else}}
  Please find the attached invoice for your reference.
{{/if}}

Best regards,
{{organization.name}}
```

---

## 7. Audit & Compliance

### 7.1 Mandatory Audit Trail

**Every email send attempt must record:**

1. **Who triggered it:**
   - User ID (if manual)
   - Workflow ID (if automated)
   - System (if recurring)

2. **What was sent:**
   - Subject
   - Body hash (SHA256)
   - Attachment hashes
   - PDF snapshot stored

3. **To whom:**
   - Recipient contact IDs
   - Resolved email addresses
   - Delivery timestamps

4. **Transaction state:**
   - Transaction snapshot (JSON)
   - Status at send time
   - Outstanding amount

5. **Result:**
   - Success/failure
   - Provider message ID
   - Bounce/unsubscribe events

### 7.2 Consent & Unsubscribe

**Opt-In Levels:**
1. **Transactional emails** (invoices, receipts) – implicit with business relationship
2. **Reminder emails** – requires customer opt-in flag
3. **Marketing emails** – requires explicit double opt-in

**Unsubscribe Handling:**
- One-click unsubscribe link in every email footer
- Unsubscribe updates `ContactPerson.unsubscribed = true`
- Immediate effect – no additional emails sent
- Audit log records unsubscribe event

**Legal Compliance:**
- GDPR: Right to access email history, right to be forgotten
- CAN-SPAM: Physical address, clear sender identification, opt-out
- CASL (Canada): Implied vs express consent tracking

### 7.3 Data Retention

**Email Audit Records:**
- Retain for 7 years (financial/tax requirement)
- Body content may be archived after 1 year
- Metadata retained indefinitely

**PDF Attachments:**
- Stored with hash for deduplication
- Linked to transaction version
- Accessible via audit trail

---

## 8. Edge Cases & Error Handling

### 8.1 Common Edge Cases

#### Case 1: All Recipients Unsubscribed
**Scenario:** User tries to email invoice, but all contacts have unsubscribed.

**Handling:**
- Block send at API level
- Return error: "Cannot send: all recipients unsubscribed"
- Suggest adding new contact or manual communication

#### Case 2: Customer Email Changed Mid-Transaction
**Scenario:** Email address updated after invoice sent but before reminder.

**Handling:**
- Reminder uses current email address (not snapshot)
- Audit log shows email change event
- No automatic re-send to new address

#### Case 3: Transaction Voided After Email Sent
**Scenario:** Invoice emailed, then voided.

**Handling:**
- Original email remains in audit (historical record)
- No automatic "void notification" to customer
- Staff can manually send void notice if needed

#### Case 4: Workflow Enabled Mid-Cycle
**Scenario:** Admin enables overdue reminder workflow; some invoices already overdue.

**Handling:**
- Workflow evaluates on next scheduled run (e.g., daily)
- Does NOT backfill emails for past events
- Admin can manually send catch-up emails if desired

#### Case 5: Duplicate Email Send Request
**Scenario:** User clicks "Send" twice rapidly.

**Handling:**
- Use idempotency key (trigger ID + transaction ID hash)
- Second request returns existing trigger ID
- Only one email sent

### 8.2 Error Handling

**Provider Failures:**
- Exponential backoff: 1min, 5min, 15min, 1hr, 4hr
- After 5 attempts, mark as permanently failed
- Alert admin if failure rate > 5%

**Invalid Recipients:**
- Validate email format before queueing
- Block known invalid domains (e.g., example.com)
- Track bounce rates per domain

**Attachment Too Large:**
- Limit: 10MB total per email
- If exceeded, host PDF and send link instead
- Log as warning in audit

---

## 9. Implementation Checklist

### Phase 1: Core Email Infrastructure
- [ ] Create database tables (Customer, ContactPerson, EmailTrigger, EmailAudit)
- [ ] Implement Email Guard Middleware
- [ ] Build email queue worker (with retry logic)
- [ ] Set up email provider integration (SendGrid/SES)
- [ ] Create email templates

### Phase 2: Manual Send Flow
- [ ] API endpoint: POST /transactions/:id/email
- [ ] API endpoint: GET /transactions/:id/email/preview
- [ ] UI: Email compose dialog with recipient selector
- [ ] UI: Email preview modal
- [ ] Audit log viewer

### Phase 3: Workflow Engine
- [ ] Workflow rule data model
- [ ] Workflow evaluator service
- [ ] Scheduled job runner (cron)
- [ ] UI: Workflow builder
- [ ] UI: Workflow enable/disable with confirmation

### Phase 4: Advanced Features
- [ ] Rate limiting per customer
- [ ] Unsubscribe handling
- [ ] Bounce tracking
- [ ] Email analytics (open rates, click rates)
- [ ] A/B testing for templates

### Phase 5: Testing & Compliance
- [ ] Unit tests for Email Guard
- [ ] Integration tests for workflows
- [ ] Load testing email queue
- [ ] GDPR compliance audit
- [ ] CAN-SPAM compliance audit

---

## 10. Testing Strategy

### 10.1 Unit Tests

```typescript
describe('Email Guard Middleware', () => {
  test('blocks email to inactive customer', async () => {
    const result = await emailGuardMiddleware(trigger, { customerId: 'inactive_customer' });
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('Customer inactive');
  });
  
  test('blocks email to unsubscribed contact', async () => {
    const result = await emailGuardMiddleware(trigger, { 
      customerId: 'cust_001',
      recipients: ['unsubscribed_contact']
    });
    expect(result.allowed).toBe(false);
  });
  
  test('allows email with valid recipients and active customer', async () => {
    const result = await emailGuardMiddleware(trigger, {
      customerId: 'active_customer',
      recipients: ['valid_contact'],
      transaction: { isDraft: false }
    });
    expect(result.allowed).toBe(true);
  });
});
```

### 10.2 Integration Tests

```typescript
describe('Transaction Email Send', () => {
  test('manual send creates trigger and audit records', async () => {
    const response = await request(app)
      .post('/api/transactions/inv_001/email')
      .send({
        recipients: ['cpt_001'],
        includePdf: true,
        sendMode: 'immediate'
      });
    
    expect(response.status).toBe(200);
    expect(response.body.triggerId).toBeDefined();
    
    const trigger = await db.query.emailTriggers.findFirst({
      where: eq(emailTriggers.id, response.body.triggerId)
    });
    expect(trigger).toBeDefined();
    expect(trigger.recipients).toEqual(['cpt_001']);
  });
});
```

### 10.3 End-to-End Tests

```typescript
describe('Workflow-Based Email', () => {
  test('overdue workflow sends reminder after 7 days', async () => {
    // 1. Create invoice
    const invoice = await createInvoice({ dueDate: '2026-01-01' });
    
    // 2. Enable workflow
    await enableWorkflow('overdue_reminder_7day');
    
    // 3. Simulate time passing (mock date)
    mockDate('2026-01-08');
    
    // 4. Trigger workflow evaluation
    await runWorkflowEvaluator();
    
    // 5. Verify email sent
    const audit = await db.query.emailAudits.findFirst({
      where: eq(emailAudits.transactionId, invoice.id)
    });
    expect(audit).toBeDefined();
    expect(audit.status).toBe('sent');
  });
});
```

### 10.4 Manual QA Checklist

- [ ] Create customer → verify no email sent
- [ ] Update customer email → verify no customer email
- [ ] Create invoice in draft → verify no email
- [ ] Send invoice manually → verify email received with PDF
- [ ] Enable workflow → verify confirmation dialog
- [ ] Unsubscribe contact → verify blocked from receiving emails
- [ ] Test rate limiting → send 11 emails in a day, verify 11th blocked
- [ ] Test duplicate send → click send twice, verify single email

---

## 📊 Sequence Diagrams

See `EMAIL_SYSTEM_SEQUENCES.md` for detailed sequence diagrams covering:
1. Manual Transaction Email Send
2. Workflow-Triggered Email
3. Unsubscribe Flow
4. Email Audit Query

---

## 🚀 Summary

This design ensures:
- ✅ No accidental customer emails
- ✅ All customer communications are intentional and audited
- ✅ Clear separation of internal events vs customer transactions
- ✅ Opt-in automation with explicit enable steps
- ✅ Legal compliance (GDPR, CAN-SPAM, CASL)
- ✅ Full audit trail for every email
- ✅ Rate limiting and error handling
- ✅ Unsubscribe support

**Default principle:** When in doubt, DO NOT send email. Customer communications must be explicit.

---

**Next Steps:**
1. Review and approve design
2. Create database migration
3. Implement Email Guard Middleware
4. Build API endpoints
5. Create UI components
6. Test thoroughly before production deployment

