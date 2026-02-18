import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, Filter, CreditCard, MoreHorizontal, Trash2, X, Pencil, Mail, Printer, ChevronDown, ArrowUpDown, RefreshCw, Download, Settings, RotateCcw, FileText } from "lucide-react";
import { usePagination } from "@/hooks/use-pagination";
import { TablePagination } from "@/components/table-pagination";
import { useBranding } from "@/hooks/use-branding";
import { PurchasePDFHeader } from "@/components/purchase-pdf-header";
import { useOrganization } from "@/context/OrganizationContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Upload } from "lucide-react";
import * as XLSX from "xlsx";
import { useToast } from "@/hooks/use-toast";
import { robustIframePrint } from "@/lib/robust-print";


interface BillPayment {
  billId: string;
  billNumber: string;
  billDate: string;
  billAmount: number;
  paymentAmount: number;
}

interface ActivityLog {
  id: string;
  timestamp: string;
  action: string;
  description: string;
  user: string;
}

interface PaymentMade {
  id: string;
  paymentNumber: string;
  vendorId: string;
  vendorName: string;
  vendorGstin?: string;
  vendorAddress?: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
  };
  paymentAmount: number;
  paymentDate: string;
  paymentMode: string;
  paidThrough?: string;
  depositTo?: string;
  paymentType: string;
  status: string;
  reference?: string;
  billPayments?: Record<string, BillPayment> | BillPayment[];
  sourceOfSupply?: string;
  destinationOfSupply?: string;
  notes?: string;
  unusedAmount?: number;
  activityLogs?: ActivityLog[];
  createdAt: string;
}

interface Vendor {
  id: string;
  vendorName: string;
  companyName?: string;
  gstin?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
}

// Convert number to words for Indian Rupees
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
  const paise = Math.round((num % 1) * 100);

  let result = "Indian Rupee ";
  if (crore > 0) result += convertLessThanOneThousand(crore) + " Crore ";
  if (lakh > 0) result += convertLessThanOneThousand(lakh) + " Lakh ";
  if (thousand > 0) result += convertLessThanOneThousand(thousand) + " Thousand ";
  if (remainder > 0) result += convertLessThanOneThousand(remainder);

  result += " Only";
  return result.trim();
}

// Helper to safely get payment number as string (handles corrupted data)
function getPaymentNumberString(paymentNumber: any): string {
  if (typeof paymentNumber === 'string') {
    return paymentNumber;
  }
  if (paymentNumber && typeof paymentNumber === 'object' && paymentNumber.nextNumber) {
    return paymentNumber.nextNumber;
  }
  return '';
}

export default function PaymentsMade() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [voidDialogOpen, setVoidDialogOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);
  const [paymentToVoid, setPaymentToVoid] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMade | null>(null);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [currentView, setCurrentView] = useState("all");

  const viewLabels: Record<string, string> = {
    'all': 'All Payments',
    'draft': 'Draft',
    'paid': 'Paid',
    'void': 'Void',
    'check': 'Paid via Check',
    'print_check': 'To Be Printed Checks',
    'uncleared_check': 'Uncleared Checks',
    'cleared_check': 'Cleared Checks',
    'void_check': 'Void Checks',
    'advance': 'Advance Payments'
  };
  const [sortBy, setSortBy] = useState<string>("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [columnPreferences, setColumnPreferences] = useState({
    showReference: true,
    showVendor: true,
    showBill: true,
    showMode: true,
    showStatus: true,
    showUnusedAmount: true,
  });

  const { data: paymentsData, isLoading, refetch } = useQuery<{ success: boolean; data: PaymentMade[] }>({
    queryKey: ['/api/payments-made'],
  });

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
    toast({ title: `Sorted by ${field}` });
  };

  const handleImportPayments = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.csv,.xlsx,.xls';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      toast({ title: "Import Started", description: `Importing ${file.name}...` });

      try {
        if (file.name.endsWith('.json')) {
          const text = await file.text();
          const data = JSON.parse(text);
          const paymentsToImport = Array.isArray(data) ? data : data.payments || [];

          for (const payment of paymentsToImport) {
            await fetch('/api/payments-made', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payment)
            });
          }
          toast({ title: "Import Complete", description: `Imported ${paymentsToImport.length} payments.` });
          refetch();
        } else if (file.name.endsWith('.csv')) {
          const text = await file.text();
          const lines = text.split('\n').filter(line => line.trim());
          const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

          let importCount = 0;
          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            const payment: Record<string, string> = {};
            headers.forEach((header, idx) => {
              payment[header] = values[idx]?.trim() || '';
            });

            await fetch('/api/payments-made', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                vendorName: payment.vendor_name || payment.vendorname,
                paymentAmount: parseFloat(payment.amount) || 0,
                paymentDate: payment.date || payment.payment_date,
                paymentMode: payment.mode || payment.payment_mode || 'cash',
                reference: payment.reference
              })
            });
            importCount++;
          }
          toast({ title: "Import Complete", description: `Imported ${importCount} payments.` });
          refetch();
        } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          const arrayBuffer = await file.arrayBuffer();
          const workbook = XLSX.read(arrayBuffer, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const data = XLSX.utils.sheet_to_json(worksheet);

          for (const row of data) {
            const r = row as Record<string, any>;
            await fetch('/api/payments-made', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                vendorName: r['Vendor Name'] || r.vendorName,
                paymentAmount: r['Amount'] || r.paymentAmount || 0,
                paymentDate: r['Date'] || r.paymentDate,
                paymentMode: r['Mode'] || r.paymentMode || 'cash',
                reference: r['Reference'] || r.reference
              })
            });
          }
          toast({ title: "Import Complete", description: `Imported ${data.length} payments.` });
          refetch();
        }
      } catch (error) {
        console.error('Import failed:', error);
        toast({ title: "Import Failed", description: "Please check your file format.", variant: "destructive" });
      }
    };
    input.click();
  };

  const handleExportPayments = (format: 'json' | 'csv' | 'excel') => {
    try {
      const exportData = payments.map(p => ({
        'Payment Number': getPaymentNumberString(p.paymentNumber),
        'Vendor Name': p.vendorName,
        'Date': formatDate(p.paymentDate),
        'Amount': p.paymentAmount,
        'Mode': getPaymentModeLabel(p.paymentMode),
        'Reference': p.reference || '',
        'Status': p.status,
        'Unused Amount': calculateUnusedAmount(p)
      }));

      if (format === 'json') {
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `payments_made_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast({ title: "Export Complete", description: "JSON file downloaded." });
      } else if (format === 'csv') {
        const headers = Object.keys(exportData[0] || {});
        const csvContent = [
          headers.join(','),
          ...exportData.map(row => headers.map(h => `"${(row as any)[h] || ''}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `payments_made_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast({ title: "Export Complete", description: "CSV file downloaded." });
      } else if (format === 'excel') {
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Payments Made');
        XLSX.writeFile(wb, `payments_made_${new Date().toISOString().split('T')[0]}.xlsx`);
        toast({ title: "Export Complete", description: "Excel file downloaded." });
      }
    } catch (error) {
      console.error('Export failed:', error);
      toast({ title: "Export Failed", variant: "destructive" });
    }
  };

  const { data: vendorsData } = useQuery<{ success: boolean; data: Vendor[] }>({
    queryKey: ['/api/vendors'],
  });

  const { data: branding } = useBranding();
  const { currentOrganization } = useOrganization();

  const payments = paymentsData?.data || [];
  const vendors = vendorsData?.data || [];

  // Deep linking for selected payment
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const paymentId = searchParams.get('id');
    if (paymentId && payments.length > 0) {
      const payment = payments.find(p => p.id === paymentId);
      if (payment) {
        setSelectedPayment(payment);
      }
    }
  }, [payments]);

  const filteredPayments = useMemo(() => {
    let result = payments;

    // Filter by view
    switch (currentView) {
      case 'draft':
        result = result.filter(p => p.status?.toLowerCase() === 'draft');
        break;
      case 'paid':
        result = result.filter(p => p.status?.toLowerCase() === 'paid');
        break;
      case 'void':
        result = result.filter(p => p.status?.toLowerCase() === 'void' || p.status?.toLowerCase() === 'voided');
        break;
      case 'check':
        result = result.filter(p => p.paymentMode?.toLowerCase() === 'cheque');
        break;
      case 'print_check':
        result = result.filter(p => p.paymentMode?.toLowerCase() === 'cheque' && p.status?.toLowerCase() === 'draft');
        break;
      case 'uncleared_check':
        result = result.filter(p => p.paymentMode?.toLowerCase() === 'cheque' && p.status?.toLowerCase() === 'paid');
        break;
      case 'cleared_check':
        result = result.filter(p => p.paymentMode?.toLowerCase() === 'cheque' && p.status?.toLowerCase() === 'cleared');
        break;
      case 'void_check':
        result = result.filter(p => p.paymentMode?.toLowerCase() === 'cheque' && (p.status?.toLowerCase() === 'void' || p.status?.toLowerCase() === 'voided'));
        break;
      case 'advance':
        result = result.filter(p => p.paymentType?.toLowerCase().includes('advance') || (p.unusedAmount || 0) > 0);
        break;
    }

    result = result.filter(payment =>
      getPaymentNumberString(payment.paymentNumber).toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(payment.vendorName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(payment.reference || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (sortBy) {
      result = [...result].sort((a, b) => {
        let valA: any = a[sortBy as keyof typeof a];
        let valB: any = b[sortBy as keyof typeof b];

        if (sortBy === "date") {
          valA = new Date(a.paymentDate).getTime();
          valB = new Date(b.paymentDate).getTime();
        } else if (sortBy === "amount") {
          valA = Number(a.paymentAmount);
          valB = Number(b.paymentAmount);
        } else if (sortBy === "vendorName") {
          valA = String(a.vendorName || "").toLowerCase();
          valB = String(b.vendorName || "").toLowerCase();
        } else if (sortBy === "paymentNumber") {
          valA = Number(a.paymentNumber);
          valB = Number(b.paymentNumber);
        }

        if (valA < valB) return sortOrder === "asc" ? -1 : 1;
        if (valA > valB) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [payments, searchQuery, sortBy, sortOrder, currentView]);

  const { currentPage, totalPages, totalItems, itemsPerPage, paginatedItems, goToPage } = usePagination(filteredPayments, 10);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const handleDelete = (id: string) => {
    setPaymentToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleVoid = (id: string) => {
    setPaymentToVoid(id);
    setVoidDialogOpen(true);
  };

  const handleViewJournal = (payment?: PaymentMade) => {
    if (payment) {
      setSelectedPayment(payment);
    }

    // Switch to detail view and scroll to journal
    setTimeout(() => {
      const journalSection = document.getElementById('journal-section');
      if (journalSection) {
        journalSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const confirmDelete = async () => {
    if (!paymentToDelete) return;
    try {
      const response = await fetch(`/api/payments-made/${paymentToDelete}`, { method: 'DELETE' });
      if (response.ok) {
        toast({ title: "Payment deleted successfully" });
        if (selectedPayment?.id === paymentToDelete) {
          setSelectedPayment(null);
        }
        refetch();
      } else {
        const data = await response.json();
        toast({ title: "Failed to delete payment", description: data.message || "An error occurred", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Failed to delete payment", variant: "destructive" });
    } finally {
      setDeleteDialogOpen(false);
      setPaymentToDelete(null);
    }
  };

  const confirmVoid = async () => {
    if (!paymentToVoid) return;
    try {
      const response = await fetch(`/api/payments-made/${paymentToVoid}/void`, { method: 'PATCH' });
      if (response.ok) {
        toast({ title: "Payment voided successfully" });
        refetch();
        // Update selected payment if it's the one we voided
        if (selectedPayment?.id === paymentToVoid) {
          const resData = await response.json();
          if (resData.success) {
            setSelectedPayment(resData.data);
          }
        }
      } else {
        const data = await response.json();
        toast({ title: "Failed to void payment", description: data.message || "An error occurred", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Failed to void payment", variant: "destructive" });
    } finally {
      setVoidDialogOpen(false);
      setPaymentToVoid(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PAID':
        return (
          <Badge
            variant="outline"
            className="text-green-600 border-green-200 bg-green-50"
          >
            PAID
          </Badge>
        );
      case 'VOIDED':
      case 'VOID':
        return (
          <Badge
            variant="outline"
            className="text-red-600 border-red-200 bg-red-50"
          >
            VOID
          </Badge>
        );
      case 'DRAFT':
        return (
          <Badge
            variant="outline"
            className="text-slate-600 border-slate-200 bg-slate-50"
          >
            DRAFT
          </Badge>
        );
      case 'REFUNDED':
        return (
          <Badge
            variant="outline"
            className="text-amber-600 border-amber-200 bg-amber-50"
          >
            REFUNDED
          </Badge>
        );
      case 'CLEARED':
        return (
          <Badge
            variant="outline"
            className="text-blue-600 border-blue-200 bg-blue-50"
          >
            CLEARED
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getBillNumbers = (payment: PaymentMade) => {
    if (!payment.billPayments) return '-';

    if (Array.isArray(payment.billPayments)) {
      return payment.billPayments.map(bp => bp.billNumber).join(', ') || '-';
    }

    const billNums = Object.values(payment.billPayments).map(bp => bp.billNumber);
    return billNums.length > 0 ? billNums.join(', ') : '-';
  };

  const getBillPaymentsArray = (payment: PaymentMade): BillPayment[] => {
    if (!payment.billPayments) return [];
    if (Array.isArray(payment.billPayments)) return payment.billPayments;
    return Object.values(payment.billPayments);
  };

  const getVendorDetails = (payment: PaymentMade) => {
    const vendor = vendors.find(v => v.id === payment.vendorId);
    return vendor;
  };

  const getPaidThroughLabel = (value?: string) => {
    const options: Record<string, string> = {
      'petty_cash': 'Petty Cash',
      'undeposited_funds': 'Undeposited Funds',
      'cash_on_hand': 'Cash on Hand',
      'bank_account': 'Bank Account',
    };
    return options[value || ''] || value || '-';
  };

  const getPaymentModeLabel = (value?: string) => {
    const options: Record<string, string> = {
      'cash': 'Cash',
      'bank_transfer': 'Bank Transfer',
      'cheque': 'Cheque',
      'credit_card': 'Credit Card',
      'upi': 'UPI',
      'neft': 'NEFT',
      'rtgs': 'RTGS',
      'imps': 'IMPS',
    };
    return options[value || ''] || value || '-';
  };

  const handleRowClick = (payment: PaymentMade) => {
    setSelectedPayment(payment);
  };

  const calculateUnusedAmount = (payment: PaymentMade) => {
    if (payment.unusedAmount !== undefined) return payment.unusedAmount;
    const billPayments = getBillPaymentsArray(payment);
    const usedAmount = billPayments.reduce((sum, bp) => sum + (bp.paymentAmount || 0), 0);
    return Math.max(0, payment.paymentAmount - usedAmount);
  };

  const handlePrint = async () => {
    toast({ title: "Preparing print...", description: "Opening print dialog." });
    try {
      await robustIframePrint('payment-receipt-content', `Payment Receipt - ${getPaymentNumberString(selectedPayment?.paymentNumber)}`);
    } catch (error) {
      console.error('Print failed:', error);
      toast({ title: "Print failed", variant: "destructive" });
    }
  };

  const handleDownloadPDF = async () => {
    toast({ title: "Preparing download...", description: "Please wait while we generate your PDF." });
    if (!selectedPayment) return;

    const element = document.getElementById('payment-receipt-content');
    if (!element) return;

    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      // Create a style element for polyfills to remove oklch variables site-wide
      const polyfillStyles = document.createElement('style');
      polyfillStyles.innerHTML = `
        * {
          --tw-ring-color: transparent !important;
          --tw-ring-offset-color: transparent !important;
          --tw-ring-shadow: none !important;
          --tw-shadow: none !important;
          --tw-shadow-colored: none !important;
          outline-color: transparent !important;
          caret-color: transparent !important;
          accent-color: transparent !important;
          
          /* Force standard RGB colors for PDF consistency */
          color-scheme: light !important;
        }
        /* Fix for light lines and colors in PDF */
        .border-slate-50 { border-color: #f1f5f9 !important; border-bottom-width: 1px !important; }
        .border-slate-100 { border-color: #f1f5f9 !important; border-bottom-width: 1px !important; }
        .border-slate-200 { border-color: #e2e8f0 !important; border-bottom-width: 1px !important; }
        .text-slate-400 { color: #94a3b8 !important; }
        .text-slate-500 { color: #64748b !important; }
        .text-slate-600 { color: #475569 !important; }
        .text-slate-700 { color: #334155 !important; }
        .bg-slate-50 { background-color: #f8fafc !important; }
        .bg-slate-100 { background-color: #f1f5f9 !important; }
        
        /* Force background visibility */
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        
        /* Hide badge for PDF generation */
        .paid-badge-overlay {
          display: none !important;
        }
      `;
      document.head.appendChild(polyfillStyles);

      // Force a re-layout and wait a bit
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.getElementById('payment-receipt-content');
          if (clonedElement) {
            // Hide the badge in the clone
            const badge = clonedElement.querySelector('.paid-badge-overlay');
            if (badge) (badge as HTMLElement).style.display = 'none';

            // Find ALL elements in the cloned document
            const allElements = clonedDoc.querySelectorAll('*');
            allElements.forEach((el) => {
              const htmlEl = el as HTMLElement;

              // 1. Clear any inline styles that might use oklch
              const inlineStyle = htmlEl.getAttribute('style') || '';
              if (inlineStyle.includes('oklch')) {
                htmlEl.setAttribute('style', inlineStyle.replace(/oklch\([^)]+\)/g, 'inherit'));
              }

              // 2. Clear known Tailwind 4 variables that often hold oklch
              htmlEl.style.setProperty('--tw-ring-color', 'transparent', 'important');
              htmlEl.style.setProperty('--tw-ring-offset-color', 'transparent', 'important');
              htmlEl.style.setProperty('--tw-ring-shadow', 'none', 'important');
              htmlEl.style.setProperty('--tw-shadow', 'none', 'important');
              htmlEl.style.setProperty('--tw-shadow-colored', 'none', 'important');

              // 3. Force computed styles to fall back
              const computed = window.getComputedStyle(htmlEl);

              // Check all potential color properties
              const colorProps = ['color', 'backgroundColor', 'borderColor', 'outlineColor', 'fill', 'stroke', 'stopColor', 'floodColor', 'lightingColor'];
              colorProps.forEach(prop => {
                const value = computed[prop as any];
                if (value && value.includes('oklch')) {
                  // Standard fallbacks
                  if (prop === 'color') htmlEl.style.setProperty('color', '#0f172a', 'important');
                  else if (prop === 'backgroundColor') htmlEl.style.setProperty('background-color', 'transparent', 'important');
                  else if (prop === 'borderColor') htmlEl.style.setProperty('border-color', '#e2e8f0', 'important');
                  else htmlEl.style.setProperty(prop, 'inherit', 'important');
                }
              });
            });
          }
        }
      });

      document.head.removeChild(polyfillStyles);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Payment-${getPaymentNumberString(selectedPayment.paymentNumber)}.pdf`);

      toast({ title: "PDF downloaded successfully" });
    } catch (error) {
      console.error('PDF Generation Error:', error);
      toast({ title: "Failed to download PDF", variant: "destructive" });
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

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50">
      <ResizablePanelGroup key={`${selectedPayment ? "split" : "single"}-${isCompact ? "compact" : "full"}`} direction="horizontal" className="h-full w-full">
        {(!isCompact || !selectedPayment) && (
          <ResizablePanel
            defaultSize={isCompact ? 100 : (selectedPayment ? 33 : 100)}
            minSize={isCompact ? 100 : (selectedPayment ? 33 : 100)}
            maxSize={isCompact ? 100 : (selectedPayment ? 33 : 100)}
            className="flex flex-col overflow-hidden bg-white border-r min-w-[25%]"
          >
            {/* Main List View */}
            <div className="flex flex-col h-full w-full animate-in fade-in duration-500">
              <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white sticky top-0 z-10 min-h-[73px] h-auto">
                <div className="flex items-center gap-4 flex-1 overflow-hidden">
                  <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="gap-1.5 text-xl font-semibold text-slate-900 hover:text-slate-700 hover:bg-transparent p-0 h-auto transition-colors text-left whitespace-normal transition-all">
                          <span className={cn(
                            "line-clamp-2",
                            selectedPayment ? "text-lg lg:text-xl" : "text-xl"
                          )}>
                            {viewLabels[currentView] || 'All Payments'}
                          </span>
                          <ChevronDown className="h-4 w-4 text-slate-500 shrink-0" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-56 p-1">
                        <DropdownMenuItem
                          className={cn("px-3 py-2 cursor-pointer transition-colors", currentView === 'all' && "bg-blue-50 text-blue-600 font-medium")}
                          onClick={() => setCurrentView('all')}
                        >
                          All Payments
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {[
                          { key: 'draft', label: 'Draft' },
                          { key: 'paid', label: 'Paid' },
                          { key: 'void', label: 'Void' },
                          { key: 'check', label: 'Paid via Check' },
                          { key: 'print_check', label: 'To Be Printed Checks' },
                          { key: 'uncleared_check', label: 'Uncleared Checks' },
                          { key: 'cleared_check', label: 'Cleared Checks' },
                          { key: 'void_check', label: 'Void Checks' },
                          { key: 'advance', label: 'Advance Payments' }
                        ].map((view) => (
                          <DropdownMenuItem
                            key={view.key}
                            onClick={() => setCurrentView(view.key)}
                            className={cn(
                              "px-3 py-2 cursor-pointer transition-colors",
                              currentView === view.key && "bg-blue-50 text-blue-600 font-medium"
                            )}
                          >
                            {view.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <span className="text-sm text-slate-400">({filteredPayments.length})</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {selectedPayment ? (
                    isSearchVisible ? (
                      <div className="relative w-full max-w-[200px] animate-in slide-in-from-right-5 fade-in-0 duration-200">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          autoFocus
                          placeholder="Search..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onBlur={() => !searchQuery && setIsSearchVisible(false)}
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
                        placeholder="Search payments..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-9"
                        data-testid="input-search-payments"
                      />
                    </div>
                  )}
                  <Button
                    className={cn(
                      "bg-sidebar hover:bg-sidebar/90 font-display font-medium gap-1.5 h-9",
                      selectedPayment && "w-9 px-0"
                    )}
                    size={selectedPayment ? "icon" : "default"}
                    onClick={() => setLocation('/payments-made/new')}
                    data-testid="button-record-payment"
                  >
                    <Plus className={cn("h-4 w-4", !selectedPayment && "mr-1.5")} />
                    {!selectedPayment && <span>New Payment</span>}
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
                            <DropdownMenuItem
                              onClick={() => handleSort("date")}
                            >
                              Date {sortBy === "date" && (sortOrder === "asc" ? "↑" : "↓")}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleSort("paymentNumber")}
                            >
                              Payment Number {sortBy === "paymentNumber" && (sortOrder === "asc" ? "↑" : "↓")}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleSort("vendorName")}
                            >
                              Vendor Name {sortBy === "vendorName" && (sortOrder === "asc" ? "↑" : "↓")}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleSort("amount")}
                            >
                              Amount {sortBy === "amount" && (sortOrder === "asc" ? "↑" : "↓")}
                            </DropdownMenuItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                      </DropdownMenuSub>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem data-testid="menu-import" onClick={handleImportPayments}>
                        <Upload className="mr-2 h-4 w-4" /> Import
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExportPayments('excel')}>
                        <Download className="mr-2 h-4 w-4" /> Export
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setIsPreferencesOpen(true)}>
                        <Settings className="mr-2 h-4 w-4" /> Preferences
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sidebar"></div>
                </div>
              ) : payments.length === 0 ? (
                <Card className="border-dashed m-6">
                  <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                      <CreditCard className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2" data-testid="text-payments-empty">No payments recorded</h3>
                    <p className="text-muted-foreground mb-4 max-w-sm">
                      Record payments made to vendors to keep track of your accounts payable.
                    </p>
                    <Button
                      className="gap-2 bg-sidebar hover:bg-sidebar/90 font-display"
                      onClick={() => setLocation('/payments-made/new')}
                      data-testid="button-record-first-payment"
                    >
                      <Plus className="h-4 w-4" /> Record Your First Payment
                    </Button>
                  </CardContent>
                </Card>
              ) : selectedPayment ? (
                <div className="flex-1 overflow-y-auto scrollbar-hide">
                  <div className="flex flex-col h-full bg-white">
                    {filteredPayments.map((payment) => (
                      <div
                        key={payment.id}
                        onClick={() => setSelectedPayment(payment)}
                        className={cn(
                          "group flex items-start gap-3 p-4 border-b border-sidebar/10 cursor-pointer transition-colors hover:bg-sidebar/5 relative",
                          selectedPayment.id === payment.id ? "bg-sidebar/5" : ""
                        )}
                      >
                        <div className="mt-1" onClick={(e) => e.stopPropagation()}>
                          <Checkbox />
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-[14px] text-slate-900 truncate uppercase">
                              {payment.vendorName}
                            </h3>
                            <div className="text-right">
                              <span className="font-semibold text-[14px] text-slate-900 whitespace-nowrap block">
                                {formatCurrency(payment.paymentAmount)}
                              </span>
                              <span className="text-[11px] text-slate-500 block">
                                Unused: {formatCurrency(calculateUnusedAmount(payment))}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 text-[13px] text-slate-500">
                            <span>{getPaymentNumberString(payment.paymentNumber)}</span>
                            <span className="text-slate-300">•</span>
                            <span>{formatDate(payment.paymentDate)}</span>
                            <span className="text-slate-300">•</span>
                            <span>{getPaymentModeLabel(payment.paymentMode)}</span>
                          </div>
                          <div className="pt-1 flex items-center justify-between">
                            {getStatusBadge(payment.status)}
                          </div>
                        </div>
                        {selectedPayment.id === payment.id && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-sidebar" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col min-h-0 relative">
                  <div className="flex-1 overflow-auto scrollbar-hide relative">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                          <TableHead className="w-10"></TableHead>
                          <TableHead className="font-display font-semibold text-slate-500 whitespace-nowrap">Date</TableHead>
                          <TableHead className="font-display font-semibold text-slate-500 whitespace-nowrap">Payment #</TableHead>
                          <TableHead className="font-display font-semibold text-slate-500 whitespace-nowrap">Reference #</TableHead>
                          <TableHead className="font-display font-semibold text-slate-500 whitespace-nowrap">Vendor Name</TableHead>
                          <TableHead className="font-display font-semibold text-slate-500 whitespace-nowrap">Bill #</TableHead>
                          <TableHead className="font-display font-semibold text-slate-500 whitespace-nowrap">Mode</TableHead>
                          <TableHead className="font-display font-semibold text-slate-500 whitespace-nowrap">Status</TableHead>
                          <TableHead className="font-display font-semibold text-right text-slate-500 whitespace-nowrap">Amount</TableHead>
                          <TableHead className="font-display font-semibold text-right text-slate-500 whitespace-nowrap">Unused Amount</TableHead>
                          <TableHead className="w-10"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedItems.map((payment: any) => (
                          <TableRow
                            key={payment.id}
                            onClick={() => handleRowClick(payment)}
                            className={cn(
                              "cursor-pointer hover-elevate",
                              (selectedPayment as any)?.id === payment.id ? "bg-blue-50/50" : ""
                            )}
                          >
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <Checkbox />
                            </TableCell>
                            <TableCell className="text-sm">
                              {formatDate(payment.paymentDate)}
                            </TableCell>
                            <TableCell className="text-sm text-blue-600 font-medium font-display hover:underline hover:text-blue-700">
                              {getPaymentNumberString(payment.paymentNumber)}
                            </TableCell>
                            <TableCell className="text-sm text-slate-500">
                              {payment.reference || '-'}
                            </TableCell>
                            <TableCell className="text-sm font-medium">{payment.vendorName}</TableCell>
                            <TableCell className="text-sm text-slate-600">{getBillNumbers(payment)}</TableCell>
                            <TableCell className="text-sm capitalize">{getPaymentModeLabel(payment.paymentMode)}</TableCell>
                            <TableCell>{getStatusBadge(payment.status)}</TableCell>
                            <TableCell className="text-sm text-right font-semibold">
                              {formatCurrency(payment.paymentAmount)}
                            </TableCell>
                            <TableCell className="text-sm text-right text-slate-600">
                              {formatCurrency(calculateUnusedAmount(payment))}
                            </TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 hover-elevate">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 p-1">
                                  <DropdownMenuItem onClick={() => handleRowClick(payment)}>
                                    View
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => setLocation(`/payments-made/edit/${payment.id}`)}>
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleViewJournal(payment)}>
                                    <FileText className="mr-2 h-4 w-4 text-slate-500" /> View Journal
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleVoid(payment.id)}
                                    disabled={payment.status === 'VOIDED'}
                                  >
                                    <RotateCcw className="mr-2 h-4 w-4 text-slate-500" /> Void
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                                    onClick={() => handleDelete(payment.id)}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {filteredPayments.length > 0 && (
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
              )}
            </div>
          </ResizablePanel>
        )}

        {selectedPayment && (
          <>
            {!isCompact && (
              <ResizableHandle withHandle className="w-1 bg-slate-100 hover:bg-sidebar/60 hover:w-1.5 transition-all cursor-col-resize" />
            )}
            <ResizablePanel defaultSize={isCompact ? 100 : 65} minSize={isCompact ? 100 : 30} className="bg-white">
              <div className="flex flex-col h-full overflow-hidden">
                {/* Detail Header */}
                <div className="flex items-center justify-between p-3 border-b bg-white">
                  <div className="flex items-center gap-4">
                    <div className="text-xl font-bold">{getPaymentNumberString(selectedPayment.paymentNumber)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="gap-1 h-8" onClick={() => setLocation(`/payments-made/edit/${selectedPayment.id}`)}>
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1 h-8">
                      <Mail className="h-3.5 w-3.5" /> Send Email
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-1 h-8">
                          <Printer className="h-3.5 w-3.5" /> PDF/Print <ChevronDown className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={handlePrint}>Print</DropdownMenuItem>
                        <DropdownMenuItem onClick={handleDownloadPDF}>Download PDF</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <div className="w-px h-4 bg-slate-200 mx-1" />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => handleViewJournal()}>
                          <FileText className="mr-2 h-4 w-4" /> View Journal
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleVoid(selectedPayment.id)}
                          disabled={selectedPayment.status === 'VOIDED'}
                        >
                          <RotateCcw className="mr-2 h-4 w-4" /> Void
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDelete(selectedPayment.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedPayment(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Detail Content */}
                <div className="flex-1 overflow-y-auto scrollbar-hide p-6 bg-slate-50 dark:bg-slate-950">
                  {/* Receipt Preview */}
                  <div id="payment-receipt-content" className="bg-white dark:bg-slate-900 border shadow-lg mx-auto w-full max-w-[210mm] relative p-8 md:p-12 text-slate-800 dark:text-slate-200 rounded-sm">
                    {/* Status Badge Overlay */}
                    <div className="absolute top-0 left-0 w-32 h-32 overflow-hidden pointer-events-none paid-badge-overlay">
                      <div className={cn(
                        "text-white text-[10px] font-bold py-1 px-10 absolute top-4 -left-8 -rotate-45 shadow-sm uppercase tracking-wider",
                        selectedPayment.status === 'VOIDED' ? "bg-red-500" : "bg-[#4CAF50]"
                      )}>
                        {selectedPayment.status === 'VOIDED' ? 'Voided' : 'Paid'}
                      </div>
                    </div>

                    {/* Header with Organization Info */}
                    <div style={{ marginBottom: '40px' }}>
                      <PurchasePDFHeader
                        organization={currentOrganization || undefined}
                        logo={branding?.logo || undefined}
                        documentTitle="PAYMENT MADE"
                        documentNumber={getPaymentNumberString(selectedPayment.paymentNumber)}
                        date={selectedPayment.paymentDate}
                        referenceNumber={selectedPayment.reference}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 mb-10" style={{ display: 'grid', marginBottom: '40px' }}>
                      <div style={{ borderLeft: '3px solid #f1f5f9', paddingLeft: '20px' }}>
                        <h4 style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px', margin: '0' }}>
                          PAID TO
                        </h4>
                        <p style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a', marginBottom: '6px', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
                          {selectedPayment.vendorName}
                        </p>
                        <div style={{ fontSize: '13px', color: '#475569', lineHeight: '1.6' }}>
                          {selectedPayment.vendorAddress?.street && <p style={{ margin: 0 }}>{selectedPayment.vendorAddress.street}</p>}
                          {selectedPayment.vendorAddress?.city && <p style={{ margin: 0 }}>{selectedPayment.vendorAddress.city}</p>}
                          <p style={{ margin: 0 }}>{selectedPayment.vendorAddress?.pincode || '411057'}, {selectedPayment.vendorAddress?.state || 'Maharashtra'}</p>
                          {selectedPayment.vendorGstin && <p style={{ margin: '4px 0 0 0', fontWeight: '600', color: '#991b1b' }}>GSTIN: {selectedPayment.vendorGstin}</p>}
                        </div>
                      </div>
                      <div className="md:border-l-0 border-l-[3px] border-[#f1f5f9] md:pl-0 pl-5">
                        <h4 style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px', margin: '0' }}>
                          PAID FROM
                        </h4>
                        <p style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a', marginBottom: '6px', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
                          {currentOrganization?.name || 'Your Company'}
                        </p>
                        <div style={{ fontSize: '13px', color: '#475569', lineHeight: '1.6' }}>
                          <p style={{ margin: '0' }}>{currentOrganization?.street1 || ''} {currentOrganization?.city || ''}</p>
                        </div>
                      </div>
                    </div>

                    {/* Metadata Information Bar */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-[1px] mb-10 bg-slate-100 rounded-lg overflow-hidden border border-slate-100" style={{
                      marginBottom: '40px',
                      backgroundColor: '#f1f5f9',
                      border: '1px solid #f1f5f9'
                    }}>
                      <div style={{ backgroundColor: '#ffffff', padding: '16px' }}>
                        <p style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px 0' }}>Payment Date</p>
                        <p style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', margin: '0' }}>{formatDate(selectedPayment.paymentDate)}</p>
                      </div>
                      <div style={{ backgroundColor: '#ffffff', padding: '16px' }}>
                        <p style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px 0' }}>Reference#</p>
                        <p style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', margin: '0' }}>{selectedPayment.reference || '-'}</p>
                      </div>
                      <div style={{ backgroundColor: '#ffffff', padding: '16px' }}>
                        <p style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px 0' }}>Payment Mode</p>
                        <p style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', margin: '0', textTransform: 'uppercase' }}>{getPaymentModeLabel(selectedPayment.paymentMode)}</p>
                      </div>
                      <div style={{ backgroundColor: '#ffffff', padding: '16px', borderLeft: '2px solid #f1f5f9' }}>
                        <p style={{ fontSize: '10px', fontWeight: '700', color: '#b91c1c', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px 0' }}>Amount Paid</p>
                        <p style={{ fontSize: '16px', fontWeight: '900', color: '#b91c1c', margin: '0' }}>{formatCurrency(selectedPayment.paymentAmount)}</p>
                      </div>
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                      <p style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px 0' }}>Amount in Words</p>
                      <p style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', fontStyle: 'italic', margin: '0' }}>{numberToWords(selectedPayment.paymentAmount)}</p>
                    </div>

                    {/* Bill Details Table */}
                    {getBillPaymentsArray(selectedPayment).length > 0 && (
                      <div style={{ marginTop: '48px', overflowX: 'auto' }}>
                        <h4 style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px', margin: '0 0 16px 0' }}>
                          Payment for
                        </h4>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '500px' }}>
                          <thead>
                            <tr style={{ backgroundColor: '#991b1b', color: '#ffffff' }}>
                              <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', borderRadius: '4px 0 0 0' }}>Bill Number</th>
                              <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bill Date</th>
                              <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Bill Amount</th>
                              <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right', borderRadius: '0 4px 0 0' }}>Payment Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {getBillPaymentsArray(selectedPayment).map((bp, index) => (
                              <tr key={index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '700', color: '#991b1b' }}>{bp.billNumber}</td>
                                <td style={{ padding: '12px 16px', fontSize: '13px', color: '#475569' }}>{formatDate(bp.billDate)}</td>
                                <td style={{ padding: '12px 16px', fontSize: '13px', color: '#475569', textAlign: 'right' }}>{formatCurrency(bp.billAmount)}</td>
                                <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '800', color: '#0f172a', textAlign: 'right' }}>{formatCurrency(bp.paymentAmount || 0)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Journal Section */}
                  <div id="journal-section" className="mt-8 max-w-[800px] mx-auto">
                    <Tabs defaultValue="journal" className="mt-8">
                      <TabsList className="h-auto p-0 bg-transparent gap-6">
                        <TabsTrigger
                          value="journal"
                          className="rounded-none border-b-2 border-transparent data-[state=active]:border-sidebar data-[state=active]:text-sidebar data-[state=active]:bg-transparent data-[state=active]:shadow-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-2 py-3 bg-transparent hover:bg-transparent transition-none"
                        >
                          Journal
                        </TabsTrigger>
                        <TabsTrigger
                          value="history"
                          className="rounded-none border-b-2 border-transparent data-[state=active]:border-sidebar data-[state=active]:text-sidebar data-[state=active]:bg-transparent data-[state=active]:shadow-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-2 py-3 bg-transparent hover:bg-transparent transition-none"
                        >
                          History
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="history" className="mt-4">
                        <div className="space-y-4">
                          <h4 className="font-semibold mb-4 mt-2">Activity History</h4>
                          {selectedPayment.activityLogs && selectedPayment.activityLogs.length > 0 ? (
                            selectedPayment.activityLogs.slice().reverse().map((log: ActivityLog, index: number) => (
                              <div key={index} className="flex gap-4 relative pl-2">
                                {/* Timeline Line */}
                                {index !== selectedPayment.activityLogs!.length - 1 && (
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

                                <div className="flex-1 bg-white p-3 rounded-md border border-slate-100 shadow-sm">
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
                            <p className="text-center text-slate-500 text-sm py-4">No activity recorded for this payment.</p>
                          )}
                        </div>
                      </TabsContent>
                      <TabsContent value="journal" className="mt-4">
                        <div className="border rounded-lg p-4 bg-slate-50 dark:bg-slate-800">
                          <div className="flex items-center justify-between mb-4">
                            <div className="text-sm text-muted-foreground">
                              Amount is displayed in your base currency <Badge variant="secondary" className="ml-2">INR</Badge>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm">Accrual</Button>
                              <Button variant="ghost" size="sm">Cash</Button>
                            </div>
                          </div>

                          <div className="font-semibold mb-2">Vendor Payment - {getPaymentNumberString(selectedPayment.paymentNumber)}</div>
                          <table className="w-full text-sm">
                            <thead className="bg-sidebar/5 dark:bg-slate-700">
                              <tr>
                                <th className="px-3 py-2 text-left">ACCOUNT</th>
                                <th className="px-3 py-2 text-right">DEBIT</th>
                                <th className="px-3 py-2 text-right">CREDIT</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="border-b">
                                <td className="px-3 py-2">{getPaidThroughLabel(selectedPayment.paidThrough)}</td>
                                <td className="px-3 py-2 text-right">0.00</td>
                                <td className="px-3 py-2 text-right">{selectedPayment.paymentAmount.toFixed(2)}</td>
                              </tr>
                              <tr className="border-b">
                                <td className="px-3 py-2">Prepaid Expenses</td>
                                <td className="px-3 py-2 text-right">{selectedPayment.paymentAmount.toFixed(2)}</td>
                                <td className="px-3 py-2 text-right">0.00</td>
                              </tr>
                              <tr className="font-bold bg-sidebar/5 dark:bg-slate-700">
                                <td className="px-3 py-2"></td>
                                <td className="px-3 py-2 text-right">{selectedPayment.paymentAmount.toFixed(2)}</td>
                                <td className="px-3 py-2 text-right">{selectedPayment.paymentAmount.toFixed(2)}</td>
                              </tr>
                            </tbody>
                          </table>

                          {getBillPaymentsArray(selectedPayment).length > 0 && (
                            <>
                              <div className="font-semibold mb-2 mt-6">Payments Made - {getBillNumbers(selectedPayment)}</div>
                              <table className="w-full text-sm">
                                <thead className="bg-sidebar/5 dark:bg-slate-700">
                                  <tr>
                                    <th className="px-3 py-2 text-left">ACCOUNT</th>
                                    <th className="px-3 py-2 text-right">DEBIT</th>
                                    <th className="px-3 py-2 text-right">CREDIT</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr className="border-b">
                                    <td className="px-3 py-2">Prepaid Expenses</td>
                                    <td className="px-3 py-2 text-right">0.00</td>
                                    <td className="px-3 py-2 text-right">{selectedPayment.paymentAmount.toFixed(2)}</td>
                                  </tr>
                                  <tr className="border-b">
                                    <td className="px-3 py-2">Accounts Payable</td>
                                    <td className="px-3 py-2 text-right">{selectedPayment.paymentAmount.toFixed(2)}</td>
                                    <td className="px-3 py-2 text-right">0.00</td>
                                  </tr>
                                  <tr className="font-bold bg-sidebar/5 dark:bg-slate-700">
                                    <td className="px-3 py-2"></td>
                                    <td className="px-3 py-2 text-right">{selectedPayment.paymentAmount.toFixed(2)}</td>
                                    <td className="px-3 py-2 text-right">{selectedPayment.paymentAmount.toFixed(2)}</td>
                                  </tr>
                                </tbody>
                              </table>
                            </>
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              </div>
            </ResizablePanel>
          </>
        )
        }
      </ResizablePanelGroup >

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Payment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this payment? This action cannot be undone.
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

      <AlertDialog open={voidDialogOpen} onOpenChange={setVoidDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Void Payment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to void this payment? This will reverse any bill allocations and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmVoid} className="bg-red-600 hover:bg-red-700">
              Void
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isPreferencesOpen} onOpenChange={setIsPreferencesOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Preferences</DialogTitle>
            <DialogDescription>
              Configure how your payments list is displayed.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="show-reference">Show Reference Column</Label>
              <Switch
                id="show-reference"
                checked={columnPreferences.showReference}
                onCheckedChange={(checked) =>
                  setColumnPreferences((prev) => ({ ...prev, showReference: checked }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="show-vendor">Show Vendor Column</Label>
              <Switch
                id="show-vendor"
                checked={columnPreferences.showVendor}
                onCheckedChange={(checked) =>
                  setColumnPreferences((prev) => ({ ...prev, showVendor: checked }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="show-bill">Show Bill Column</Label>
              <Switch
                id="show-bill"
                checked={columnPreferences.showBill}
                onCheckedChange={(checked) =>
                  setColumnPreferences((prev) => ({ ...prev, showBill: checked }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="show-mode">Show Mode Column</Label>
              <Switch
                id="show-mode"
                checked={columnPreferences.showMode}
                onCheckedChange={(checked) =>
                  setColumnPreferences((prev) => ({ ...prev, showMode: checked }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="show-status">Show Status Column</Label>
              <Switch
                id="show-status"
                checked={columnPreferences.showStatus}
                onCheckedChange={(checked) =>
                  setColumnPreferences((prev) => ({ ...prev, showStatus: checked }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="show-unused">Show Unused Amount Column</Label>
              <Switch
                id="show-unused"
                checked={columnPreferences.showUnusedAmount}
                onCheckedChange={(checked) =>
                  setColumnPreferences((prev) => ({ ...prev, showUnusedAmount: checked }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setColumnPreferences({
                  showReference: true,
                  showVendor: true,
                  showBill: true,
                  showMode: true,
                  showStatus: true,
                  showUnusedAmount: true,
                });
                toast({ title: "Preferences reset to default" });
              }}
            >
              Reset to Default
            </Button>
            <Button onClick={() => {
              setIsPreferencesOpen(false);
              toast({ title: "Preferences saved" });
            }}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div >
  );
}