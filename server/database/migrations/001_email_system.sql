-- Migration: Customer Lifecycle Email System
-- Version: 1.0
-- Date: 2026-01-06
-- Description: Creates tables for transaction-driven email system with opt-in automation

-- =====================================================
-- 1. Customer Email Preferences Extension
-- =====================================================

-- Add email preference columns to customers table
ALTER TABLE customers ADD COLUMN IF NOT EXISTS email_opt_in_document_emails BOOLEAN DEFAULT true;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS email_opt_in_reminder_emails BOOLEAN DEFAULT true;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS email_opt_in_marketing_emails BOOLEAN DEFAULT false;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS email_opt_in_portal_notifications BOOLEAN DEFAULT true;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(10) DEFAULT 'en';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'UTC';

-- Create index for active customers (used in email guard checks)
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);

-- =====================================================
-- 2. Contact Persons Table
-- =====================================================

CREATE TABLE IF NOT EXISTS contact_persons (
  id VARCHAR(36) PRIMARY KEY DEFAULT (uuid()),
  customer_id VARCHAR(36) NOT NULL,
  
  -- Identity
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  
  -- Role & Status
  role VARCHAR(50) NOT NULL DEFAULT 'other', -- owner, billing, finance, accounting, other
  is_primary BOOLEAN DEFAULT false,
  
  -- Email Preferences
  receives_document_emails BOOLEAN DEFAULT true,
  receives_reminder_emails BOOLEAN DEFAULT true,
  unsubscribed BOOLEAN DEFAULT false,
  unsubscribed_at TIMESTAMP,
  unsubscribe_reason TEXT,
  
  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_contact_persons_customer ON contact_persons(customer_id);
CREATE INDEX idx_contact_persons_email ON contact_persons(email);
CREATE INDEX idx_contact_persons_primary ON contact_persons(customer_id, is_primary);
CREATE INDEX idx_contact_persons_unsubscribed ON contact_persons(unsubscribed);

-- =====================================================
-- 3. Transaction Email Control
-- =====================================================

-- Add email control columns to transactions (invoices, estimates, etc.)
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS auto_email_flag BOOLEAN DEFAULT false;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS is_draft BOOLEAN DEFAULT true;

-- Same for other transaction types
ALTER TABLE estimates ADD COLUMN IF NOT EXISTS auto_email_flag BOOLEAN DEFAULT false;
ALTER TABLE estimates ADD COLUMN IF NOT EXISTS is_draft BOOLEAN DEFAULT true;

ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS auto_email_flag BOOLEAN DEFAULT false;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS is_draft BOOLEAN DEFAULT true;

ALTER TABLE credit_notes ADD COLUMN IF NOT EXISTS auto_email_flag BOOLEAN DEFAULT false;
ALTER TABLE credit_notes ADD COLUMN IF NOT EXISTS is_draft BOOLEAN DEFAULT true;

-- =====================================================
-- 4. Workflow Rules Table
-- =====================================================

CREATE TABLE IF NOT EXISTS workflow_rules (
  id VARCHAR(36) PRIMARY KEY DEFAULT (uuid()),
  
  -- Metadata
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Owner
  organization_id VARCHAR(36) NOT NULL,
  created_by VARCHAR(36) NOT NULL,
  
  -- Trigger Configuration
  trigger_event VARCHAR(100) NOT NULL, -- invoice_created, invoice_overdue, payment_received, etc.
  trigger_conditions JSON, -- JSON object with condition expressions
  
  -- Actions
  actions JSON NOT NULL, -- Array of action objects
  
  -- State
  enabled BOOLEAN DEFAULT false,
  scope VARCHAR(50) DEFAULT 'organization', -- organization, customer_group, customer
  scope_ids JSON, -- Array of customer IDs or group IDs
  
  -- Opt-In Control
  opt_in_required BOOLEAN DEFAULT true,
  
  -- Audit
  enabled_by VARCHAR(36),
  enabled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (enabled_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX idx_workflow_rules_org ON workflow_rules(organization_id);
CREATE INDEX idx_workflow_rules_enabled ON workflow_rules(enabled);
CREATE INDEX idx_workflow_rules_trigger_event ON workflow_rules(trigger_event);

-- =====================================================
-- 5. Customer Workflow Opt-Ins
-- =====================================================

CREATE TABLE IF NOT EXISTS customer_workflow_opt_ins (
  id VARCHAR(36) PRIMARY KEY DEFAULT (uuid()),
  customer_id VARCHAR(36) NOT NULL,
  workflow_id VARCHAR(36) NOT NULL,
  opted_in BOOLEAN DEFAULT false,
  opted_in_at TIMESTAMP,
  opted_in_by VARCHAR(36), -- user who opted customer in
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (workflow_id) REFERENCES workflow_rules(id) ON DELETE CASCADE,
  FOREIGN KEY (opted_in_by) REFERENCES users(id) ON DELETE SET NULL,
  
  UNIQUE KEY unique_customer_workflow (customer_id, workflow_id)
);

-- Indexes
CREATE INDEX idx_workflow_opt_ins_customer ON customer_workflow_opt_ins(customer_id);
CREATE INDEX idx_workflow_opt_ins_workflow ON customer_workflow_opt_ins(workflow_id);

-- =====================================================
-- 6. Email Triggers Table
-- =====================================================

CREATE TABLE IF NOT EXISTS email_triggers (
  id VARCHAR(36) PRIMARY KEY DEFAULT (uuid()),
  
  -- Source (one of these will be set)
  transaction_type VARCHAR(50), -- invoice, estimate, sales_order, credit_note, payment
  transaction_id VARCHAR(36),
  payment_id VARCHAR(36),
  statement_id VARCHAR(36),
  workflow_id VARCHAR(36),
  user_id VARCHAR(36), -- User who manually triggered
  
  -- Customer Context
  customer_id VARCHAR(36) NOT NULL,
  
  -- Recipients (stored as JSON arrays of contact_person IDs)
  recipients JSON NOT NULL,
  cc_recipients JSON,
  bcc_recipients JSON,
  
  -- Content Configuration
  template_id VARCHAR(100),
  custom_subject TEXT,
  custom_body TEXT,
  
  -- Attachments
  include_pdf BOOLEAN DEFAULT true,
  include_payment_link BOOLEAN DEFAULT false,
  additional_attachments JSON, -- Array of file paths
  
  -- Scheduling
  send_mode VARCHAR(50) NOT NULL DEFAULT 'immediate', -- immediate, scheduled, workflow
  scheduled_at TIMESTAMP,
  
  -- Metadata
  metadata JSON,
  
  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (workflow_id) REFERENCES workflow_rules(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX idx_email_triggers_customer ON email_triggers(customer_id);
CREATE INDEX idx_email_triggers_transaction ON email_triggers(transaction_type, transaction_id);
CREATE INDEX idx_email_triggers_workflow ON email_triggers(workflow_id);
CREATE INDEX idx_email_triggers_send_mode ON email_triggers(send_mode, scheduled_at);
CREATE INDEX idx_email_triggers_created ON email_triggers(created_at);

-- =====================================================
-- 7. Email Audit Table
-- =====================================================

CREATE TABLE IF NOT EXISTS email_audits (
  id VARCHAR(36) PRIMARY KEY DEFAULT (uuid()),
  trigger_id VARCHAR(36) NOT NULL,
  
  -- Resolved Recipients (actual email addresses)
  to_addresses JSON NOT NULL, -- Array of email addresses
  cc_addresses JSON,
  bcc_addresses JSON,
  
  -- Content Snapshot
  subject VARCHAR(500) NOT NULL,
  body_hash VARCHAR(64) NOT NULL, -- SHA256 of email body
  attachments JSON, -- Array of {filename, content_hash, size}
  
  -- Delivery Status
  status VARCHAR(50) NOT NULL DEFAULT 'queued', -- queued, sent, failed, bounced, unsubscribed
  attempts INT DEFAULT 0,
  sent_at TIMESTAMP,
  error_message TEXT,
  
  -- Provider Response
  provider_message_id VARCHAR(255),
  provider_response JSON,
  
  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (trigger_id) REFERENCES email_triggers(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_email_audits_trigger ON email_audits(trigger_id);
CREATE INDEX idx_email_audits_status ON email_audits(status);
CREATE INDEX idx_email_audits_sent_at ON email_audits(sent_at);
CREATE INDEX idx_email_audits_to_addresses ON email_audits((CAST(to_addresses AS CHAR(500))));

-- =====================================================
-- 8. Email Templates Table
-- =====================================================

CREATE TABLE IF NOT EXISTS email_templates (
  id VARCHAR(36) PRIMARY KEY DEFAULT (uuid()),
  
  -- Metadata
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100), -- invoice, receipt, reminder, statement, etc.
  
  -- Template Content
  subject_template TEXT NOT NULL,
  body_html_template TEXT NOT NULL,
  body_text_template TEXT,
  
  -- Configuration
  language VARCHAR(10) DEFAULT 'en',
  organization_id VARCHAR(36),
  is_default BOOLEAN DEFAULT false,
  
  -- Audit
  created_by VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX idx_email_templates_org ON email_templates(organization_id);
CREATE INDEX idx_email_templates_category ON email_templates(category);
CREATE INDEX idx_email_templates_default ON email_templates(is_default);

-- =====================================================
-- 9. Email Rate Limits Table
-- =====================================================

CREATE TABLE IF NOT EXISTS email_rate_limits (
  id VARCHAR(36) PRIMARY KEY DEFAULT (uuid()),
  customer_id VARCHAR(36) NOT NULL,
  
  -- Time Window
  window_start TIMESTAMP NOT NULL,
  window_end TIMESTAMP NOT NULL,
  
  -- Counts by Type
  document_emails_sent INT DEFAULT 0,
  reminder_emails_sent INT DEFAULT 0,
  total_emails_sent INT DEFAULT 0,
  
  -- Limits (configurable per customer)
  max_document_emails INT DEFAULT 10,
  max_reminder_emails INT DEFAULT 3,
  max_total_emails INT DEFAULT 15,
  
  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  
  UNIQUE KEY unique_customer_window (customer_id, window_start)
);

-- Indexes
CREATE INDEX idx_rate_limits_customer ON email_rate_limits(customer_id);
CREATE INDEX idx_rate_limits_window ON email_rate_limits(window_start, window_end);

-- =====================================================
-- 10. Email Bounce & Unsubscribe Events
-- =====================================================

CREATE TABLE IF NOT EXISTS email_events (
  id VARCHAR(36) PRIMARY KEY DEFAULT (uuid()),
  audit_id VARCHAR(36),
  
  -- Event Details
  event_type VARCHAR(50) NOT NULL, -- bounce, complaint, unsubscribe, open, click
  email_address VARCHAR(255) NOT NULL,
  
  -- Bounce Details
  bounce_type VARCHAR(50), -- hard, soft, complaint
  bounce_reason TEXT,
  
  -- Provider Data
  provider_event_id VARCHAR(255),
  provider_data JSON,
  
  -- Timestamp
  occurred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (audit_id) REFERENCES email_audits(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX idx_email_events_audit ON email_events(audit_id);
CREATE INDEX idx_email_events_type ON email_events(event_type);
CREATE INDEX idx_email_events_email ON email_events(email_address);
CREATE INDEX idx_email_events_occurred ON email_events(occurred_at);

-- =====================================================
-- 11. Insert Default Email Templates
-- =====================================================

INSERT INTO email_templates (id, name, description, category, subject_template, body_html_template, body_text_template, is_default)
VALUES 
(
  'tpl_invoice_default',
  'Default Invoice Email',
  'Standard invoice email template',
  'invoice',
  'Invoice {{invoice.number}} from {{organization.name}}',
  '<p>Hi {{contact.name}},</p><p>Please find attached invoice {{invoice.number}} for {{invoice.total_formatted}}.</p><p>Due date: {{invoice.due_date_formatted}}</p><p>{{#if payment_link}}You can pay online: <a href="{{payment_link}}">Pay Now</a>{{/if}}</p><p>Thank you for your business!</p><p>{{organization.name}}</p>',
  'Hi {{contact.name}},\n\nPlease find attached invoice {{invoice.number}} for {{invoice.total_formatted}}.\n\nDue date: {{invoice.due_date_formatted}}\n\nThank you for your business!\n\n{{organization.name}}',
  true
),
(
  'tpl_payment_receipt',
  'Payment Receipt',
  'Payment confirmation email',
  'receipt',
  'Payment Receipt - {{payment.reference}}',
  '<p>Hi {{contact.name}},</p><p>Thank you for your payment of {{payment.amount_formatted}}.</p><p>Payment method: {{payment.method}}</p><p>Reference: {{payment.reference}}</p><p>Please find attached receipt for your records.</p><p>{{organization.name}}</p>',
  'Hi {{contact.name}},\n\nThank you for your payment of {{payment.amount_formatted}}.\n\nPayment method: {{payment.method}}\nReference: {{payment.reference}}\n\nPlease find attached receipt for your records.\n\n{{organization.name}}',
  true
),
(
  'tpl_overdue_reminder',
  'Overdue Invoice Reminder',
  'Reminder for overdue invoices',
  'reminder',
  'Reminder: Invoice {{invoice.number}} is overdue',
  '<p>Hi {{contact.name}},</p><p>This is a friendly reminder that invoice {{invoice.number}} for {{invoice.outstanding_formatted}} is now {{invoice.days_overdue}} days overdue.</p><p>Original due date: {{invoice.due_date_formatted}}</p><p>{{#if payment_link}}<a href="{{payment_link}}">Pay Now</a>{{/if}}</p><p>If you have already made payment, please disregard this notice.</p><p>{{organization.name}}</p>',
  'Hi {{contact.name}},\n\nThis is a friendly reminder that invoice {{invoice.number}} for {{invoice.outstanding_formatted}} is now {{invoice.days_overdue}} days overdue.\n\nOriginal due date: {{invoice.due_date_formatted}}\n\nIf you have already made payment, please disregard this notice.\n\n{{organization.name}}',
  true
);

-- =====================================================
-- 12. Default Workflow Rules (Disabled by Default)
-- =====================================================

-- Note: These are created as examples but remain DISABLED until explicitly enabled by admin

INSERT INTO workflow_rules (id, name, description, organization_id, created_by, trigger_event, trigger_conditions, actions, enabled, scope, opt_in_required)
SELECT 
  'wf_overdue_7day',
  '7-Day Overdue Reminder',
  'Send reminder 7 days after invoice due date',
  o.id,
  'system',
  'invoice_overdue_check',
  JSON_OBJECT('daysOverdue', JSON_OBJECT('$gte', 7), 'outstanding', JSON_OBJECT('$gt', 0), 'status', 'overdue'),
  JSON_ARRAY(
    JSON_OBJECT(
      'type', 'send_email',
      'config', JSON_OBJECT(
        'templateId', 'tpl_overdue_reminder',
        'recipientSelection', 'primary',
        'includeAttachments', true,
        'includePaymentLink', true
      )
    )
  ),
  false, -- DISABLED by default
  'organization',
  true
FROM organizations o
LIMIT 1;

-- =====================================================
-- 13. Create Views for Reporting
-- =====================================================

-- View: Email Activity Summary
CREATE OR REPLACE VIEW v_email_activity_summary AS
SELECT 
  DATE(ea.created_at) as activity_date,
  c.id as customer_id,
  c.name as customer_name,
  COUNT(*) as total_emails,
  SUM(CASE WHEN ea.status = 'sent' THEN 1 ELSE 0 END) as emails_sent,
  SUM(CASE WHEN ea.status = 'failed' THEN 1 ELSE 0 END) as emails_failed,
  SUM(CASE WHEN ea.status = 'bounced' THEN 1 ELSE 0 END) as emails_bounced
FROM email_audits ea
JOIN email_triggers et ON ea.trigger_id = et.id
JOIN customers c ON et.customer_id = c.id
GROUP BY DATE(ea.created_at), c.id, c.name;

-- View: Customer Email Preferences
CREATE OR REPLACE VIEW v_customer_email_preferences AS
SELECT 
  c.id as customer_id,
  c.name as customer_name,
  c.email as customer_email,
  c.status as customer_status,
  c.email_opt_in_document_emails,
  c.email_opt_in_reminder_emails,
  c.email_opt_in_marketing_emails,
  c.email_opt_in_portal_notifications,
  COUNT(cp.id) as total_contacts,
  SUM(CASE WHEN cp.unsubscribed = false THEN 1 ELSE 0 END) as active_contacts
FROM customers c
LEFT JOIN contact_persons cp ON c.id = cp.customer_id
GROUP BY c.id;

-- =====================================================
-- End of Migration
-- =====================================================

-- Grant permissions (adjust based on your user setup)
-- GRANT SELECT, INSERT, UPDATE ON email_triggers TO 'billing_app_user'@'%';
-- GRANT SELECT, INSERT, UPDATE ON email_audits TO 'billing_app_user'@'%';
-- GRANT SELECT ON email_templates TO 'billing_app_user'@'%';
