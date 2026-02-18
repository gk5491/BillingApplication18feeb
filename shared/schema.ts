import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, decimal, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const UserRole = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  CUSTOMER: "customer",
  VENDOR: "vendor",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default(UserRole.CUSTOMER),
  name: text("name"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
  name: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Banking Schema
export const bankAccounts = pgTable("bank_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  accountType: text("account_type", { enum: ["bank", "credit_card"] }).notNull(),
  accountName: text("account_name").notNull(),
  accountCode: text("account_code"),
  currency: text("currency").notNull().default("INR"),
  accountNumber: text("account_number"),
  bankName: text("bank_name"),
  ifsc: text("ifsc"),
  description: text("description"),
  isPrimary: boolean("is_primary").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBankAccountSchema = createInsertSchema(bankAccounts).omit({
  id: true,
  createdAt: true,
});

export type InsertBankAccount = z.infer<typeof insertBankAccountSchema>;
export type BankAccount = typeof bankAccounts.$inferSelect;

// Transactions Schema
export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: text("date").notNull(),
  withdrawals: decimal("withdrawals", { precision: 12, scale: 2 }).notNull().default("0.00"),
  deposits: decimal("deposits", { precision: 12, scale: 2 }).notNull().default("0.00"),
  payee: text("payee"),
  description: text("description"),
  referenceNumber: text("reference_number"),
  status: text("status").notNull().default("Uncategorized"),
  organizationId: varchar("organization_id").notNull().default("1"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

// Organization Branding Schema
export const organizationBrandingSchema = z.object({
  id: z.string().default("default"),
  logo: z.object({
    url: z.string().nullable().optional(),
    fileName: z.string().optional(),
    uploadedAt: z.string().optional(),
    fileSize: z.number().optional(),
  }).nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type OrganizationBranding = z.infer<typeof organizationBrandingSchema>;

// Organization Schema
export const organizationSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().optional(),
  website: z.string().optional(),
  industry: z.string(),
  location: z.string(),
  state: z.string().optional(),
  street1: z.string().optional(),
  street2: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  currency: z.string().optional().default("INR"),
  language: z.string().optional().default("English"),
  timezone: z.string().optional(),
  gstRegistered: z.boolean().optional().default(false),
  gstin: z.string().optional(),
  note: z.string().optional(),
  createdAt: z.string(),
});

export type Organization = z.infer<typeof organizationSchema>;

// Email Logs and Preferences
export const emailLogSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  transactionId: z.string().optional(), // Invoice, Estimate, etc.
  transactionType: z.string().optional(),
  type: z.enum(["manual", "automated", "workflow"]),
  status: z.enum(["queued", "sent", "failed"]),
  errorMessage: z.string().optional(),
  subject: z.string(),
  body: z.string(),
  sentAt: z.string(),
  recipient: z.string(),
  attachments: z.array(z.string()).optional(),
});

export type EmailLog = z.infer<typeof emailLogSchema>;

export const customerCommunicationPreferencesSchema = z.object({
  invoiceReminders: z.boolean().default(false),
  recurringInvoiceAutoEmail: z.boolean().default(false),
  paymentReceipts: z.boolean().default(false),
  portalNotifications: z.boolean().default(false),
});

export type CustomerCommunicationPreferences = z.infer<typeof customerCommunicationPreferencesSchema>;
