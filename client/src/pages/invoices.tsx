
import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import { Link, useLocation } from "wouter";
import { jsPDF } from "jspdf";
import { addLogotoPDF, addSignaturetoPDF } from "@/lib/logo-utils";
import { robustIframePrint } from "@/lib/robust-print";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useOrganization } from "@/context/OrganizationContext";
import { SalesPDFHeader } from "@/components/sales-pdf-header";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
    Plus,
    Download,
    Upload,
    Send,
    MoreHorizontal,
    Trash2,
    Pencil,
    MessageSquare,
    CreditCard,
    HelpCircle,
    ArrowLeft,
    Printer,
    Share2,
    X,
    Clock,
    Save,
    Menu,
    Search,
    Filter,
    ChevronDown,
    CheckCircle,
    AlertCircle,
    FileText,
    Repeat,
    FileCheck,
    Truck,
    Ban,
    BookOpen,
    Settings,
    RotateCcw,
    Mail,
    Copy,
    ArrowUpDown,
    RefreshCw,
    Info
} from "lucide-react";
import ApplyCreditsDialog from "@/components/ApplyCreditsDialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { usePagination } from "@/hooks/use-pagination";
import { TablePagination } from "@/components/table-pagination";
import { InvoicePDFView } from "@/components/InvoicePDFView";

interface InvoiceListItem {
    id: string;
    invoiceNumber: string;
    customerName: string;
    customerId: string;
    date: string;
    dueDate: string;
    amount: number;
    status: string;
    terms: string;
    balanceDue: number;
}

interface InvoiceDetail {
    id: string;
    invoiceNumber: string;
    referenceNumber: string;
    date: string;
    dueDate: string;
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
    salesperson: string;
    placeOfSupply: string;
    paymentTerms: string;
    items: any[];
    subTotal: number;
    shippingCharges: number;
    cgst: number;
    sgst: number;
    igst: number;
    adjustment: number;
    total: number;
    amountPaid: number;
    balanceDue: number;
    customerNotes: string;
    termsAndConditions: string;
    status: string;
    sourceType: string | null;
    sourceNumber: string | null;
    payments: any[];
    activityLogs: any[];
    createdAt: string;
    amountRefunded?: number;
    refunds?: any[];
}

const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null) return '₹0.00';
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
};

const formatAddress = (address: any) => {
    if (!address) return ['-'];
    const parts = [address.street, address.city, address.state, address.country, address.pincode].filter(Boolean);
    return parts.length > 0 ? parts : ['-'];
};

const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
        case 'paid':
            return 'bg-green-50 text-green-700 border-green-200 font-display font-bold text-[10px] uppercase tracking-wider px-2 py-0.5';
        case 'sent':
        case 'pending':
            return 'bg-blue-50 text-blue-700 border-blue-200 font-display font-bold text-[10px] uppercase tracking-wider px-2 py-0.5';
        case 'overdue':
            return 'bg-red-50 text-red-700 border-red-200 font-display font-bold text-[10px] uppercase tracking-wider px-2 py-0.5';
        case 'draft':
            return 'bg-slate-50 text-slate-600 border-slate-200 font-display font-bold text-[10px] uppercase tracking-wider px-2 py-0.5';
        case 'partially_paid':
            return 'bg-amber-50 text-amber-700 border-amber-200 font-display font-bold text-[10px] uppercase tracking-wider px-2 py-0.5';
        case 'void':
            return 'bg-slate-100 text-slate-400 border-slate-200 font-display font-bold text-[10px] uppercase tracking-wider px-2 py-0.5';
        default:
            return 'bg-slate-50 text-slate-600 border-slate-200 font-display font-bold text-[10px] uppercase tracking-wider px-2 py-0.5';
    }
};

const getActivityIcon = (action: string) => {
    switch (action) {
        case 'created':
            return <div className="w-3 h-3 rounded-full bg-green-500" />;
        case 'sent':
            return <div className="w-3 h-3 rounded-full bg-blue-500" />;
        case 'paid':
            return <div className="w-3 h-3 rounded-full bg-green-500" />;
        case 'payment_recorded':
            return <div className="w-3 h-3 rounded-full bg-emerald-500" />;
        case 'updated':
            return <div className="w-3 h-3 rounded-full bg-yellow-500" />;
        default:
            return <div className="w-3 h-3 rounded-full bg-slate-400" />;
    }
};


export default function Invoices() {
    const { token } = useAuthStore();
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
    const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDetail | null>(null);
    const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeFilter, setActiveFilter] = useState<string>("All");
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState("whats-next");
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState("");
    const [paymentMode, setPaymentMode] = useState("cash");
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [paymentTime, setPaymentTime] = useState(new Date().toTimeString().slice(0, 5));
    const [voidDialogOpen, setVoidDialogOpen] = useState(false);
    const [recurringDialogOpen, setRecurringDialogOpen] = useState(false);
    const [journalDialogOpen, setJournalDialogOpen] = useState(false);
    const [preferencesDialogOpen, setPreferencesDialogOpen] = useState(false);
    const [refundDialogOpen, setRefundDialogOpen] = useState(false);
    const [refundAmount, setRefundAmount] = useState("");
    const [refundMode, setRefundMode] = useState("Cash");
    const [refundReason, setRefundReason] = useState("");
    const [branding, setBranding] = useState<any>(null);
    const [sortBy, setSortBy] = useState<{ field: keyof InvoiceListItem; order: 'asc' | 'desc' }>({ field: 'date', order: 'desc' });

    const handleSort = (field: keyof InvoiceListItem) => {
        setSortBy(prev => ({
            field,
            order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc'
        }));
    };

    const getSortedInvoices = (items: InvoiceListItem[]) => {
        return [...items].sort((a, b) => {
            const field = sortBy.field;
            const order = sortBy.order;
            const valA = a[field];
            const valB = b[field];

            if (typeof valA === 'string' && typeof valB === 'string') {
                return order === 'asc'
                    ? valA.localeCompare(valB)
                    : valB.localeCompare(valA);
            }

            if (typeof valA === 'number' && typeof valB === 'number') {
                return order === 'asc' ? valA - valB : valB - valA;
            }

            return 0;
        });
    };

    const [isSearchVisible, setIsSearchVisible] = useState(false);
    const [applyCreditsDialogOpen, setApplyCreditsDialogOpen] = useState(false);
    const [availableCredits, setAvailableCredits] = useState<number>(0);
    const invoicePdfRef = useRef<HTMLDivElement>(null);
    const { currentOrganization } = useOrganization();

    const filteredInvoices = getSortedInvoices(invoices.filter(invoice => {
        const matchesSearch =
            (invoice.invoiceNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (invoice.customerName || '').toLowerCase().includes(searchTerm.toLowerCase());

        if (activeFilter === "All") return matchesSearch;
        const normalizedStatus = (invoice.status || '').toUpperCase();
        const normalizedFilter = activeFilter.toUpperCase();

        if (normalizedFilter === 'SENT' && (normalizedStatus === 'SENT' || normalizedStatus === 'PENDING' || normalizedStatus === 'OVERDUE')) {
            return matchesSearch;
        }

        return matchesSearch && normalizedStatus === normalizedFilter;
    }));

    useEffect(() => {
        fetchInvoices();
        fetchBranding();
    }, []);

    const fetchBranding = async () => {
        try {
            const response = await fetch("/api/branding", {
                headers: {
                    ...(token ? { "Authorization": `Bearer ${token}` } : {})
                }
            });
            const data = await response.json();
            if (data.success) {
                setBranding(data.data);
            }
        } catch (error) {
            console.error("Failed to fetch branding:", error);
        }
    };

    const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
        toast({ title: `Exporting as ${format.toUpperCase()}...`, description: "Preparing your document for download." });

        try {
            if (format === 'pdf') {
                const { generatePDFFromElement } = await import("@/lib/pdf-utils");
                const elementId = selectedInvoice ? "invoice-pdf-content" : "invoices-table-container";
                const fileName = selectedInvoice ? `Invoice-${selectedInvoice.invoiceNumber}.pdf` : `invoices_export_${new Date().getTime()}.pdf`;

                const element = document.getElementById(elementId);
                if (element) {
                    await generatePDFFromElement(elementId, fileName);
                    toast({ title: "Success", description: "PDF downloaded successfully." });
                } else {
                    const exportData = selectedInvoices.length > 0 ? invoices.filter(i => selectedInvoices.includes(i.id)) : invoices;
                    const content = "Date,Number,Customer,Status,Amount\n" + exportData.map(i => `${i.date},${i.invoiceNumber},${i.customerName},${i.status},${i.amount}`).join("\n");
                    const blob = new Blob([content], { type: 'application/pdf' });
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = fileName;
                    link.click();
                    window.URL.revokeObjectURL(url);
                }
            } else {
                const fileName = `invoices_export_${new Date().getTime()}.${format === 'excel' ? 'xlsx' : format}`;
                const exportData = selectedInvoices.length > 0 ? invoices.filter(i => selectedInvoices.includes(i.id)) : invoices;
                const content = "Date,Number,Customer,Status,Amount\n" + exportData.map(i => `${i.date},${i.invoiceNumber},${i.customerName},${i.status},${i.amount}`).join("\n");
                const blob = new Blob([content], { type: 'text/plain' });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = fileName;
                link.click();
                window.URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error("Export Error:", error);
            toast({ title: "Export Failed", description: "There was an error generating the file.", variant: "destructive" });
        }
    };

    const handleImport = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.csv,.xlsx,.xls';
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

    const fetchInvoices = async () => {
        try {
            const response = await fetch('/api/invoices', {
                headers: {
                    ...(token ? { "Authorization": `Bearer ${token}` } : {})
                }
            });
            if (response.ok) {
                const data = await response.json();
                setInvoices(data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch invoices:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchInvoiceDetail = async (id: string) => {
        try {
            const response = await fetch(`/api/invoices/${id}`, {
                headers: {
                    ...(token ? { "Authorization": `Bearer ${token}` } : {})
                }
            });
            if (response.ok) {
                const data = await response.json();
                setSelectedInvoice(data.data);

                // Fetch available credits for the customer
                if (data.data.customerId) {
                    fetchAvailableCredits(data.data.customerId);
                }
            }
        } catch (error) {
            console.error('Failed to fetch invoice detail:', error);
        }
    };

    const fetchAvailableCredits = async (customerId: string) => {
        try {
            const response = await fetch(`/api/customers/${customerId}/available-credits`, {
                headers: {
                    ...(token ? { "Authorization": `Bearer ${token}` } : {})
                }
            });
            if (response.ok) {
                const data = await response.json();
                setAvailableCredits(data.data.totalAvailable || 0);
            }
        } catch (error) {
            console.error('Failed to fetch available credits:', error);
            setAvailableCredits(0);
        }
    };

    const handleInvoiceClick = (invoice: InvoiceListItem) => {
        fetchInvoiceDetail(invoice.id);
    };

    const handleClosePanel = () => {
        setSelectedInvoice(null);
    };

    const handleEditInvoice = () => {
        if (selectedInvoice) {
            setLocation(`/invoices/${selectedInvoice.id}/edit`);
        }
    };

    const toggleSelectInvoice = (id: string, e?: React.MouseEvent) => {
        if (e && e.stopPropagation) e.stopPropagation();
        if (selectedInvoices.includes(id)) {
            setSelectedInvoices(selectedInvoices.filter(i => i !== id));
        } else {
            setSelectedInvoices([...selectedInvoices, id]);
        }
    };

    const handleDownloadPDF = async (invoice: InvoiceDetail) => {
        toast({ title: "Preparing download...", description: "Please wait while we generate your PDF." });
        // If we are already viewing the PDF, use that element
        const pdfElement = document.getElementById('invoice-pdf-content');

        if (!pdfElement) {
            // If not viewing the PDF, we need to show it first (hidden or separate)
            // but for simplicity and UI consistency, we'll suggest viewing it or
            // we can trigger the state change.
            setShowPdfPreview(true);
            setTimeout(() => handleDownloadPDF(invoice), 300);
            return;
        }

        try {
            const { generatePDFFromElement } = await import("@/lib/pdf-utils");
            await generatePDFFromElement("invoice-pdf-content", `Invoice-${invoice.invoiceNumber}.pdf`);

            toast({
                title: "PDF Downloaded",
                description: `Invoice ${invoice.invoiceNumber} has been downloaded successfully.`,
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

    const handleMarkAsSentInDropdown = async () => {
        if (!selectedInvoice) return;
        try {
            const response = await fetch(`/api/invoices/${selectedInvoice.id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { "Authorization": `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ status: 'Sent' })
            });
            if (response.ok) {
                toast({ title: "Invoice marked as sent" });
                fetchInvoiceDetail(selectedInvoice.id);
                fetchInvoices();
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to mark as sent", variant: "destructive" });
        }
    };

    const handleSendInvoice = async () => {
        if (!selectedInvoice) return;
        try {
            // Step 1: Send the email
            const emailResponse = await fetch("/api/email/send", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { "Authorization": `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    customerId: selectedInvoice.customerId,
                    transactionId: selectedInvoice.id,
                    transactionType: "invoice",
                    subject: `Invoice ${selectedInvoice.invoiceNumber} from ${currentOrganization?.name || 'our company'}`,
                    body: `Please find the attached invoice ${selectedInvoice.invoiceNumber} for your review.`,
                    recipient: "customer@example.com", // In real app, fetch from customer data
                    fromEmail: currentOrganization?.email || "billing@example.com",
                    type: "manual"
                })
            });

            if (!emailResponse.ok) throw new Error('Failed to send email');

            // Step 2: Mark as sent
            const response = await fetch(`/api/invoices/${selectedInvoice.id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { "Authorization": `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ status: 'Sent' })
            });
            if (response.ok) {
                toast({ title: "Invoice emailed and marked as sent" });
                fetchInvoiceDetail(selectedInvoice.id);
                fetchInvoices();
            }
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to send invoice",
                variant: "destructive"
            });
        }
    };

    const handleRecordPayment = async () => {
        if (!selectedInvoice || !paymentAmount) return;
        try {
            // Combine date and time into a single timestamp
            const paymentDateTime = new Date(`${paymentDate}T${paymentTime}`);

            const response = await fetch(`/api/invoices/${selectedInvoice.id}/record-payment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { "Authorization": `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    amount: parseFloat(paymentAmount),
                    paymentMode: paymentMode,
                    date: paymentDateTime.toISOString()
                })
            });
            if (response.ok) {
                toast({ title: "Payment recorded successfully" });
                setPaymentDialogOpen(false);
                setPaymentAmount("");
                setPaymentDate(new Date().toISOString().split('T')[0]);
                setPaymentTime(new Date().toTimeString().slice(0, 5));
                fetchInvoiceDetail(selectedInvoice.id);
                fetchInvoices();
            }
        } catch (error) {
            toast({ title: "Failed to record payment", variant: "destructive" });
        }
    };

    const getRefundableAmount = () => {
        if (!selectedInvoice) return 0;
        return selectedInvoice.amountPaid || 0;
    };

    const handleRefund = async () => {
        if (!selectedInvoice || !refundAmount) return;
        const amount = parseFloat(refundAmount);
        const refundableAmount = getRefundableAmount();
        if (amount <= 0) {
            toast({ title: "Refund amount must be greater than 0", variant: "destructive" });
            return;
        }
        if (amount > refundableAmount) {
            toast({ title: `Refund amount cannot exceed refundable balance of ${formatCurrency(refundableAmount)}`, variant: "destructive" });
            return;
        }
        try {
            const response = await fetch(`/api/invoices/${selectedInvoice.id}/refund`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { "Authorization": `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    amount: amount,
                    mode: refundMode,
                    reason: refundReason || 'Refund processed'
                })
            });
            if (response.ok) {
                toast({ title: "Refund processed successfully" });
                setRefundDialogOpen(false);
                setRefundAmount("");
                setRefundReason("");
                fetchInvoiceDetail(selectedInvoice.id);
                fetchInvoices();
            } else {
                const errorData = await response.json();
                toast({ title: errorData.message || "Failed to process refund", variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Failed to process refund", variant: "destructive" });
        }
    };

    const handleDeleteClick = () => {
        if (selectedInvoice) {
            setInvoiceToDelete(selectedInvoice.id);
            setDeleteDialogOpen(true);
        }
    };

    const confirmDelete = async () => {
        if (!invoiceToDelete) return;
        try {
            const response = await fetch(`/api/invoices/${invoiceToDelete}`, {
                method: 'DELETE',
                headers: {
                    ...(token ? { "Authorization": `Bearer ${token}` } : {})
                }
            });
            if (response.ok) {
                toast({ title: "Invoice deleted successfully" });
                handleClosePanel();
                fetchInvoices();
            }
        } catch (error) {
            toast({ title: "Failed to delete invoice", variant: "destructive" });
        } finally {
            setDeleteDialogOpen(false);
            setInvoiceToDelete(null);
        }
    };

    const handleDeleteInvoice = async (invoiceId: string, e: React.MouseEvent) => {
        e.stopPropagation();

        if (!window.confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch(`/api/invoices/${invoiceId}`, {
                method: 'DELETE',
                headers: {
                    ...(token ? { "Authorization": `Bearer ${token}` } : {})
                }
            });
            if (response.ok) {
                toast({ title: "Invoice deleted successfully" });
                // Close detail panel if the deleted invoice was selected
                if (selectedInvoice?.id === invoiceId) {
                    handleClosePanel();
                }
                fetchInvoices();
            } else {
                toast({ title: "Failed to delete invoice", variant: "destructive" });
            }
        } catch (error) {
            console.error('Failed to delete invoice:', error);
            toast({ title: "Failed to delete invoice", variant: "destructive" });
        }
    };

    const handleMarkAsSent = async () => {
        if (!selectedInvoice) return;
        try {
            const response = await fetch(`/api/invoices/${selectedInvoice.id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { "Authorization": `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ status: 'Sent' })
            });
            if (response.ok) {
                toast({ title: "Invoice marked as sent" });
                fetchInvoiceDetail(selectedInvoice.id);
                fetchInvoices();
            }
        } catch (error) {
            toast({ title: "Failed to mark invoice as sent", variant: "destructive" });
        }
    };

    const handleMakeRecurring = () => {
        setRecurringDialogOpen(true);
    };

    const handleCreateCreditNote = () => {
        if (selectedInvoice) {
            setLocation(`/credit-notes/create?fromInvoice=${selectedInvoice.id}`);
        }
    };

    const handleAddEWayBillDetails = () => {
        if (selectedInvoice) {
            setLocation(`/e-way-bills?fromInvoice=${selectedInvoice.id}`);
        }
    };

    const handleCloneInvoice = () => {
        if (selectedInvoice) {
            setLocation(`/invoices/new?cloneFrom=${selectedInvoice.id}`);
        }
    };

    const handleVoidInvoice = async () => {
        if (!selectedInvoice) return;
        try {
            const response = await fetch(`/api/invoices/${selectedInvoice.id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { "Authorization": `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ status: 'VOID' })
            });
            if (response.ok) {
                toast({ title: "Invoice voided successfully" });
                setVoidDialogOpen(false);
                fetchInvoiceDetail(selectedInvoice.id);
                fetchInvoices();
            }
        } catch (error) {
            toast({ title: "Failed to void invoice", variant: "destructive" });
        }
    };

    const handleViewJournal = () => {
        setJournalDialogOpen(true);
    };

    const handleInvoicePreferences = () => {
        setPreferencesDialogOpen(true);
    };

    const handleShare = () => {
        if (selectedInvoice) {
            navigator.clipboard.writeText(`${window.location.origin}/invoices/${selectedInvoice.id}`);
            toast({ title: "Link copied to clipboard" });
        }
    };

    const [showPdfPreview, setShowPdfPreview] = useState(true);

    const handlePrint = async () => {
        if (!selectedInvoice) return;

        toast({ title: "Preparing print...", description: "Please wait while we generate the invoice preview." });

        // Ensure PDF preview is showing before capturing
        if (!showPdfPreview) {
            setShowPdfPreview(true);
            // Give React time to render
            await new Promise(resolve => setTimeout(resolve, 1500));
        }

        try {
            await robustIframePrint('invoice-pdf-content', `Invoice_${selectedInvoice.invoiceNumber}`);
        } catch (error) {
            console.error('Print failed:', error);
            toast({ title: "Print failed", variant: "destructive" });
        }
    };


    const applyFilter = (invoiceList: InvoiceListItem[]) => {
        if (activeFilter === "All") return invoiceList;
        return invoiceList.filter(invoice => {
            const status = invoice.status?.toUpperCase() || "";
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const dueDate = new Date(invoice.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            const isOverdue = dueDate < today && invoice.balanceDue > 0;

            switch (activeFilter) {
                case "Draft":
                    return status === "DRAFT";
                case "Locked":
                    return status === "LOCKED";
                case "Pending Approval":
                    return status === "PENDING_APPROVAL" || status === "PENDING APPROVAL";
                case "Approved":
                    return status === "APPROVED";
                case "Customer Viewed":
                    return status === "CUSTOMER_VIEWED" || status === "CUSTOMER VIEWED";
                case "Partially Paid":
                    return status === "PARTIALLY_PAID" || status === "PARTIALLY PAID";
                case "Unpaid":
                    return invoice.balanceDue > 0 && invoice.balanceDue === invoice.amount;
                case "Overdue":
                    return isOverdue;
                default:
                    return true;
            }
        });
    };

    const getCalculatedStatus = (invoice: InvoiceListItem) => {
        const status = (invoice.status || '').toLowerCase();
        if (status === 'paid') return { label: 'Paid', color: 'text-green-700', bgColor: 'bg-green-100' };
        if (status === 'draft') return { label: 'Draft', color: 'text-slate-600', bgColor: 'bg-slate-100' };
        if (status === 'partially_paid') return { label: 'Partially Paid', color: 'text-yellow-700', bgColor: 'bg-yellow-100' };

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dueDate = new Date(invoice.dueDate);

        if (dueDate < today) {
            return { label: 'Overdue', color: 'text-red-700', bgColor: 'bg-red-100' };
        }

        return { label: 'Sent', color: 'text-blue-700', bgColor: 'bg-blue-100' };
    };

    const { currentPage, totalPages, totalItems, itemsPerPage, paginatedItems, goToPage } = usePagination(filteredInvoices, 10);

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
            <ResizablePanelGroup key={`${selectedInvoice ? "split" : "single"}-${isCompact ? "compact" : "full"}`} direction="horizontal" className="h-full w-full">
                {(!isCompact || !selectedInvoice) && (
                    <ResizablePanel
                        defaultSize={isCompact ? 100 : (selectedInvoice ? 27 : 100)}
                        minSize={isCompact ? 100 : (selectedInvoice ? 27 : 100)}
                        maxSize={isCompact ? 100 : (selectedInvoice ? 27 : 100)}
                        className="flex flex-col overflow-hidden bg-white border-r border-slate-200 min-w-[25%]"
                    >
                        <div className="flex flex-col h-full overflow-hidden">
                            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white sticky top-0 z-10 min-h-[73px] h-auto">
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    className="gap-2 text-2xl font-bold text-sidebar hover:text-sidebar hover:bg-transparent p-0 h-auto transition-colors text-left whitespace-normal font-display tracking-tight group"
                                                >
                                                    <span className="line-clamp-2">
                                                        {activeFilter === "All" ? "All Invoices" : `${activeFilter} Invoices`}
                                                    </span>
                                                    <ChevronDown className="h-5 w-5 text-sidebar/30 group-hover:text-sidebar/50 transition-colors shrink-0" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="start" className="w-64 p-1">
                                                <div className="px-3 py-2 text-[10px] font-bold text-sidebar/40 uppercase tracking-[0.2em] font-display mb-1">Filter by Status</div>
                                                <DropdownMenuItem onClick={() => setActiveFilter("All")} className="rounded-md focus:bg-sidebar/5 focus:text-sidebar font-medium">All</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setActiveFilter("Draft")} className="rounded-md focus:bg-sidebar/5 focus:text-sidebar font-medium">Draft</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setActiveFilter("Locked")} className="rounded-md focus:bg-sidebar/5 focus:text-sidebar font-medium">Locked</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setActiveFilter("Pending Approval")} className="rounded-md focus:bg-sidebar/5 focus:text-sidebar font-medium">Pending Approval</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setActiveFilter("Approved")} className="rounded-md focus:bg-sidebar/5 focus:text-sidebar font-medium">Approved</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setActiveFilter("Customer Viewed")} className="rounded-md focus:bg-sidebar/5 focus:text-sidebar font-medium">Customer Viewed</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setActiveFilter("Partially Paid")} className="rounded-md focus:bg-sidebar/5 focus:text-sidebar font-medium">Partially Paid</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setActiveFilter("Unpaid")} className="rounded-md focus:bg-sidebar/5 focus:text-sidebar font-medium">Unpaid</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setActiveFilter("Overdue")} className="rounded-md focus:bg-sidebar/5 focus:text-sidebar font-medium">Overdue</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                        <div className="h-6 w-px bg-sidebar/10 mx-1 hidden sm:block"></div>
                                        <Badge variant="secondary" className="bg-sidebar/5 text-sidebar/60 border-sidebar/10 font-bold font-display px-2.5 py-0.5 rounded-full text-[11px]">
                                            {invoices.length}
                                        </Badge>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {selectedInvoice ? (
                                        isSearchVisible ? (
                                            <div className="relative w-full max-w-[200px] animate-in slide-in-from-right-5 fade-in-0 duration-200">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-sidebar/40" />
                                                <Input
                                                    autoFocus
                                                    placeholder="Search..."
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    onBlur={() => !searchTerm && setIsSearchVisible(false)}
                                                    className="pl-9 h-9 border-sidebar/10 focus:border-sidebar/20 bg-sidebar-accent/5 focus:bg-white transition-all text-sidebar font-medium"
                                                />
                                            </div>
                                        ) : (
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-9 w-9 border-sidebar/10 hover:bg-sidebar/5 hover:text-sidebar transition-all text-sidebar/60"
                                                onClick={() => setIsSearchVisible(true)}
                                            >
                                                <Search className="h-4 w-4" />
                                            </Button>
                                        )
                                    ) : (
                                        <div className="relative w-[280px] hidden sm:block">
                                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-sidebar/30" />
                                            <Input
                                                placeholder="Search invoices..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="pl-10 h-10 border-sidebar/10 focus:border-sidebar/20 bg-sidebar-accent/5 focus:bg-white transition-all text-sidebar font-medium rounded-lg"
                                                data-testid="input-search-invoices"
                                            />
                                        </div>
                                    )}

                                    <Link href="/invoices/new">
                                        <Button
                                            className={`bg-sidebar hover:bg-sidebar/90 text-white gap-2 h-9 px-4 font-bold font-display uppercase tracking-wider text-[11px] shadow-sm transition-all hover:translate-y-[-1px] ${selectedInvoice ? 'w-9 px-0' : ''}`}
                                            data-testid="button-new-invoice"
                                            size={selectedInvoice ? "icon" : "default"}
                                        >
                                            <Plus className={`h-4 w-4 transition-transform group-hover:rotate-90 ${selectedInvoice ? '' : ''}`} />
                                            {!selectedInvoice && "New"}
                                        </Button>
                                    </Link>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" size="icon" className="h-9 w-9">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-56">
                                            <DropdownMenuSub>
                                                <DropdownMenuSubTrigger>
                                                    <ArrowUpDown className="mr-2 h-4 w-4" />
                                                    <span>Sort by</span>
                                                </DropdownMenuSubTrigger>
                                                <DropdownMenuPortal>
                                                    <DropdownMenuSubContent>
                                                        <DropdownMenuItem onClick={() => handleSort('date')}>Date</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleSort('invoiceNumber')}>Invoice Number</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleSort('customerName')}>Customer Name</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleSort('amount')}>Amount</DropdownMenuItem>
                                                    </DropdownMenuSubContent>
                                                </DropdownMenuPortal>
                                            </DropdownMenuSub>

                                            <DropdownMenuSeparator />

                                            <DropdownMenuItem onClick={handleImport}>
                                                <Download className="mr-2 h-4 w-4" />
                                                <span>Import Invoices</span>
                                            </DropdownMenuItem>

                                            <DropdownMenuSub>
                                                <DropdownMenuSubTrigger>
                                                    <Upload className="mr-2 h-4 w-4" />
                                                    <span>Export Invoices</span>
                                                </DropdownMenuSubTrigger>
                                                <DropdownMenuPortal>
                                                    <DropdownMenuSubContent>
                                                        <DropdownMenuItem onClick={() => handleExport('pdf')}>PDF</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleExport('excel')}>Excel</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleExport('csv')}>CSV</DropdownMenuItem>
                                                    </DropdownMenuSubContent>
                                                </DropdownMenuPortal>
                                            </DropdownMenuSub>

                                            <DropdownMenuSeparator />

                                            <DropdownMenuItem onClick={fetchInvoices}>
                                                <RefreshCw className="mr-2 h-4 w-4" /> Refresh List
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
                                        placeholder="Search invoices..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-9 h-9"
                                        data-testid="input-search-mobile"
                                    />
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col min-h-0 border-t border-slate-200" id="invoices-table-container">
                                <div className="flex-1 overflow-auto scrollbar-hide">

                                    {loading ? (
                                        <div className="p-8 text-center text-slate-500">Loading invoices...</div>
                                    ) : filteredInvoices.length === 0 ? (
                                        <div className="p-8 text-center text-slate-500">
                                            <p>No invoices found.</p>
                                            <Link href="/invoices/new">
                                                <Button className="mt-4 bg-red-500 hover:bg-red-600">
                                                    <Plus className="h-4 w-4 mr-2" /> Create your first invoice
                                                </Button>
                                            </Link>
                                        </div>
                                    ) : selectedInvoice ? (
                                        <div className="divide-y divide-slate-100">
                                            {filteredInvoices.map((invoice) => {
                                                const status = getCalculatedStatus(invoice);
                                                return (
                                                    <div
                                                        key={invoice.id}
                                                        className={`p-4 hover:bg-slate-50 cursor-pointer transition-colors ${selectedInvoice?.id === invoice.id ? 'bg-blue-50 border-l-2 border-l-blue-600' : ''
                                                            }`}
                                                        onClick={() => handleInvoiceClick(invoice)}
                                                        data-testid={`card-invoice-${invoice.id}`}
                                                    >
                                                        <div className="flex items-start justify-between mb-1">
                                                            <div className="flex items-center gap-2">
                                                                <Checkbox
                                                                    checked={selectedInvoices.includes(invoice.id)}
                                                                    onClick={(e) => toggleSelectInvoice(invoice.id, e)}
                                                                />
                                                                <span className="font-medium text-slate-900 truncate">{invoice.customerName}</span>
                                                            </div>
                                                            <span className="text-sm font-medium text-slate-900">
                                                                {formatCurrency(invoice.amount)}
                                                            </span>
                                                        </div>
                                                        <div className="ml-6 flex items-center gap-2 text-sm">
                                                            <span className="text-blue-600">{invoice.invoiceNumber}</span>
                                                            <span className="text-slate-400">{formatDate(invoice.date)}</span>
                                                        </div>
                                                        <div className="ml-6 mt-1">
                                                            <Badge className={`text-[10px] px-1.5 py-0 border-0 uppercase ${status.bgColor} ${status.color}`}>
                                                                {status.label}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <>
                                            <table className="w-full">
                                                <thead className="bg-sidebar-accent/5 border-b border-sidebar/10">
                                                    <tr>
                                                        <th className="w-12 px-5 py-4 text-left">
                                                            <Checkbox className="border-sidebar/20 data-[state=checked]:bg-sidebar data-[state=checked]:text-white" />
                                                        </th>
                                                        <th className="px-5 py-4 text-left font-bold font-display text-xs text-sidebar uppercase tracking-wider">Date</th>
                                                        <th className="px-5 py-4 text-left font-bold font-display text-xs text-sidebar uppercase tracking-wider">Invoice#</th>
                                                        <th className="px-5 py-4 text-left font-bold font-display text-xs text-sidebar uppercase tracking-wider">Customer Name</th>
                                                        <th className="px-5 py-4 text-left font-bold font-display text-xs text-sidebar uppercase tracking-wider">Status</th>
                                                        <th className="px-5 py-4 text-left font-bold font-display text-xs text-sidebar uppercase tracking-wider">Due Date</th>
                                                        <th className="px-5 py-4 text-right font-bold font-display text-xs text-sidebar uppercase tracking-wider">Amount</th>
                                                        <th className="px-5 py-4 text-right font-bold font-display text-xs text-sidebar uppercase tracking-wider">Balance Due</th>
                                                        <th className="w-10 px-5 py-4"></th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {paginatedItems.map((invoice) => {
                                                        const status = getCalculatedStatus(invoice);
                                                        return (
                                                            <tr
                                                                key={invoice.id}
                                                                className="group hover:bg-sidebar/5 cursor-pointer transition-colors"
                                                                onClick={() => handleInvoiceClick(invoice)}
                                                                data-testid={`row-invoice-${invoice.id}`}
                                                            >
                                                                <td className="px-4 py-3">
                                                                    <Checkbox
                                                                        checked={selectedInvoices.includes(invoice.id)}
                                                                        onClick={(e) => toggleSelectInvoice(invoice.id, e)}
                                                                    />
                                                                </td>
                                                                <td className="px-4 py-3 text-sm text-slate-600">
                                                                    {formatDate(invoice.date)}
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <span className="text-sm text-blue-600 hover:underline">
                                                                        {invoice.invoiceNumber}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3 text-sm text-slate-900 font-medium">
                                                                    {invoice.customerName}
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <Badge className={`text-[10px] uppercase ${status.bgColor} ${status.color}`}>
                                                                        {status.label}
                                                                    </Badge>
                                                                </td>
                                                                <td className="px-4 py-3 text-sm text-slate-600">
                                                                    {formatDate(invoice.dueDate)}
                                                                </td>
                                                                <td className="px-4 py-3 text-sm text-slate-900 text-right font-medium">
                                                                    {formatCurrency(invoice.amount)}
                                                                </td>
                                                                <td className="px-4 py-3 text-sm text-slate-900 text-right font-medium">
                                                                    {formatCurrency(invoice.balanceDue)}
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <DropdownMenu>
                                                                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                                <MoreHorizontal className="h-4 w-4" />
                                                                            </Button>
                                                                        </DropdownMenuTrigger>
                                                                        <DropdownMenuContent align="end">
                                                                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setLocation(`/invoices/${invoice.id}/edit`); }}>Edit</DropdownMenuItem>
                                                                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setLocation(`/invoices/create?cloneFrom=${invoice.id}`); }}>Clone</DropdownMenuItem>
                                                                            <DropdownMenuItem onClick={(e) => e.stopPropagation()}>Send</DropdownMenuItem>
                                                                            <DropdownMenuItem onClick={(e) => handleDeleteInvoice(invoice.id, e)} className="text-red-600">Delete</DropdownMenuItem>
                                                                        </DropdownMenuContent>
                                                                    </DropdownMenu>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </>
                                    )}
                                </div>
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

                {(!isCompact && selectedInvoice) && (
                    <ResizableHandle withHandle className="w-1 bg-slate-200 hover:bg-blue-400 hover:w-1.5 transition-all cursor-col-resize" />
                )}
                {selectedInvoice && (
                    <ResizablePanel defaultSize={isCompact ? 100 : 65} minSize={isCompact ? 100 : 30} className="bg-white">
                        <div className="flex flex-col h-full overflow-hidden bg-white border-l border-slate-200">
                            <div className="flex items-center justify-between p-3 border-b border-slate-200 sticky top-0 bg-white z-10">
                                <div className="flex items-center gap-4">
                                    <Button variant="ghost" size="icon" onClick={handleClosePanel} className="h-8 w-8">
                                        <X className="h-4 w-4" />
                                    </Button>
                                    <div className="flex flex-col">
                                        <h2 className="text-sm font-semibold text-slate-900">{selectedInvoice.invoiceNumber}</h2>
                                        <span className="text-xs text-slate-500">{selectedInvoice.customerName}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-slate-500">Show PDF View</span>
                                        <Switch checked={showPdfPreview} onCheckedChange={setShowPdfPreview} />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-200 overflow-x-auto bg-white dark:bg-slate-900">
                                <Button variant="ghost" size="sm" className="h-8 gap-1.5" onClick={handleEditInvoice} data-testid="button-edit-invoice">
                                    <Pencil className="h-3.5 w-3.5" />
                                    Edit
                                </Button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-8 gap-1.5" data-testid="button-send-dropdown">
                                            <Mail className="h-3.5 w-3.5" />
                                            Send
                                            <ChevronDown className="h-3 w-3" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem onClick={handleSendInvoice}>Send Email</DropdownMenuItem>
                                        <DropdownMenuItem>Send WhatsApp</DropdownMenuItem>
                                        <DropdownMenuItem>Send SMS</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <Button variant="ghost" size="sm" className="h-8 gap-1.5" onClick={handleShare} data-testid="button-share-invoice">
                                    <Share2 className="h-3.5 w-3.5" />
                                    Share
                                </Button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-8 gap-1.5" data-testid="button-pdf-print">
                                            <FileText className="h-3.5 w-3.5" />
                                            PDF/Print
                                            <ChevronDown className="h-3 w-3" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem onClick={() => handleDownloadPDF(selectedInvoice)}>
                                            <Download className="mr-2 h-4 w-4" /> Download PDF
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={handlePrint}>
                                            <Printer className="mr-2 h-4 w-4" /> Print
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                {selectedInvoice.status?.toLowerCase() !== 'paid' && (
                                    <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={() => setPaymentDialogOpen(true)} data-testid="button-record-payment">
                                        <CreditCard className="h-3.5 w-3.5" />
                                        Record Payment
                                    </Button>
                                )}
                                {availableCredits > 0 && selectedInvoice.balanceDue > 0 && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 gap-1.5 text-blue-600 border-blue-200 hover:bg-blue-50"
                                        onClick={() => setApplyCreditsDialogOpen(true)}
                                        data-testid="button-apply-credits"
                                    >
                                        <Info className="h-3.5 w-3.5" />
                                        Apply Credits
                                    </Button>
                                )}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm" className="h-8" data-testid="button-more-actions">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56">
                                        <DropdownMenuItem onClick={handleMarkAsSentInDropdown} data-testid="menu-mark-as-sent">
                                            <CheckCircle className="mr-2 h-4 w-4 text-blue-600" />
                                            <span className="text-blue-600 font-medium">Mark As Sent</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={handleMakeRecurring} data-testid="menu-make-recurring">
                                            <Repeat className="mr-2 h-4 w-4" /> Make Recurring
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={handleCreateCreditNote} data-testid="menu-create-credit-note">
                                            <FileCheck className="mr-2 h-4 w-4" /> Create Credit Note
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setLocation(`/e-way-bills/create?invoiceId=${selectedInvoice.id}`)} data-testid="menu-add-eway-bill">
                                            <Truck className="mr-2 h-4 w-4" /> Add e-Way Bill Details
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={handleCloneInvoice} data-testid="menu-clone">
                                            <Copy className="mr-2 h-4 w-4" /> Clone
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setVoidDialogOpen(true)} data-testid="menu-void">
                                            <Ban className="mr-2 h-4 w-4" /> Void
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={handleViewJournal} data-testid="menu-view-journal">
                                            <BookOpen className="mr-2 h-4 w-4" /> View Journal
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            className="text-destructive focus:text-destructive"
                                            onClick={handleDeleteClick}
                                            data-testid="menu-delete-invoice"
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={handleInvoicePreferences} data-testid="menu-invoice-preferences">
                                            <Settings className="mr-2 h-4 w-4" /> Invoice Preferences
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            {showPdfPreview ? (
                                <div className="flex-1 overflow-auto scrollbar-hide bg-slate-100 dark:bg-slate-800 p-4 sm:p-8 flex justify-center">
                                    <div className="w-full max-w-[210mm] shadow-lg bg-white dark:bg-white mx-auto">
                                        <div id="invoice-pdf-content" ref={invoicePdfRef} className="bg-white w-full" style={{ minHeight: '296mm', border: '1px solid #cbd5e1' }}>
                                            <InvoicePDFView
                                                invoice={selectedInvoice}
                                                branding={branding}
                                                organization={currentOrganization}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 overflow-auto scrollbar-hide">
                                    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                                        <div className="px-6 bg-white border-b border-slate-200">
                                            <TabsList className="h-auto p-0 bg-transparent gap-6">
                                                <TabsTrigger
                                                    value="whats-next"
                                                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-2 py-3 bg-transparent hover:bg-transparent transition-none"
                                                >
                                                    <HelpCircle className="h-3.5 w-3.5 mr-1.5" />
                                                    What's Next
                                                </TabsTrigger>
                                                <TabsTrigger
                                                    value="comments"
                                                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-2 py-3 bg-transparent hover:bg-transparent transition-none"
                                                >
                                                    <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                                                    Comments & History
                                                </TabsTrigger>
                                                {/* Payments tab removed - merged into Comments & History */}
                                            </TabsList>
                                        </div>

                                        <ScrollArea className="flex-1">
                                            <TabsContent value="whats-next" className="m-0 p-6">
                                                <div className="bg-purple-50 rounded-lg border border-purple-100 p-4 flex items-start gap-4 mb-6">
                                                    <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                                                        <Send className="h-5 w-5 text-purple-600" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="font-medium text-slate-900">Send the Invoice</h4>
                                                        <p className="text-sm text-slate-600 mt-1">
                                                            Invoice has been created. You can now email this invoice to your customer or mark it as sent.
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-3">
                                                            <Button variant="outline" size="sm" onClick={handleSendInvoice}>
                                                                Mark as Sent
                                                            </Button>
                                                            <Button size="sm" className="gap-1.5 bg-blue-600 hover:bg-blue-700">
                                                                <Send className="h-3.5 w-3.5" /> Send Invoice
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-6">
                                                    <div className="bg-white rounded-lg border border-slate-200 p-6">
                                                        <InvoicePDFView
                                                            invoice={selectedInvoice}
                                                            branding={branding}
                                                            organization={currentOrganization}
                                                        />
                                                    </div>
                                                </div>
                                            </TabsContent>

                                            <TabsContent value="comments" className="m-0 p-6">
                                                <div className="space-y-6">
                                                    {/* Payment History Section */}
                                                    {(selectedInvoice.payments || []).length > 0 && (
                                                        <div>
                                                            <h3 className="text-sm font-semibold text-slate-700 mb-3">Payment History</h3>
                                                            <div className="border border-slate-200 rounded-lg overflow-hidden">
                                                                <table className="w-full">
                                                                    <thead className="bg-slate-50">
                                                                        <tr>
                                                                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">System Activity</th>
                                                                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Payment Mode</th>
                                                                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Actual Payment Date & Time</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-slate-200">
                                                                        {(selectedInvoice.payments || []).map((payment: any) => (
                                                                            <tr key={payment.id} className="hover:bg-slate-50">
                                                                                <td className="px-4 py-3 text-sm text-slate-900">
                                                                                    Payment of {formatCurrency(payment.amount)} recorded
                                                                                </td>
                                                                                <td className="px-4 py-3 text-sm text-slate-900">
                                                                                    {payment.paymentMode?.toUpperCase() || 'N/A'}
                                                                                </td>
                                                                                <td className="px-4 py-3 text-sm text-slate-900">
                                                                                    {formatDateTime(payment.date || payment.timestamp)}
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Refund History Section */}
                                                    {(selectedInvoice.refunds || []).length > 0 && (
                                                        <div className="mt-6">
                                                            <h3 className="text-sm font-semibold text-slate-700 mb-3">Refund History</h3>
                                                            <div className="border border-slate-200 rounded-lg overflow-hidden">
                                                                <table className="w-full">
                                                                    <thead className="bg-orange-50">
                                                                        <tr>
                                                                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Refund Details</th>
                                                                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Mode</th>
                                                                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Date</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-slate-200">
                                                                        {(selectedInvoice.refunds || []).map((refund: any) => (
                                                                            <tr key={refund.id} className="hover:bg-slate-50">
                                                                                <td className="px-4 py-3 text-sm text-orange-700">
                                                                                    Refund of {formatCurrency(refund.amount)} processed
                                                                                    {refund.reason && <span className="text-slate-500 ml-1">- {refund.reason}</span>}
                                                                                </td>
                                                                                <td className="px-4 py-3 text-sm text-slate-900">
                                                                                    {refund.mode?.toUpperCase() || 'N/A'}
                                                                                </td>
                                                                                <td className="px-4 py-3 text-sm text-slate-900">
                                                                                    {formatDateTime(refund.date)}
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </TabsContent>

                                            {/* Payments tab removed - content merged into Comments & History */}
                                        </ScrollArea>
                                    </Tabs>
                                </div>
                            )}

                            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Are you sure you want to delete this invoice? This action cannot be undone.
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

                            <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Record Payment</DialogTitle>
                                        <DialogDescription>
                                            Record a payment for {selectedInvoice?.invoiceNumber}
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label>Amount Received</Label>
                                            <Input
                                                type="number"
                                                placeholder="0.00"
                                                value={paymentAmount}
                                                onChange={(e) => setPaymentAmount(e.target.value)}
                                                data-testid="input-payment-amount"
                                            />
                                            <p className="text-xs text-slate-500">
                                                Balance Due: {formatCurrency(selectedInvoice?.balanceDue || 0)}
                                            </p>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Payment Mode</Label>
                                            <Select value={paymentMode} onValueChange={setPaymentMode}>
                                                <SelectTrigger data-testid="select-payment-mode">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="cash">Cash</SelectItem>
                                                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                                    <SelectItem value="cheque">Cheque</SelectItem>
                                                    <SelectItem value="upi">UPI</SelectItem>
                                                    <SelectItem value="credit_card">Credit Card</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Payment Date</Label>
                                                <Input
                                                    type="date"
                                                    value={paymentDate}
                                                    onChange={(e) => setPaymentDate(e.target.value)}
                                                    data-testid="input-payment-date"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Payment Time</Label>
                                                <Input
                                                    type="time"
                                                    value={paymentTime}
                                                    onChange={(e) => setPaymentTime(e.target.value)}
                                                    data-testid="input-payment-time"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>Cancel</Button>
                                        <Button onClick={handleRecordPayment} data-testid="button-confirm-payment">Record Payment</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>

                            <Dialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Process Refund</DialogTitle>
                                        <DialogDescription>
                                            Process a refund for {selectedInvoice?.invoiceNumber}. Refundable balance: {formatCurrency(getRefundableAmount())}
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label>Refund Amount</Label>
                                            <Input
                                                type="number"
                                                placeholder="Enter refund amount"
                                                value={refundAmount}
                                                onChange={(e) => setRefundAmount(e.target.value)}
                                                max={getRefundableAmount()}
                                                data-testid="input-refund-amount"
                                            />
                                            <p className="text-xs text-muted-foreground">Maximum refundable: {formatCurrency(getRefundableAmount())}</p>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Refund Mode</Label>
                                            <Select value={refundMode} onValueChange={setRefundMode}>
                                                <SelectTrigger data-testid="select-refund-mode">
                                                    <SelectValue placeholder="Select refund mode" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Cash">Cash</SelectItem>
                                                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                                                    <SelectItem value="Cheque">Cheque</SelectItem>
                                                    <SelectItem value="UPI">UPI</SelectItem>
                                                    <SelectItem value="Credit Card">Credit Card</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Reason (Optional)</Label>
                                            <Input
                                                placeholder="Enter reason for refund"
                                                value={refundReason}
                                                onChange={(e) => setRefundReason(e.target.value)}
                                                data-testid="input-refund-reason"
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setRefundDialogOpen(false)}>Cancel</Button>
                                        <Button onClick={handleRefund} data-testid="button-confirm-refund">Process Refund</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>

                            <AlertDialog open={voidDialogOpen} onOpenChange={setVoidDialogOpen}>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Void Invoice</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Are you sure you want to void this invoice ({selectedInvoice?.invoiceNumber})? This action will mark the invoice as void and it cannot be used for transactions.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleVoidInvoice} className="bg-orange-600 hover:bg-orange-700">
                                            Void Invoice
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>

                            <Dialog open={recurringDialogOpen} onOpenChange={setRecurringDialogOpen}>
                                <DialogContent className="max-w-md">
                                    <DialogHeader>
                                        <DialogTitle>Make Recurring Invoice</DialogTitle>
                                        <DialogDescription>
                                            Set up this invoice to automatically generate on a schedule.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label>Profile Name</Label>
                                            <Input placeholder="Monthly Invoice" data-testid="input-recurring-name" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Repeat Every</Label>
                                            <div className="flex gap-2">
                                                <Input type="number" defaultValue="1" className="w-20" />
                                                <Select defaultValue="month">
                                                    <SelectTrigger className="flex-1">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="week">Week(s)</SelectItem>
                                                        <SelectItem value="month">Month(s)</SelectItem>
                                                        <SelectItem value="year">Year(s)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Start Date</Label>
                                            <Input type="date" defaultValue={new Date().toISOString().split('T')[0]} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>End</Label>
                                            <Select defaultValue="never">
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="never">Never</SelectItem>
                                                    <SelectItem value="after">After # of occurrences</SelectItem>
                                                    <SelectItem value="on">On a specific date</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setRecurringDialogOpen(false)}>Cancel</Button>
                                        <Button onClick={() => {
                                            toast({ title: "Recurring invoice created" });
                                            setRecurringDialogOpen(false);
                                        }}>Create Recurring Invoice</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>

                            <Dialog open={journalDialogOpen} onOpenChange={setJournalDialogOpen}>
                                <DialogContent className="max-w-2xl">
                                    <DialogHeader>
                                        <DialogTitle>Journal Entry</DialogTitle>
                                        <DialogDescription>
                                            View the accounting journal entry for {selectedInvoice?.invoiceNumber}
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="py-4">
                                        <div className="border rounded-lg overflow-hidden">
                                            <table className="w-full">
                                                <thead className="bg-slate-50">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Account</th>
                                                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Debit</th>
                                                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Credit</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-200">
                                                    <tr>
                                                        <td className="px-4 py-3 text-sm text-slate-900">Accounts Receivable</td>
                                                        <td className="px-4 py-3 text-sm text-slate-900 text-right">{formatCurrency(selectedInvoice?.total || 0)}</td>
                                                        <td className="px-4 py-3 text-sm text-slate-900 text-right">-</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="px-4 py-3 text-sm text-slate-900">Sales Revenue</td>
                                                        <td className="px-4 py-3 text-sm text-slate-900 text-right">-</td>
                                                        <td className="px-4 py-3 text-sm text-slate-900 text-right">{formatCurrency(selectedInvoice?.subTotal || 0)}</td>
                                                    </tr>
                                                    {(selectedInvoice?.cgst || 0) > 0 && (
                                                        <tr>
                                                            <td className="px-4 py-3 text-sm text-slate-900">CGST Payable</td>
                                                            <td className="px-4 py-3 text-sm text-slate-900 text-right">-</td>
                                                            <td className="px-4 py-3 text-sm text-slate-900 text-right">{formatCurrency(selectedInvoice?.cgst || 0)}</td>
                                                        </tr>
                                                    )}
                                                    {(selectedInvoice?.sgst || 0) > 0 && (
                                                        <tr>
                                                            <td className="px-4 py-3 text-sm text-slate-900">SGST Payable</td>
                                                            <td className="px-4 py-3 text-sm text-slate-900 text-right">-</td>
                                                            <td className="px-4 py-3 text-sm text-slate-900 text-right">{formatCurrency(selectedInvoice?.sgst || 0)}</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                                <tfoot className="bg-slate-50">
                                                    <tr>
                                                        <td className="px-4 py-3 text-sm font-medium text-slate-900">Total</td>
                                                        <td className="px-4 py-3 text-sm font-medium text-slate-900 text-right">{formatCurrency(selectedInvoice?.total || 0)}</td>
                                                        <td className="px-4 py-3 text-sm font-medium text-slate-900 text-right">{formatCurrency(selectedInvoice?.total || 0)}</td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button onClick={() => setJournalDialogOpen(false)}>Close</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>

                            <Dialog open={preferencesDialogOpen} onOpenChange={setPreferencesDialogOpen}>
                                <DialogContent className="max-w-md">
                                    <DialogHeader>
                                        <DialogTitle>Invoice Preferences</DialogTitle>
                                        <DialogDescription>
                                            Customize the settings for your invoices.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label>Default Payment Terms</Label>
                                            <Select defaultValue="net30">
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="due_on_receipt">Due on Receipt</SelectItem>
                                                    <SelectItem value="net15">Net 15</SelectItem>
                                                    <SelectItem value="net30">Net 30</SelectItem>
                                                    <SelectItem value="net45">Net 45</SelectItem>
                                                    <SelectItem value="net60">Net 60</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Invoice Number Prefix</Label>
                                            <Input defaultValue="INV-" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Default Notes</Label>
                                            <Input placeholder="Thank you for your business!" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Default Terms & Conditions</Label>
                                            <Input placeholder="Payment is due within the terms specified..." />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setPreferencesDialogOpen(false)}>Cancel</Button>
                                        <Button onClick={() => {
                                            toast({ title: "Invoice preferences saved" });
                                            setPreferencesDialogOpen(false);
                                        }}>Save Preferences</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>

                        </div>
                    </ResizablePanel>
                )}
            </ResizablePanelGroup>

            {
                selectedInvoice && (
                    <ApplyCreditsDialog
                        open={applyCreditsDialogOpen}
                        onClose={() => setApplyCreditsDialogOpen(false)}
                        invoice={selectedInvoice}
                        onSuccess={() => {
                            fetchInvoiceDetail(selectedInvoice.id);
                            fetchInvoices();
                        }}
                    />
                )
            }
        </div >
    );
}