import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { robustIframePrint } from "@/lib/robust-print";
import {
  Plus,
  ChevronDown,
  MoreHorizontal,
  Search,
  X,
  FileText,
  Pencil,
  Trash2,
  Copy,
  Send,
  CheckCircle,
  XCircle,
  ShoppingCart,
  Receipt,
  Clock,
  Calendar,
  User,
  Building2,
  Mail,
  Phone,
  MapPin,
  Printer,
  Download,
  RefreshCw,
  MessageSquare,
  History,
  FileDown,
  Star,
  ArrowUpDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOrganization } from "@/context/OrganizationContext";
import { SalesPDFHeader } from "@/components/sales-pdf-header";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { usePagination } from "@/hooks/use-pagination";
import { TablePagination } from "@/components/table-pagination";

interface Quote {
  id: string;
  quoteNumber: string;
  referenceNumber?: string;
  date: string;
  expiryDate?: string;
  customerId: string;
  customerName: string;
  total: number;
  status: string;
  convertedTo?: string; // 'invoice' | 'sales-order'
  salesperson?: string;
  createdAt?: string;
  updatedAt?: string;
  items?: any[];
  billingAddress?: any;
  shippingAddress?: any;
  customerNotes?: string;
  termsAndConditions?: string;
  activityLogs?: any[];
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(amount);
};

const formatDate = (dateString: string) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const getStatusBadge = (status: string, convertedTo?: string) => {
  if (status === "CONVERTED" || status === "Converted") {
    const label = convertedTo === 'invoice' ? "Converted To Invoice" :
      convertedTo === 'sales-order' ? "Converted To Sales Order" : "Converted";
    return <span className="text-purple-600 font-medium text-[13px] whitespace-nowrap">{label}</span>;
  }

  if (status === "Sent") {
    return <span className="text-blue-600 font-medium text-[13px] whitespace-nowrap">Quotation Sent</span>;
  }

  const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className?: string }> = {
    Draft: { label: "Draft", variant: "secondary" },
    Sent: { label: "Sent", variant: "outline", className: "text-blue-600 border-blue-200 bg-blue-50" },
    Approved: { label: "Approved", variant: "default" },
    Scrapped: { label: "Scrapped", variant: "destructive" },
    Accepted: { label: "Approved", variant: "default" }, // Compatibility
    DRAFT: { label: "Draft", variant: "secondary" }, // Compatibility
    SENT: { label: "Sent", variant: "outline", className: "text-blue-600 border-blue-200 bg-blue-50" }, // Compatibility
    ACCEPTED: { label: "Approved", variant: "default" }, // Compatibility
    DECLINED: { label: "Scrapped", variant: "destructive" }, // Compatibility
    EXPIRED: { label: "Scrapped", variant: "destructive" }, // Compatibility
    CONVERTED: { label: "Converted", variant: "outline" },
  };
  const config = statusMap[status] || { label: status, variant: "secondary" as const };
  return <Badge variant={config.variant} className={cn("text-[11px] font-medium px-2 py-0.5", config.className)}>{config.label}</Badge>;
};

const QUOTE_FILTERS = [
  { id: "all", label: "All Quotes" },
  { id: "Draft", label: "Draft" },
  { id: "Sent", label: "Sent" },
  { id: "Approved", label: "Approved" },
  { id: "Scrapped", label: "Scrapped" },
  { id: "CONVERTED", label: "Converted" },
];

// Helper function to convert number to words
function numberToWords(num: number): string {
  if (num === 0) return "Zero Only";

  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function convertLessThanOneThousand(n: number): string {
    let result = "";
    if (n >= 100) {
      result += ones[Math.floor(n / 100)] + " Hundred ";
      n %= 100;
    }
    if (n >= 20) {
      result += tens[Math.floor(n / 10)] + " ";
      n %= 10;
    }
    if (n > 0) {
      result += ones[n] + " ";
    }
    return result.trim();
  }

  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  const thousand = Math.floor(num / 1000);
  num %= 1000;
  const remainder = Math.floor(num);

  let result = "Indian Rupee ";
  if (crore > 0) result += convertLessThanOneThousand(crore) + " Crore ";
  if (lakh > 0) result += convertLessThanOneThousand(lakh) + " Lakh ";
  if (thousand > 0) result += convertLessThanOneThousand(thousand) + " Thousand ";
  if (remainder > 0) result += convertLessThanOneThousand(remainder);

  result += " Only";
  return result.trim();
}

function QuotePDFView({ quote, branding, organization }: { quote: Quote; branding?: any; organization?: any }) {
  // Calculate tax breakdown (assuming items have tax information)
  const calculateTotals = () => {
    let subtotal = 0;
    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    if (quote.items && quote.items.length > 0) {
      quote.items.forEach((item: any) => {
        subtotal += item.amount || 0;
        if (item.cgst) cgst += (item.amount * item.cgst) / 100;
        if (item.sgst) sgst += (item.amount * item.sgst) / 100;
        if (item.igst) igst += (item.amount * item.igst) / 100;
      });
    } else {
      // If no items with tax info, estimate based on total
      subtotal = quote.total / 1.18; // Assuming 18% GST
      cgst = subtotal * 0.09;
      sgst = subtotal * 0.09;
    }

    return { subtotal, cgst, sgst, igst, total: quote.total };
  };

  const totals = calculateTotals();

  const formatAddress = (address: any) => {
    if (!address) return [];
    const parts = [address.street, address.city, address.state, address.country, address.pincode].filter(Boolean);
    return parts;
  };

  const billToAddress = formatAddress(quote.billingAddress);
  const shipToAddress = formatAddress(quote.shippingAddress);

  return (
    <div id="estimate-pdf-content" className="bg-white" style={{
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
          <SalesPDFHeader
            logo={branding?.logo || undefined}
            documentTitle="Quotation"
            documentNumber={quote.quoteNumber}
            date={quote.date}
            referenceNumber={quote.referenceNumber}
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
              {quote.customerName}
            </p>
            <div style={{ fontSize: '13px', color: '#475569', lineHeight: '1.6' }}>
              {billToAddress.length > 0 ? (
                billToAddress.map((line, i) => <p key={i} style={{ margin: '0' }}>{line}</p>)
              ) : (
                <p style={{ margin: '0' }}>-</p>
              )}
            </div>
          </div>
          <div style={{ borderLeft: '3px solid #f1f5f9', paddingLeft: '20px' }}>
            <h3 style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px', margin: '0 0 12px 0' }}>
              SHIP TO
            </h3>
            <p style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a', marginBottom: '6px', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
              {quote.customerName}
            </p>
            <div style={{ fontSize: '13px', color: '#475569', lineHeight: '1.6' }}>
              {shipToAddress.length > 0 ? (
                shipToAddress.map((line, i) => <p key={i} style={{ margin: '0' }}>{line}</p>)
              ) : (
                <p style={{ margin: '0' }}>-</p>
              )}
            </div>
          </div>
        </div>

        {/* Quote Metadata Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-[2px] mb-10 bg-slate-100 rounded-lg overflow-hidden border border-slate-100" style={{
          marginBottom: '40px',
          backgroundColor: '#f1f5f9',
          border: '1px solid #f1f5f9'
        }}>
          <div style={{ backgroundColor: '#ffffff', padding: '16px' }}>
            <p style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px 0' }}>Quote Date</p>
            <p style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', margin: '0' }}>{formatDate(quote.date)}</p>
          </div>
          <div style={{ backgroundColor: '#ffffff', padding: '16px' }}>
            <p style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px 0' }}>Expiry Date</p>
            <p style={{ fontSize: '13px', fontWeight: '800', color: '#b91c1c', margin: '0' }}>
              {quote.expiryDate ? formatDate(quote.expiryDate) : formatDate(new Date(new Date(quote.date).setDate(new Date(quote.date).getDate() + 30)).toISOString())}
            </p>
          </div>
          <div style={{ backgroundColor: '#ffffff', padding: '16px' }}>
            <p style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px 0' }}>Place of Supply</p>
            <p style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', margin: '0' }}>{quote.billingAddress?.state || 'Maharashtra (27)'}</p>
          </div>
          <div style={{ backgroundColor: '#ffffff', padding: '16px' }}>
            <p style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px 0' }}>Reference#</p>
            <p style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', margin: '0' }}>{quote.referenceNumber || '-'}</p>
          </div>
        </div>

        {/* Items Table */}
        <div style={{ marginBottom: '32px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '500px' }}>
            <thead>
              <tr style={{ backgroundColor: '#1e40af', color: '#ffffff' }}>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', borderRadius: '4px 0 0 0' }}>#</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Item & Description</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Qty</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Rate</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right', borderRadius: '0 4px 0 0' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {(quote.items || []).map((item, index) => (
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
          {/* Notes & Terms */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {quote.customerNotes && (
              <div style={{ backgroundColor: '#fdfdfd', padding: '16px', borderRadius: '4px', borderLeft: '4px solid #cbd5e1' }}>
                <h4 style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', margin: '0 0 8px 0' }}>
                  Customer Notes
                </h4>
                <p style={{ fontSize: '13px', color: '#475569', margin: '0', lineHeight: '1.6' }}>{quote.customerNotes}</p>
              </div>
            )}
            {quote.termsAndConditions && (
              <div style={{ backgroundColor: '#fdfdfd', padding: '16px', borderRadius: '4px', borderLeft: '4px solid #cbd5e1' }}>
                <h4 style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', margin: '0 0 8px 0' }}>
                  Terms & Conditions
                </h4>
                <div style={{ fontSize: '12px', color: '#475569', margin: '0', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                  {quote.termsAndConditions}
                </div>
              </div>
            )}
          </div>

          {/* Summary Table */}
          <div style={{ backgroundColor: '#f8fafc', borderRadius: '8px', padding: '20px', border: '1px solid #f1f5f9', alignSelf: 'start' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '13px' }}>
              <span style={{ color: '#64748b', fontWeight: '600' }}>Sub Total</span>
              <span style={{ color: '#0f172a', fontWeight: '700' }}>{formatCurrency(totals.subtotal)}</span>
            </div>
            {totals.cgst > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '13px' }}>
                <span style={{ color: '#64748b', fontWeight: '600' }}>CGST (9.0%)</span>
                <span style={{ color: '#0f172a', fontWeight: '700' }}>{formatCurrency(totals.cgst)}</span>
              </div>
            )}
            {totals.sgst > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '13px' }}>
                <span style={{ color: '#64748b', fontWeight: '600' }}>SGST (9.0%)</span>
                <span style={{ color: '#0f172a', fontWeight: '700' }}>{formatCurrency(totals.sgst)}</span>
              </div>
            )}
            {totals.igst > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '13px' }}>
                <span style={{ color: '#64748b', fontWeight: '600' }}>IGST (18.0%)</span>
                <span style={{ color: '#0f172a', fontWeight: '700' }}>{formatCurrency(totals.igst)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', paddingTop: '16px', borderTop: '2px solid #e2e8f0' }}>
              <span style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>Total</span>
              <span style={{ fontSize: '18px', fontWeight: '800', color: '#1e40af' }}>{formatCurrency(totals.total)}</span>
            </div>
            <div style={{ marginTop: '16px', fontSize: '10px', color: '#64748b', fontStyle: 'italic', textAlign: 'right' }}>
              {numberToWords(totals.total)}
            </div>
          </div>
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

interface QuoteDetailPanelProps {
  quote: Quote;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onConvert: (type: string) => void;
  onClone: () => void;
  branding?: any;
}

function QuoteDetailPanel({ quote, onClose, onEdit, onDelete, onConvert, onClone, branding, organization }: QuoteDetailPanelProps & { organization?: any }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [showPdfView, setShowPdfView] = useState(true);
  const { toast } = useToast();

  const handlePrint = async () => {
    // Show preparing toast
    toast({ title: "Preparing print...", description: "Please wait while we generate the quote preview." });

    // Ensure PDF view is showing before printing
    if (!showPdfView) {
      setShowPdfView(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    try {
      await robustIframePrint('estimate-pdf-content', `Quote_${quote.quoteNumber}`);
    } catch (error) {
      console.error('Print failed:', error);
      toast({ title: "Print failed", variant: "destructive" });
    }
  };

  const handleDownloadPDF = async () => {
    if (!quote) return;
    toast({ title: "Preparing download...", description: "Please wait while we generate the PDF." });

    // Ensure PDF preview is showing before capturing
    if (!showPdfView) {
      setShowPdfView(true);
      // Give React time to render 
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    try {
      const { generatePDFFromElement } = await import("@/lib/pdf-utils");
      await generatePDFFromElement("estimate-pdf-content", `Quote-${quote.quoteNumber}.pdf`);

      toast({
        title: "PDF Downloaded",
        description: `Quote-${quote.quoteNumber}.pdf has been downloaded successfully.`
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({ title: "Failed to download PDF", variant: "destructive" });
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <ChevronDown className="h-4 w-4 rotate-90" />
          </Button>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white truncate" data-testid="text-quote-number">{quote.quoteNumber}</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onEdit} data-testid="button-edit-quote">
            Edit
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5" data-testid="button-pdf-print">
                <FileText className="h-4 w-4" />
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 gap-1.5" size="sm" data-testid="button-convert">
                Convert
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onConvert("sales-order")} data-testid="menu-item-convert-sales-order">
                <ShoppingCart className="mr-2 h-4 w-4" /> To Sales Order
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onConvert("invoice")} data-testid="menu-item-convert-invoice">
                <Receipt className="mr-2 h-4 w-4" /> To Invoice
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5" data-testid="button-more-actions">
                More
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem data-testid="menu-item-send">
                <Send className="mr-2 h-4 w-4" /> Send Email
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onClone} data-testid="menu-item-clone">
                <Copy className="mr-2 h-4 w-4" /> Clone
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem data-testid="menu-item-accept">
                <CheckCircle className="mr-2 h-4 w-4" /> Mark as Accepted
              </DropdownMenuItem>
              <DropdownMenuItem data-testid="menu-item-decline">
                <XCircle className="mr-2 h-4 w-4" /> Mark as Declined
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600" onClick={onDelete} data-testid="menu-item-delete">
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose} data-testid="button-close-panel">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center px-6 border-b border-slate-200 dark:border-slate-700">
          <TabsList className="h-auto p-0 bg-transparent">
            <TabsTrigger
              value="overview"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent px-4 py-3"
              data-testid="tab-overview"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="comments"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent px-4 py-3"
              data-testid="tab-comments"
            >
              Comments
            </TabsTrigger>
            <TabsTrigger
              value="transactions"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent px-4 py-3"
              data-testid="tab-transactions"
            >
              Transactions
            </TabsTrigger>
            <TabsTrigger
              value="mails"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent px-4 py-3"
              data-testid="tab-mails"
            >
              Mails
            </TabsTrigger>
            <TabsTrigger
              value="activity"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent px-4 py-3"
              data-testid="tab-activity"
            >
              Activity
            </TabsTrigger>
            <TabsTrigger
              value="statement"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent px-4 py-3"
              data-testid="tab-statement"
            >
              Statement
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="flex-1 overflow-auto scrollbar-hide mt-0">
          <div className="flex h-full">
            <div className="w-72 border-r border-slate-200 dark:border-slate-700 p-6 overflow-auto scrollbar-hide">
              <div className="space-y-6">
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold mb-2">Quote Info</p>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-slate-500">Status</p>
                      <div className="mt-1">{getStatusBadge(quote.status, quote.convertedTo)}</div>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Quote Date</p>
                      <p className="text-sm font-medium">{formatDate(quote.date)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Expiry Date</p>
                      <p className="text-sm font-medium">{quote.expiryDate ? formatDate(quote.expiryDate) : '-'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold mb-2">Customer Info</p>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-slate-500">Name</p>
                      <p className="text-sm font-medium text-blue-600">{quote.customerName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Salesperson</p>
                      <p className="text-sm font-medium">{quote.salesperson || '-'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold mb-2">Amount</p>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    {formatCurrency(quote.total)}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="pdf-view" className="text-xs text-slate-500">PDF Preview</Label>
                    <Switch
                      id="pdf-view"
                      checked={showPdfView}
                      onCheckedChange={setShowPdfView}
                      data-testid="switch-pdf-view"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 bg-slate-50 dark:bg-slate-900/50 p-6 overflow-auto scrollbar-hide">
              {showPdfView ? (
                <div className="w-full flex justify-center">
                  <div className="w-full max-w-[210mm] shadow-lg bg-white ring-1 ring-slate-200">
                    <div id="estimate-pdf-content" className="bg-white w-full" style={{
                      minHeight: '296mm',
                      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                      color: '#0f172a',
                      padding: '40px',
                      boxSizing: 'border-box'
                    }}>
                      <QuotePDFView quote={quote} branding={branding} organization={organization} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {quote.items && quote.items.length > 0 && (
                    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
                      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                        <h4 className="text-sm font-semibold">Items</h4>
                      </div>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-left text-slate-500">
                            <th className="px-4 py-2 font-medium">Item</th>
                            <th className="px-4 py-2 font-medium text-right">Qty</th>
                            <th className="px-4 py-2 font-medium text-right">Rate</th>
                            <th className="px-4 py-2 font-medium text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {quote.items.map((item: any, index: number) => (
                            <tr key={item.id || index} className="border-b last:border-0">
                              <td className="px-4 py-3">
                                <p className="font-medium">{item.name}</p>
                                {item.description && <p className="text-xs text-slate-500">{item.description}</p>}
                              </td>
                              <td className="px-4 py-3 text-right">{item.quantity}</td>
                              <td className="px-4 py-3 text-right">{formatCurrency(item.rate)}</td>
                              <td className="px-4 py-3 text-right font-medium">{formatCurrency(item.amount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="comments" className="flex-1 overflow-auto scrollbar-hide mt-0">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-12 w-12 rounded-full bg-slate-100 mb-3 flex items-center justify-center">
              <MessageSquare className="h-6 w-6 text-slate-400" />
            </div>
            <p className="text-sm text-slate-500">No comments added yet</p>
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="flex-1 overflow-auto scrollbar-hide mt-0">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-12 w-12 rounded-full bg-slate-100 mb-3 flex items-center justify-center">
              <History className="h-6 w-6 text-slate-400" />
            </div>
            <p className="text-sm text-slate-500">No transactions found</p>
          </div>
        </TabsContent>

        <TabsContent value="mails" className="flex-1 overflow-auto scrollbar-hide mt-0">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-12 w-12 rounded-full bg-slate-100 mb-3 flex items-center justify-center">
              <Mail className="h-6 w-6 text-slate-400" />
            </div>
            <p className="text-sm text-slate-500">No mails sent yet</p>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="flex-1 overflow-auto scrollbar-hide mt-0">
          <div className="p-6">
            {quote.activityLogs && quote.activityLogs.length > 0 ? (
              <div className="space-y-4">
                {quote.activityLogs.map((log: any) => (
                  <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                    <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                      <Clock className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{log.description}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {log.user} • {formatDate(log.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-12 w-12 rounded-full bg-slate-100 mb-3 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-slate-400" />
                </div>
                <p className="text-sm text-slate-500">No activity recorded yet</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="statement" className="flex-1 overflow-auto scrollbar-hide mt-0">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-12 w-12 rounded-full bg-slate-100 mb-3 flex items-center justify-center">
              <FileDown className="h-6 w-6 text-slate-400" />
            </div>
            <p className="text-sm text-slate-500">No statement available for quote</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function Estimates() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [selectedQuotes, setSelectedQuotes] = useState<string[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [quoteToDelete, setQuoteToDelete] = useState<string | null>(null);
  const [branding, setBranding] = useState<any>(null);
  const { currentOrganization } = useOrganization();
  const [activeFilter, setActiveFilter] = useState("all");
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [favoriteFilters, setFavoriteFilters] = useState<string[]>([]);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(false);


  const getFilterLabel = () => {
    const filter = QUOTE_FILTERS.find(f => f.id === activeFilter);
    return filter?.label || "All Quotes";
  };

  const toggleFavorite = (filterId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (favoriteFilters.includes(filterId)) {
      setFavoriteFilters(favoriteFilters.filter(f => f !== filterId));
    } else {
      setFavoriteFilters([...favoriteFilters, filterId]);
    }
  };

  useEffect(() => {
    fetchQuotes();
    fetchBranding();
  }, []);

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

  const fetchQuotes = async () => {
    try {
      const response = await fetch('/api/quotes');
      if (response.ok) {
        const data = await response.json();
        setQuotes(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuoteClick = (quote: Quote) => {
    setSelectedQuote(quote);
  };

  const handleClosePanel = () => {
    setSelectedQuote(null);
  };

  const handleEditQuote = () => {
    if (selectedQuote) {
      setLocation(`/estimates/${selectedQuote.id}/edit`);
    }
  };

  const toggleSelectQuote = (id: string, e?: React.MouseEvent) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (selectedQuotes.includes(id)) {
      setSelectedQuotes(selectedQuotes.filter(i => i !== id));
    } else {
      setSelectedQuotes([...selectedQuotes, id]);
    }
  };

  const handleDeleteClick = () => {
    if (selectedQuote) {
      setQuoteToDelete(selectedQuote.id);
      setDeleteDialogOpen(true);
    }
  };

  const confirmDelete = async () => {
    if (!quoteToDelete) return;
    try {
      const response = await fetch(`/api/quotes/${quoteToDelete}`, { method: 'DELETE' });
      if (response.ok) {
        toast({ title: "Quote deleted successfully" });
        handleClosePanel();
        fetchQuotes();
      }
    } catch (error) {
      toast({ title: "Failed to delete quote", variant: "destructive" });
    } finally {
      setDeleteDialogOpen(false);
      setQuoteToDelete(null);
    }
  };

  const handleConvert = async (type: string) => {
    if (!selectedQuote) return;

    try {
      const endpoint = type === 'invoice'
        ? `/api/quotes/${selectedQuote.id}/convert-to-invoice`
        : `/api/quotes/${selectedQuote.id}/convert-to-sales-order`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const result = await response.json();
        const targetType = type === 'invoice' ? 'Invoice' : 'Sales Order';
        const targetNumber = type === 'invoice'
          ? result.data?.invoice?.invoiceNumber || result.data?.invoiceNumber
          : result.data?.salesOrder?.orderNumber || result.data?.orderNumber;

        toast({
          title: "Quote Converted",
          description: `Quote converted to ${targetType}${targetNumber ? ' ' + targetNumber : ''}`,
        });

        // Refresh quotes to show updated status
        fetchQuotes();
        handleClosePanel();
      } else {
        throw new Error('Failed to convert');
      }
    } catch (error) {
      console.error('Error converting quote:', error);
      toast({
        title: "Conversion Failed",
        description: `Failed to convert quote to ${type === 'invoice' ? 'Invoice' : 'Sales Order'}`,
        variant: "destructive"
      });
    }
  };

  const handleClone = async () => {
    if (!selectedQuote) return;
    setLocation(`/quotes/create?cloneFrom=${selectedQuote.id}`);
  };

  const filteredQuotes = quotes.filter(quote => {
    const matchesSearch =
      quote.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = activeFilter === "all" || quote.status === activeFilter;
    return matchesSearch && matchesStatus;
  });

  const { currentPage, totalPages, totalItems, itemsPerPage, paginatedItems, goToPage } = usePagination<Quote>(filteredQuotes, 10);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50">
      <ResizablePanelGroup key={selectedQuote ? "split" : "single"} direction="horizontal" className="h-full w-full">
        <ResizablePanel
          defaultSize={selectedQuote ? 33 : 100}
          minSize={selectedQuote ? 33 : 100}
          maxSize={selectedQuote ? 33 : 100}
          className="flex flex-col h-full overflow-hidden bg-white border-r border-slate-200 min-w-[25%]"
        >
          <div className="flex flex-col h-full overflow-hidden">
            <div className={`flex items-center justify-between p-4 border-b border-slate-200 bg-white sticky top-0 z-10 min-h-[73px] h-auto`}>
              <div className="flex items-center gap-4 flex-1">
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                  <DropdownMenu open={filterDropdownOpen} onOpenChange={setFilterDropdownOpen}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="gap-1.5 text-xl font-semibold text-slate-900 dark:text-white p-0 h-auto hover:bg-transparent text-left whitespace-normal"
                        data-testid="button-filter-dropdown"
                      >
                        <span className="line-clamp-2">
                          {getFilterLabel()}
                        </span>
                        <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform shrink-0 ${filterDropdownOpen ? 'rotate-180' : ''}`} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-64">
                      {QUOTE_FILTERS.map((filter) => (
                        <DropdownMenuItem
                          key={filter.id}
                          className={`flex items-center justify-between ${activeFilter === filter.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                          onClick={() => {
                            setActiveFilter(filter.id);
                            setFilterDropdownOpen(false);
                          }}
                          data-testid={`filter-${filter.id}`}
                        >
                          <span className={activeFilter === filter.id ? 'font-medium text-blue-600' : ''}>
                            {filter.label}
                          </span>
                          <button
                            className="ml-2 text-slate-400 hover:text-yellow-500"
                            onClick={(e) => toggleFavorite(filter.id, e)}
                            data-testid={`favorite-${filter.id}`}
                          >
                            {favoriteFilters.includes(filter.id) ? (
                              <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            ) : (
                              <Star className="w-4 h-4" />
                            )}
                          </button>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {selectedQuote ? (
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
                      placeholder="Search quotes..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 h-9"
                      data-testid="input-search-header"
                    />
                  </div>
                )}
                <Button
                  onClick={() => setLocation("/estimates/create")}
                  className={`bg-blue-600 hover:bg-blue-700 h-9 ${selectedQuote ? 'w-9 px-0' : ''}`}
                  data-testid="button-new-quote"
                  size={selectedQuote ? "icon" : "default"}
                >
                  <Plus className={`h-4 w-4 ${selectedQuote ? '' : 'mr-2'}`} />
                  {!selectedQuote && "New Quote"}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="h-9 w-9" data-testid="button-more-options">
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
                          <DropdownMenuItem>Date</DropdownMenuItem>
                          <DropdownMenuItem>Quote Number</DropdownMenuItem>
                          <DropdownMenuItem>Customer Name</DropdownMenuItem>
                          <DropdownMenuItem>Amount</DropdownMenuItem>
                        </DropdownMenuSubContent>
                      </DropdownMenuPortal>
                    </DropdownMenuSub>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={fetchQuotes} className="flex items-center cursor-pointer mb-1">
                      <RefreshCw className="mr-2 h-4 w-4 text-slate-500" />
                      <span className="text-slate-700">Refresh List</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className={`flex flex-col flex-grow min-h-0 overflow-hidden`}>
              <div className="flex-1 overflow-auto scrollbar-hide">
                {loading ? (
                  <div className="p-8 text-center text-slate-500">Loading quotes...</div>
                ) : selectedQuote ? (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredQuotes.map((quote) => (
                      <div
                        key={quote.id}
                        className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors ${selectedQuote?.id === quote.id ? 'bg-blue-50 dark:bg-blue-900/20 border-l-2 border-l-blue-600' : ''
                          }`}
                        onClick={() => handleQuoteClick(quote)}
                        data-testid={`card-quote-${quote.id}`}
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={selectedQuotes.includes(quote.id)}
                            onCheckedChange={() => toggleSelectQuote(quote.id, {} as any)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="font-medium text-slate-900 dark:text-white truncate uppercase">
                                {quote.quoteNumber}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="text-xs text-slate-500 truncate">
                                {quote.customerName}
                              </div>
                              <div className="text-xs font-semibold">
                                {formatCurrency(quote.total)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <table className="w-full text-sm border-separate border-spacing-0">
                    <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0 z-10">
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <th className="w-10 px-3 py-3 text-left border-b border-slate-200 bg-slate-50 dark:bg-slate-800 shadow-[0_1px_0_rgba(0,0,0,0.05)]">
                          <Checkbox
                            checked={selectedQuotes.length === filteredQuotes.length && filteredQuotes.length > 0}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (selectedQuotes.length === filteredQuotes.length) {
                                setSelectedQuotes([]);
                              } else {
                                setSelectedQuotes(filteredQuotes.map(q => q.id));
                              }
                            }}
                          />
                        </th>
                        <th className="px-3 py-4 text-left font-semibold">Date</th>
                        <th className="px-3 py-4 text-left font-semibold">Quote Number</th>
                        <th className="px-3 py-4 text-left font-semibold">Customer Name</th>
                        <th className="px-3 py-4 text-left font-semibold">Status</th>
                        <th className="px-3 py-4 text-right font-semibold">Amount</th>
                        <th className="w-10 px-3 py-4 border-b border-slate-200 bg-slate-50/50 dark:bg-slate-800/50 shadow-[0_1px_0_rgba(0,0,0,0.05)]"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {paginatedItems.map((quote) => (
                        <tr
                          key={quote.id}
                          className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 cursor-pointer transition-colors ${selectedQuote?.id === quote.id ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                            }`}
                          onClick={() => handleQuoteClick(quote)}
                          data-testid={`row-quote-${quote.id}`}
                        >
                          <td className="px-3 py-4">
                            <Checkbox
                              checked={selectedQuotes.includes(quote.id)}
                              onClick={(e) => toggleSelectQuote(quote.id, e)}
                              className="rounded-full h-5 w-5 border-slate-300"
                            />
                          </td>
                          <td className="px-3 py-4 text-[13px] text-slate-600 dark:text-slate-400">
                            {formatDate(quote.date)}
                          </td>
                          <td className="px-3 py-4">
                            <span className="text-[13px] font-medium text-blue-600 dark:text-blue-400 cursor-pointer hover:underline">{quote.quoteNumber}</span>
                          </td>
                          <td className="px-3 py-4 text-[13px] text-slate-500 dark:text-slate-500">
                            {quote.referenceNumber || '-'}
                          </td>
                          <td className="px-3 py-4 text-[13px] text-slate-900 dark:text-slate-200 font-medium">
                            {quote.customerName}
                          </td>
                          <td className="px-3 py-4">
                            {getStatusBadge(quote.status, quote.convertedTo)}
                          </td>
                          <td className="px-3 py-4 text-right text-[13px] font-semibold text-slate-900 dark:text-white">
                            {formatCurrency(quote.total)}
                          </td>
                          <td className="px-3 py-4 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100">
                                  <MoreHorizontal className="h-4 w-4 text-slate-400" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleQuoteClick(quote); }}>
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEditQuote(); }}>
                                  Edit
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
            <div className="flex-none mt-auto border-t border-slate-200 bg-white">
              <TablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={goToPage}
              />
            </div>
          </div>
        </ResizablePanel>

        {selectedQuote && (
          <>
            <ResizableHandle withHandle className="w-1 bg-slate-200 hover:bg-blue-400 hover:w-1.5 transition-all cursor-col-resize" />
            <ResizablePanel defaultSize={65} minSize={30} className="bg-white">
              <div className="h-full flex flex-col overflow-hidden bg-white">
                <QuoteDetailPanel
                  quote={selectedQuote}
                  branding={branding}
                  onClose={handleClosePanel}
                  onEdit={handleEditQuote}
                  onDelete={handleDeleteClick}
                  onConvert={handleConvert}
                  onClone={handleClone}
                  organization={currentOrganization}
                />
              </div>
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Quote</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this quote? This action cannot be undone.
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
    </div >
  );
}
