import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Pencil,
  Trash2,
  ChevronDown,
  X,
  Send,
  FileText,
  Receipt,
  Package,
  Truck,
  CreditCard,
  Calendar,
  MapPin,
  Building2,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Printer,
  RefreshCw,
  ArrowUpDown,
  Upload,
  Download,
  Settings,
  Columns,
} from "lucide-react";

import { robustIframePrint } from "@/lib/robust-print";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useOrganization } from "@/context/OrganizationContext";
import { SalesPDFHeader } from "@/components/sales-pdf-header";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { usePagination } from "@/hooks/use-pagination";
import { TablePagination } from "@/components/table-pagination";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface SalesOrderListItem {
  id: string;
  date: string;
  salesOrderNumber: string;
  referenceNumber: string;
  customerName: string;
  orderStatus: string;
  invoiceStatus: string;
  paymentStatus: string;
  total: number;
  expectedShipmentDate: string;
}

interface SalesOrderItem {
  id: string;
  itemId: string;
  name: string;
  description: string;
  hsnSac: string;
  quantity: number;
  unit: string;
  rate: number;
  discount: number;
  discountType: string;
  tax: number;
  taxName: string;
  amount: number;
  ordered: number;
  invoicedQty: number;
  invoiceStatus: string;
}

interface SalesOrderInvoice {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  status: string;
  amount: number;
  balanceDue: number;
}

interface SalesOrderDetail {
  id: string;
  salesOrderNumber: string;
  referenceNumber: string;
  date: string;
  expectedShipmentDate: string;
  customerId: string;
  customerName: string;
  billingAddress: {
    street: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
  };
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
  };
  paymentTerms: string;
  deliveryMethod: string;
  salesperson: string;
  placeOfSupply: string;
  items: SalesOrderItem[];
  subTotal: number;
  shippingCharges: number;
  cgst: number;
  sgst: number;
  igst: number;
  adjustment: number;
  total: number;
  customerNotes: string;
  termsAndConditions: string;
  orderStatus: string;
  invoiceStatus: string;
  paymentStatus: string;
  shipmentStatus: string;
  invoices?: SalesOrderInvoice[];
  createdAt?: string;
  createdBy?: string;
}

const formatCurrency = (amount: number) => {
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (dateString: string) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatAddress = (address: any) => {
  if (!address) return ['-'];
  const parts = [address.street, address.city, address.state, address.country, address.pincode].filter(Boolean);
  return parts.length > 0 ? parts : ['-'];
};

const getStatusBadgeStyles = (status: string) => {
  const statusLower = status?.toLowerCase() || '';
  if (statusLower === 'confirmed' || statusLower === 'closed' || statusLower === 'invoiced' || statusLower === 'paid' || statusLower === 'shipped' || statusLower === 'delivered' || statusLower === 'partially invoiced') {
    return 'bg-green-50 text-green-700 border-green-200 font-display font-bold text-[10px] uppercase tracking-wider px-2 py-0.5';
  }
  if (statusLower === 'draft' || statusLower === 'pending' || statusLower === 'not invoiced' || statusLower === 'unpaid') {
    return 'bg-amber-50 text-amber-700 border-amber-200 font-display font-bold text-[10px] uppercase tracking-wider px-2 py-0.5';
  }
  if (statusLower === 'cancelled' || statusLower === 'void') {
    return 'bg-red-50 text-red-700 border-red-200 font-display font-bold text-[10px] uppercase tracking-wider px-2 py-0.5';
  }
  return 'bg-slate-50 text-slate-600 border-slate-200 font-display font-bold text-[10px] uppercase tracking-wider px-2 py-0.5';
};

interface SalesOrderDetailPanelProps {
  order: SalesOrderDetail;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onConvertToInvoice: () => void;
  onConvertSelectedItems: () => void;
}

function SalesOrderPdfPreview({ order, branding, organization }: { order: SalesOrderDetail; branding?: any; organization?: any }) {
  return (
    <div id="sales-order-pdf-preview" style={{
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      backgroundColor: '#ffffff',
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
          <SalesPDFHeader
            logo={branding?.logo || undefined}
            documentTitle="SALES ORDER"
            documentNumber={order.salesOrderNumber}
            date={order.date}
            referenceNumber={order.referenceNumber}
            organization={organization}
          />
        </div>

        {/* Addresses Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 mb-10" style={{ display: 'grid', marginBottom: '40px' }}>
          <div style={{ borderLeft: '3px solid #f1f5f9', paddingLeft: '20px' }}>
            <h3 style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px', margin: '0 0 12px 0' }}>
              BILL TO
            </h3>
            <p style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a', marginBottom: '6px', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
              {order.customerName}
            </p>
            <div style={{ fontSize: '13px', color: '#475569', lineHeight: '1.6' }}>
              {formatAddress(order.billingAddress).map((line, i) => (
                <p key={i} style={{ margin: '0' }}>{line}</p>
              ))}
            </div>
          </div>
          <div style={{ borderLeft: '3px solid #f1f5f9', paddingLeft: '20px' }}>
            <h3 style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px', margin: '0 0 12px 0' }}>
              SHIP TO
            </h3>
            <p style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a', marginBottom: '6px', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
              {order.customerName}
            </p>
            <div style={{ fontSize: '13px', color: '#475569', lineHeight: '1.6' }}>
              {formatAddress(order.shippingAddress).map((line, i) => (
                <p key={i} style={{ margin: '0' }}>{line}</p>
              ))}
            </div>
          </div>
        </div>

        {/* Meta Information Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-[2px] mb-10 bg-slate-100 rounded-lg overflow-hidden border border-slate-100" style={{
          marginBottom: '40px',
          backgroundColor: '#f1f5f9',
          border: '1px solid #f1f5f9'
        }}>
          <div style={{ backgroundColor: '#ffffff', padding: '16px' }}>
            <p style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px 0' }}>Order Date</p>
            <p style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', margin: '0' }}>{formatDate(order.date)}</p>
          </div>
          <div style={{ backgroundColor: '#ffffff', padding: '16px' }}>
            <p style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px 0' }}>Expected Shipment</p>
            <p style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', margin: '0' }}>{formatDate(order.expectedShipmentDate)}</p>
          </div>
          <div style={{ backgroundColor: '#ffffff', padding: '16px' }}>
            <p style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px 0' }}>Payment Terms</p>
            <p style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', margin: '0' }}>{order.paymentTerms || 'Due on Receipt'}</p>
          </div>
          <div style={{ backgroundColor: '#ffffff', padding: '16px' }}>
            <p style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px 0' }}>Place of Supply</p>
            <p style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', margin: '0' }}>{order.placeOfSupply || '-'}</p>
          </div>
        </div>

        {/* Items Table */}
        <div style={{ marginBottom: '32px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '500px' }}>
            <thead>
              <tr style={{ backgroundColor: '#1e40af', color: '#ffffff' }}>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', borderRadius: '4px 0 0 0' }}>#</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Item & Description</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>HSN/SAC</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Qty</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Rate</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right', borderRadius: '0 4px 0 0' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, index) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '16px', fontSize: '13px', color: '#64748b', verticalAlign: 'top' }}>{index + 1}</td>
                  <td style={{ padding: '16px', verticalAlign: 'top' }}>
                    <p style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px 0' }}>{item.name}</p>
                    {item.description && (
                      <p style={{ fontSize: '12px', color: '#64748b', margin: '0', lineHeight: '1.4' }}>{item.description}</p>
                    )}
                  </td>
                  <td style={{ padding: '16px', fontSize: '13px', color: '#64748b', textAlign: 'center', verticalAlign: 'top' }}>{item.hsnSac || '-'}</td>
                  <td style={{ padding: '16px', fontSize: '13px', color: '#0f172a', textAlign: 'center', verticalAlign: 'top', fontWeight: '600' }}>
                    {item.ordered} {item.unit}
                  </td>
                  <td style={{ padding: '16px', fontSize: '13px', color: '#0f172a', textAlign: 'right', verticalAlign: 'top' }}>
                    {formatCurrency(item.rate)}
                  </td>
                  <td style={{ padding: '16px', fontSize: '13px', color: '#0f172a', textAlign: 'right', verticalAlign: 'top', fontWeight: '700' }}>
                    {formatCurrency(item.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '40px' }}>
          <div style={{ width: '320px', backgroundColor: '#f8fafc', borderRadius: '8px', padding: '20px', border: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '13px' }}>
              <span style={{ color: '#64748b', fontWeight: '600' }}>Sub Total</span>
              <span style={{ color: '#0f172a', fontWeight: '700' }}>{formatCurrency(order.subTotal)}</span>
            </div>
            {order.shippingCharges > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '13px' }}>
                <span style={{ color: '#64748b', fontWeight: '600' }}>Shipping Charges</span>
                <span style={{ color: '#0f172a', fontWeight: '700' }}>{formatCurrency(order.shippingCharges)}</span>
              </div>
            )}
            {order.cgst > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '13px' }}>
                <span style={{ color: '#64748b', fontWeight: '600' }}>CGST (9.0%)</span>
                <span style={{ color: '#0f172a', fontWeight: '700' }}>{formatCurrency(order.cgst)}</span>
              </div>
            )}
            {order.sgst > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '13px' }}>
                <span style={{ color: '#64748b', fontWeight: '600' }}>SGST (9.0%)</span>
                <span style={{ color: '#0f172a', fontWeight: '700' }}>{formatCurrency(order.sgst)}</span>
              </div>
            )}
            {order.igst > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '13px' }}>
                <span style={{ color: '#64748b', fontWeight: '600' }}>IGST (18.0%)</span>
                <span style={{ color: '#0f172a', fontWeight: '700' }}>{formatCurrency(order.igst)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', paddingTop: '16px', borderTop: '2px solid #e2e8f0' }}>
              <span style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>Total</span>
              <span style={{ fontSize: '18px', fontWeight: '800', color: '#1e40af' }}>{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Notes & Terms */}
        <div className="grid grid-cols-1 gap-6 mb-10" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
          {order.customerNotes && (
            <div style={{ backgroundColor: '#fdfdfd', padding: '16px', borderRadius: '4px', borderLeft: '4px solid #cbd5e1' }}>
              <h4 style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', margin: '0 0 8px 0' }}>
                Customer Notes
              </h4>
              <p style={{ fontSize: '13px', color: '#475569', margin: '0', lineHeight: '1.6' }}>{order.customerNotes}</p>
            </div>
          )}

          {order.termsAndConditions && (
            <div style={{ backgroundColor: '#fdfdfd', padding: '16px', borderRadius: '4px', borderLeft: '4px solid #cbd5e1' }}>
              <h4 style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', margin: '0 0 8px 0' }}>
                Terms & Conditions
              </h4>
              <div style={{ fontSize: '12px', color: '#475569', margin: '0', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                {order.termsAndConditions}
              </div>
            </div>
          )}
        </div>

        {/* Signature Section */}
        <div style={{ marginTop: '64px', display: 'flex', justifyContent: 'flex-end', textAlign: 'center' }}>
          <div>
            {branding?.signature?.url ? (
              <img
                src={branding.signature.url}
                alt="Signature"
                style={{ maxHeight: '80px', maxWidth: '200px', objectFit: 'contain', marginBottom: '8px' }}
              />
            ) : (
              <div style={{ height: '80px', width: '200px', borderBottom: '1px solid #e2e8f0', marginBottom: '8px' }}></div>
            )}
            <p style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '1px', margin: '0' }}>
              Authorized Signature
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SalesOrderDetailPanel({ order, branding, organization, onClose, onEdit, onDelete, onConvertToInvoice, onConvertSelectedItems }: SalesOrderDetailPanelProps & { branding?: any; organization?: any }) {
  const [activeTab, setActiveTab] = useState("details");
  const [showPdfPreview, setShowPdfPreview] = useState(true);
  const { toast } = useToast();

  const handlePrint = async () => {
    toast({ title: "Preparing print...", description: "Please wait while we generate the Sales Order preview." });
    if (!showPdfPreview) {
      setShowPdfPreview(true);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    try {
      await robustIframePrint('sales-order-pdf-preview', `SalesOrder_${order.salesOrderNumber}`);
    } catch (error) {
      console.error('Print failed:', error);
      toast({ title: "Print failed", variant: "destructive" });
    }
  };

  const handleDownloadPDF = async () => {
    toast({ title: "Preparing download...", description: "Please wait while we generate your PDF." });
    try {
      // Import the unified PDF utility
      const { generatePDFFromElement } = await import("@/lib/pdf-utils");

      // Generate PDF from the existing PDF view
      await generatePDFFromElement("sales-order-pdf-preview", `SalesOrder-${order.salesOrderNumber}.pdf`);

      toast({
        title: "PDF Downloaded",
        description: `${order.salesOrderNumber}.pdf has been downloaded successfully.`
      });
    } catch (error) {
      console.error("PDF generation error:", error);
      toast({
        title: "Failed to download PDF",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between px-6 py-4 bg-sidebar-accent/5 border-b border-sidebar/10 shadow-sm z-10">
        <div>
          <h2 className="text-xl font-bold text-sidebar font-display tracking-tight" data-testid="text-order-number">{order.salesOrderNumber}</h2>
          <p className="text-sm font-medium text-sidebar/60 font-display">{order.customerName}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-sidebar/10 shadow-sm">
            <span className="text-[10px] font-bold text-sidebar uppercase tracking-widest font-display">PDF View</span>
            <Switch checked={showPdfPreview} onCheckedChange={setShowPdfPreview} className="data-[state=checked]:bg-sidebar" />
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-9 w-9 rounded-full hover:bg-sidebar/10 text-sidebar/70" data-testid="button-close-panel">
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 px-6 py-3 bg-white border-b border-sidebar/10 overflow-x-auto flex-wrap scrollbar-hide">
        <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-slate-600 hover:text-sidebar hover:bg-sidebar/5 font-bold font-display" onClick={onEdit} data-testid="button-edit-order">
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </Button>
        <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-slate-600 hover:text-sidebar hover:bg-sidebar/5 font-bold font-display" data-testid="button-send-email">
          <Send className="h-3.5 w-3.5" />
          Send Email
        </Button>
        <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-slate-600 hover:text-sidebar hover:bg-sidebar/5 font-bold font-display" onClick={handleDownloadPDF} data-testid="button-download">
          <Download className="h-3.5 w-3.5" />
          Download PDF
        </Button>
        <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-slate-600 hover:text-sidebar hover:bg-sidebar/5 font-bold font-display" onClick={handlePrint} data-testid="button-print">
          <Printer className="h-3.5 w-3.5" />
          Print
        </Button>
        <div className="h-4 w-[1px] bg-slate-200 mx-1" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-sidebar font-bold font-display hover:bg-sidebar/5 disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="button-convert-invoice"
              disabled={order.invoiceStatus === 'Invoiced' || order.orderStatus === 'CLOSED'}
            >
              <Receipt className="h-3.5 w-3.5" />
              {order.invoiceStatus === 'Invoiced' || order.orderStatus === 'CLOSED' ? 'Invoiced' : 'Convert to Invoice'}
              <ChevronDown className="h-3.5 w-3.5 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 font-display">
            <DropdownMenuItem
              onClick={onConvertToInvoice}
              className="font-medium"
              data-testid="menu-item-invoice-all"
              disabled={order.invoiceStatus === 'Invoiced'}
            >
              <Receipt className="mr-2 h-4 w-4 opacity-70" /> Invoice All Items
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onConvertSelectedItems}
              className="font-medium"
              data-testid="menu-item-invoice-selected"
              disabled={order.invoiceStatus === 'Invoiced'}
            >
              <Package className="mr-2 h-4 w-4 opacity-70" /> Invoice Selected Items
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-sidebar/5 text-sidebar/70" data-testid="button-more-options">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem data-testid="menu-item-clone">
              <FileText className="mr-2 h-4 w-4" /> Clone
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive" data-testid="menu-item-delete">
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {showPdfPreview ? (
        <div className="flex-1 overflow-auto scrollbar-hide bg-slate-100 dark:bg-slate-800 p-8 flex justify-center">
          <div className="w-full max-w-[210mm] shadow-lg bg-white dark:bg-white">
            <SalesOrderPdfPreview order={order} branding={branding} organization={organization} />
          </div>
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center px-6 border-b border-sidebar/10">
            <TabsList className="h-auto p-0 bg-transparent gap-8">
              <TabsTrigger
                value="details"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-sidebar data-[state=active]:text-sidebar data-[state=active]:bg-transparent data-[state=active]:shadow-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-0 py-4 font-bold font-display text-xs uppercase tracking-[0.15em] transition-all"
                data-testid="tab-details"
              >
                Order Details
              </TabsTrigger>
              <TabsTrigger
                value="invoices"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-sidebar data-[state=active]:text-sidebar data-[state=active]:bg-transparent data-[state=active]:shadow-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-0 py-4 font-bold font-display text-xs uppercase tracking-[0.15em] transition-all"
                data-testid="tab-invoices"
              >
                Invoices ({order.invoices?.length || 0})
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="details" className="flex-1 overflow-auto scrollbar-hide p-6 mt-0">
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-50 dark:bg-slate-800 rounded-md p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="h-4 w-4 text-slate-500" />
                    <span className="text-xs text-slate-500 uppercase">Order Status</span>
                  </div>
                  <Badge className={getStatusBadgeStyles(order.orderStatus)}>
                    {order.orderStatus}
                  </Badge>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-md p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Receipt className="h-4 w-4 text-slate-500" />
                    <span className="text-xs text-slate-500 uppercase">Invoice Status</span>
                  </div>
                  <Badge className={getStatusBadgeStyles(order.invoiceStatus)}>
                    {order.invoiceStatus}
                  </Badge>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-md p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="h-4 w-4 text-slate-500" />
                    <span className="text-xs text-slate-500 uppercase">Payment Status</span>
                  </div>
                  <Badge className={getStatusBadgeStyles(order.paymentStatus)}>
                    {order.paymentStatus}
                  </Badge>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-md p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Truck className="h-4 w-4 text-slate-500" />
                    <span className="text-xs text-slate-500 uppercase">Shipment</span>
                  </div>
                  <Badge className={getStatusBadgeStyles(order.shipmentStatus)}>
                    {order.shipmentStatus}
                  </Badge>
                </div>
              </div>

              <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-slate-500" /> Billing Address
                    </h4>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      {formatAddress(order.billingAddress).map((line, i) => (
                        <p key={i}>{line}</p>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                      <Truck className="h-4 w-4 text-slate-500" /> Shipping Address
                    </h4>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      {formatAddress(order.shippingAddress).map((line, i) => (
                        <p key={i}>{line}</p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                <h4 className="text-[10px] font-bold text-sidebar uppercase tracking-[0.2em] font-display mb-4">Items</h4>
                <div className="border border-sidebar/10 rounded-lg overflow-hidden shadow-sm">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-sidebar-accent/5 border-b border-sidebar/10">
                        <th className="px-4 py-3 text-left text-[10px] font-bold text-sidebar uppercase tracking-wider font-display">Items & Description</th>
                        <th className="px-4 py-3 text-right text-[10px] font-bold text-sidebar uppercase tracking-wider font-display">Ordered</th>
                        <th className="px-4 py-3 text-center text-[10px] font-bold text-sidebar uppercase tracking-wider font-display">Status</th>
                        <th className="px-4 py-3 text-right text-[10px] font-bold text-sidebar uppercase tracking-wider font-display">Rate</th>
                        <th className="px-4 py-3 text-right text-[10px] font-bold text-sidebar uppercase tracking-wider font-display">Discount</th>
                        <th className="px-4 py-3 text-right text-[10px] font-bold text-sidebar uppercase tracking-wider font-display">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {order.items.map((item) => (
                        <tr key={item.id} data-testid={`row-item-${item.id}`}>
                          <td className="px-4 py-3">
                            <div className="font-medium text-slate-900 dark:text-white">{item.name}</div>
                            {item.description && <div className="text-xs text-slate-500">{item.description}</div>}
                            {item.hsnSac && <div className="text-xs text-slate-400">HSN/SAC: {item.hsnSac}</div>}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400">{item.ordered} {item.unit}</td>
                          <td className="px-4 py-3 text-center">
                            <Badge variant="outline" className={getStatusBadgeStyles(item.invoiceStatus)}>
                              {item.invoiceStatus}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400">{formatCurrency(item.rate)}</td>
                          <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400">
                            {item.discount > 0 ? (item.discountType === 'percentage' ? `${item.discount}%` : formatCurrency(item.discount)) : '-'}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-slate-900 dark:text-white">{formatCurrency(item.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="border-t border-sidebar/10 pt-8">
                <div className="flex justify-end">
                  <div className="w-80 bg-sidebar-accent/5 rounded-lg p-6 space-y-4 border border-sidebar/10 shadow-sm">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500 font-medium">Sub Total</span>
                      <span className="text-slate-700 font-bold font-display">{formatCurrency(order.subTotal)}</span>
                    </div>
                    {order.shippingCharges > 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500 font-medium">Shipping Charges</span>
                        <span className="text-slate-700 font-bold font-display">{formatCurrency(order.shippingCharges)}</span>
                      </div>
                    )}
                    {(order.cgst > 0 || order.sgst > 0 || order.igst > 0) && (
                      <div className="space-y-3 pt-2 border-t border-sidebar/5">
                        {order.cgst > 0 && (
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-400 font-medium uppercase tracking-tight">CGST (9%)</span>
                            <span className="text-slate-600 font-bold font-display">{formatCurrency(order.cgst)}</span>
                          </div>
                        )}
                        {order.sgst > 0 && (
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-400 font-medium uppercase tracking-tight">SGST (9%)</span>
                            <span className="text-slate-600 font-bold font-display">{formatCurrency(order.sgst)}</span>
                          </div>
                        )}
                        {order.igst > 0 && (
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-400 font-medium uppercase tracking-tight">IGST (18%)</span>
                            <span className="text-slate-600 font-bold font-display">{formatCurrency(order.igst)}</span>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex justify-between items-center text-base font-bold text-slate-900 border-t border-sidebar/10 pt-4 mt-2">
                      <span className="font-display uppercase tracking-wider text-xs">Total ( ₹ )</span>
                      <span className="text-2xl text-sidebar font-display tracking-tight">{formatCurrency(order.total)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {order.customerNotes && (
                <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                  <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-2">Customer Notes</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{order.customerNotes}</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="invoices" className="flex-1 overflow-auto scrollbar-hide p-6 mt-0">
            {order.invoices && order.invoices.length > 0 ? (
              <div className="space-y-4">
                {order.invoices.map((invoice) => (
                  <div key={invoice.id} className="border border-slate-200 dark:border-slate-700 rounded-md p-4" data-testid={`card-invoice-${invoice.id}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{invoice.invoiceNumber}</p>
                        <p className="text-sm text-slate-500">{formatDate(invoice.date)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-slate-900 dark:text-white">{formatCurrency(invoice.amount)}</p>
                        <Badge className={getStatusBadgeStyles(invoice.status)}>{invoice.status}</Badge>
                      </div>
                    </div>
                    {invoice.balanceDue > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between text-sm">
                        <span className="text-slate-500">Balance Due</span>
                        <span className="text-amber-600 font-medium">{formatCurrency(invoice.balanceDue)}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Receipt className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                <p className="text-sm">No invoices yet</p>
                <p className="text-xs text-slate-400">Convert this order to an invoice to get started</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* 
      <div className="border-t border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between">
        <Button variant="ghost" size="icon" data-testid="button-prev-order">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" data-testid="button-next-order">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      */}
    </div>
  );
}

export default function SalesOrdersPage() {
  const { token } = useAuthStore();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { currentOrganization } = useOrganization();
  const [salesOrders, setSalesOrders] = useState<SalesOrderListItem[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [selectedItemsForInvoice, setSelectedItemsForInvoice] = useState<string[]>([]);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [branding, setBranding] = useState<any>(null);

  useEffect(() => {
    fetchSalesOrders();
    fetchBranding();
  }, []);

  const fetchBranding = async () => {
    try {
      const response = await fetch("/api/branding", {
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      });
      const data = await response.json();
      if (data.success) {
        setBranding(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch branding:", error);
    }
  };

  const fetchSalesOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/sales-orders', {
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      });
      if (response.ok) {
        const data = await response.json();
        setSalesOrders(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch sales orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetail = async (id: string) => {
    try {
      const response = await fetch(`/api/sales-orders/${id}`, {
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      });
      if (response.ok) {
        const data = await response.json();
        setSelectedOrder(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch order detail:', error);
    }
  };

  const handleOrderClick = (order: SalesOrderListItem) => {
    fetchOrderDetail(order.id);
  };

  const handleClosePanel = () => {
    setSelectedOrder(null);
  };

  const handleEditOrder = () => {
    if (selectedOrder) {
      setLocation(`/sales-orders/${selectedOrder.id}/edit`);
    }
  };

  const toggleSelectOrder = (id: string, e?: React.MouseEvent) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (selectedOrders.includes(id)) {
      setSelectedOrders(selectedOrders.filter(i => i !== id));
    } else {
      setSelectedOrders([...selectedOrders, id]);
    }
  };

  const handleDeleteClick = () => {
    if (selectedOrder) {
      setOrderToDelete(selectedOrder.id);
      setDeleteDialogOpen(true);
    }
  };

  const confirmDelete = async () => {
    if (!orderToDelete) return;
    try {
      const response = await fetch(`/api/sales-orders/${orderToDelete}`, {
        method: 'DELETE',
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      });
      if (response.ok) {
        toast({ title: "Sales order deleted successfully" });
        handleClosePanel();
        fetchSalesOrders();
      }
    } catch (error) {
      toast({ title: "Failed to delete sales order", variant: "destructive" });
    } finally {
      setDeleteDialogOpen(false);
      setOrderToDelete(null);
    }
  };

  const handleDeleteOrder = async (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOrderToDelete(orderId);
    setDeleteDialogOpen(true);
  };

  const handleConvertToInvoice = async () => {
    if (!selectedOrder) return;

    try {
      // Create invoice with all items
      const invoiceData = {
        salesOrderId: selectedOrder.id,
        customerId: selectedOrder.customerId,
        customerName: selectedOrder.customerName,
        items: selectedOrder.items.filter(item => (item.quantity - (item.invoicedQty || 0)) > 0),
        convertAll: true,
        billingAddress: selectedOrder.billingAddress,
        shippingAddress: selectedOrder.shippingAddress,
        paymentTerms: selectedOrder.paymentTerms,
        notes: `Converted from Sales Order: ${selectedOrder.salesOrderNumber}`
      };

      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify(invoiceData)
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Invoice Created Successfully",
          description: `Invoice ${result.data.invoiceNumber} has been created from sales order ${selectedOrder.salesOrderNumber}`
        });

        // Refresh sales order data and navigate to invoices
        await fetchOrderDetail(selectedOrder.id);
        await fetchSalesOrders();
        setLocation('/invoices');
      } else {
        throw new Error('Failed to create invoice');
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast({
        title: "Failed to Create Invoice",
        description: "There was an error creating the invoice. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleConvertSelectedItems = () => {
    if (!selectedOrder) return;
    // Open dialog to select items
    setSelectedItemsForInvoice([]);
    setInvoiceDialogOpen(true);
  };

  const handleConfirmSelectedItems = async () => {
    if (!selectedOrder || selectedItemsForInvoice.length === 0) {
      toast({ title: "Please select at least one item", variant: "destructive" });
      return;
    }

    try {
      // Filter selected items and ensure they have remaining quantity
      const selectedItems = selectedOrder.items
        .filter(item => selectedItemsForInvoice.includes(item.id))
        .filter(item => (item.quantity - (item.invoicedQty || 0)) > 0);

      if (selectedItems.length === 0) {
        toast({
          title: "No Items to Invoice",
          description: "All selected items have already been fully invoiced.",
          variant: "destructive"
        });
        return;
      }

      // Calculate invoice totals from selected items
      const calculateInvoiceTotals = (items: SalesOrderItem[]) => {
        let subtotal = 0;
        let totalTax = 0;

        items.forEach(item => {
          const itemSubtotal = item.quantity * item.rate;
          const discountAmount = item.discountType === 'percentage'
            ? (itemSubtotal * item.discount) / 100
            : item.discount;
          const taxableAmount = itemSubtotal - discountAmount;
          const taxAmount = (taxableAmount * item.tax) / 100;

          subtotal += taxableAmount;
          totalTax += taxAmount;
        });

        const total = subtotal + totalTax;

        return {
          subTotal: subtotal,
          totalTax,
          total,
          cgst: 0, // Will be calculated based on tax preference
          sgst: 0,
          igst: totalTax // Assuming IGST for now
        };
      };

      const totals = calculateInvoiceTotals(selectedItems);

      // Create invoice with selected items and calculated totals
      const invoiceData = {
        date: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
        salesOrderId: selectedOrder.id,
        customerId: selectedOrder.customerId,
        customerName: selectedOrder.customerName,
        items: selectedItems,
        convertAll: false,
        selectedItemIds: selectedItemsForInvoice,
        billingAddress: selectedOrder.billingAddress,
        shippingAddress: selectedOrder.shippingAddress,
        paymentTerms: selectedOrder.paymentTerms,
        subTotal: totals.subTotal,
        shippingCharges: 0,
        cgst: totals.cgst,
        sgst: totals.sgst,
        igst: totals.igst,
        adjustment: 0,
        total: totals.total,
        status: 'pending',
        customerNotes: '',
        termsAndConditions: '',
        notes: `Converted from Sales Order: ${selectedOrder.salesOrderNumber} (${selectedItems.length} selected items)`
      };

      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify(invoiceData)
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Invoice Created Successfully",
          description: `Invoice ${result.data.invoiceNumber} has been created with ${selectedItems.length} items from sales order ${selectedOrder.salesOrderNumber}`
        });

        // Close dialog, refresh data and navigate to invoices
        setInvoiceDialogOpen(false);
        setSelectedItemsForInvoice([]);
        await fetchOrderDetail(selectedOrder.id);
        await fetchSalesOrders();
        setLocation('/invoices');
      } else {
        throw new Error('Failed to create invoice');
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast({
        title: "Failed to Create Invoice",
        description: "There was an error creating the invoice. Please try again.",
        variant: "destructive"
      });
    }
  };

  const toggleItemSelection = (itemId: string) => {
    if (!selectedOrder) return;

    const item = selectedOrder.items.find(i => i.id === itemId);
    if (!item) return;

    const remainingQty = item.quantity - (item.invoicedQty || 0);
    if (remainingQty <= 0) return; // Don't allow selection of fully invoiced items

    setSelectedItemsForInvoice(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const applyFilter = (orderList: SalesOrderListItem[]) => {
    if (activeFilter === "All") return orderList;
    return orderList.filter(order => {
      const orderStatus = order.orderStatus?.toUpperCase() || "";
      const invoiceStatus = order.invoiceStatus?.toUpperCase() || "";
      switch (activeFilter) {
        case "Draft":
          return orderStatus === "DRAFT";
        case "Pending Approval":
          return orderStatus === "PENDING_APPROVAL" || orderStatus === "PENDING APPROVAL";
        case "Approved":
          return orderStatus === "APPROVED";
        case "Confirmed":
          return orderStatus === "CONFIRMED";
        case "Overdue":
          return orderStatus === "OVERDUE";
        case "Partially Invoiced":
          return invoiceStatus === "PARTIALLY_INVOICED" || invoiceStatus === "PARTIALLY INVOICED";
        case "Invoiced":
          return invoiceStatus === "INVOICED";
        case "Closed":
          return orderStatus === "CLOSED";
        default:
          return true;
      }
    });
  };

  const [sortBy, setSortBy] = useState<string>("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const sortOrders = (orderList: SalesOrderListItem[]) => {
    return [...orderList].sort((a, b) => {
      let aValue: any = a[sortBy as keyof SalesOrderListItem] || "";
      let bValue: any = b[sortBy as keyof SalesOrderListItem] || "";

      if (typeof aValue === "string") aValue = aValue.toLowerCase();
      if (typeof bValue === "string") bValue = bValue.toLowerCase();

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  };

  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    // Generate dummy content for the file
    let content = "";
    let mimeType = "";
    let fileName = `sales_orders_export_${new Date().toISOString().split('T')[0]}`;

    if (format === 'csv') {
      content = "Date,Order Number,Reference,Customer Name,Status,Amount\n";
      filteredOrders.forEach(order => {
        content += `${order.date},${order.salesOrderNumber},${order.referenceNumber || ""},${order.customerName},${order.orderStatus},${order.total}\n`;
      });
      mimeType = "text/csv";
      fileName += ".csv";
    } else if (format === 'excel') {
      // For Excel, we'll provide a CSV that Excel can open, or a simple text representation
      content = "Date\tOrder Number\tReference\tCustomer Name\tStatus\tAmount\n";
      filteredOrders.forEach(order => {
        content += `${order.date}\t${order.salesOrderNumber}\t${order.referenceNumber || ""}\t${order.customerName}\t${order.orderStatus}\t${order.total}\n`;
      });
      mimeType = "application/vnd.ms-excel";
      fileName += ".xls";

      // Create a blob and download link
      const blob = new Blob([content], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } else {
      // PDF generation using jsPDF
      const doc = new jsPDF();

      doc.setFontSize(18);
      doc.text("Sales Orders Export", 14, 22);
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

      const tableColumn = ["Date", "Order Number", "Customer Name", "Status", "Amount"];
      const tableRows: any[] = [];

      filteredOrders.forEach(order => {
        const orderData = [
          order.date,
          order.salesOrderNumber,
          order.customerName,
          order.orderStatus,
          `₹${order.total.toFixed(2)}`
        ];
        tableRows.push(orderData);
      });

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 35,
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255] },
        alternateRowStyles: { fillColor: [248, 250, 252] }
      });

      doc.save(fileName + ".pdf");
    }

    toast({
      title: `Export Successful`,
      description: `Your sales orders have been exported as ${format.toUpperCase()}.`
    });
  };

  const handleImport = () => {
    // Create a hidden input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.xlsx,.xls'; // Common spreadsheet formats
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        toast({
          title: "File Selected",
          description: `Importing ${file.name}... This feature will be fully implemented soon.`,
        });
      }
    };
    input.click();
  };

  const handlePreferences = () => {
    toast({ title: "Preferences", description: "This feature will be fully implemented soon." });
  };

  const fieldMapping: Record<string, string> = {
    "Date": "date",
    "Order Number": "salesOrderNumber",
    "Customer Name": "customerName",
    "Amount": "total"
  };

  const filteredOrders = sortOrders(applyFilter(salesOrders).filter(order =>
    order.salesOrderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (order.referenceNumber && order.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  ));

  const { currentPage, totalPages, totalItems, itemsPerPage, paginatedItems, goToPage } = usePagination(filteredOrders, 10);

  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    const checkCompact = () => {
      setIsCompact(window.innerWidth < 1280);
    };

    // Initial check
    checkCompact();

    window.addEventListener('resize', checkCompact);
    return () => window.removeEventListener('resize', checkCompact);
  }, []);

  return (
    <div className="flex h-screen animate-in fade-in duration-300 w-full overflow-hidden bg-slate-50">
      <ResizablePanelGroup key={`${selectedOrder ? "split" : "single"}-${isCompact ? "compact" : "full"}`} direction="horizontal" className="h-full w-full">
        {(!isCompact || !selectedOrder) && (
          <ResizablePanel
            defaultSize={isCompact ? 100 : (selectedOrder ? 30 : 100)}
            minSize={isCompact ? 100 : (selectedOrder ? 30 : 100)}
            maxSize={isCompact ? 100 : (selectedOrder ? 30 : 100)}
            className="flex flex-col overflow-hidden bg-white border-r border-slate-200 min-w-[25%]"
          >
            <div className="flex flex-col h-full overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white sticky top-0 z-10 min-h-[73px] h-auto">
                <div className="flex items-center gap-4 flex-1 overflow-hidden">
                  <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="gap-2 text-xl font-bold font-display text-sidebar hover:text-sidebar/80 hover:bg-transparent p-0 h-auto transition-all text-left">
                          <span className={selectedOrder ? "text-base sm:text-lg lg:text-xl truncate" : "text-xl truncate"}>
                            {activeFilter === "All" ? "All Sales Orders" : `${activeFilter} Sales Orders`}
                          </span>
                          <ChevronDown className="h-5 w-5 text-sidebar/50" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-64 font-display">
                        <DropdownMenuItem onClick={() => setActiveFilter("All")}>
                          All
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setActiveFilter("Draft")}>
                          Draft
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setActiveFilter("Pending Approval")}>
                          Pending Approval
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setActiveFilter("Approved")}>
                          Approved
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setActiveFilter("Confirmed")}>
                          Confirmed
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setActiveFilter("Overdue")}>
                          Overdue
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setActiveFilter("Partially Invoiced")}>
                          Partially Invoiced
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setActiveFilter("Invoiced")}>
                          Invoiced
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setActiveFilter("Closed")}>
                          Closed
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    {!selectedOrder && <span className="text-sm text-slate-400 font-display font-medium bg-slate-100 px-2 py-0.5 rounded-full ml-1">{salesOrders.length}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selectedOrder ? (
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
                        <Search className="h-4 w-4 text-slate-500" />
                      </Button>
                    )
                  ) : (
                    <div className="relative w-[240px] hidden sm:block">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="Search sales orders..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 h-9"
                        data-testid="input-search-sales-orders"
                      />
                    </div>
                  )}
                  <Button
                    onClick={() => setLocation("/sales-orders/create")}
                    className={cn(
                      "bg-sidebar hover:bg-sidebar/90 text-white font-bold font-display gap-1.5 h-9 shadow-sm hover:shadow-md transition-all",
                      selectedOrder ? "w-9 px-0" : "px-4"
                    )}
                    size={selectedOrder ? "icon" : "default"}
                    data-testid="button-new-order"
                  >
                    <Plus className="h-4 w-4" strokeWidth={2.5} />
                    {!selectedOrder && <span>New</span>}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" className="h-9 w-9" data-testid="button-more-options">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger className="flex items-center gap-2 py-2 cursor-pointer hover:bg-slate-50 data-[state=open]:bg-slate-50">
                          <ArrowUpDown className="h-4 w-4 text-slate-500" />
                          <span className="flex-1 font-bold text-slate-700">Sort by</span>
                          <div className="flex items-center gap-0.5">
                            <ChevronRight className="h-4 w-4 text-slate-400" />
                            <ChevronRight className="h-4 w-4 text-slate-400 -ml-2.5" />
                          </div>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                          <DropdownMenuSubContent className="w-48 p-0 border border-slate-200 shadow-lg">
                            {Object.keys(fieldMapping).map((label) => (
                              <DropdownMenuItem
                                key={label}
                                onClick={() => handleSort(fieldMapping[label])}
                                className={`flex items-center justify-between px-3 py-2 cursor-pointer ${sortBy === fieldMapping[label] ? 'bg-slate-100 text-slate-900 focus:bg-slate-100 focus:text-slate-900' : 'hover:bg-slate-50'}`}
                              >
                                <span className="font-bold text-slate-700">{label}</span>
                                {sortBy === fieldMapping[label] && (
                                  <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${sortOrder === 'asc' ? 'rotate-180' : ''}`} />
                                )}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                      </DropdownMenuSub>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleImport} className="flex items-center gap-2 py-2 cursor-pointer">
                        <Download className="h-4 w-4 text-slate-500" />
                        <span className="font-bold text-slate-700">Import Sales Orders</span>
                      </DropdownMenuItem>
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger className="flex items-center gap-2 py-2 cursor-pointer hover:bg-slate-50 data-[state=open]:bg-slate-50">
                          <Upload className="h-4 w-4 text-slate-500" />
                          <span className="flex-1 font-bold text-slate-700">Export Sales Orders</span>
                          <div className="flex items-center gap-0.5">
                            <ChevronRight className="h-4 w-4 text-slate-400" />
                            <ChevronRight className="h-4 w-4 text-slate-400 -ml-2.5" />
                          </div>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                          <DropdownMenuSubContent className="w-44 p-0 border border-slate-200 shadow-lg">
                            <DropdownMenuItem onClick={() => handleExport('pdf')} className="font-bold text-slate-700 py-2 cursor-pointer hover:bg-slate-50 flex justify-between items-center w-full">
                              <span>Export as PDF</span>
                              <ChevronRight className="h-4 w-4 text-slate-400" />
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExport('excel')} className="font-bold text-slate-700 py-2 cursor-pointer hover:bg-slate-50 flex justify-between items-center w-full">
                              <span>Export as Excel</span>
                              <ChevronRight className="h-4 w-4 text-slate-400" />
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExport('csv')} className="font-bold text-slate-700 py-2 cursor-pointer hover:bg-slate-50 flex justify-between items-center w-full">
                              <span>Export as CSV</span>
                              <ChevronRight className="h-4 w-4 text-slate-400" />
                            </DropdownMenuItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                      </DropdownMenuSub>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => fetchSalesOrders()} className="flex items-center gap-2 py-2 cursor-pointer">
                        <RefreshCw className="h-4 w-4 text-slate-500" />
                        <span className="font-bold text-slate-700">Refresh List</span>
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
                    placeholder="Search sales orders..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 h-9"
                    data-testid="input-search-mobile"
                  />
                </div>
              </div>

              <div className="flex-1 flex flex-col min-h-0 border-t border-slate-200 dark:border-slate-700">
                <div className="flex-1 overflow-auto scrollbar-hide">

                  {loading ? (
                    <div className="p-8 text-center text-slate-500">Loading sales orders...</div>
                  ) : filteredOrders.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                      <Package className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                      <p className="font-medium">No sales orders found</p>
                      <p className="text-sm text-slate-400 mt-1">Create your first sales order to get started</p>
                      <Button
                        onClick={() => setLocation("/sales-orders/create")}
                        className="mt-4 bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus className="h-4 w-4 mr-2" /> Create Sales Order
                      </Button>
                    </div>
                  ) : selectedOrder ? (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredOrders.map((order) => (
                        <div
                          key={order.id}
                          className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors ${selectedOrder?.id === order.id ? 'bg-blue-50 dark:bg-blue-900/20 border-l-2 border-l-blue-600' : ''
                            }`}
                          onClick={() => handleOrderClick(order)}
                          data-testid={`card-order-${order.id}`}
                        >
                          <div className="flex items-start justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={selectedOrders.includes(order.id)}
                                onClick={(e) => toggleSelectOrder(order.id, e)}
                              />
                              <span className="font-medium text-slate-900 dark:text-white truncate">{order.customerName}</span>
                            </div>
                            <span className="font-semibold text-slate-900 dark:text-white">{formatCurrency(order.total)}</span>
                          </div>
                          <div className="ml-6 flex items-center gap-2 text-sm flex-wrap">
                            <span className="text-slate-500">{order.salesOrderNumber}</span>
                            <span className="text-slate-300">|</span>
                            <span className="text-slate-500">{formatDate(order.date)}</span>
                          </div>
                          <div className="ml-6 mt-2 flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className={getStatusBadgeStyles(order.orderStatus)}>
                              {order.orderStatus}
                            </Badge>
                            <Badge variant="outline" className={getStatusBadgeStyles(order.invoiceStatus)}>
                              {order.invoiceStatus}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-0 select-none">
                      <table className="w-full border-separate border-spacing-0">
                        <thead>
                          <tr className="bg-sidebar-accent/5 border-b border-sidebar/10">
                            <th className="w-12 px-6 py-4 text-left">
                              <Checkbox className="border-sidebar/20 data-[state=checked]:bg-sidebar data-[state=checked]:text-white" />
                            </th>
                            <th className="px-5 py-4 text-left font-bold font-display text-xs text-sidebar uppercase tracking-wider">Date</th>
                            <th className="px-5 py-4 text-left font-bold font-display text-xs text-sidebar uppercase tracking-wider">Sales Order#</th>
                            <th className="px-5 py-4 text-left font-bold font-display text-xs text-sidebar/50 uppercase tracking-wider">Reference#</th>
                            <th className="px-5 py-4 text-left font-bold font-display text-xs text-sidebar uppercase tracking-wider">Customer Name</th>
                            <th className="px-5 py-4 text-left font-bold font-display text-xs text-sidebar uppercase tracking-wider">Status</th>
                            <th className="px-5 py-4 text-left font-bold font-display text-xs text-sidebar/50 uppercase tracking-wider">Invoiced</th>
                            <th className="px-5 py-4 text-left font-bold font-display text-xs text-sidebar/50 uppercase tracking-wider">Payment</th>
                            <th className="px-5 py-4 text-right font-bold font-display text-xs text-sidebar uppercase tracking-wider">Amount</th>
                            <th className="w-12 px-6 py-4"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {paginatedItems.map((order) => (
                            <tr
                              key={order.id}
                              className="group hover:bg-sidebar/5 cursor-pointer transition-colors"
                              onClick={() => handleOrderClick(order)}
                              data-testid={`row-order-${order.id}`}
                            >
                              <td className="px-4 py-4">
                                <Checkbox
                                  checked={selectedOrders.includes(order.id)}
                                  onClick={(e) => toggleSelectOrder(order.id, e)}
                                />
                              </td>
                              <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">{formatDate(order.date)}</td>
                              <td className="px-5 py-4 whitespace-nowrap">
                                <span className="text-blue-600 font-medium">{order.salesOrderNumber}</span>
                              </td>
                              <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">{order.referenceNumber || '-'}</td>
                              <td className="px-5 py-4 text-sm text-slate-900 dark:text-white font-medium">{order.customerName}</td>
                              <td className="px-5 py-4 whitespace-nowrap">
                                <Badge variant="outline" className={getStatusBadgeStyles(order.orderStatus)}>
                                  {order.orderStatus}
                                </Badge>
                              </td>
                              <td className="px-5 py-4 whitespace-nowrap">
                                <Badge variant="outline" className={getStatusBadgeStyles(order.invoiceStatus)}>
                                  {order.invoiceStatus}
                                </Badge>
                              </td>
                              <td className="px-5 py-4 whitespace-nowrap">
                                <Badge variant="outline" className={getStatusBadgeStyles(order.paymentStatus)}>
                                  {order.paymentStatus}
                                </Badge>
                              </td>
                              <td className="px-5 py-4 text-right font-semibold text-slate-900 dark:text-white whitespace-nowrap">{formatCurrency(order.total)}</td>
                              <td className="px-4 py-4">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={(e) => { e.stopPropagation(); setLocation(`/sales-orders/${order.id}/edit`); }}
                                      disabled={order.invoiceStatus === 'Invoiced' || order.orderStatus === 'CLOSED'}
                                    >
                                      <Pencil className="mr-2 h-4 w-4" /> Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={(e) => { e.stopPropagation(); handleOrderClick(order); }}
                                      disabled={order.invoiceStatus === 'Invoiced' || order.orderStatus === 'CLOSED'}
                                    >
                                      <Receipt className="mr-2 h-4 w-4" /> Convert to Invoice
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={(e) => handleDeleteOrder(order.id, e)} className="text-destructive">
                                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
                {filteredOrders.length > 0 && (
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
            </div>

          </ResizablePanel>
        )}

        {selectedOrder && (
          <>
            {!isCompact && (
              <ResizableHandle withHandle className="w-1 bg-slate-200 hover:bg-blue-400 hover:w-1.5 transition-all cursor-col-resize" />
            )}
            <ResizablePanel defaultSize={isCompact ? 100 : 70} minSize={isCompact ? 100 : 30} className="bg-white">
              <SalesOrderDetailPanel
                order={selectedOrder}
                branding={branding}
                organization={currentOrganization || undefined}
                onClose={handleClosePanel}
                onEdit={handleEditOrder}
                onDelete={handleDeleteClick}
                onConvertToInvoice={handleConvertToInvoice}
                onConvertSelectedItems={handleConvertSelectedItems}
              />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Sales Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this sales order? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Item Selection Dialog for Invoice */}
      <Dialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto scrollbar-hide">
          <DialogHeader>
            <DialogTitle>Select Items to Invoice</DialogTitle>
            <DialogDescription>
              Choose which items from the sales order you want to include in the invoice.
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">Sales Order: {selectedOrder.salesOrderNumber}</h4>
                <p className="text-sm text-gray-600">Customer: {selectedOrder.customerName}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Items</h4>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const invoiceableItems = selectedOrder.items
                          .filter(item => (item.quantity - (item.invoicedQty || 0)) > 0)
                          .map(item => item.id);
                        setSelectedItemsForInvoice(invoiceableItems);
                      }}
                    >
                      Select All Available
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedItemsForInvoice([])}
                    >
                      Clear All
                    </Button>
                  </div>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <div className="max-h-60 overflow-y-auto scrollbar-hide">
                    {selectedOrder.items.map((item) => {
                      const remainingQty = item.quantity - (item.invoicedQty || 0);
                      const isFullyInvoiced = remainingQty <= 0;

                      return (
                        <div key={item.id} className={`flex items-center justify-between p-3 border-b last:border-b-0 ${isFullyInvoiced ? 'bg-gray-50 opacity-60' : 'hover:bg-gray-50'}`}>
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={selectedItemsForInvoice.includes(item.id)}
                              onCheckedChange={() => toggleItemSelection(item.id)}
                              disabled={isFullyInvoiced}
                            />
                            <div className="flex-1">
                              <div className={`font-medium ${isFullyInvoiced ? 'text-gray-400' : ''}`}>{item.name}</div>
                              {item.description && (
                                <div className={`text-sm ${isFullyInvoiced ? 'text-gray-400' : 'text-gray-600'}`}>{item.description}</div>
                              )}
                              <div className={`text-xs ${isFullyInvoiced ? 'text-gray-400' : 'text-gray-500'}`}>
                                Total Qty: {item.quantity} | Invoiced: {item.invoicedQty || 0} | <strong>Remaining: {remainingQty}</strong>
                              </div>
                              <div className={`text-xs ${isFullyInvoiced ? 'text-gray-400' : 'text-gray-500'}`}>
                                Rate: ₹{item.rate.toFixed(2)}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`font-medium ${isFullyInvoiced ? 'text-gray-400' : ''}`}>
                              ₹{(item.rate * remainingQty).toFixed(2)}
                            </div>
                            <div className={`text-xs ${isFullyInvoiced ? 'text-gray-400' : 'text-gray-500'}`}>
                              {isFullyInvoiced ? "Fully Invoiced" : (item.invoiceStatus || "Available")}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {selectedItemsForInvoice.length > 0 && selectedOrder && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-sm">
                      <strong>{selectedItemsForInvoice.length}</strong> item(s) selected for invoice
                    </div>
                    <div className="text-xs text-blue-700 mt-1">
                      Total Amount: ₹{selectedOrder.items
                        .filter(item => selectedItemsForInvoice.includes(item.id))
                        .reduce((sum, item) => {
                          const remainingQty = item.quantity - (item.invoicedQty || 0);
                          return sum + (item.rate * remainingQty);
                        }, 0)
                        .toFixed(2)
                      }
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setInvoiceDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmSelectedItems} disabled={selectedItemsForInvoice.length === 0}>
              Create Invoice ({selectedItemsForInvoice.length} items)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
