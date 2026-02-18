import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useOrganization } from "@/context/OrganizationContext";
import {
  Plus, Search, ChevronDown, MoreHorizontal, Pencil, Trash2,
  X, Send, FileText, Printer, Download, RefreshCw, Eye,
  Check, Filter, ArrowUpDown, Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
import { robustIframePrint } from "@/lib/robust-print";
import { UnifiedPaymentReceipt } from "@/components/UnifiedPaymentReceipt";
import { usePagination } from "@/hooks/use-pagination";
import { TablePagination } from "@/components/table-pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface JournalEntry {
  account: string;
  debit: number;
  credit: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceId?: string;
  amountApplied?: number;
}

interface PaymentReceived {
  id: string;
  paymentNumber: string;
  date: string;
  referenceNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  invoices: Invoice[];
  mode: string;
  depositTo: string;
  amount: number;
  unusedAmount: number;
  bankCharges: number;
  tax: string;
  taxAmount: number;
  notes: string;
  attachments: string[];
  sendThankYou: boolean;
  status: string;
  paymentType: string;
  placeOfSupply: string;
  descriptionOfSupply: string;
  amountInWords: string;
  journalEntries: JournalEntry[];
  createdAt: string;
}

interface Customer {
  id: string;
  displayName: string;
  companyName: string;
  email: string;
  pan?: string;
  gstin?: string;
  gstTreatment?: string;
  placeOfSupply?: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  amount: number;
  balanceDue: number;
  status: string;
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

// Wrapper component that uses the unified receipt for consistent rendering
function PaymentReceiptView({ payment, branding, organization, isPreview = false }: { payment: PaymentReceived; branding?: any; organization?: any; isPreview?: boolean }) {
  return <UnifiedPaymentReceipt payment={payment} branding={branding} organization={organization} isPreview={isPreview} />;
}

function PaymentDetailPanel({
  payment,
  branding,
  organization,
  onClose,
  onEdit,
  onDelete,
  onRefund,
  onSendReceipt
}: {
  payment: PaymentReceived;
  branding?: any;
  organization?: any;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onRefund: () => void;
  onSendReceipt: () => void;
}) {
  const [showPdfView, setShowPdfView] = useState(true);
  const { toast } = useToast();

  const handleDownloadPDF = async () => {
    toast({ title: "Preparing download...", description: "Please wait while we generate the PDF." });

    // Ensure view is rendered
    if (!showPdfView) {
      setShowPdfView(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    try {
      const { generatePDFFromElement } = await import("@/lib/pdf-utils");
      await generatePDFFromElement("payment-pdf-content", `Payment-${(payment as any).paymentNumber}.pdf`);

      toast({
        title: "PDF Downloaded",
        description: `${(payment as any).paymentNumber}.pdf has been downloaded successfully.`
      });
    } catch (error) {
      console.error("PDF generation error:", error);
      const { toast } = await import("@/hooks/use-toast");
      toast({
        title: "Failed to download PDF",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };

  const handlePrint = async () => {
    toast({ title: "Preparing print...", description: "Please wait while we generate the receipt preview." });

    if (!showPdfView) {
      setShowPdfView(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    try {
      await robustIframePrint('payment-pdf-content', `Payment_${(payment as any).paymentNumber}`);
    } catch (error) {
      console.error('Print failed:', error);
      toast({ title: "Print failed", variant: "destructive" });
    }
  };

  return (
    <div className="h-full flex flex-col bg-white border-l border-slate-200 overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 bg-slate-50">
        <h2 className="text-sm font-semibold text-slate-900" data-testid="text-payment-number">{(payment as any).paymentNumber}</h2>
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9 rounded-md border-slate-200 hover:bg-slate-50 shadow-sm transition-all" onClick={onEdit}>
                  <Pencil className="h-4 w-4 text-slate-600" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit Payment</TooltipContent>
            </Tooltip>

            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="h-9 w-9 rounded-md border-slate-200 hover:bg-slate-50 shadow-sm transition-all">
                      <Send className="h-4 w-4 text-slate-600" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>Send Receipt</TooltipContent>
              </Tooltip>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={onSendReceipt}>Send via Email</DropdownMenuItem>
                <DropdownMenuItem>Send via SMS</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="h-9 px-3 gap-2 rounded-md border-slate-200 hover:bg-slate-50 shadow-sm transition-all text-slate-700 font-medium">
                      <FileText className="h-4 w-4" />
                      <span>Print / PDF</span>
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>View/Print PDF</TooltipContent>
              </Tooltip>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={handleDownloadPDF}>
                  <Download className="mr-2 h-4 w-4" /> Download PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handlePrint}>
                  <Printer className="mr-2 h-4 w-4" /> Print
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9 rounded-md border-slate-200 hover:bg-slate-50 shadow-sm transition-all" onClick={onRefund}>
                  <RefreshCw className="h-4 w-4 text-slate-600" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refund Payment</TooltipContent>
            </Tooltip>

            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="h-9 w-9 rounded-md border-slate-200 hover:bg-slate-50 shadow-sm transition-all">
                      <MoreHorizontal className="h-4 w-4 text-slate-600" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>More Options</TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="text-red-600" onClick={onDelete}>
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TooltipProvider>

          <div className="w-px h-6 bg-slate-200 mx-2" />

          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-700" onClick={onClose} data-testid="button-close-panel">
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-end px-4 py-2 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-2">
          <Label htmlFor="pdf-view" className="text-xs text-slate-500 font-medium">Show PDF View</Label>
          <Switch id="pdf-view" checked={showPdfView} onCheckedChange={setShowPdfView} className="scale-75" />
        </div>
      </div>

      {showPdfView ? (
        <div className="flex-1 overflow-auto scrollbar-hide bg-slate-100 flex justify-center" style={{ minHeight: 0 }}>
          <div className="p-8 w-full flex justify-center">
            <div id="payment-pdf-content" className="shadow-lg bg-white w-full max-w-[210mm]" style={{ minHeight: '296mm' }}>
              <PaymentReceiptView payment={payment} branding={branding} organization={organization} isPreview={true} />
            </div>
          </div>
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <div className="p-4">
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-sm text-slate-500">Customer</p>
                  <p className="font-semibold text-blue-600">{(payment as any).customerName}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500">Amount</p>
                  <p className="text-2xl font-bold text-slate-900">{formatCurrency((payment as any).amount)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Payment Date</p>
                  <p className="font-medium">{formatDate((payment as any).date)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Payment #</p>
                  <p className="font-medium">{(payment as any).paymentNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Payment Mode</p>
                  <p className="font-medium">{(payment as any).mode}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Deposit To</p>
                  <p className="font-medium">{payment.depositTo}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Reference Number</p>
                  <p className="font-medium">{payment.referenceNumber || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Status</p>
                  <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                    {(payment as any).status}
                  </Badge>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">More Information</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Deposit To</span>
                    <span className="text-blue-600">{payment.depositTo}</span>
                  </div>
                </div>
              </div>

              {payment.journalEntries && payment.journalEntries.length > 0 && (
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">Journal</h4>
                    <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">INR</span>
                  </div>
                  <p className="text-sm text-slate-500 mb-2">Amount is displayed in your base currency</p>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-medium">Customer Payment - {(payment as any).paymentNumber}</span>
                    <Button variant="outline" size="sm" className="h-6 text-xs">Accrual</Button>
                    <Button variant="outline" size="sm" className="h-6 text-xs">Cash</Button>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="text-xs">ACCOUNT</TableHead>
                        <TableHead className="text-xs text-right">DEBIT</TableHead>
                        <TableHead className="text-xs text-right">CREDIT</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payment.journalEntries.map((entry, index) => (
                        <TableRow key={index}>
                          <TableCell className="text-sm">{entry.account}</TableCell>
                          <TableCell className="text-sm text-right">{entry.debit > 0 ? formatCurrency(entry.debit).replace('₹', '') : '0.00'}</TableCell>
                          <TableCell className="text-sm text-right">{entry.credit > 0 ? formatCurrency(entry.credit).replace('₹', '') : '0.00'}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="border-t-2">
                        <TableCell className="font-semibold">Total</TableCell>
                        <TableCell className="font-semibold text-right">
                          {formatCurrency(payment.journalEntries.reduce((sum, e) => sum + e.debit, 0)).replace('₹', '')}
                        </TableCell>
                        <TableCell className="font-semibold text-right">
                          {formatCurrency(payment.journalEntries.reduce((sum, e) => sum + e.credit, 0)).replace('₹', '')}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      )}

      <div className="border-t border-slate-200 p-3 text-center text-xs text-slate-500">
        PDF Template: <span className="text-blue-600">Elite Template</span>
        <button className="text-blue-600 ml-2">Change</button>
      </div>
    </div>
  );
}

export default function PaymentsReceived() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { currentOrganization } = useOrganization();
  const [payments, setPayments] = useState<PaymentReceived[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<PaymentReceived | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);
  const [sendReceiptDialogOpen, setSendReceiptDialogOpen] = useState(false);
  const [isSendingReceipt, setIsSendingReceipt] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [branding, setBranding] = useState<any>(null);
  const [sortBy, setSortBy] = useState<{ field: string; order: 'asc' | 'desc' }>({ field: 'date', order: 'desc' });
  const [filterStatus, setFilterStatus] = useState("All");

  useEffect(() => {
    fetchPayments();
    fetchBranding();
  }, []);

  const handleSort = (field: string) => {
    setSortBy(prev => ({
      field,
      order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc'
    }));
  };

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

  const fetchPayments = async () => {
    try {
      const response = await fetch('/api/payments-received');
      const data = await response.json();
      if (data.success) {
        setPayments(data.data);
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch payments", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentClick = (payment: PaymentReceived) => {
    setSelectedPayment(payment);
  };

  const handleClosePanel = () => {
    setSelectedPayment(null);
  };

  const handleEditPayment = () => {
    if (selectedPayment) {
      setLocation(`/payments-received/${selectedPayment.id}/edit`);
    }
  };

  const handleDelete = (id: string) => {
    setPaymentToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!paymentToDelete) return;
    try {
      const response = await fetch(`/api/payments-received/${paymentToDelete}`, { method: 'DELETE' });
      if (response.ok) {
        toast({ title: "Success", description: "Payment deleted successfully" });
        fetchPayments();
        if (selectedPayment?.id === paymentToDelete) {
          setSelectedPayment(null);
        }
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete payment", variant: "destructive" });
    } finally {
      setDeleteDialogOpen(false);
      setPaymentToDelete(null);
    }
  };

  const handleRefund = () => {
    toast({ title: "Refund", description: "Refund functionality coming soon" });
  };

  const handleSendReceipt = () => {
    if (!selectedPayment) return;
    setSendReceiptDialogOpen(true);
  };

  const confirmSendReceipt = async () => {
    if (!selectedPayment) return;

    setIsSendingReceipt(true);
    try {
      const response = await fetch(`/api/payments-received/${selectedPayment.id}/send-receipt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Receipt Sent",
          description: data.message || `Payment receipt has been sent to ${selectedPayment.customerEmail || 'the customer'}`
        });

        // Update local state to show activity log immediately
        setPayments(prev => prev.map(p => p.id === data.data.id ? data.data : p));
        setSelectedPayment(data.data);
      } else {
        toast({
          title: "Failed to Send",
          description: data.message || "Could not send payment receipt",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error sending receipt:', error);
      toast({
        title: "Error",
        description: "Failed to send payment receipt. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSendingReceipt(false);
      setSendReceiptDialogOpen(false);
    }
  };

  const handleVerifyPayment = async (id: string) => {
    try {
      const response = await fetch(`/api/payments-received/${id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (data.success) {
        toast({ title: "Success", description: "Payment verified successfully" });
        fetchPayments();
        if (selectedPayment?.id === id) {
          setSelectedPayment(data.data);
        }
      } else {
        toast({ title: "Error", description: data.message || "Failed to verify payment", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to verify payment", variant: "destructive" });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower === 'paid' || statusLower === 'verified') return <Badge className="bg-green-100 text-green-700 border-green-200">Verified</Badge>;
    if (statusLower === 'pending verification') return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Pending Verification</Badge>;
    if (statusLower === 'partially_paid') return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Partially Paid</Badge>;
    if (statusLower === 'void') return <Badge className="bg-red-100 text-red-700 border-red-200">Void</Badge>;
    return <Badge variant="outline">{status}</Badge>;
  };

  const filteredPayments = payments
    .filter(p => {
      const matchesSearch = p.paymentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.referenceNumber?.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (filterStatus === "All") return true;
      if (filterStatus === "Closed") {
        return ['paid', 'void'].includes(p.status?.toLowerCase());
      }
      return p.status?.toLowerCase() === filterStatus.toLowerCase();
    })
    .sort((a, b) => {
      const field = sortBy.field as keyof PaymentReceived;
      let aValue: any = a[field];
      let bValue: any = b[field];

      if (field === 'date') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      if (aValue < bValue) return sortBy.order === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortBy.order === 'asc' ? 1 : -1;
      return 0;
    });

  const { currentPage, totalPages, totalItems, itemsPerPage, paginatedItems, goToPage } = usePagination<PaymentReceived>(filteredPayments, 10);

  const showCreateForm = false; // Separate page handles this

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
        {!showCreateForm && (!isCompact || !selectedPayment) && (
          <ResizablePanel
            defaultSize={isCompact ? 100 : (selectedPayment ? 29 : 100)}
            minSize={isCompact ? 100 : (selectedPayment ? 29 : 100)}
            maxSize={isCompact ? 100 : (selectedPayment ? 29 : 100)}
            className="bg-white min-w-[25%]"
          >
            <div className="h-full flex flex-col overflow-hidden bg-white border-r border-slate-200">
              <div className="flex items-center justify-between p-4 border-b border-slate-200 sticky top-0 bg-white z-10 flex-none min-h-[73px] h-auto">
                <div className="flex items-center gap-4 flex-1 overflow-hidden">
                  <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="gap-1.5 text-xl font-semibold text-slate-900 hover:text-slate-700 hover:bg-transparent p-0 h-auto transition-colors text-left whitespace-normal"
                        >
                          <span className="line-clamp-2">{filterStatus === "All" ? "All Payments" : filterStatus}</span>
                          <ChevronDown className="h-4 w-4 text-slate-500 shrink-0" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-56">
                        <DropdownMenuItem onClick={() => setFilterStatus("All")}>All Payments</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setFilterStatus("Draft")}>Draft</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setFilterStatus("Open")}>Open</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setFilterStatus("Closed")}>Closed</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <span className="text-sm text-slate-400">({payments.length})</span>
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
                        <Search className="h-4 w-4 text-slate-500" />
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
                    onClick={() => setLocation('/payments-received/create')}
                    className={cn(
                      "bg-[#002e46] hover:bg-[#001f2f] text-white gap-1.5 h-9 font-semibold",
                      selectedPayment && "w-9 px-0"
                    )}
                    size={selectedPayment ? "icon" : "default"}
                    data-testid="button-record-payment"
                  >
                    <Plus className="h-4 w-4" />
                    {!selectedPayment && <span>New</span>}
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
                            <DropdownMenuItem onClick={() => handleSort('date')}>
                              Date {sortBy.field === 'date' && (sortBy.order === 'asc' ? '↑' : '↓')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSort('paymentNumber')}>
                              Payment Number {sortBy.field === 'paymentNumber' && (sortBy.order === 'asc' ? '↑' : '↓')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSort('customerName')}>
                              Customer Name {sortBy.field === 'customerName' && (sortBy.order === 'asc' ? '↑' : '↓')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSort('amount')}>
                              Amount {sortBy.field === 'amount' && (sortBy.order === 'asc' ? '↑' : '↓')}
                            </DropdownMenuItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                      </DropdownMenuSub>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleImport} data-testid="menu-import">
                        <Download className="mr-2 h-4 w-4" /> Import Payments
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={async () => {
                        const { exportToExcel } = await import("@/lib/export-utils");
                        toast({ title: "Exporting...", description: "Your file is being prepared." });
                        const exportData = filteredPayments.map(p => ({
                          'Date': formatDate(p.date),
                          'Payment Number': p.paymentNumber,
                          'Reference Number': p.referenceNumber || '-',
                          'Customer Name': p.customerName,
                          'Mode': p.mode,
                          'Amount': p.amount,
                          'Unused Amount': p.unusedAmount,
                          'Status': p.status
                        }));
                        await exportToExcel(exportData, 'payments-received', 'Payments');
                      }} data-testid="menu-export">
                        <Download className="mr-2 h-4 w-4" /> Export Payments
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="flex-1 overflow-auto scrollbar-hide min-h-0">
                {isLoading ? (
                  <div className="flex items-center justify-center h-64">Loading...</div>
                ) : filteredPayments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                    <p>No payments found</p>
                  </div>
                ) : selectedPayment ? (
                  <div className="divide-y divide-slate-100">
                    {paginatedItems.map((payment) => (
                      <div
                        key={payment.id}
                        className={cn(
                          "p-4 cursor-pointer hover:bg-slate-50 transition-colors",
                          selectedPayment.id === payment.id && "bg-blue-50 border-l-2 border-l-blue-600"
                        )}
                        onClick={() => handlePaymentClick(payment)}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <div className={cn(
                            "font-medium truncate",
                            selectedPayment.id === payment.id ? "text-blue-600" : "text-slate-900"
                          )}>
                            {payment.customerName}
                          </div>
                          <span className="text-xs text-slate-500 whitespace-nowrap ml-2">{formatDate(payment.date)}</span>
                        </div>
                        <div className="flex justify-between items-center mb-1">
                          <div className="text-xs text-slate-500">{payment.paymentNumber}</div>
                          <div className="font-semibold text-sm">{formatCurrency(payment.amount)}</div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-400 capitalize">{payment.mode}</span>
                          {payment.unusedAmount > 0 && (
                            <span className="text-xs text-orange-600">
                              Unused: {formatCurrency(payment.unusedAmount)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="w-full">
                    <Table>
                      <TableHeader className="bg-sidebar-accent/5 border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                        <TableRow className="border-b border-slate-200">
                          <TableHead className="w-12 pl-4 py-3">
                            <Checkbox
                              checked={selectedPayments.length === filteredPayments.length && filteredPayments.length > 0}
                              onCheckedChange={(checked) => {
                                if (checked) setSelectedPayments(filteredPayments.map(p => p.id));
                                else setSelectedPayments([]);
                              }}
                              className="data-[state=checked]:bg-sidebar data-[state=checked]:border-sidebar border-slate-300"
                            />
                          </TableHead>
                          <TableHead className="px-4 py-3 text-left text-[11px] font-bold text-sidebar/70 uppercase tracking-wider font-display">DATE</TableHead>
                          <TableHead className="px-4 py-3 text-left text-[11px] font-bold text-sidebar/70 uppercase tracking-wider font-display">PAYMENT #</TableHead>
                          <TableHead className="px-4 py-3 text-left text-[11px] font-bold text-sidebar/70 uppercase tracking-wider font-display">REFERENCE NUMBER</TableHead>
                          <TableHead className="px-4 py-3 text-left text-[11px] font-bold text-sidebar/70 uppercase tracking-wider font-display">CUSTOMER NAME</TableHead>
                          <TableHead className="px-4 py-3 text-left text-[11px] font-bold text-sidebar/70 uppercase tracking-wider font-display">INVOICE#</TableHead>
                          <TableHead className="px-4 py-3 text-left text-[11px] font-bold text-sidebar/70 uppercase tracking-wider font-display">MODE</TableHead>
                          <TableHead className="px-4 py-3 text-right text-[11px] font-bold text-sidebar/70 uppercase tracking-wider font-display">AMOUNT</TableHead>
                          <TableHead className="px-4 py-3 text-right text-[11px] font-bold text-sidebar/70 uppercase tracking-wider font-display">UNUSED AMOUNT</TableHead>
                          <TableHead className="px-4 py-3 text-left text-[11px] font-bold text-sidebar/70 uppercase tracking-wider font-display">STATUS</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedItems.map((payment: PaymentReceived) => (
                          <TableRow
                            key={payment.id}
                            onClick={() => handlePaymentClick(payment)}
                            className={`cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 ${(selectedPayment as any)?.id === payment.id ? 'bg-blue-50' : ''}`}
                            data-testid={`row-payment-${payment.id}`}
                          >
                            <TableCell className="pl-4 py-4" onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                checked={selectedPayments.includes(payment.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedPayments(prev => [...prev, payment.id]);
                                  } else {
                                    setSelectedPayments(prev => prev.filter(i => i !== payment.id));
                                  }
                                }}
                              />
                            </TableCell>
                            <TableCell className="py-4 text-sm">{formatDate(payment.date)}</TableCell>
                            <TableCell className="py-4 text-sm text-blue-600 font-medium">{payment.paymentNumber}</TableCell>
                            <TableCell className="py-4 text-sm">{payment.referenceNumber || '-'}</TableCell>
                            <TableCell className="py-4 text-sm font-semibold text-sidebar hover:text-primary transition-colors font-display cursor-pointer">{payment.customerName}</TableCell>
                            <TableCell className="py-4 text-sm">
                              {payment.invoices?.length > 0
                                ? payment.invoices.map(inv => inv.invoiceNumber).join(', ')
                                : '-'
                              }
                            </TableCell>
                            <TableCell className="py-4 text-sm">{payment.mode}</TableCell>
                            <TableCell className="py-4 text-sm text-right font-semibold">{formatCurrency(payment.amount)}</TableCell>
                            <TableCell className="py-4 text-sm text-right">{formatCurrency(payment.unusedAmount)}</TableCell>
                            <TableCell className="py-4">{getStatusBadge(payment.status)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
              <div className="flex-none border-t border-slate-200 bg-white">
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
        )}

        {!showCreateForm && selectedPayment && (
          <>
            {!isCompact && (
              <ResizableHandle withHandle className="w-1 bg-slate-200 hover:bg-blue-400 hover:w-1.5 transition-all cursor-col-resize" />
            )}
            <ResizablePanel defaultSize={isCompact ? 100 : 65} minSize={isCompact ? 100 : 25} className="bg-white">
              <div className="h-full flex flex-col overflow-hidden bg-white border-l border-slate-200">
                <PaymentDetailPanel
                  payment={selectedPayment}
                  branding={branding}
                  organization={currentOrganization || undefined}
                  onClose={handleClosePanel}
                  onEdit={handleEditPayment}
                  onDelete={() => handleDelete(selectedPayment.id)}
                  onRefund={handleRefund}
                  onSendReceipt={handleSendReceipt}
                />
              </div>
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>

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

      <AlertDialog open={sendReceiptDialogOpen} onOpenChange={setSendReceiptDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send Payment Receipt</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedPayment ? (
                <>
                  Send payment receipt for <strong>{selectedPayment.paymentNumber}</strong> to{' '}
                  <strong>{selectedPayment.customerEmail || selectedPayment.customerName}</strong>?
                  {!selectedPayment.customerEmail && (
                    <div className="mt-2 text-orange-600">
                      ⚠️ Warning: Customer email not found. Please update customer details.
                    </div>
                  )}
                </>
              ) : (
                'Send payment receipt to customer?'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSendingReceipt}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmSendReceipt}
              disabled={isSendingReceipt || !selectedPayment?.customerEmail}
              className="bg-[#002e46] hover:bg-[#001f2f]"
            >
              {isSendingReceipt ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Receipt'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div >
  );
}

