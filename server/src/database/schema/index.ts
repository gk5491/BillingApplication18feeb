export * from '../../modules/items/model';

import { pgTable, text, varchar, numeric, boolean, timestamp, integer, jsonb } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: text('password').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull().default('viewer'),
  phone: varchar('phone', { length: 20 }),
  avatar: text('avatar'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const customers = pgTable('customers', {
  id: text('id').primaryKey(),
  displayName: varchar('display_name', { length: 255 }).notNull(),
  companyName: varchar('company_name', { length: 255 }),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 20 }),
  gst: varchar('gst', { length: 15 }),
  pan: varchar('pan', { length: 10 }),
  billingAddress: jsonb('billing_address'),
  shippingAddress: jsonb('shipping_address'),
  creditLimit: numeric('credit_limit', { precision: 18, scale: 2 }),
  paymentTerms: integer('payment_terms'),
  notes: text('notes'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const vendors = pgTable('vendors', {
  id: text('id').primaryKey(),
  displayName: varchar('display_name', { length: 255 }).notNull(),
  companyName: varchar('company_name', { length: 255 }),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 20 }),
  gst: varchar('gst', { length: 15 }),
  pan: varchar('pan', { length: 10 }),
  billingAddress: jsonb('billing_address'),
  paymentTerms: integer('payment_terms'),
  notes: text('notes'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const invoices = pgTable('invoices', {
  id: text('id').primaryKey(),
  invoiceNumber: varchar('invoice_number', { length: 50 }).notNull().unique(),
  customerId: text('customer_id').notNull(),
  invoiceDate: timestamp('invoice_date').notNull(),
  dueDate: timestamp('due_date').notNull(),
  status: varchar('status', { length: 50 }).notNull().default('draft'),
  subtotal: numeric('subtotal', { precision: 18, scale: 2 }).notNull().default('0'),
  discountTotal: numeric('discount_total', { precision: 18, scale: 2 }).notNull().default('0'),
  taxTotal: numeric('tax_total', { precision: 18, scale: 2 }).notNull().default('0'),
  total: numeric('total', { precision: 18, scale: 2 }).notNull().default('0'),
  amountPaid: numeric('amount_paid', { precision: 18, scale: 2 }).notNull().default('0'),
  balance: numeric('balance', { precision: 18, scale: 2 }).notNull().default('0'),
  notes: text('notes'),
  terms: text('terms'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const invoiceLineItems = pgTable('invoice_line_items', {
  id: text('id').primaryKey(),
  invoiceId: text('invoice_id').notNull(),
  itemId: text('item_id'),
  itemName: varchar('item_name', { length: 255 }).notNull(),
  description: text('description'),
  quantity: numeric('quantity', { precision: 18, scale: 4 }).notNull(),
  rate: numeric('rate', { precision: 18, scale: 2 }).notNull(),
  discount: numeric('discount', { precision: 18, scale: 2 }),
  taxRate: numeric('tax_rate', { precision: 5, scale: 2 }),
  amount: numeric('amount', { precision: 18, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const expenses = pgTable('expenses', {
  id: text('id').primaryKey(),
  date: timestamp('date').notNull(),
  category: varchar('category', { length: 100 }).notNull(),
  vendorId: text('vendor_id'),
  amount: numeric('amount', { precision: 18, scale: 2 }).notNull(),
  taxAmount: numeric('tax_amount', { precision: 18, scale: 2 }),
  notes: text('notes'),
  receiptUrl: text('receipt_url'),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const bankAccounts = pgTable('bank_accounts', {
  id: text('id').primaryKey(),
  accountName: varchar('account_name', { length: 255 }).notNull(),
  accountNumber: varchar('account_number', { length: 50 }).notNull(),
  bankName: varchar('bank_name', { length: 255 }).notNull(),
  ifscCode: varchar('ifsc_code', { length: 11 }),
  accountType: varchar('account_type', { length: 50 }).notNull(),
  balance: numeric('balance', { precision: 18, scale: 2 }).notNull().default('0'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const emailAudits = pgTable('email_audits', {
  id: text('id').primaryKey(),
  transactionType: varchar('transaction_type', { length: 50 }).notNull(),
  transactionId: text('transaction_id').notNull(),
  customerId: text('customer_id').notNull(),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  toAddresses: text('to_addresses').notNull(),
  ccAddresses: text('cc_addresses'),
  bccAddresses: text('bcc_addresses'),
  subject: varchar('subject', { length: 255 }).notNull(),
  bodyHtml: text('body_html').notNull(),
  bodyText: text('body_text').notNull(),
  sentAt: timestamp('sent_at'),
  errorMessage: text('error_message'),
  providerMessageId: varchar('provider_message_id', { length: 255 }),
  providerResponse: text('provider_response'),
  attempts: integer('attempts').notNull().default(0),
  userId: text('user_id'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
