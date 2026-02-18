import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { cn } from "@/lib/utils";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  Plus, Search, ChevronDown, MoreHorizontal, Pencil, Trash2,
  X, Mail, FileText, Printer, ArrowRight, Filter, Download,
  ClipboardList, Eye, Check, Calendar, XCircle, Copy, Archive,
  ArrowUpDown, RefreshCw, FileSpreadsheet
} from "lucide-react";
import { robustIframePrint } from "@/lib/robust-print";
import { generatePDFFromElement } from "@/lib/pdf-utils";
import { exportToExcel, transformPOListForExcel, transformPODetailForExcel } from "@/lib/excel-utils";
import { Button } from "@/components/ui/button";
import { usePagination } from "@/hooks/use-pagination";
import { TablePagination } from "@/components/table-pagination";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { PurchasePDFHeader } from "@/components/purchase-pdf-header";
import { Organization } from "@shared/schema";
import { useOrganization } from "@/context/OrganizationContext";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface PurchaseOrder {
  id: string;
  purchaseOrderNumber: string;
  referenceNumber?: string;
  date: string;
  deliveryDate?: string;
  expectedShipmentDate?: string;
  paymentTerms?: string;
  vendorId: string;
  vendorName: string;
  vendorAddress?: {
    street1?: string;
    street2?: string;
    city?: string;
    state?: string;
    pinCode?: string;
    countryRegion?: string;
    gstin?: string;
  };
  items: Array<{
    id: string;
    itemName: string;
    description?: string;
    quantity: number;
    rate: number;
    tax?: string;
    taxAmount?: number;
    amount: number;
  }>;
  subTotal: number;
  discountAmount?: number;
  taxAmount?: number;
  adjustment?: number;
  total: number;
  notes?: string;
  termsAndConditions?: string;
  status: string;
  receiveStatus?: string;
  billedStatus?: string;
  createdAt?: string;
  pdfTemplate?: string;
  activityLogs?: Array<{
    id: string;
    timestamp: string;
    action: string;
    description: string;
    user: string;
  }>;
}

interface ActionItem {
  icon: any;
  label: string;
  onClick: () => void;
  className?: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(amount);
}

function formatDate(dateString: string): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function PurchaseOrderPDFView({ purchaseOrder, branding, organization }: { purchaseOrder: PurchaseOrder; branding?: any; organization?: Organization }) {
  const redThemeColor = '#b91c1c'; // Red-700
  const blueThemeColor = '#1d4ed8'; // Blue-700

  return (
    <div className="mx-auto shadow-lg bg-white my-8 w-full max-w-[210mm]">
      <div
        id="purchase-order-pdf-content"
        className="bg-white border border-slate-200"
        style={{
          backgroundColor: 'white',

          width: '100%',
          maxWidth: '210mm',
          minHeight: '316mm',
          margin: '0 auto',
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          color: '#0f172a',
          boxSizing: 'border-box',
          lineHeight: '1.5'
        }}
      >
        <div style={{ padding: '40px', position: 'relative' }}>
          {/* Header Section with Organization Info */}
          <PurchasePDFHeader
            logo={branding?.logo}
            documentTitle="PURCHASE ORDER"
            documentNumber={purchaseOrder.purchaseOrderNumber || 'PO-00001'}
            date={purchaseOrder.date}
            referenceNumber={purchaseOrder.referenceNumber}
            organization={organization}
          />

          {/* Vendor Section */}
          <div style={{ display: 'flex', gap: '40px', marginBottom: '40px', flexWrap: 'wrap' }}>
            <div style={{ borderLeft: '3px solid #f1f5f9', paddingLeft: '20px', flex: '1', minWidth: '250px' }}>
              <h4 style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px', margin: '0 0 12px 0' }}>
                VENDOR
              </h4>
              <p style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a', marginBottom: '6px', margin: '0 0 6px 0', letterSpacing: '-0.02em', wordWrap: 'break-word' }}>
                {purchaseOrder.vendorName}
              </p>
              <div style={{ fontSize: '13px', color: '#475569', lineHeight: '1.6', wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                {purchaseOrder.vendorAddress?.street1 && <p style={{ margin: 0 }}>{purchaseOrder.vendorAddress.street1}</p>}
                {purchaseOrder.vendorAddress?.street2 && <p style={{ margin: 0 }}>{purchaseOrder.vendorAddress.street2}</p>}
                {purchaseOrder.vendorAddress?.city && <p style={{ margin: 0 }}>{purchaseOrder.vendorAddress.city}</p>}
                <p style={{ margin: 0 }}>{purchaseOrder.vendorAddress?.pinCode || '411057'}, {purchaseOrder.vendorAddress?.state || 'Maharashtra'}</p>
                <p style={{ margin: 0 }}>{purchaseOrder.vendorAddress?.countryRegion || 'India'}</p>
                {purchaseOrder.vendorAddress?.gstin && <p style={{ margin: '4px 0 0 0', fontWeight: '600', color: '#991b1b' }}>GSTIN {purchaseOrder.vendorAddress.gstin}</p>}
              </div>
            </div>
            <div style={{ borderLeft: '3px solid #f1f5f9', paddingLeft: '20px', flex: '1', minWidth: '250px' }}>
              <h4 style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px', margin: '0 0 12px 0' }}>
                SHIP TO
              </h4>
              <p style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a', marginBottom: '6px', margin: '0 0 6px 0', letterSpacing: '-0.02em', wordWrap: 'break-word' }}>
                {organization?.name || 'Your Company'}
              </p>
              <div style={{ fontSize: '13px', color: '#475569', lineHeight: '1.6', wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                {organization?.street1 && <p style={{ margin: 0 }}>{organization.street1}</p>}
                {organization?.street2 && <p style={{ margin: 0 }}>{organization.street2}</p>}
                {organization?.city && <p style={{ margin: 0 }}>{organization.city}</p>}
                <p style={{ margin: 0 }}>{organization?.postalCode || ''}{organization?.postalCode && organization?.state ? ', ' : ''}{organization?.state || ''}</p>
                <p style={{ margin: 0 }}>{organization?.location || 'India'}</p>
              </div>
            </div>
          </div>

          {/* Metadata section transformed to a bar for consistency */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-[2px] mb-10 bg-slate-100 rounded-lg overflow-hidden border border-slate-100" style={{
            marginBottom: '40px',
            backgroundColor: '#f1f5f9',
            border: '1px solid #f1f5f9'
          }}>
            <div style={{ backgroundColor: '#ffffff', padding: '16px' }}>
              <p style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px 0' }}>Order Date</p>
              <p style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', margin: '0' }}>{formatDate(purchaseOrder.date)}</p>
            </div>
            <div style={{ backgroundColor: '#ffffff', padding: '16px' }}>
              <p style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px 0' }}>Expected Delivery</p>
              <p style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', margin: '0' }}>{formatDate(purchaseOrder.deliveryDate || '')}</p>
            </div>
            <div style={{ backgroundColor: '#ffffff', padding: '16px' }}>
              <p style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px 0' }}>Payment Terms</p>
              <p style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', margin: '0' }}>{purchaseOrder.paymentTerms || 'Due on Receipt'}</p>
            </div>
            <div style={{ backgroundColor: '#ffffff', padding: '16px' }}>
              <p style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px 0' }}>Ref#</p>
              <p style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', margin: '0' }}>{purchaseOrder.referenceNumber || '-'}</p>
            </div>
          </div>

          {/* Table Section */}
          <div style={{ marginBottom: '20px', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', minWidth: '500px' }}>
              <thead>
                <tr style={{ backgroundColor: redThemeColor, color: 'white' }}>
                  <th style={{ padding: '8px', textAlign: 'center', fontSize: '11px', width: '30px', fontWeight: 'bold' }}>#</th>
                  <th style={{ padding: '8px', textAlign: 'left', fontSize: '11px', fontWeight: 'bold' }}>Item & Description</th>
                  <th style={{ padding: '8px', textAlign: 'center', fontSize: '11px', width: '80px', fontWeight: 'bold' }}>HSN/SAC</th>
                  <th style={{ padding: '8px', textAlign: 'center', fontSize: '11px', width: '60px', fontWeight: 'bold' }}>Qty</th>
                  <th style={{ padding: '8px', textAlign: 'right', fontSize: '11px', width: '100px', fontWeight: 'bold' }}>Rate</th>
                  <th style={{ padding: '8px', textAlign: 'right', fontSize: '11px', width: '100px', fontWeight: 'bold' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {purchaseOrder.items.map((item, index) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '15px 8px', textAlign: 'center', fontSize: '11px', verticalAlign: 'top' }}>{index + 1}</td>
                    <td style={{ padding: '15px 8px', verticalAlign: 'top' }}>
                      <p style={{ fontSize: '11px', fontWeight: 'bold', margin: '0 0 5px 0' }}>{item.itemName}</p>
                      <p style={{ fontSize: '9px', color: '#64748b', margin: 0, textTransform: 'uppercase' }}>{item.description}</p>
                    </td>
                    <td style={{ padding: '15px 8px', textAlign: 'center', fontSize: '11px', verticalAlign: 'top', color: '#64748b' }}>{(item as any).hsnSac || '998315'}</td>
                    <td style={{ padding: '15px 8px', textAlign: 'center', fontSize: '11px', verticalAlign: 'top' }}>{item.quantity.toFixed(2)}</td>
                    <td style={{ padding: '15px 8px', textAlign: 'right', fontSize: '11px', verticalAlign: 'top' }}>{item.rate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td style={{ padding: '15px 8px', textAlign: 'right', fontSize: '11px', verticalAlign: 'top' }}>{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Section */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginBottom: '40px' }}>
            <div style={{ width: '250px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '10px' }}>
                <span style={{ color: '#64748b' }}>Sub Total</span>
                <span style={{ fontWeight: 'bold' }}>{purchaseOrder.subTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '10px' }}>
                <span style={{ color: '#64748b' }}>CGST9 (9%)</span>
                <span style={{ fontWeight: 'bold' }}>{(purchaseOrder.taxAmount ? purchaseOrder.taxAmount / 2 : 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '10px' }}>
                <span style={{ color: '#64748b' }}>SGST9 (9%)</span>
                <span style={{ fontWeight: 'bold' }}>{(purchaseOrder.taxAmount ? purchaseOrder.taxAmount / 2 : 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: redThemeColor, marginBottom: '15px' }}>
                <div style={{ textAlign: 'right', flex: 1, marginRight: '20px' }}>
                  <p style={{ margin: 0 }}>Amount Withheld</p>
                  <p style={{ margin: 0 }}>(Section 194 J)</p>
                </div>
                <span style={{ fontWeight: 'bold' }}>(-){(0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
                <span style={{ fontSize: '14px', fontWeight: 'bold' }}>Total</span>
                <span style={{ fontSize: '14px', fontWeight: 'bold' }}>₹{purchaseOrder.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Signature Section */}
          <div style={{ marginTop: '50px', textAlign: 'center' }}>
            <div style={{ position: 'relative', display: 'inline-block', minHeight: '80px', minWidth: '200px' }}>
              {branding?.signature?.url ? (
                <img src={branding.signature.url} alt="Signature" style={{ maxWidth: '150px', maxHeight: '80px', objectFit: 'contain' }} />
              ) : (
                <div style={{ textAlign: 'center', color: '#1e313b', paddingTop: '20px' }}>
                  <p style={{ fontSize: '14px', fontWeight: 'bold', margin: 0, borderBottom: '1px solid #1e313b', paddingBottom: '2px', display: 'inline-block' }}>SKILLTONIT</p>
                </div>
              )}
            </div>
            <p style={{ fontSize: '12px', marginTop: '10px', color: '#64748b' }}>Authorized Signature</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PurchaseOrderDetailPanel({
  purchaseOrder,
  onClose,
  onEdit,
  onDelete,
  onConvertToBill,
  onMarkAsIssued,
  onMarkAsReceived,
  onMarkAsCancelled,
  onClone,
  onSetDeliveryDate,
  onCancelItems,
  branding,
  organization
}: {
  purchaseOrder: PurchaseOrder;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onConvertToBill: () => void;
  onMarkAsIssued: () => void;
  onMarkAsReceived: () => void;
  onMarkAsCancelled: () => void;
  onClone: () => void;
  onSetDeliveryDate: () => void;
  onCancelItems: () => void;
  branding?: any;
  organization?: Organization;
}) {
  const [showPdfView, setShowPdfView] = useState(true);
  const pdfRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleDownloadPDF = async () => {
    toast({ title: "Preparing download...", description: "Please wait while we generate your PDF." });

    if (!showPdfView) {
      setShowPdfView(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    try {
      await generatePDFFromElement("purchase-order-pdf-content", `${purchaseOrder.purchaseOrderNumber}.pdf`);
      toast({ title: "Success", description: "Purchase Order downloaded successfully." });
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
      await robustIframePrint("purchase-order-pdf-content");
    } catch (error) {
      console.error("Print error:", error);
      toast({ title: "Error", description: "Failed to open print dialog.", variant: "destructive" });
    }
  };

  const handleDownloadExcel = async () => {
    toast({ title: "Preparing download...", description: "Generating Excel file. This may take a moment." });

    try {
      const transformedData = transformPODetailForExcel(purchaseOrder);
      const success = await exportToExcel(transformedData, `PurchaseOrder-${purchaseOrder.purchaseOrderNumber}`, 'Purchase Order Details');

      if (success) {
        toast({ title: "Success", description: "Excel file downloaded successfully." });
      } else {
        toast({ title: "Error", description: "Failed to generate Excel file.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Excel generation error:", error);
      toast({ title: "Error", description: "An unexpected error occurred during Excel export.", variant: "destructive" });
    }
  };

  function getActionsForStatus(status: string): ActionItem[] {
    const actions: ActionItem[] = [];

    switch (status?.toUpperCase()) {
      case 'DRAFT':
        actions.push(
          { icon: Check, label: "Mark as Issued", onClick: onMarkAsIssued },
          { icon: ArrowRight, label: "Convert to Bill", onClick: onConvertToBill },
          { icon: Copy, label: "Clone", onClick: onClone },
          { icon: Trash2, label: "Delete", onClick: onDelete, className: "text-red-600" }
        );
        break;

      case 'ISSUED':
        actions.push(
          { icon: Calendar, label: "Expected Delivery Date", onClick: onSetDeliveryDate },
          { icon: XCircle, label: "Cancel Items", onClick: onCancelItems },
          { icon: XCircle, label: "Mark as Cancelled", onClick: onMarkAsCancelled },
          { icon: Copy, label: "Clone", onClick: onClone },
          { icon: Trash2, label: "Delete", onClick: onDelete, className: "text-red-600" },
          { icon: Check, label: "Mark as Received", onClick: onMarkAsReceived }
        );
        break;

      case 'RECEIVED':
        actions.push(
          { icon: ArrowRight, label: "Convert to Bill", onClick: onConvertToBill },
          { icon: Eye, label: "View", onClick: () => { } },
          { icon: FileText, label: "PDF/Print", onClick: () => { } },
          { icon: Copy, label: "Clone", onClick: onClone },
          { icon: Trash2, label: "Delete", onClick: onDelete, className: "text-red-600" }
        );
        break;

      case 'CLOSED':
        actions.push(
          { icon: Eye, label: "View", onClick: () => { } },
          { icon: FileText, label: "PDF/Print", onClick: () => { } },
          { icon: Copy, label: "Clone", onClick: onClone },
          { icon: Trash2, label: "Delete", onClick: onDelete, className: "text-red-600" }
        );
        break;

      default:
        actions.push(
          { icon: Trash2, label: "Delete", onClick: onDelete, className: "text-red-600" }
        );
    }

    return actions;
  }

  return (
    <div className="h-full flex flex-col bg-white border-l border-slate-200 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white">
        <h2 className="text-lg font-bold text-slate-900" data-testid="text-po-number">{purchaseOrder.purchaseOrderNumber}</h2>
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 border rounded-md hover:bg-slate-50" onClick={handleDownloadPDF} title="Download PDF">
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 border rounded-md hover:bg-slate-50" onClick={handleDownloadExcel} title="Download Excel">
            <FileSpreadsheet className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 border rounded-md hover:bg-slate-50" onClick={handlePrint} title="Print Document">
            <Printer className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 border rounded-md hover:bg-slate-50" onClick={onClose} data-testid="button-close-panel">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-200 overflow-x-auto bg-white">
        <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50" onClick={onEdit} data-testid="button-edit-po">
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </Button>
        <div className="w-px h-4 bg-slate-200 mx-1" />
        <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">
          <Mail className="h-3.5 w-3.5" />
          Send Email
        </Button>
        <div className="w-px h-4 bg-slate-200 mx-1" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">
              <FileText className="h-3.5 w-3.5" />
              PDF/Print
              <ChevronDown className="h-3 w-3 ml-0.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={handleDownloadPDF}>
              <Download className="mr-2 h-4 w-4" /> Download PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDownloadExcel}>
              <FileText className="mr-2 h-4 w-4" /> Download Excel
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" /> Print
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="w-px h-4 bg-slate-200 mx-1" />
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          onClick={onMarkAsIssued}
        >
          <Check className="h-3.5 w-3.5" />
          Mark as Issued
        </Button>
        <div className="flex-1" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-50" data-testid="button-more-actions">
              <MoreHorizontal className="h-4 w-4 text-slate-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {getActionsForStatus(purchaseOrder.status).map((action: ActionItem, index: number) => (
              <DropdownMenuItem
                key={index}
                onClick={action.onClick}
                className={action.className || ""}
              >
                <action.icon className="mr-2 h-4 w-4" />
                {action.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {purchaseOrder.billedStatus !== 'BILLED' && (
        <div className="px-4 py-4 bg-sidebar/5 border-b border-sidebar/10 flex items-center gap-3">
          <div className="bg-sidebar/10 p-1.5 rounded-full">
            <Plus className="h-3.5 w-3.5 text-sidebar" />
          </div>
          <div className="flex flex-col">
            <span className="text-sidebar text-[10px] font-bold tracking-widest uppercase leading-none mb-1">✨ WHAT'S NEXT?</span>
            <span className="text-sm text-slate-600">
              {purchaseOrder.status?.toUpperCase() === 'DRAFT'
                ? 'Send this purchase order to your vendor or mark it as issued.'
                : 'Convert this purchase order to a bill to complete your purchase.'}
            </span>
          </div>
          <div className="flex gap-2 ml-auto">
            {purchaseOrder.status?.toUpperCase() === 'DRAFT' ? (
              <>
                <Button
                  size="sm"
                  className="bg-sidebar hover:bg-sidebar/90 h-8 text-xs font-medium px-4 font-display"
                  onClick={() => { }}
                >
                  Send Purchase Order
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs font-medium bg-white border-slate-200 px-4"
                  onClick={onMarkAsIssued}
                >
                  Mark as Issued
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                className="bg-sidebar hover:bg-sidebar/90 h-8 text-xs font-medium px-4 font-display"
                onClick={onConvertToBill}
              >
                Convert to Bill
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="px-4 py-5 border-b border-slate-200 flex items-center justify-between bg-white">
        <div className="flex items-center gap-8">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 font-bold tracking-wider uppercase mb-1.5">Receive Status</span>
            <span className={`text-xs font-extrabold tracking-tight ${purchaseOrder.receiveStatus === 'RECEIVED' ? 'text-green-600' : 'text-amber-600'}`}>
              {purchaseOrder.receiveStatus || 'YET TO BE RECEIVED'}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 font-bold tracking-wider uppercase mb-1.5">Bill Status</span>
            <span className={`text-xs font-extrabold tracking-tight ${purchaseOrder.billedStatus === 'BILLED' ? 'text-green-600' : 'text-amber-600'}`}>
              {purchaseOrder.billedStatus || 'YET TO BE BILLED'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="pdf-view" className="text-xs font-semibold text-slate-500">Show PDF View</Label>
          <Switch id="pdf-view" checked={showPdfView} onCheckedChange={setShowPdfView} className="scale-75" />
        </div>
      </div>

      <div className="flex-1 overflow-auto scrollbar-hide">
        <Tabs defaultValue="details" className="h-full flex flex-col">
          <div className="px-4 border-b bg-slate-50/50">
            <TabsList className="h-10 p-0 bg-transparent gap-6">
              <TabsTrigger
                value="details"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-sidebar data-[state=active]:text-sidebar data-[state=active]:bg-transparent data-[state=active]:shadow-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-1 py-2 text-xs font-bold uppercase tracking-wider bg-transparent hover:bg-transparent transition-none"
              >
                Details
              </TabsTrigger>
              <TabsTrigger
                value="activity"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-sidebar data-[state=active]:text-sidebar data-[state=active]:bg-transparent data-[state=active]:shadow-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-1 py-2 text-xs font-bold uppercase tracking-wider bg-transparent hover:bg-transparent transition-none"
              >
                Activity Log
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="details" className="flex-1 mt-0 overflow-auto scrollbar-hide p-2 focus-visible:ring-0">
            <div ref={pdfRef} className="w-full">
              {showPdfView ? (
                <div className="w-full flex justify-center">
                  <PurchaseOrderPDFView purchaseOrder={purchaseOrder} branding={branding} organization={organization} />
                </div>
              ) : (
                <div className="space-y-6 p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-500">Vendor</span>
                      <p className="font-medium text-sidebar font-display">{purchaseOrder.vendorName}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Date</span>
                      <p className="font-medium">{formatDate(purchaseOrder.date)}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Delivery Date</span>
                      <p className="font-medium">{formatDate(purchaseOrder.deliveryDate || '')}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Status</span>
                      <Badge variant="outline" className={`font-bold text-[10px] px-1.5 py-0 h-5 border-none rounded-sm uppercase ${purchaseOrder.status?.toUpperCase() === 'DRAFT' ? 'bg-slate-100 text-slate-400' :
                        purchaseOrder.status?.toUpperCase() === 'ISSUED' ? 'bg-sidebar/10 text-sidebar border-sidebar/20' :
                          purchaseOrder.status?.toUpperCase() === 'RECEIVED' ? 'bg-green-100 text-green-600' :
                            purchaseOrder.status?.toUpperCase() === 'CLOSED' ? 'bg-gray-100 text-gray-600' :
                              'bg-slate-100 text-slate-600'
                        }`}>
                        {purchaseOrder.status?.toUpperCase()}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Items</h4>
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-2 py-1 text-left">Item</th>
                          <th className="px-2 py-1 text-center">Qty</th>
                          <th className="px-2 py-1 text-right">Rate</th>
                          <th className="px-2 py-1 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {purchaseOrder.items.map((item) => (
                          <tr key={item.id} className="border-b">
                            <td className="px-2 py-2">{item.itemName}</td>
                            <td className="px-2 py-2 text-center">{item.quantity}</td>
                            <td className="px-2 py-2 text-right">{formatCurrency(item.rate)}</td>
                            <td className="px-2 py-2 text-right">{formatCurrency(item.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="text-right space-y-1">
                    <div className="flex justify-end gap-4 text-sm">
                      <span className="text-slate-500">Sub Total:</span>
                      <span className="w-28">{formatCurrency(purchaseOrder.subTotal)}</span>
                    </div>
                    <div className="flex justify-end gap-4 text-sm font-semibold">
                      <span>Total:</span>
                      <span className="w-28">{formatCurrency(purchaseOrder.total)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="activity" className="flex-1 mt-0 overflow-auto scrollbar-hide p-6 focus-visible:ring-0">
            <div className="space-y-6">
              {purchaseOrder.activityLogs && purchaseOrder.activityLogs.length > 0 ? (
                <div className="relative border-l-2 border-slate-100 ml-3 pl-6 space-y-8">
                  {purchaseOrder.activityLogs.map((log, index) => (
                    <div key={log.id || index} className="relative">
                      <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-white border-2 border-sidebar" />
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900 capitalize">{log.action}</span>
                        <span className="text-sm text-slate-500 mt-0.5">{log.description}</span>
                        <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-400">
                          <span className="font-medium uppercase">{log.user}</span>
                          <span>•</span>
                          <span>{new Date(log.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-3">
                    <FileText className="h-6 w-6 text-slate-300" />
                  </div>
                  <p className="text-sm text-slate-400">No activity recorded for this purchase order yet.</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <div className="border-t border-slate-200 p-3 text-center text-xs text-slate-500">
        PDF Template: <span className="text-sidebar">{purchaseOrder.pdfTemplate || 'Standard Template'}</span>
        <button className="text-sidebar ml-2">Change</button>
      </div>
    </div>
  );
}

export default function PurchaseOrders() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [poToDelete, setPoToDelete] = useState<string | null>(null);
  const [selectedPOs, setSelectedPOs] = useState<string[]>([]);
  const [branding, setBranding] = useState<any>(null);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [currentView, setCurrentView] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.csv,.xlsx';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        toast({
          title: "Import Started",
          description: `Importing ${file.name}...`,
        });
      }
    };
    input.click();
  };

  const handleResetColumnWidth = () => {
    toast({
      title: "Success",
      description: "Column widths reset to default.",
    });
  };


  // Use organization context instead of local state
  const { currentOrganization: organization } = useOrganization();

  useEffect(() => {
    fetchPurchaseOrders();
    fetchBranding();
  }, []);

  // Deep linking for selected purchase order
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const poId = searchParams.get('id');
    if (poId && purchaseOrders.length > 0) {
      const po = purchaseOrders.find(p => p.id === poId);
      if (po) {
        fetchPODetail(po.id);
      }
    }
  }, [purchaseOrders]);

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






  const fetchPurchaseOrders = async () => {
    try {
      const response = await fetch('/api/purchase-orders');
      if (response.ok) {
        const data = await response.json();
        setPurchaseOrders(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch purchase orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPODetail = async (id: string) => {
    try {
      const response = await fetch(`/api/purchase-orders/${id}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedPO(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch PO detail:', error);
    }
  };

  const handlePOClick = (po: PurchaseOrder) => {
    fetchPODetail(po.id);
  };

  const handleClosePanel = () => {
    setSelectedPO(null);
  };

  const handleEditPO = () => {
    if (selectedPO) {
      setLocation(`/purchase-orders/${selectedPO.id}/edit`);
    }
  };

  const handleDelete = (id: string) => {
    setPoToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!poToDelete) return;
    try {
      const response = await fetch(`/api/purchase-orders/${poToDelete}`, { method: 'DELETE' });
      if (response.ok) {
        toast({ title: "Purchase order deleted successfully" });
        fetchPurchaseOrders();
        if (selectedPO?.id === poToDelete) {
          handleClosePanel();
        }
      }
    } catch (error) {
      toast({ title: "Failed to delete purchase order", variant: "destructive" });
    } finally {
      setDeleteDialogOpen(false);
      setPoToDelete(null);
    }
  };

  const handleConvertToBill = async () => {
    if (!selectedPO) return;
    try {
      // First update the PO status and create the bill
      const response = await fetch(`/api/purchase-orders/${selectedPO.id}/convert-to-bill`, {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        toast({ title: "Purchase Order converted successfully", description: "Redirecting to bill details..." });

        // Refresh PO list to update status
        await fetchPurchaseOrders();

        // Navigate to the newly created bill's edit page
        if (data.data?.bill?.id) {
          setLocation(`/bills/${data.data.bill.id}/edit`);
        } else {
          // Fallback just in case, though API guarantees bill return on success
          toast({ title: "Warning", description: "Bill created but could not redirect automatically.", variant: "destructive" });
        }
      } else {
        throw new Error('Failed to convert to bill');
      }
    } catch (error) {
      console.error('Convert to bill error:', error);
      toast({ title: "Failed to convert to bill", variant: "destructive" });
    }
  };

  const handleMarkAsIssued = async (poId: string) => {
    try {
      const response = await fetch(`/api/purchase-orders/${poId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'ISSUED',
          updatedBy: 'Admin User'
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Update local state with the updated PO from server
        setPurchaseOrders(prev =>
          prev.map(po =>
            po.id === poId ? data.data : po
          )
        );
        const updatedPO = data.data;
        toast({
          title: "Purchase Order Issued",
          description: `PO #${updatedPO.purchaseOrderNumber} has been moved to Issued status.`
        });
      } else {
        throw new Error('Failed to update status');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update purchase order status",
        variant: "destructive"
      });
    }
  };

  const handleMarkAsReceived = async (poId: string) => {
    try {
      const response = await fetch(`/api/purchase-orders/${poId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'RECEIVED',
          updatedBy: 'Admin User'
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Update local state with the updated PO from server
        setPurchaseOrders(prev =>
          prev.map(po =>
            po.id === poId ? data.data : po
          )
        );
        // Also update selected PO if it's the one being received
        if (selectedPO?.id === poId) {
          setSelectedPO(data.data);
        }
        toast({ title: "Purchase Order Received", description: "Status updated successfully" });
      } else {
        throw new Error('Failed to update status');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update purchase order status",
        variant: "destructive"
      });
    }
  };

  const handleMarkAsCancelled = async (poId: string) => {
    try {
      const response = await fetch(`/api/purchase-orders/${poId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'CANCELLED',
          updatedBy: 'Admin User'
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Update local state with the updated PO from server
        setPurchaseOrders(prev =>
          prev.map(po =>
            po.id === poId ? data.data : po
          )
        );
        toast({ title: "Purchase Order Cancelled", description: "Status updated successfully" });
      } else {
        throw new Error('Failed to update status');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update purchase order status",
        variant: "destructive"
      });
    }
  };

  const handleClone = (poId: string) => {
    // Clone the purchase order
    const poToClone = purchaseOrders.find(po => po.id === poId);
    if (poToClone) {
      const clonedPO = {
        ...poToClone,
        id: Date.now().toString(),
        purchaseOrderNumber: `PO-${String(purchaseOrders.length + 1).padStart(5, '0')}`,
        date: new Date().toISOString().split('T')[0],
        status: 'DRAFT'
      };
      setPurchaseOrders(prev => [clonedPO, ...prev]);
      toast({ title: "Purchase Order Cloned", description: "Successfully created a copy" });
    }
  };

  const handleSetDeliveryDate = (poId: string) => {
    const newDate = prompt("Enter expected delivery date (YYYY-MM-DD):");
    if (newDate) {
      setPurchaseOrders(prev =>
        prev.map(po =>
          po.id === poId ? { ...po, deliveryDate: newDate } : po
        )
      );
      toast({ title: "Delivery Date Updated", description: "Expected delivery date set successfully" });
    }
  };

  const handleCancelItems = (poId: string) => {
    // Logic to cancel specific items in the PO
    toast({ title: "Cancel Items", description: "Item cancellation dialog would open here" });
  };

  const toggleSelectPO = (id: string, e?: React.MouseEvent) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (selectedPOs.includes(id)) {
      setSelectedPOs(selectedPOs.filter(i => i !== id));
    } else {
      setSelectedPOs([...selectedPOs, id]);
    }
  };

  const filteredByView = purchaseOrders.filter(po => {
    switch (currentView) {
      case 'draft': return po.status?.toUpperCase() === 'DRAFT';
      case 'pending_approval': return po.status?.toUpperCase() === 'PENDING_APPROVAL';
      case 'approved': return po.status?.toUpperCase() === 'APPROVED';
      case 'issued': return po.status?.toUpperCase() === 'ISSUED';
      case 'billed': return po.billedStatus?.toUpperCase() === 'BILLED';
      case 'partially_billed': return po.billedStatus?.toUpperCase() === 'PARTIALLY_BILLED';
      case 'closed': return po.status?.toUpperCase() === 'CLOSED';
      case 'cancelled': return po.status?.toUpperCase() === 'CANCELLED';
      default: return true;
    }
  });

  const filteredPOs: PurchaseOrder[] = filteredByView.filter(po =>
    po.purchaseOrderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    po.vendorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    po.referenceNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedPOs: PurchaseOrder[] = [...filteredPOs].sort((a, b) => {
    let aVal: any = a[sortBy as keyof PurchaseOrder] || "";
    let bVal: any = b[sortBy as keyof PurchaseOrder] || "";

    if (sortBy === 'total') {
      aVal = parseFloat(String(aVal)) || 0;
      bVal = parseFloat(String(bVal)) || 0;
    }

    if (sortBy === 'date' || sortBy === 'createdAt') {
      aVal = new Date(aVal).getTime();
      bVal = new Date(bVal).getTime();
    }

    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();

    if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
    if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const { currentPage, totalPages, totalItems, itemsPerPage, paginatedItems, goToPage } = usePagination<PurchaseOrder>(sortedPOs, 10);

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'ISSUED':
        return <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">ISSUED</Badge>;
      case 'DRAFT':
        return <Badge variant="outline" className="text-slate-600 border-slate-200">DRAFT</Badge>;
      case 'CLOSED':
        return <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">CLOSED</Badge>;
      case 'CANCELLED':
        return <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">CANCELLED</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  function getActionsForStatus(status: string, poId: string) {
    const actions = [];

    switch (status?.toUpperCase()) {
      case 'DRAFT':
        actions.push(
          { icon: Check, label: "Mark as Issued", onClick: () => handleMarkAsIssued(poId) },
          { icon: ArrowRight, label: "Convert to Bill", onClick: () => handleConvertToBill() },
          { icon: Copy, label: "Clone", onClick: () => handleClone(poId) },
          { icon: Trash2, label: "Delete", onClick: () => handleDelete(poId), className: "text-red-600" }
        );
        break;

      case 'ISSUED':
        actions.push(
          { icon: Calendar, label: "Expected Delivery Date", onClick: () => handleSetDeliveryDate(poId) },
          { icon: XCircle, label: "Cancel Items", onClick: () => handleCancelItems(poId) },
          { icon: XCircle, label: "Mark as Cancelled", onClick: () => handleMarkAsCancelled(poId) },
          { icon: Copy, label: "Clone", onClick: () => handleClone(poId) },
          { icon: Trash2, label: "Delete", onClick: () => handleDelete(poId), className: "text-red-600" },
          { icon: Check, label: "Mark as Received", onClick: () => handleMarkAsReceived(poId) }
        );
        break;

      case 'RECEIVED':
      case 'CLOSED':
        actions.push(
          { icon: Eye, label: "View", onClick: () => handlePOClick(purchaseOrders.find(po => po.id === poId)!) },
          { icon: FileText, label: "PDF/Print", onClick: () => { } },
          { icon: Copy, label: "Clone", onClick: () => handleClone(poId) },
          { icon: Trash2, label: "Delete", onClick: () => handleDelete(poId), className: "text-red-600" }
        );
        break;

      case 'CANCELLED':
        actions.push(
          { icon: Copy, label: "Clone", onClick: () => handleClone(poId) },
          { icon: Trash2, label: "Delete", onClick: () => handleDelete(poId), className: "text-red-600" }
        );
        break;

      default:
        actions.push(
          { icon: Trash2, label: "Delete", onClick: () => handleDelete(poId), className: "text-red-600" }
        );
    }

    return actions;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
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

  return (
    <div className="flex h-screen animate-in fade-in duration-300 w-full overflow-hidden bg-slate-50">
      <ResizablePanelGroup key={`${selectedPO ? "split" : "single"}-${isCompact ? "compact" : "full"}`} direction="horizontal" className="h-full w-full">
        {(!isCompact || !selectedPO) && (
          <ResizablePanel
            defaultSize={isCompact ? 100 : (selectedPO ? 30 : 100)}
            minSize={isCompact ? 100 : (selectedPO ? 30 : 100)}
            maxSize={isCompact ? 100 : (selectedPO ? 30 : 100)}
            className="flex flex-col overflow-hidden bg-white min-w-[25%]"
          >
            <div className="flex flex-col h-full overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white sticky top-0 z-10 min-h-[73px] h-auto">
                <div className="flex items-center gap-0">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="text-xl font-semibold text-slate-900 px-2 h-auto gap-2 hover:bg-slate-50">
                        {currentView === "all" ? "All Purchase Orders" :
                          currentView === "draft" ? "Draft Purchase Orders" :
                            currentView === "pending_approval" ? "Pending Approval" :
                              currentView === "approved" ? "Approved Purchase Orders" :
                                currentView === "issued" ? "Issued Purchase Orders" :
                                  currentView === "billed" ? "Billed Purchase Orders" :
                                    currentView === "partially_billed" ? "Partially Billed" :
                                      currentView === "closed" ? "Closed Purchase Orders" :
                                        "Canceled Purchase Orders"}
                        <ChevronDown className="h-5 w-5 text-blue-600" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-64 p-0">
                      <div className="py-2">
                        {[
                          { id: "all", label: "All" },
                          { id: "draft", label: "Draft" },
                          { id: "pending_approval", label: "Pending Approval" },
                          { id: "approved", label: "Approved" },
                          { id: "issued", label: "Issued" },
                          { id: "billed", label: "Billed" },
                          { id: "partially_billed", label: "Partially Billed" },
                          { id: "closed", label: "Closed" },
                          { id: "cancelled", label: "Canceled" },
                        ].map((view) => (
                          <DropdownMenuItem
                            key={view.id}
                            onClick={() => setCurrentView(view.id)}
                            className="flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-slate-50"
                          >
                            <span className={cn(currentView === view.id && "text-blue-600 font-medium")}>{view.label}</span>
                          </DropdownMenuItem>
                        ))}
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex items-center gap-2">
                  {selectedPO ? (
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
                        className="h-9 w-9"
                        onClick={() => setIsSearchVisible(true)}
                      >
                        <Search className="h-4 w-4 text-slate-400" />
                      </Button>
                    )
                  ) : (
                    <div className="relative w-[240px] hidden sm:block">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="Search purchase orders..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 h-9"
                        data-testid="input-search-po"
                      />
                    </div>
                  )}
                  <Button
                    onClick={() => setLocation("/purchase-orders/new")}
                    className={`bg-sidebar hover:bg-sidebar/90 gap-1.5 h-9 font-display font-medium shadow-sm ${selectedPO ? 'w-9 px-0' : ''}`}
                    data-testid="button-new-po"
                    size={selectedPO ? "icon" : "default"}
                  >
                    <Plus className={`h-4 w-4 ${selectedPO ? '' : 'mr-1.5'}`} />
                    {!selectedPO && "New"}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" className="h-9 w-9" data-testid="button-more-options">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 p-1">
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger className="gap-2">
                          <ArrowUpDown className="h-4 w-4" />
                          <span>Sort by</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                          <DropdownMenuSubContent className="w-48">
                            <DropdownMenuItem onClick={() => handleSort('date')} className={cn(sortBy === 'date' && "bg-blue-50 text-blue-700 font-medium")}>
                              Date {sortBy === 'date' && (sortOrder === "asc" ? "↑" : "↓")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSort('purchaseOrderNumber')} className={cn(sortBy === 'purchaseOrderNumber' && "bg-blue-50 text-blue-700 font-medium")}>
                              Order Number {sortBy === 'purchaseOrderNumber' && (sortOrder === "asc" ? "↑" : "↓")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSort('vendorName')} className={cn(sortBy === 'vendorName' && "bg-blue-50 text-blue-700 font-medium")}>
                              Vendor Name {sortBy === 'vendorName' && (sortOrder === "asc" ? "↑" : "↓")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSort('total')} className={cn(sortBy === 'total' && "bg-blue-50 text-blue-700 font-medium")}>
                              Amount {sortBy === 'total' && (sortOrder === "asc" ? "↑" : "↓")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSort('createdAt')} className={cn(sortBy === 'createdAt' && "bg-blue-50 text-blue-700 font-medium")}>
                              Created Time {sortBy === 'createdAt' && (sortOrder === "asc" ? "↑" : "↓")}
                            </DropdownMenuItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                      </DropdownMenuSub>
                      <DropdownMenuSeparator />
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger className="gap-2">
                          <Download className="h-4 w-4" />
                          <span>Import</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                          <DropdownMenuSubContent>
                            <DropdownMenuItem onClick={handleImport}>Import Purchase Orders</DropdownMenuItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                      </DropdownMenuSub>
                      <DropdownMenuItem onClick={async () => {
                        toast({ title: "Exporting...", description: "Generating Excel file for all purchase orders." });
                        const transformedData = transformPOListForExcel(filteredPOs);
                        const success = await exportToExcel(transformedData, 'PurchaseOrders_List', 'Purchase Orders');
                        if (success) {
                          toast({ title: "Success", description: "Purchase orders exported successfully." });
                        } else {
                          toast({ title: "Error", description: "Failed to export purchase orders.", variant: "destructive" });
                        }
                      }} className="gap-2">
                        <FileSpreadsheet className="h-4 w-4" /> Export to Excel
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>



              <div className="flex-1 overflow-auto scrollbar-hide">
                {loading ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : filteredPOs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                    <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                      <ClipboardList className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No purchase orders yet</h3>
                    <p className="text-slate-500 mb-4 max-w-sm">
                      Create purchase orders to formalize orders with your vendors and track deliveries.
                    </p>
                    <Button
                      onClick={() => setLocation("/purchase-orders/new")}
                      className="bg-sidebar hover:bg-sidebar/90 font-display font-medium shadow-sm"
                      data-testid="button-create-first-po"
                    >
                      <Plus className="h-4 w-4 mr-2" /> Create Your First Purchase Order
                    </Button>
                  </div>
                ) : selectedPO ? (
                  <div className="divide-y divide-slate-100 bg-white">
                    {paginatedItems.map((po: PurchaseOrder) => (
                      <div
                        key={po.id}
                        className={`flex items-start gap-3 p-4 cursor-pointer hover:bg-slate-50 transition-colors ${selectedPO && selectedPO.id === po.id ? 'bg-sidebar/5' : ''}`}
                        onClick={() => handlePOClick(po)}
                      >
                        <Checkbox
                          checked={selectedPOs.includes(po.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedPOs([...selectedPOs, po.id]);
                            } else {
                              setSelectedPOs(selectedPOs.filter(id => id !== po.id));
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-bold text-slate-900 truncate text-[13px]">{po.vendorName}</span>
                            <span className="font-bold text-slate-900 text-[13px] whitespace-nowrap">{formatCurrency(po.total)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 mb-1">
                            <span>{po.purchaseOrderNumber}</span>
                            <span>•</span>
                            <span>{formatDate(po.date)}</span>
                          </div>
                          <div className={`text-[10px] font-bold uppercase tracking-wider ${po.status?.toUpperCase() === 'DRAFT' ? 'text-slate-400' :
                            po.status?.toUpperCase() === 'CLOSED' ? 'text-green-600' :
                              'text-blue-500'
                            }`}>
                            {po.status?.toUpperCase()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex-1 overflow-auto scrollbar-hide">
                    <div className="border rounded-lg overflow-hidden bg-white dark:bg-slate-900">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-sidebar/5 dark:bg-sidebar/10 border-b border-slate-200 dark:border-slate-700">
                            <tr>
                              <th className="px-4 py-3 text-left text-[11px] font-bold text-sidebar/70 uppercase tracking-wider w-10 font-display">
                                <Checkbox
                                  checked={selectedPOs.length === paginatedItems.length && paginatedItems.length > 0}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedPOs(paginatedItems.map((po: PurchaseOrder) => po.id));
                                    } else {
                                      setSelectedPOs([]);
                                    }
                                  }}
                                  data-testid="checkbox-select-all"
                                />
                              </th>
                              <th className="px-4 py-3 text-left text-[11px] font-bold text-sidebar/70 uppercase tracking-wider font-display">Date</th>
                              <th className="px-4 py-3 text-left text-[11px] font-bold text-sidebar/70 uppercase tracking-wider font-display">Purchase Order#</th>
                              <th className="px-4 py-3 text-left text-[11px] font-bold text-sidebar/70 uppercase tracking-wider font-display">Reference#</th>
                              <th className="px-4 py-3 text-left text-[11px] font-bold text-sidebar/70 uppercase tracking-wider font-display">Vendor Name</th>
                              <th className="px-4 py-3 text-left text-[11px] font-bold text-sidebar/70 uppercase tracking-wider font-display">Status</th>
                              <th className="px-4 py-3 text-left text-[11px] font-bold text-sidebar/70 uppercase tracking-wider font-display">Billed Status</th>
                              <th className="px-4 py-3 text-right text-[11px] font-bold text-sidebar/70 uppercase tracking-wider font-display">Amount</th>
                              <th className="px-4 py-3 text-left text-[11px] font-bold text-sidebar/70 uppercase tracking-wider font-display">Delivery Date</th>
                              <th className="px-4 py-3 text-right text-[11px] font-bold text-sidebar/70 uppercase tracking-wider font-display"><Search className="h-3 w-3 inline-block" /></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {paginatedItems.map((po: PurchaseOrder) => (
                              <tr
                                key={po.id}
                                className={`hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors ${selectedPO?.id === po.id ? 'bg-sidebar/5 dark:bg-sidebar/20' : ''}`}
                                onClick={() => handlePOClick(po)}
                                data-testid={`row-po-${po.id}`}
                              >
                                <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                                  <Checkbox
                                    checked={selectedPOs.includes(po.id)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setSelectedPOs([...selectedPOs, po.id]);
                                      } else {
                                        setSelectedPOs(selectedPOs.filter(id => id !== po.id));
                                      }
                                    }}
                                    data-testid={`checkbox-po-${po.id}`}
                                  />
                                </td>
                                <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">
                                  {formatDate(po.date)}
                                </td>
                                <td className="px-4 py-4 text-sm font-medium text-sidebar hover:underline font-display">
                                  {po.purchaseOrderNumber}
                                </td>
                                <td className="px-4 py-4 text-sm text-slate-500 dark:text-slate-400">
                                  {po.referenceNumber || '-'}
                                </td>
                                <td className="px-4 py-4 text-sm font-medium text-slate-900 dark:text-white">
                                  {po.vendorName}
                                </td>
                                <td className="px-4 py-4">
                                  <Badge variant="outline" className={`font-bold text-[10px] px-1.5 py-0 h-5 border-none rounded-sm uppercase ${po.status?.toUpperCase() === 'DRAFT' ? 'bg-slate-100 text-slate-400' :
                                    po.status?.toUpperCase() === 'ISSUED' ? 'bg-sidebar/10 text-sidebar border-sidebar/20' :
                                      po.status?.toUpperCase() === 'RECEIVED' ? 'bg-green-100 text-green-600' :
                                        po.status?.toUpperCase() === 'CLOSED' ? 'bg-gray-100 text-gray-600' :
                                          'bg-slate-100 text-slate-600'
                                    }`}>
                                    {po.status?.toUpperCase()}
                                  </Badge>
                                </td>
                                <td className="px-4 py-4 text-[10px] font-bold tracking-wider text-slate-400 uppercase whitespace-nowrap">
                                  {po.billedStatus || 'YET TO BE BILLED'}
                                </td>
                                <td className="px-4 py-4 text-sm font-bold text-right text-slate-900 dark:text-white">
                                  {formatCurrency(po.total)}
                                </td>
                                <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-300">
                                  {po.deliveryDate ? formatDate(po.deliveryDate) : '-'}
                                </td>
                                <td className="px-4 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8 hover-elevate">
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => setLocation(`/purchase-orders/${po.id}/edit`)}>
                                        <Pencil className="mr-2 h-4 w-4" /> Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        className="text-red-600 focus:text-red-600"
                                        onClick={() => handleDelete(po.id)}
                                      >
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
                    </div>
                  </div>
                )}
              </div>
              {filteredPOs.length > 0 && (
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
          </ResizablePanel>
        )}

        {selectedPO && (
          <>
            {!isCompact && (
              <ResizableHandle withHandle className="w-1 bg-slate-200 hover:bg-blue-400 hover:w-1.5 transition-all cursor-col-resize" />
            )}
            <ResizablePanel defaultSize={isCompact ? 100 : 65} minSize={isCompact ? 100 : 30} className="bg-white">
              <PurchaseOrderDetailPanel
                purchaseOrder={selectedPO}
                onClose={handleClosePanel}
                onEdit={handleEditPO}
                onDelete={() => handleDelete(selectedPO.id)}
                onConvertToBill={handleConvertToBill}
                onMarkAsIssued={() => handleMarkAsIssued(selectedPO.id)}
                onMarkAsReceived={() => handleMarkAsReceived(selectedPO.id)}
                onMarkAsCancelled={() => handleMarkAsCancelled(selectedPO.id)}
                onClone={() => handleClone(selectedPO.id)}
                onSetDeliveryDate={() => handleSetDeliveryDate(selectedPO.id)}
                onCancelItems={() => handleCancelItems(selectedPO.id)}
                branding={branding}
                organization={organization || undefined}
              />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Purchase Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this purchase order? This action cannot be undone.
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
    </div>
  );
}