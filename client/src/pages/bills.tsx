import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { PurchasePDFHeader } from "@/components/purchase-pdf-header";
import { Organization } from "@shared/schema";
import { useOrganization } from "@/context/OrganizationContext";
import {
  Plus,
  Search,
  ChevronDown,
  MoreHorizontal,
  Pencil,
  Trash2,
  X,
  Mail,
  FileText,
  Printer,
  Filter,
  Download,
  Eye,
  Check,
  List,
  Grid3X3,
  CreditCard,
  Copy,
  Clock,
  BookOpen,
  Ban,
  Upload,
  RefreshCw,
  Lightbulb,
  ArrowUpDown
} from "lucide-react";
import { transformExpenseListForExcel, exportToExcel, transformBillListForExcel } from "@/lib/excel-utils";
import { robustIframePrint } from "@/lib/robust-print";
import { generatePDFFromElement } from "@/lib/pdf-utils";
import { Button } from "@/components/ui/button";
import { usePagination } from "@/hooks/use-pagination";
import { TablePagination } from "@/components/table-pagination";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";


interface BillItem {
  id: string;
  itemName: string;
  name?: string;
  description?: string;
  account: string;
  quantity: number;
  rate: number;
  tax?: string;
  taxAmount?: number;
  customerDetails?: string;
  amount: number;
}

interface JournalEntry {
  account: string;
  debit: number;
  credit: number;
}

interface ActivityLog {
  id: string;
  timestamp: string;
  action: string;
  description: string;
  user: string;
}

interface Bill {
  id: string;
  billNumber: string;
  orderNumber?: string;
  vendorId: string;
  vendorName: string;
  vendorEmail?: string;
  vendorUnusedCredits?: number;
  vendorAddress?: {
    street1?: string;
    street2?: string;
    city?: string;
    state?: string;
    pinCode?: string;
    country?: string;
    gstin?: string;
  };
  billDate: string;
  dueDate: string;
  paymentTerms: string;
  reverseCharge?: boolean;
  subject?: string;
  items: BillItem[];
  subTotal: number;
  discountType?: string;
  discountValue?: number;
  discountAmount?: number;
  taxType?: string;
  taxCategory?: string;
  taxAmount?: number;
  adjustment?: number;
  adjustmentDescription?: string;
  total: number;
  amountPaid: number;
  balanceDue: number;
  notes?: string;
  attachments?: string[];
  status: string;
  pdfTemplate?: string;
  journalEntries?: JournalEntry[];
  createdAt?: string;
  updatedAt?: string;
  activityLogs?: ActivityLog[];
  creditsApplied?: Array<{
    creditId: string;
    creditNumber: string;
    amount: number;
    appliedDate: string;
  }>;
  paymentsRecorded?: Array<{
    paymentId: string;
    paymentNumber?: string;
    amount: number;
    date: string;
    mode?: string;
  }>;
  paymentsMadeApplied?: Array<{
    paymentId: string;
    paymentNumber?: string;
    amount: number;
    date: string;
    mode?: string;
    reference?: string;
    paidThrough?: string;
  }>;
}

interface VendorCredit {
  id: string;
  creditNumber: string;
  vendorId: string;
  date: string;
  amount: number;
  balance: number;
  status: string;
}

function getPaymentStatus(bill: Bill): string {
  if (bill.balanceDue === 0 && bill.total > 0) {
    return "PAID";
  } else if (bill.balanceDue > 0 && bill.balanceDue < bill.total) {
    return "PARTIALLY PAID";
  } else if (bill.status === "VOID") {
    return "VOID";
  } else if (bill.status === "OVERDUE") {
    return "OVERDUE";
  }
  return bill.status || "OPEN";
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateString: string): string {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function BillPDFView({ bill, branding, organization }: { bill: Bill; branding?: any; organization?: Organization }) {
  const paymentStatus = getPaymentStatus(bill);

  return (
    <div id="bill-pdf-content" className="bg-white" style={{
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      color: '#0f172a',
      margin: '0',
      minHeight: '296mm',
      width: '100%',
      maxWidth: '210mm',
      boxSizing: 'border-box',
      lineHeight: '1.5'
    }}>
      <div style={{ padding: '40px' }}>
        {/* Header Section */}
        <div style={{ marginBottom: '40px' }}>
          <PurchasePDFHeader
            logo={branding?.logo}
            documentTitle="BILL"
            documentNumber={bill.billNumber}
            date={bill.billDate}
            organization={organization}
          />
        </div>

        {/* Bill From and Details Header - Responsive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 mb-10" style={{ display: 'grid', marginBottom: '40px' }}>
          <div style={{ borderLeft: '3px solid #f1f5f9', paddingLeft: '20px' }}>
            <h3 style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px', margin: '0 0 12px 0' }}>
              BILL FROM
            </h3>
            <p style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a', marginBottom: '6px', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
              {bill.vendorName}
            </p>
            <div style={{ fontSize: '13px', color: '#475569', lineHeight: '1.6' }}>
              {/* Vendor address details */}
              <p style={{ margin: '0' }}>{bill.vendorEmail || 'Contact Email'}</p>
            </div>
          </div>
          <div>
            <h3 style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px', margin: '0 0 12px 0' }}>
              SHIP TO
            </h3>
            <p style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a', marginBottom: '6px', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
              {organization?.name || 'Your Company'}
            </p>
            <div style={{ fontSize: '13px', color: '#475569', lineHeight: '1.6' }}>
              <p style={{ margin: '0' }}>{organization?.street1 || ''} {organization?.city || ''}</p>
            </div>
          </div>
        </div>

        {/* Meta Information Bar - Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-[2px] mb-10 bg-slate-100 rounded-lg overflow-hidden border border-slate-100" style={{
          marginBottom: '40px',
          backgroundColor: '#f1f5f9',
          border: '1px solid #f1f5f9'
        }}>
          <div style={{ backgroundColor: '#ffffff', padding: '16px' }}>
            <p style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px 0' }}>Bill Date</p>
            <p style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', margin: '0' }}>{formatDate(bill.billDate)}</p>
          </div>
          <div style={{ backgroundColor: '#ffffff', padding: '16px' }}>
            <p style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px 0' }}>Due Date</p>
            <p style={{ fontSize: '13px', fontWeight: '800', color: '#b91c1c', margin: '0' }}>{formatDate(bill.dueDate)}</p>
          </div>
          <div style={{ backgroundColor: '#ffffff', padding: '16px' }}>
            <p style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px 0' }}>Status</p>
            <p style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', margin: '0' }}>{paymentStatus}</p>
          </div>
        </div>

        {/* Items Table */}
        <div style={{ marginBottom: '32px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '500px' }}>
            <thead>
              <tr style={{ backgroundColor: '#991b1b', color: '#ffffff' }}>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', borderRadius: '4px 0 0 0' }}>#</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Item & Description</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Qty</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Rate</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right', borderRadius: '0 4px 0 0' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {(bill.items || []).map((item, index) => (
                <tr key={item.id || index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '16px', fontSize: '13px', color: '#64748b', verticalAlign: 'top' }}>{index + 1}</td>
                  <td style={{ padding: '16px', verticalAlign: 'top' }}>
                    <p style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px 0' }}>{item.name}</p>
                    {item.description && (
                      <p style={{ fontSize: '12px', color: '#64748b', margin: '0', lineHeight: '1.4' }}>{item.description}</p>
                    )}
                  </td>
                  <td style={{ padding: '16px', fontSize: '13px', color: '#0f172a', textAlign: 'center', verticalAlign: 'top', fontWeight: '600' }}>{item.quantity}</td>
                  <td style={{ padding: '16px', fontSize: '13px', color: '#0f172a', textAlign: 'right', verticalAlign: 'top' }}>{formatCurrency(item.rate)}</td>
                  <td style={{ padding: '16px', fontSize: '13px', color: '#0f172a', textAlign: 'right', verticalAlign: 'top', fontWeight: '700' }}>{formatCurrency(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bottom Section: Notes and Summary */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-8 md:gap-12 mb-10" style={{ marginBottom: '40px' }}>
          {/* Notes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {bill.notes && (
              <div style={{ backgroundColor: '#fdfdfd', padding: '16px', borderRadius: '4px', borderLeft: '4px solid #cbd5e1' }}>
                <h4 style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', margin: '0 0 8px 0' }}>
                  Notes
                </h4>
                <p style={{ fontSize: '13px', color: '#475569', margin: '0', lineHeight: '1.6' }}>{bill.notes}</p>
              </div>
            )}
          </div>

          {/* Summary Table */}
          <div style={{ backgroundColor: '#f8fafc', borderRadius: '8px', padding: '20px', border: '1px solid #f1f5f9', alignSelf: 'start' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '13px' }}>
              <span style={{ color: '#64748b', fontWeight: '600' }}>Sub Total</span>
              <span style={{ color: '#0f172a', fontWeight: '700' }}>{formatCurrency(bill.subTotal)}</span>
            </div>
            {bill.taxAmount && bill.taxAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '13px' }}>
                <span style={{ color: '#64748b', fontWeight: '600' }}>GST</span>
                <span style={{ color: '#0f172a', fontWeight: '700' }}>{formatCurrency(bill.taxAmount)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', paddingTop: '16px', borderTop: '2px solid #e2e8f0' }}>
              <span style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>Total</span>
              <span style={{ fontSize: '18px', fontWeight: '800', color: '#991b1b' }}>{formatCurrency(bill.total)}</span>
            </div>
            {bill.amountPaid > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '13px', color: '#16a34a' }}>
                <span style={{ fontWeight: '600' }}>Amount Paid</span>
                <span style={{ fontWeight: '700' }}>(-) {formatCurrency(bill.amountPaid)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>Balance Due</span>
              <span style={{ fontSize: '16px', fontWeight: '800', color: '#b91c1c' }}>{formatCurrency(bill.balanceDue)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BillDetailView({ bill }: { bill: Bill }) {
  const paymentStatus = getPaymentStatus(bill);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-1">BILL</h2>
          <p className="text-slate-600">
            Bill# <span className="font-semibold">{bill.billNumber}</span>
          </p>
          <Badge
            className={`mt-2 ${paymentStatus === "PAID"
              ? "bg-green-500 text-white"
              : paymentStatus === "PARTIALLY PAID"
                ? "bg-amber-500 text-white"
                : paymentStatus === "OVERDUE"
                  ? "bg-red-500 text-white"
                  : paymentStatus === "VOID"
                    ? "bg-slate-500 text-white"
                    : "bg-blue-500 text-white"
              }`}
          >
            {paymentStatus}
          </Badge>
        </div>
        <div className="text-right">
          <h4 className="text-sm text-slate-500">VENDOR ADDRESS</h4>
          <p className="font-semibold text-blue-600">{bill.vendorName}</p>
          {bill.vendorAddress && (
            <div className="text-sm text-slate-600 mt-1">
              {bill.vendorAddress.street1 && (
                <p>{bill.vendorAddress.street1}</p>
              )}
              <p>
                {bill.vendorAddress.city}, {bill.vendorAddress.state}
              </p>
              <p>
                {bill.vendorAddress.country} - {bill.vendorAddress.pinCode}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 text-sm border-t border-b py-4">
        <div>
          <span className="text-slate-500 uppercase text-xs">Bill Date</span>
          <p className="font-medium">{formatDate(bill.billDate)}</p>
        </div>
        <div>
          <span className="text-slate-500 uppercase text-xs">Due Date</span>
          <p className="font-medium">{formatDate(bill.dueDate)}</p>
        </div>
        <div>
          <span className="text-slate-500 uppercase text-xs">
            Payment Terms
          </span>
          <p className="font-medium">{bill.paymentTerms}</p>
        </div>
        <div className="col-span-3">
          <span className="text-slate-500 uppercase text-xs">Total</span>
          <p className="font-bold text-lg">{formatCurrency(bill.total)}</p>
        </div>
      </div>

      <div>
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="text-xs">ITEMS & DESCRIPTION</TableHead>
              <TableHead className="text-xs">ACCOUNT</TableHead>
              <TableHead className="text-xs text-center">QUANTITY</TableHead>
              <TableHead className="text-xs text-right">RATE</TableHead>
              <TableHead className="text-xs text-right">AMOUNT</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bill.items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="text-blue-600">{item.itemName}</TableCell>
                <TableCell>{item.account}</TableCell>
                <TableCell className="text-center">{item.quantity}</TableCell>
                <TableCell className="text-right">
                  {item.rate.toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  {item.amount.toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-end">
        <div className="w-72 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Sub Total</span>
            <span>{formatCurrency(bill.subTotal)}</span>
          </div>
          {bill.discountAmount && bill.discountAmount > 0 && (
            <div className="flex justify-between text-sm text-pink-600">
              <span>Discount</span>
              <span>(-){formatCurrency(bill.discountAmount)}</span>
            </div>
          )}
          {bill.taxAmount && bill.taxAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">IGST18 (18%)</span>
              <span>{formatCurrency(bill.taxAmount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold border-t pt-2">
            <span>Total</span>
            <span>{formatCurrency(bill.total)}</span>
          </div>
          {bill.creditsApplied && bill.creditsApplied.length > 0 && (
            <div className="border-t pt-2 space-y-1">
              <p className="text-xs text-slate-500 font-semibold">
                Credits Applied:
              </p>
              {bill.creditsApplied.map((credit, index) => (
                <div
                  key={index}
                  className="flex justify-between text-sm text-green-600"
                >
                  <span>Credit {credit.creditNumber}</span>
                  <span>- {formatCurrency(credit.amount)}</span>
                </div>
              ))}
            </div>
          )}
          {bill.paymentsMadeApplied && bill.paymentsMadeApplied.length > 0 && (
            <div className="border-t pt-2 space-y-1">
              <p className="text-xs text-slate-500 font-semibold">
                Payment Made:
              </p>
              {bill.paymentsMadeApplied.map((payment, index) => (
                <div
                  key={index}
                  className="flex justify-between text-sm text-blue-600"
                >
                  <span>
                    Payment {payment.paymentNumber || payment.paymentId}
                  </span>
                  <span>- {formatCurrency(payment.amount)}</span>
                </div>
              ))}
            </div>
          )}
          {bill.activityLogs && bill.activityLogs.length > 0 && (
            <div className="border-t pt-2 space-y-1">
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                Recent Activity:
              </p>
              {bill.activityLogs
                .slice()
                .reverse()
                .slice(0, 3)
                .map((log, index) => (
                  <div
                    key={index}
                    className="flex justify-between text-[11px] text-slate-500 gap-2"
                  >
                    <span className="truncate">{log.description}</span>
                    <span className="whitespace-nowrap font-medium text-slate-400">
                      {new Date(log.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                ))}
            </div>
          )}
          {bill.paymentsRecorded && bill.paymentsRecorded.length > 0 && (
            <div className="border-t pt-2 space-y-1">
              <p className="text-xs text-slate-500 font-semibold">
                Record Payment:
              </p>
              {bill.paymentsRecorded.map((payment, index) => (
                <div
                  key={index}
                  className="flex justify-between text-sm text-purple-600"
                >
                  <span>
                    Payment {payment.paymentNumber || payment.paymentId}
                  </span>
                  <span>- {formatCurrency(payment.amount)}</span>
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-between bg-blue-50 p-2 rounded font-semibold">
            <span>Balance Due</span>
            <span>{formatCurrency(bill.balanceDue)}</span>
          </div>
        </div>
      </div>

      {(bill.journalEntries && bill.journalEntries.length > 0) || (bill.paymentsMadeApplied && bill.paymentsMadeApplied.length > 0) ? (
        <div className="border-t pt-4">
          <Tabs defaultValue="payments-history">
            <TabsList className="h-auto p-0 bg-transparent gap-6">
              <TabsTrigger
                value="payments-history"
                className="rounded-none border-b-2 border-transparent px-2 py-3 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent hover:bg-transparent transition-none"
              >
                Payments Made
              </TabsTrigger>
              <TabsTrigger
                value="journal"
                className="rounded-none border-b-2 border-transparent px-2 py-3 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent hover:bg-transparent transition-none"
              >
                Journal
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="rounded-none border-b-2 border-transparent px-2 py-3 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent hover:bg-transparent transition-none"
              >
                History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="history">
              <h4 className="font-semibold mb-4 mt-4">Activity History</h4>
              <div className="space-y-4">
                {bill.activityLogs && bill.activityLogs.length > 0 ? (
                  bill.activityLogs.slice().reverse().map((log: ActivityLog, index: number) => (
                    <div key={index} className="flex gap-4 relative pl-2">
                      {/* Timeline Line */}
                      {index !== bill.activityLogs!.length - 1 && (
                        <div className="absolute left-[15px] top-6 bottom-[-20px] w-[2px] bg-slate-200"></div>
                      )}

                      <div className="mt-1 relative z-10">
                        <div className={`h-7 w-7 rounded-full flex items-center justify-center border-2 ${log.action === 'created' ? 'bg-green-50 border-green-200 text-green-600' :
                          log.action === 'updated' ? 'bg-blue-50 border-blue-200 text-blue-600' :
                            log.action === 'payment' ? 'bg-purple-50 border-purple-200 text-purple-600' :
                              'bg-slate-50 border-slate-200 text-slate-500'
                          }`}>
                          <Clock className="h-3.5 w-3.5" />
                        </div>
                      </div>

                      <div className="flex-1 bg-slate-50 p-3 rounded-md border border-slate-100">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-slate-900 text-sm">
                              {log.description}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              by <span className="font-semibold text-slate-700">{log.user}</span>
                            </p>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-slate-400 whitespace-nowrap">
                            <span>{new Date(log.timestamp).toLocaleDateString()}</span>
                            <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-slate-500 text-sm py-4">No activity recorded for this bill.</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="payments-history">
              <h4 className="font-semibold mb-2 mt-4">Payment History</h4>
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="text-xs">DATE</TableHead>
                    <TableHead className="text-xs">PAYMENT #</TableHead>
                    <TableHead className="text-xs">REFERENCE #</TableHead>
                    <TableHead className="text-xs">PAYMENT MODE</TableHead>
                    <TableHead className="text-xs text-right">AMOUNT</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bill.paymentsMadeApplied && bill.paymentsMadeApplied.length > 0 ? (
                    bill.paymentsMadeApplied.map((payment: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>{formatDate(payment.date)}</TableCell>
                        <TableCell className="font-medium text-blue-600">
                          {payment.paymentNumber || payment.paymentId}
                        </TableCell>
                        <TableCell>{payment.reference || '-'}</TableCell>
                        <TableCell>{payment.mode}</TableCell>
                        <TableCell className="text-right font-bold">
                          {formatCurrency(payment.amount)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-slate-500 py-4">No payments made recorded yet.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="journal">
              <p className="text-xs text-slate-500 mb-2">
                Amount is displayed in your base currency{" "}
                <Badge variant="outline" className="text-xs">
                  INR
                </Badge>
              </p>
              <h4 className="font-semibold mb-2">Bill</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">ACCOUNT</TableHead>
                    <TableHead className="text-xs text-right">DEBIT</TableHead>
                    <TableHead className="text-xs text-right">CREDIT</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bill.journalEntries && bill.journalEntries.map((entry, index) => (
                    <TableRow key={index}>
                      <TableCell>{entry.account}</TableCell>
                      <TableCell className="text-right">
                        {entry.debit.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {entry.credit.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </div>
      ) : null}
    </div>
  );
}

function BillDetailPanel({
  bill,
  branding,
  organization,
  onClose,
  onEdit,
  onDelete,
  onMarkPaid,
  onRecordPayment,
  onVoid,
  onClone,
  onCreateVendorCredits,
  onViewJournal,
  onApplyCredits,
  onExpectedPaymentDate,
}: {
  bill: Bill;
  branding?: any;
  organization?: Organization;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onMarkPaid: () => void;
  onRecordPayment: () => void;
  onVoid: () => void;
  onClone: () => void;
  onCreateVendorCredits: () => void;
  onViewJournal: () => void;
  onApplyCredits: () => void;
  onExpectedPaymentDate: () => void;
}) {
  const [showPdfView, setShowPdfView] = useState(true);
  const [unusedCredits, setUnusedCredits] = useState(0);

  useEffect(() => {
    // Fetch customer/vendor details to check available credits
    const fetchVendorDetails = async () => {
      try {
        // Since we don't have a direct "unused credits" field on the bill, we fetch vendor credits manually
        const response = await fetch('/api/vendor-credits');
        if (response.ok) {
          const data = await response.json();
          const credits = data.data.filter((c: any) =>
            c.vendorId === bill.vendorId &&
            (c.status === 'OPEN' || (c.balance > 0 && c.status !== 'VOID'))
          );
          const total = credits.reduce((sum: number, c: any) => sum + (c.balance || 0), 0);
          setUnusedCredits(total);
        }
      } catch (error) {
        console.error("Failed to fetch credits", error);
      }
    };

    if (bill && bill.vendorId) {
      fetchVendorDetails();
    }
  }, [bill]);

  const { toast } = useToast();

  const handleDownloadPDF = async () => {
    toast({ title: "Preparing download...", description: "Please wait while we generate your PDF." });

    if (!showPdfView) {
      setShowPdfView(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    try {
      await generatePDFFromElement("bill-pdf-content", `Bill-${bill.billNumber}.pdf`);
      toast({ title: "Success", description: "Bill downloaded successfully." });
    } catch (error) {
      console.error("PDF generation error:", error);
      toast({ title: "Error", description: "Failed to generate PDF. Please try again.", variant: "destructive" });
    }
  };

  const handlePrint = async () => {
    toast({ title: "Preparing print...", description: "Please wait while we prepare the document." });

    if (!showPdfView) {
      setShowPdfView(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    try {
      await robustIframePrint("bill-pdf-content");
    } catch (error) {
      console.error("Print error:", error);
      toast({ title: "Error", description: "Failed to open print dialog.", variant: "destructive" });
    }
  };

  return (
    <div className="h-full flex flex-col bg-white border-l border-slate-200 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
        <h2
          className="text-lg font-semibold text-slate-900"
          data-testid="text-bill-number"
        >
          {bill.billNumber}
        </h2>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onClose}
            data-testid="button-close-panel"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-200 overflow-x-auto bg-white">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5"
          onClick={onEdit}
          data-testid="button-edit-bill"
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              PDF/Print
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={handleDownloadPDF}>
              <Download className="mr-2 h-4 w-4" /> Download PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" /> Print
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Use Credits Button */}
        {unusedCredits > 0 && bill.balanceDue > 0 && bill.status !== "VOID" && (
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-blue-600 border-blue-200 hover:bg-blue-50"
            onClick={onApplyCredits}
          >
            <CreditCard className="h-3.5 w-3.5" />
            Use Credits ({formatCurrency(unusedCredits)})
          </Button>
        )}

        {bill.balanceDue > 0 && bill.status !== "VOID" && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5"
            onClick={onRecordPayment}
            data-testid="button-record-payment"
          >
            <CreditCard className="h-3.5 w-3.5" />
            Record Payment
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5"
              data-testid="button-more-actions"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => setShowPdfView(!showPdfView)}>
              <Eye className="mr-2 h-4 w-4" />
              {showPdfView ? "View Details" : "View PDF"}
            </DropdownMenuItem>
            {bill.status !== "VOID" && (
              <DropdownMenuItem onClick={onVoid} className="text-red-600">
                <Ban className="mr-2 h-4 w-4" />
                Void
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={onExpectedPaymentDate}>
              <Clock className="mr-2 h-4 w-4" />
              Expected Payment Date
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onClone}>
              <Copy className="mr-2 h-4 w-4" />
              Clone
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onCreateVendorCredits}>
              <CreditCard className="mr-2 h-4 w-4" />
              Create Vendor Credits
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onViewJournal}>
              <BookOpen className="mr-2 h-4 w-4" />
              View Journal
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600" onClick={onDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-end">
        <div className="flex items-center gap-2">
          <Label htmlFor="pdf-view" className="text-sm text-slate-500">
            Show PDF View
          </Label>
          <Switch
            id="pdf-view"
            checked={showPdfView}
            onCheckedChange={setShowPdfView}
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-slate-100 dark:bg-slate-800/50 pb-32">
        {showPdfView ? (
          <div className="p-4 sm:p-8 flex justify-center">
            <div className="bg-white rounded-md shadow-md w-full max-w-[210mm] overflow-hidden">
              <BillPDFView bill={bill} branding={branding} />
            </div>
          </div>
        ) : (
          <div className="p-4 sm:p-6 mx-auto w-full max-w-5xl">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
              <BillDetailView bill={bill} />
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-slate-200 p-3 text-center text-xs text-slate-500">
        PDF Template:{" "}
        <span className="text-blue-600">
          {bill.pdfTemplate || "Standard Template"}
        </span>
        <button className="text-blue-600 ml-2">Change</button>
      </div>
    </div>
  );
}

// Record Payment Dialog Component
function RecordPaymentDialog({
  isOpen,
  onClose,
  bill,
  onPaymentRecorded,
}: {
  isOpen: boolean;
  onClose: () => void;
  bill: Bill | null;
  onPaymentRecorded: () => void;
  onPaymentRecorded: () => void;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [paymentNumber, setPaymentNumber] = useState("1");
  const [paymentMadeOn, setPaymentMadeOn] = useState("");
  const [paidThrough, setPaidThrough] = useState("Petty Cash");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [sendNotification, setSendNotification] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && bill) {
      setPaymentAmount(String(bill.balanceDue || 0));
      setPaymentDate(new Date().toISOString().split("T")[0]);
      fetchNextPaymentNumber();
    }
  }, [isOpen, bill]);

  const fetchNextPaymentNumber = async () => {
    try {
      const response = await fetch("/api/payments-made/next-number");
      if (response.ok) {
        const data = await response.json();
        setPaymentNumber(data.data?.nextNumber || "1");
      }
    } catch (error) {
      console.error("Failed to fetch next payment number:", error);
    }
  };

  const incrementPaymentNumber = () => {
    const num = parseInt(paymentNumber) || 0;
    setPaymentNumber(String(num + 1));
  };

  const handleSave = async (status: "DRAFT" | "PAID") => {
    if (!bill) return;

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Please enter a valid payment amount",
        variant: "destructive",
      });
      return;
    }
    if (amount > (bill.balanceDue || 0)) {
      toast({
        title: "Payment amount cannot exceed balance due",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Record payment on the bill - this also creates a payment in Payments Made
      const billResponse = await fetch(`/api/bills/${bill.id}/record-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          paymentMode,
          paymentDate,
          paymentNumber,
          paymentMadeOn,
          paidThrough,
          reference,
          notes,
          status,
          sendNotification,
        }),
      });

      if (!billResponse.ok) {
        throw new Error("Failed to record payment");
      }

      toast({
        title:
          status === "DRAFT"
            ? "Payment saved as draft"
            : "Payment recorded successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/payments-made"] });
      onPaymentRecorded();
      onClose();
      resetForm();
    } catch (error) {
      toast({ title: "Failed to record payment", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setPaymentAmount("");
    setPaymentMode("Cash");
    setPaymentDate(new Date().toISOString().split("T")[0]);
    setPaymentNumber("1");
    setPaymentMadeOn("");
    setPaidThrough("Petty Cash");
    setReference("");
    setNotes("");
    setSendNotification(false);
  };

  if (!bill) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-hide">
        <DialogHeader>
          <DialogTitle
            className="text-xl font-semibold"
            data-testid="text-payment-title"
          >
            Payment for {bill.billNumber}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Payment Amount */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-red-600">
              Payment Made <span className="text-red-500">*</span>(INR)
            </Label>
            <Input
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}

              className="max-w-xs"
              data-testid="input-payment-amount"
            />
          </div>

          {/* Info Message */}

          {/* Payment Mode */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Payment Mode</Label>
            <Select value={paymentMode} onValueChange={setPaymentMode}>
              <SelectTrigger
                className="max-w-xs"
                data-testid="select-payment-mode"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                <SelectItem value="Cheque">Cheque</SelectItem>
                <SelectItem value="Credit Card">Credit Card</SelectItem>
                <SelectItem value="UPI">UPI</SelectItem>
                <SelectItem value="NEFT">NEFT</SelectItem>
                <SelectItem value="RTGS">RTGS</SelectItem>
                <SelectItem value="IMPS">IMPS</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Payment Date and Payment # */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-red-600">
                Payment Date<span className="text-red-500">*</span>
              </Label>
              <Input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                data-testid="input-payment-date"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-red-600">
                Payment #<span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  value={paymentNumber}
                  onChange={(e) => setPaymentNumber(e.target.value)}
                  className="flex-1"
                  data-testid="input-payment-number"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={incrementPaymentNumber}
                  title="Generate next number"
                  data-testid="button-next-payment-number"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Payment Made On, Paid Through, Reference */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Payment Made on</Label>
              <Input
                type="date"
                value={paymentMadeOn}
                onChange={(e) => setPaymentMadeOn(e.target.value)}
                placeholder="dd/MM/yyyy"
                data-testid="input-payment-made-on"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-red-600">
                Paid Through<span className="text-red-500">*</span>
              </Label>
              <Select value={paidThrough} onValueChange={setPaidThrough}>
                <SelectTrigger data-testid="select-paid-through">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Petty Cash">Petty Cash</SelectItem>
                  <SelectItem value="Undeposited Funds">
                    Undeposited Funds
                  </SelectItem>
                  <SelectItem value="Bank Account">Bank Account</SelectItem>
                  <SelectItem value="Prepaid Expenses">
                    Prepaid Expenses
                  </SelectItem>
                  <SelectItem value="Accounts Payable">
                    Accounts Payable
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Reference#</Label>
              <Input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                data-testid="input-reference"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              data-testid="input-notes"
            />
          </div>

          {/* Attachments */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Attachments</Label>
            <div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="gap-2"
                    data-testid="button-upload-file"
                  >
                    <Upload className="h-4 w-4" />
                    Upload File
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>Upload from Computer</DropdownMenuItem>
                  <DropdownMenuItem>Attach from Cloud</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <p className="text-xs text-slate-500 mt-1">
                You can upload a maximum of 5 files, 10MB each
              </p>
            </div>
          </div>

          {/* Email Notification */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="send-notification"
              checked={sendNotification}
              onCheckedChange={(checked) =>
                setSendNotification(checked === true)
              }
              data-testid="checkbox-send-notification"
            />
            <Label
              htmlFor="send-notification"
              className="text-sm cursor-pointer"
            >
              Send a Payment Made email notification.
            </Label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => handleSave("DRAFT")}
              disabled={isSubmitting}
              data-testid="button-save-draft"
            >
              Save as Draft
            </Button>
            <Button
              onClick={() => handleSave("PAID")}
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
              data-testid="button-save-paid"
            >
              Save as Paid
            </Button>
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={isSubmitting}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ApplyCreditsToBillDialog({
  isOpen,
  onClose,
  bill,
  onCreditsApplied
}: {
  isOpen: boolean;
  onClose: () => void;
  bill: Bill | null;
  onCreditsApplied: () => void;
}) {
  const { toast } = useToast();
  const [vendorCredits, setVendorCredits] = useState<VendorCredit[]>([]);
  const [creditsToApply, setCreditsToApply] = useState<{ [creditId: string]: number }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [appliedDate, setAppliedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (isOpen && bill) {
      fetchVendorCredits();
      setCreditsToApply({});
    }
  }, [isOpen, bill]);

  const fetchVendorCredits = async () => {
    if (!bill) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/vendor-credits`);
      if (response.ok) {
        const data = await response.json();
        const openCredits = data.data.filter((credit: VendorCredit) =>
          credit.vendorId === bill.vendorId &&
          (credit.status === 'OPEN' || (credit.balance > 0 && credit.status !== 'VOID'))
        );
        setVendorCredits(openCredits);
      }
    } catch (error) {
      console.error("Failed to fetch vendor credits:", error);
      toast({ title: "Failed to fetch vendor credits", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAmountChange = (creditId: string, value: string) => {
    const amount = parseFloat(value) || 0;
    const credit = vendorCredits.find(c => c.id === creditId);

    if (!credit || !bill) return;

    // Validate against credit balance
    if (amount > credit.balance) {
      return;
    }

    setCreditsToApply(prev => ({
      ...prev,
      [creditId]: amount
    }));
  };

  const getTotalApplied = () => {
    return Object.values(creditsToApply).reduce((sum, amt) => sum + amt, 0);
  };

  const handleSave = async () => {
    if (!bill) return;

    const totalApplied = getTotalApplied();
    if (totalApplied <= 0) {
      toast({ title: "Please enter an amount to apply", variant: "destructive" });
      return;
    }

    if (totalApplied > bill.balanceDue) {
      toast({
        title: "Total credits cannot exceed bill balance due",
        description: `Bill Balance: ${formatCurrency(bill.balanceDue)}, Applied: ${formatCurrency(totalApplied)}`,
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Create an array of promises to apply each credit
      const promises = Object.entries(creditsToApply)
        .filter(([_, amount]) => amount > 0)
        .map(([creditId, amount]) => {
          return fetch(`/api/vendor-credits/${creditId}/apply-to-bills`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              creditsToApply: { [bill.id]: amount },
              appliedDate
            })
          });
        });

      await Promise.all(promises);

      toast({ title: "Credits applied successfully" });
      onCreditsApplied();
      onClose();
    } catch (error) {
      console.error("Failed to apply credits:", error);
      toast({ title: "Failed to apply some credits", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!bill) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Apply Credits to Bill {bill.billNumber}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex justify-between items-center bg-slate-50 p-4 rounded-md border text-sm">
            <div>
              <p className="text-slate-500">Bill Balance Due</p>
              <p className="text-lg font-bold text-red-600">{formatCurrency(bill.balanceDue)}</p>
            </div>
            <div>
              <p className="text-slate-500">Total Credits Available</p>
              <p className="text-lg font-bold text-green-600">
                {formatCurrency(vendorCredits.reduce((sum, c) => sum + c.balance, 0))}
              </p>
            </div>
            <div>
              <p className="text-slate-500">Total To Apply</p>
              <p className="text-lg font-bold text-blue-600">{formatCurrency(getTotalApplied())}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Label>Date Applied:</Label>
            <Input
              type="date"
              value={appliedDate}
              onChange={(e) => setAppliedDate(e.target.value)}
              className="w-40"
            />
          </div>

          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>Date</TableHead>
                  <TableHead>Credit Note #</TableHead>
                  <TableHead className="text-right">Credit Balance</TableHead>
                  <TableHead className="text-right w-[150px]">Amount to Apply</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">Loading credits...</TableCell>
                  </TableRow>
                ) : vendorCredits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-slate-500">No open credits available for this vendor.</TableCell>
                  </TableRow>
                ) : (
                  vendorCredits.map(credit => (
                    <TableRow key={credit.id}>
                      <TableCell>{formatDate(credit.date)}</TableCell>
                      <TableCell className="font-medium text-blue-600">{credit.creditNumber}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(credit.balance)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-slate-400 text-xs">₹</span>
                          <Input
                            type="number"
                            className="w-24 text-right h-8"
                            min="0"
                            max={credit.balance}
                            value={creditsToApply[credit.id] || ''}
                            onChange={(e) => handleAmountChange(credit.id, e.target.value)}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSubmitting || getTotalApplied() === 0}>Apply Credits</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Bills() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [bills, setBills] = useState<Bill[]>([]);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [billToDelete, setBillToDelete] = useState<string | null>(null);
  const [selectedBills, setSelectedBills] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState("All");
  const [viewMode, setViewMode] = useState<"list" | "table">("table");
  const [recordPaymentDialogOpen, setRecordPaymentDialogOpen] = useState(false);
  const [voidDialogOpen, setVoidDialogOpen] = useState(false);
  const [expectedPaymentDateDialogOpen, setExpectedPaymentDateDialogOpen] =
    useState(false);
  const [expectedPaymentDate, setExpectedPaymentDate] = useState("");
  const [journalDialogOpen, setJournalDialogOpen] = useState(false);
  const [branding, setBranding] = useState<any>(null);
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  const [applyCreditsDialogOpen, setApplyCreditsDialogOpen] = useState(false);
  const [sortBy, setSortBy] = useState<string>('createdTime');
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [preferencesDialogOpen, setPreferencesDialogOpen] = useState(false);

  // Use organization context instead of local state
  const { currentOrganization: organization } = useOrganization();

  useEffect(() => {
    fetchBills();
    fetchBranding();
  }, []);

  // Deep linking for selected bill
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const billId = searchParams.get('id');
    if (billId && bills.length > 0) {
      const bill = bills.find(b => b.id === billId);
      if (bill) {
        setSelectedBill(bill);
      }
    }
  }, [bills]);

  const fetchBranding = async () => {
    try {
      const response = await fetch("/api/branding");
      const data = await response.json();
      if (data.success) {
        setBranding(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch branding:", error);
    }
  };

  const fetchBills = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/bills");
      if (response.ok) {
        const data = await response.json();
        const billsData = data.data || [];

        // Map itemName to name for items to fix PDF view LSP error
        const billsWithMappedItems = billsData.map((bill: any) => ({
          ...bill,
          items: (bill.items || []).map((item: any) => ({
            ...item,
            name: item.itemName
          }))
        }));

        setBills(billsWithMappedItems);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load bills. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBillDetail = async (id: string) => {
    try {
      const response = await fetch(`/api/bills/${id}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedBill(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch bill detail:", error);
    }
  };

  const handleBillClick = (bill: Bill) => {
    fetchBillDetail(bill.id);
  };

  const handleClosePanel = () => {
    setSelectedBill(null);
  };

  const handleEditBill = () => {
    if (selectedBill) {
      setLocation(`/bills/${selectedBill.id}/edit`);
    }
  };

  const handleDelete = (id: string) => {
    setBillToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!billToDelete) return;
    try {
      const response = await fetch(`/api/bills/${billToDelete}`, {
        method: "DELETE",
      });
      if (response.ok) {
        toast({ title: "Bill deleted successfully" });
        fetchBills();
        if (selectedBill?.id === billToDelete) {
          handleClosePanel();
        }
      }
    } catch (error) {
      toast({ title: "Failed to delete bill", variant: "destructive" });
    } finally {
      setDeleteDialogOpen(false);
      setBillToDelete(null);
    }
  };

  const handleMarkPaid = async () => {
    if (!selectedBill) return;
    try {
      const response = await fetch(`/api/bills/${selectedBill.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PAID" }),
      });
      if (response.ok) {
        toast({ title: "Bill marked as paid" });
        fetchBills();
        fetchBillDetail(selectedBill.id);
      }
    } catch (error) {
      toast({ title: "Failed to update bill status", variant: "destructive" });
    }
  };

  const handleRecordPayment = () => {
    setRecordPaymentDialogOpen(true);
  };

  const handlePaymentRecorded = () => {
    fetchBills();
    if (selectedBill) {
      fetchBillDetail(selectedBill.id);
    }
  };

  const handleVoid = async () => {
    if (!selectedBill) return;
    setVoidDialogOpen(true);
  };

  const confirmVoid = async () => {
    if (!selectedBill) return;
    try {
      const response = await fetch(`/api/bills/${selectedBill.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "VOID" }),
      });
      if (response.ok) {
        toast({ title: "Bill has been voided" });
        fetchBills();
        fetchBillDetail(selectedBill.id);
      }
    } catch (error) {
      toast({ title: "Failed to void bill", variant: "destructive" });
    } finally {
      setVoidDialogOpen(false);
    }
  };

  const handleClone = () => {
    if (selectedBill) {
      setLocation(`/bills/new?clone=${selectedBill.id}`);
    }
  };

  const handleCreateVendorCredits = () => {
    if (selectedBill) {
      setLocation(
        `/vendor-credits/new?billId=${selectedBill.id}&vendorId=${selectedBill.vendorId}`,
      );
    }
  };

  const handleViewJournal = () => {
    setJournalDialogOpen(true);
  };

  const handleExpectedPaymentDate = () => {
    if (selectedBill) {
      setExpectedPaymentDate(selectedBill.dueDate || "");
      setExpectedPaymentDateDialogOpen(true);
    }
  };

  const confirmExpectedPaymentDate = async () => {
    if (!selectedBill) return;
    try {
      const response = await fetch(`/api/bills/${selectedBill.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...selectedBill, expectedPaymentDate }),
      });
      if (response.ok) {
        toast({ title: "Expected payment date updated" });
        fetchBills();
        fetchBillDetail(selectedBill.id);
      }
    } catch (error) {
      toast({
        title: "Failed to update expected payment date",
        variant: "destructive",
      });
    } finally {
      setExpectedPaymentDateDialogOpen(false);
    }
  };

  // Sort handler
  const handleSort = (sortField: string) => {
    setSortBy(sortField);
    const sortedBills = [...bills].sort((a, b) => {
      switch (sortField) {
        case 'name':
        case 'companyName':
          return (a.vendorName || '').localeCompare(b.vendorName || '');
        case 'payables':
          return (b.balanceDue || 0) - (a.balanceDue || 0);
        case 'unusedCredits':
          // Assuming unused credits is a field on the vendor or bill
          return (b.vendorUnusedCredits || 0) - (a.vendorUnusedCredits || 0);
        case 'createdTime':
          return new Date(b.createdAt || b.billDate).getTime() - new Date(a.createdAt || a.billDate).getTime();
        case 'lastModifiedTime':
          return new Date(b.updatedAt || b.billDate).getTime() - new Date(a.updatedAt || a.billDate).getTime();
        default:
          return 0;
      }
    });
    setBills(sortedBills);
    toast({ title: `Sorted by ${sortField}` });
  };

  // Import handler
  const handleImport = () => {
    setImportDialogOpen(true);
  };

  // Export handler
  const handleExport = async () => {
    try {
      toast({
        title: "Exporting...",
        description: "Preparing Excel file for all bills.",
      });
      const transformedData = transformBillListForExcel(filteredBills);
      exportToExcel(transformedData, 'Bills_List', 'Bills');
    } catch (error) {
      toast({ title: "Failed to export bills", variant: "destructive" });
    }
  };

  // Preferences handler
  const handlePreferences = () => {
    setPreferencesDialogOpen(true);
  };

  const toggleSelectBill = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedBills.includes(id)) {
      setSelectedBills(selectedBills.filter((i) => i !== id));
    } else {
      setSelectedBills([...selectedBills, id]);
    }
  };

  const filteredByStatus = bills.filter((bill) => {
    const status = bill.status?.toUpperCase();
    const balanceDue = bill.balanceDue || 0;
    const total = bill.total || 0;
    const dueDate = bill.dueDate ? new Date(bill.dueDate) : null;
    const now = new Date();

    switch (activeFilter) {
      case "Draft":
        return status === "DRAFT";
      case "Pending Approval":
        return status === "PENDING_APPROVAL";
      case "Open":
        return status === "OPEN" || (balanceDue > 0 && status !== "VOID");
      case "Overdue":
        return status === "OVERDUE" || (balanceDue > 0 && dueDate && dueDate < now);
      case "Unpaid":
        return balanceDue === total && total > 0;
      case "Partially Paid":
        return balanceDue > 0 && balanceDue < total;
      case "Paid":
        return balanceDue === 0 && total > 0;
      case "Void":
        return status === "VOID";
      case "Credit Notes":
        return bill.creditsApplied && bill.creditsApplied.length > 0;
      case "All":
      default:
        return true;
    }
  });

  const filteredBills = filteredByStatus.filter(
    (bill) =>
      bill.billNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.vendorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const paginationResult = usePagination<Bill>(filteredBills, 10);
  const { currentPage, totalPages, totalItems, itemsPerPage, goToPage } =
    paginationResult;
  const paginatedItems: Bill[] = paginationResult.paginatedItems;

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case "PAID":
        return (
          <Badge
            variant="outline"
            className="text-green-600 border-green-200 bg-green-50"
          >
            PAID
          </Badge>
        );
      case "OPEN":
        return (
          <Badge
            variant="outline"
            className="text-blue-600 border-blue-200 bg-blue-50"
          >
            OPEN
          </Badge>
        );
      case "OVERDUE":
        return (
          <Badge
            variant="outline"
            className="text-red-600 border-red-200 bg-red-50"
          >
            OVERDUE
          </Badge>
        );
      case "PARTIALLY_PAID":
        return (
          <Badge
            variant="outline"
            className="text-amber-600 border-amber-200 bg-amber-50"
          >
            PARTIALLY PAID
          </Badge>
        );
      case "VOID":
        return (
          <Badge variant="outline" className="text-slate-600 border-slate-200">
            VOID
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    const checkCompact = () => {
      setIsCompact(window.innerWidth < 1280);
    };

    checkCompact();
    window.addEventListener('resize', checkCompact);
    return () => window.removeEventListener('resize', checkCompact);
  }, []);

  const handleApplyCredits = () => {
    setApplyCreditsDialogOpen(true);
  };

  const handleCreditsApplied = () => {
    fetchBills();
    if (selectedBill) {
      fetchBillDetail(selectedBill.id);
    }
  };

  return (
    <div className="flex h-screen animate-in fade-in duration-300 w-full overflow-hidden">
      {/* Apply Credits Dialog */}
      <ApplyCreditsToBillDialog
        isOpen={applyCreditsDialogOpen}
        onClose={() => setApplyCreditsDialogOpen(false)}
        bill={selectedBill}
        onCreditsApplied={handleCreditsApplied}
      />
      <ResizablePanelGroup key={`${selectedBill ? "split" : "single"}-${isCompact ? "compact" : "full"}`} direction="horizontal" className="h-full w-full">
        {(!isCompact || !selectedBill) && (
          <ResizablePanel
            defaultSize={isCompact ? 100 : (selectedBill ? 29 : 100)}
            minSize={isCompact ? 100 : (selectedBill ? 29 : 100)}
            maxSize={isCompact ? 100 : (selectedBill ? 29 : 100)}
            className="flex flex-col overflow-hidden bg-white min-w-[25%]"
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white sticky top-0 z-10 min-h-[73px] h-auto">
              <div className="flex items-center gap-4 flex-1">
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="gap-1.5 text-xl font-semibold text-slate-900 hover:text-slate-700 hover:bg-transparent p-0 h-auto transition-colors text-left whitespace-normal"
                      >
                        <span className="line-clamp-2">
                          {activeFilter === "All" ? "All Bills" : `${activeFilter} Bills`}
                        </span>
                        <ChevronDown className="h-4 w-4 text-slate-500 shrink-0" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56 p-1">
                      {[
                        "All",
                        "Draft",
                        "Pending Approval",
                        "Open",
                        "Overdue",
                        "Unpaid",
                        "Partially Paid",
                        "Paid",
                        "Void",
                        "Credit Notes",
                      ].map((filter) => (
                        <DropdownMenuItem
                          key={filter}
                          onClick={() => setActiveFilter(filter)}
                          className={cn(
                            "flex items-center justify-between px-3 py-2 cursor-pointer transition-colors",
                            activeFilter === filter && "bg-blue-50 text-blue-600 font-medium"
                          )}
                        >
                          {filter}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <span className="text-sm text-slate-400">({filteredBills.length})</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {selectedBill ? (
                  isSearchVisible ? (
                    <div className="relative w-full max-w-[200px] animate-in slide-in-from-right-5 fade-in-0 duration-200">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        autoFocus
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onBlur={() => !searchTerm && setIsSearchVisible(false)}
                        className="pl-9 h-9"
                      />
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 px-0"
                      data-testid="button-search-compact"
                      onClick={() => setIsSearchVisible(true)}
                    >
                      <Search className="h-4 w-4 text-slate-400" />
                    </Button>
                  )
                ) : (
                  <div className="relative w-[240px] hidden sm:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search bills..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 h-9"
                      data-testid="input-search-bills"
                    />
                  </div>
                )}

                <Button
                  onClick={() => setLocation("/bills/new")}
                  className={`bg-sidebar hover:bg-sidebar/90 font-display font-medium gap-1.5 h-9 ${selectedBill ? 'w-9 px-0' : ''}`}
                  data-testid="button-new-bill"
                  size={selectedBill ? "icon" : "default"}
                >
                  <Plus className={`h-4 w-4 ${selectedBill ? '' : 'mr-1.5'}`} />
                  {!selectedBill && "New Bill"}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="h-9 w-9">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 p-1">
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <ArrowUpDown className="mr-2 h-4 w-4" />
                        <span>Sort by</span>
                      </DropdownMenuSubTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuSubContent>
                          <DropdownMenuItem onClick={() => handleSort('name')}>Name</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSort('companyName')}>Company Name</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSort('payables')}>Payables (BCY)</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSort('unusedCredits')}>Unused Credits (BCY)</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSort('createdTime')}>Created Time</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSort('lastModifiedTime')}>Last Modified Time</DropdownMenuItem>
                        </DropdownMenuSubContent>
                      </DropdownMenuPortal>
                    </DropdownMenuSub>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleImport()}>
                      <Upload className="mr-2 h-4 w-4" /> Import
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport()}>
                      <Download className="mr-2 h-4 w-4" /> Export
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Mobile Search Bar */}
            <div className="px-4 py-3 flex items-center gap-2 border-b border-slate-200 bg-white sm:hidden">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search bills..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-9"
                  data-testid="input-search-mobile"
                />
              </div>
            </div>



            <div className="flex-1 flex flex-col min-h-0 relative">
              <div className="flex-1 overflow-auto scrollbar-hide relative">

                {loading ? (
                  <div className="p-8 text-center text-slate-500">
                    Loading bills...
                  </div>
                ) : filteredBills.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8">
                    <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                      <FileText className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No bills found</h3>
                    <p className="text-slate-500 mb-4">
                      {searchTerm
                        ? "Try adjusting your search criteria"
                        : "Create your first bill to get started"}
                    </p>
                    {!searchTerm && (
                      <Button
                        onClick={() => setLocation("/bills/new")}
                        className="gap-2"
                        data-testid="button-create-first-bill"
                      >
                        <Plus className="h-4 w-4" /> Create New Bill
                      </Button>
                    )}
                  </div>
                ) : selectedBill ? (
                  <div className="flex flex-col h-full bg-white">
                    {paginatedItems.map((bill: Bill) => {
                      const paymentStatus = getPaymentStatus(bill);
                      const isOverdue = bill.status === "OVERDUE" || (bill.balanceDue > 0 && new Date(bill.dueDate) < new Date());
                      const daysOverdue = isOverdue ? Math.ceil((new Date().getTime() - new Date(bill.dueDate).getTime()) / (1000 * 3600 * 24)) : 0;

                      return (
                        <div
                          key={bill.id}
                          onClick={() => handleBillClick(bill)}
                          className={`group flex items-start gap-3 p-4 border-b border-sidebar/10 cursor-pointer transition-colors hover:bg-sidebar/5 relative ${selectedBill?.id === bill.id ? "bg-sidebar/5" : ""
                            }`}
                          data-testid={`card-bill-${bill.id}`}
                        >
                          <div className="mt-1" onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={selectedBills.includes(bill.id)}
                              onCheckedChange={() => {
                                if (selectedBills.includes(bill.id)) {
                                  setSelectedBills(selectedBills.filter((i) => i !== bill.id));
                                } else {
                                  setSelectedBills([...selectedBills, bill.id]);
                                }
                              }}
                            />
                          </div>
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-semibold text-[14px] text-slate-900 truncate uppercase">
                                {bill.vendorName}
                              </h3>
                              <div className="text-right">
                                <span className="font-semibold text-[14px] text-slate-900 whitespace-nowrap block">
                                  {formatCurrency(bill.total)}
                                </span>
                                <span className="text-[11px] text-slate-500 block">
                                  Balance: {formatCurrency(bill.balanceDue)}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 text-[13px] text-slate-500">
                              <span>{bill.billNumber}</span>
                              <span className="text-slate-300">•</span>
                              <span>{formatDate(bill.billDate)}</span>
                              <span className="text-slate-300">•</span>
                              <span className="text-blue-600 font-medium">Paid: {formatCurrency(bill.amountPaid || (bill.total - bill.balanceDue))}</span>
                            </div>
                            <div className="pt-1 flex items-center justify-between">
                              {paymentStatus === "PAID" ? (
                                <span className="text-[11px] font-bold text-green-600 tracking-wider">PAID</span>
                              ) : isOverdue ? (
                                <span className="text-[11px] font-bold text-orange-500 tracking-wider">
                                  OVERDUE BY {daysOverdue} DAYS
                                </span>
                              ) : (
                                <span className="text-[11px] font-bold text-sidebar tracking-wider">OPEN</span>
                              )}
                            </div>
                          </div>
                          {selectedBill?.id === bill.id && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-sidebar" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                        <TableHead className="w-10"></TableHead>
                        <TableHead className="font-display font-semibold text-slate-500 whitespace-nowrap">Date</TableHead>
                        <TableHead className="font-display font-semibold text-slate-500 whitespace-nowrap">Bill #</TableHead>
                        <TableHead className="font-display font-semibold text-slate-500 whitespace-nowrap">Reference</TableHead>
                        <TableHead className="font-display font-semibold text-slate-500 whitespace-nowrap">Vendor Name</TableHead>
                        <TableHead className="font-display font-semibold text-slate-500 whitespace-nowrap">Status</TableHead>
                        <TableHead className="font-display font-semibold text-slate-500 whitespace-nowrap">Due Date</TableHead>
                        <TableHead className="font-display font-semibold text-right text-slate-500 whitespace-nowrap">Amount</TableHead>
                        <TableHead className="font-display font-semibold text-right text-slate-500 whitespace-nowrap">Amount Paid</TableHead>
                        <TableHead className="font-display font-semibold text-right text-slate-500 whitespace-nowrap">
                          Balance Due
                        </TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedItems.map((bill: any) => (
                        <TableRow
                          key={bill.id}
                          onClick={() => handleBillClick(bill as Bill)}
                          className={`cursor-pointer hover-elevate ${(selectedBill as any)?.id === bill.id ? "bg-blue-50/50" : ""}`}
                          data-testid={`row-bill-${bill.id}`}
                        >
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={selectedBills.includes(bill.id)}
                              onClick={(e) => toggleSelectBill(bill.id, e)}
                            />
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatDate(bill.billDate)}
                          </TableCell>
                          <TableCell className="text-sm text-blue-600 font-medium font-display hover:underline hover:text-blue-700">
                            {bill.billNumber}
                          </TableCell>
                          <TableCell className="text-sm">
                            {bill.orderNumber || "-"}
                          </TableCell>
                          <TableCell className="text-sm">{bill.vendorName}</TableCell>
                          <TableCell>{getStatusBadge(bill.status)}</TableCell>
                          <TableCell className="text-sm">
                            {formatDate(bill.dueDate)}
                          </TableCell>
                          <TableCell className="text-sm text-right">
                            {formatCurrency(bill.total)}
                          </TableCell>
                          <TableCell className="text-sm text-right">
                            {formatCurrency((bill.amountPaid !== undefined && bill.amountPaid !== null) ? bill.amountPaid : (bill.total - bill.balanceDue))}
                          </TableCell>
                          <TableCell className="text-sm text-right">
                            {formatCurrency(bill.balanceDue)}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                asChild
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setLocation(`/bills/${bill.id}/edit`);
                                  }}
                                >
                                  <Pencil className="mr-2 h-4 w-4" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(bill.id);
                                  }}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
              {filteredBills.length > 0 && (
                <div className="flex-none border-t border-slate-200 bg-white">
                  <TablePagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    itemsPerPage={itemsPerPage}
                    onPageChange={goToPage}
                  />
                </div>
              )}
            </div>

          </ResizablePanel >
        )}

        {selectedBill && (
          <>
            {!isCompact && (
              <ResizableHandle withHandle className="w-1 bg-slate-200 hover:bg-sidebar/40 hover:w-1.5 transition-all cursor-col-resize" />
            )}
            <ResizablePanel defaultSize={isCompact ? 100 : 65} minSize={isCompact ? 100 : 30} className="bg-white">
              <BillDetailPanel
                bill={selectedBill}
                branding={branding}
                organization={organization || undefined}
                onClose={handleClosePanel}
                onEdit={handleEditBill}
                onDelete={() => handleDelete(selectedBill.id)}
                onMarkPaid={handleMarkPaid}
                onRecordPayment={handleRecordPayment}
                onVoid={handleVoid}
                onClone={handleClone}
                onCreateVendorCredits={handleCreateVendorCredits}
                onViewJournal={handleViewJournal}
                onApplyCredits={handleApplyCredits}
                onExpectedPaymentDate={handleExpectedPaymentDate}
              />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup >

      {/* Record Payment Dialog */}
      < RecordPaymentDialog
        isOpen={recordPaymentDialogOpen}
        onClose={() => setRecordPaymentDialogOpen(false)}
        bill={selectedBill}
        onPaymentRecorded={handlePaymentRecorded}
      />

      {/* Delete Bill Dialog */}
      < AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Bill</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this bill? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog >

      {/* Void Bill Dialog */}
      < AlertDialog open={voidDialogOpen} onOpenChange={setVoidDialogOpen} >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Void Bill</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to void this bill? This will cancel the bill
              and it cannot be used for any transactions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmVoid}
              className="bg-red-600 hover:bg-red-700"
            >
              Void Bill
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog >

      {/* Expected Payment Date Dialog */}
      < Dialog
        open={expectedPaymentDateDialogOpen}
        onOpenChange={setExpectedPaymentDateDialogOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Expected Payment Date</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Expected Payment Date</Label>
              <Input
                type="date"
                value={expectedPaymentDate}
                onChange={(e) => setExpectedPaymentDate(e.target.value)}
                data-testid="input-expected-payment-date"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setExpectedPaymentDateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmExpectedPaymentDate}
                className="bg-sidebar hover:bg-sidebar/90 font-display"
              >
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog >

      {/* View Journal Dialog */}
      < Dialog open={journalDialogOpen} onOpenChange={setJournalDialogOpen} >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Journal Entries</DialogTitle>
          </DialogHeader>
          <div className="pt-4">
            <p className="text-xs text-slate-500 mb-2">
              Amount is displayed in your base currency{" "}
              <Badge variant="outline" className="text-xs">
                INR
              </Badge>
            </p>
            {selectedBill && (
              <>
                <h4 className="font-semibold mb-2">
                  Bill - {selectedBill.billNumber}
                </h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">ACCOUNT</TableHead>
                      <TableHead className="text-xs text-right">
                        DEBIT
                      </TableHead>
                      <TableHead className="text-xs text-right">
                        CREDIT
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedBill.journalEntries &&
                      selectedBill.journalEntries.length > 0 ? (
                      selectedBill.journalEntries.map((entry, index) => (
                        <TableRow key={index}>
                          <TableCell>{entry.account}</TableCell>
                          <TableCell className="text-right">
                            {entry.debit.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            {entry.credit.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <>
                        <TableRow>
                          <TableCell>Purchases</TableCell>
                          <TableCell className="text-right">
                            {selectedBill.subTotal.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">0.00</TableCell>
                        </TableRow>
                        {selectedBill.taxAmount &&
                          selectedBill.taxAmount > 0 && (
                            <TableRow>
                              <TableCell>Input Tax Credits (IGST)</TableCell>
                              <TableCell className="text-right">
                                {selectedBill.taxAmount.toFixed(2)}
                              </TableCell>
                              <TableCell className="text-right">0.00</TableCell>
                            </TableRow>
                          )}
                        <TableRow>
                          <TableCell>Accounts Payable</TableCell>
                          <TableCell className="text-right">0.00</TableCell>
                          <TableCell className="text-right">
                            {selectedBill.total.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      </>
                    )}
                  </TableBody>
                </Table>
              </>
            )}
            <div className="flex justify-end mt-4">
              <Button
                variant="outline"
                onClick={() => setJournalDialogOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog >

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Import Bills</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
              <Upload className="h-10 w-10 text-slate-400 mx-auto mb-3" />
              <p className="text-sm text-slate-600 mb-2">
                Drag and drop your CSV file here, or click to browse
              </p>
              <Input
                type="file"
                accept=".csv,.xlsx"
                className="hidden"
                id="import-file"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    toast({ title: `File "${file.name}" selected for import` });
                    setImportDialogOpen(false);
                  }
                }}
              />
              <Button
                variant="outline"
                onClick={() => document.getElementById('import-file')?.click()}
              >
                Browse Files
              </Button>
            </div>
            <p className="text-xs text-slate-500">
              Supported formats: CSV, XLSX
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preferences Dialog */}
      <Dialog open={preferencesDialogOpen} onOpenChange={setPreferencesDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Bills Preferences</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Show paid bills</Label>
                <p className="text-xs text-slate-500">Display bills that have been fully paid</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Show overdue alerts</Label>
                <p className="text-xs text-slate-500">Highlight overdue bills in the list</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Auto-refresh list</Label>
                <p className="text-xs text-slate-500">Automatically refresh the bills list</p>
              </div>
              <Switch />
            </div>
            <div className="space-y-2">
              <Label>Default view</Label>
              <Select defaultValue="table">
                <SelectTrigger>
                  <SelectValue placeholder="Select view" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="table">Table View</SelectItem>
                  <SelectItem value="list">List View</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setPreferencesDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                toast({ title: "Preferences saved" });
                setPreferencesDialogOpen(false);
              }}>
                Save Preferences
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div >
  );
}