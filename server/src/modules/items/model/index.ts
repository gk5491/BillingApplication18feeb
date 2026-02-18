import { pgTable, text, numeric, boolean, timestamp, varchar } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const items = pgTable('items', {
  id: text('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  type: varchar('type', { length: 20 }).notNull().default('goods'),
  sku: varchar('sku', { length: 50 }),
  hsnSac: varchar('hsn_sac', { length: 20 }),
  unit: varchar('unit', { length: 20 }),
  sellingPrice: numeric('selling_price', { precision: 18, scale: 2 }).notNull().default('0'),
  purchasePrice: numeric('purchase_price', { precision: 18, scale: 2 }).notNull().default('0'),
  taxRate: numeric('tax_rate', { precision: 5, scale: 2 }),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const insertItemSchema = createInsertSchema(items);
export const selectItemSchema = createSelectSchema(items);

export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;
