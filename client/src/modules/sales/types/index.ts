import { BaseEntity } from '@/shared/types';

export interface InvoiceLineItem {
  itemId: string;
  itemName: string;
  description?: string;
  quantity: number;
  rate: number;
  discount?: number;
  taxRate?: number;
  amount: number;
}

export interface Invoice extends BaseEntity {
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  invoiceDate: string;
  dueDate: string;
  status: 'draft' | 'sent' | 'viewed' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled';
  lineItems: InvoiceLineItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
  amountPaid: number;
  balance: number;
  notes?: string;
  terms?: string;
}

export interface CreateInvoiceDto {
  customerId: string;
  invoiceDate: string;
  dueDate: string;
  lineItems: Omit<InvoiceLineItem, 'amount'>[];
  notes?: string;
  terms?: string;
}

export interface Estimate extends BaseEntity {
  estimateNumber: string;
  customerId: string;
  customerName: string;
  estimateDate: string;
  expiryDate: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'converted';
  lineItems: InvoiceLineItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
  notes?: string;
  terms?: string;
}
