import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useOrganization } from "@/context/OrganizationContext";
import { usePagination } from "@/hooks/use-pagination";
import { TablePagination } from "@/components/table-pagination";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
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
    RefreshCw,
    ArrowUpDown,
    Plus,
    Download,
    Send,
    MoreHorizontal,
    Trash2,
    Pencil,
    MessageSquare,
    HelpCircle,
    Mail,
    Printer,
    Copy,
    X,
    Menu,
    Search,
    Filter,
    ChevronDown,
    FileText,
    ArrowRight,
    Settings
} from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { UnifiedDeliveryChallan } from "@/components/UnifiedDeliveryChallan";
import { Checkbox } from "@/components/ui/checkbox";
import { robustIframePrint } from "@/lib/robust-print";
import { cn } from "@/lib/utils";

interface ChallanListItem {
    id: string;
    challanNumber: string;
    referenceNumber: string;
    customerName: string;
    customerId: string;
    date: string;
    amount: number;
    status: string;
    invoiceStatus: string;
    challanType: string;
}

interface ChallanDetail {
    id: string;
    challanNumber: string;
    referenceNumber: string;
    date: string;
    customerId: string;
    customerName: string;
    challanType: string;
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
    placeOfSupply: string;
    gstin: string;
    items: any[];
    subTotal: number;
    cgst: number;
    sgst: number;
    igst: number;
    adjustment: number;
    total: number;
    customerNotes: string;
    termsAndConditions: string;
    status: string;
    invoiceStatus: string;
    invoiceId: string | null;
    createdAt: string;
    activityLogs: any[];
}

const formatCurrency = (amount: number) => {
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

const formatAddress = (address: any): string[] => {
    if (!address) return ['-'];
    if (typeof address === 'string') return [address];
    if (typeof address !== 'object') return ['-'];
    const parts = [
        address.street ? String(address.street) : '',
        address.city ? String(address.city) : '',
        address.state ? String(address.state) : '',
        address.country ? String(address.country) : '',
        address.pincode ? String(address.pincode) : ''
    ].filter(Boolean);
    return parts.length > 0 ? parts : ['-'];
};

const getChallanTypeLabel = (type: string) => {
    switch (type) {
        case 'supply_on_approval': return 'Supply on Approval';
        case 'supply_for_job_work': return 'Supply for Job Work';
        case 'supply_for_repair': return 'Supply for Repair';
        case 'removal_for_own_use': return 'Removal for Own Use';
        case 'others': return 'Others';
        default: return type || 'Others';
    }
};

const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
        case 'OPEN':
            return 'bg-blue-100 text-blue-700 border-blue-200';
        case 'DELIVERED':
            return 'bg-green-100 text-green-700 border-green-200';
        case 'DRAFT':
            return 'bg-slate-100 text-slate-600 border-slate-200';
        case 'INVOICED':
            return 'bg-purple-100 text-purple-700 border-purple-200';
        default:
            return 'bg-slate-100 text-slate-600 border-slate-200';
    }
};

const getActivityIcon = (action: string) => {
    switch (action) {
        case 'created':
            return <div className="w-3 h-3 rounded-full bg-green-500" />;
        case 'sent':
            return <div className="w-3 h-3 rounded-full bg-blue-500" />;
        case 'converted':
            return <div className="w-3 h-3 rounded-full bg-purple-500" />;
        case 'updated':
            return <div className="w-3 h-3 rounded-full bg-yellow-500" />;
        default:
            return <div className="w-3 h-3 rounded-full bg-slate-400" />;
    }
};

// ChallanPDFView removed in favor of UnifiedDeliveryChallan

export default function DeliveryChallans() {
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const { currentOrganization } = useOrganization();
    const [challans, setChallans] = useState<ChallanListItem[]>([]);
    const [selectedChallan, setSelectedChallan] = useState<ChallanDetail | null>(null);
    const [selectedChallans, setSelectedChallans] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [challanToDelete, setChallanToDelete] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState("whats-next");
    const [branding, setBranding] = useState<any>(null);
    const [sortBy, setSortBy] = useState<{ field: 'date' | 'challanNumber' | 'customerName' | 'amount'; order: 'asc' | 'desc' }>({ field: 'date', order: 'desc' });
    const [activeFilter, setActiveFilter] = useState<string>("All");

    const handleSort = (field: 'date' | 'challanNumber' | 'customerName' | 'amount') => {
        setSortBy(prev => ({
            field,
            order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc'
        }));
    };

    const getSortedChallans = (items: any[]) => {
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

    useEffect(() => {
        fetchChallans();
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

    const fetchChallans = async () => {
        try {
            const response = await fetch('/api/delivery-challans');
            if (response.ok) {
                const data = await response.json();
                setChallans(data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch delivery challans:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchChallanDetail = async (id: string) => {
        try {
            const response = await fetch(`/api/delivery-challans/${id}`);
            if (response.ok) {
                const data = await response.json();
                setSelectedChallan(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch challan detail:', error);
        }
    };

    const handleSelectChallan = (challan: ChallanListItem) => {
        fetchChallanDetail(challan.id);
    };

    const handleCloseDetail = () => {
        setSelectedChallan(null);
    };

    const handleDeleteChallan = async () => {
        if (!challanToDelete) return;

        try {
            const response = await fetch(`/api/delivery-challans/${challanToDelete}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                toast({
                    title: "Delivery Challan Deleted",
                    description: "The delivery challan has been deleted successfully.",
                });
                fetchChallans();
                if (selectedChallan?.id === challanToDelete) {
                    setSelectedChallan(null);
                }
            } else {
                throw new Error('Failed to delete');
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to delete delivery challan. Please try again.",
                variant: "destructive"
            });
        } finally {
            setDeleteDialogOpen(false);
            setChallanToDelete(null);
        }
    };

    const handleConvertToInvoice = async (challanId: string) => {
        try {
            const response = await fetch(`/api/delivery-challans/${challanId}/convert-to-invoice`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                const data = await response.json();
                toast({
                    title: "Converted to Invoice",
                    description: `Invoice ${data.data.invoice.invoiceNumber} has been created.`,
                });
                fetchChallans();
                if (selectedChallan?.id === challanId) {
                    fetchChallanDetail(challanId);
                }
            } else {
                throw new Error('Failed to convert');
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to convert to invoice. Please try again.",
                variant: "destructive"
            });
        }
    };

    const handleStatusChange = async (challanId: string, newStatus: string) => {
        try {
            const response = await fetch(`/api/delivery-challans/${challanId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                toast({
                    title: "Status Updated",
                    description: `Delivery challan status changed to ${newStatus}.`,
                });
                fetchChallans();
                if (selectedChallan?.id === challanId) {
                    fetchChallanDetail(challanId);
                }
            } else {
                throw new Error('Failed to update status');
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update status. Please try again.",
                variant: "destructive"
            });
        }
    };

    const handleCloneChallan = async (challanId: string) => {
        try {
            const response = await fetch(`/api/delivery-challans/${challanId}/clone`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                const data = await response.json();
                toast({
                    title: "Challan Cloned",
                    description: `New challan ${data.data.challanNumber} has been created.`,
                });
                fetchChallans();
            } else {
                throw new Error('Failed to clone');
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to clone delivery challan. Please try again.",
                variant: "destructive"
            });
        }
    };

    const handleGeneratePDF = async () => {
        if (!selectedChallan) {
            toast({
                title: "PDF Error",
                description: "No delivery challan selected for PDF generation.",
                variant: "destructive"
            });
            return;
        }

        const toastResult = toast({
            title: "Generating PDF...",
            description: "Please wait while we prepare your document."
        });

        try {
            // Check if the PDF content element exists
            const pdfElement = document.getElementById("challan-pdf-content");
            if (!pdfElement) {
                throw new Error("PDF content element not found");
            }

            // Temporarily make the content visible for PDF generation
            const originalStyle = pdfElement.style.cssText;
            pdfElement.style.cssText = 'position: absolute; left: -9999px; top: -9999px; opacity: 1; z-index: 9999; width: 210mm; background-color: white;';

            // Wait for content to render properly
            await new Promise(resolve => setTimeout(resolve, 500));

            // Verify content exists
            if (!pdfElement.innerHTML.trim()) {
                throw new Error("PDF content is empty");
            }

            // Import the unified PDF utility
            const { generatePDFFromElement } = await import("@/lib/pdf-utils");

            // Generate PDF from the existing PDF view
            await generatePDFFromElement("challan-pdf-content", `${selectedChallan.challanNumber}.pdf`);

            // Restore original styling
            pdfElement.style.cssText = originalStyle;

            toastResult.update({
                id: toastResult.id,
                title: "PDF Downloaded",
                description: `${selectedChallan.challanNumber}.pdf has been downloaded successfully.`
            });
        } catch (error) {
            console.error("PDF generation error:", error);
            toastResult.update({
                id: toastResult.id,
                title: "Failed to generate PDF",
                description: "Please try again. " + (error instanceof Error ? error.message : ""),
                variant: "destructive"
            });
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

    const handlePrint = async () => {
        if (!selectedChallan) {
            toast({
                title: "Print Error",
                description: "No delivery challan selected for printing.",
                variant: "destructive"
            });
            return;
        }

        toast({ title: "Preparing print...", description: "Please wait while we generate the challan preview." });

        try {
            await robustIframePrint('challan-pdf-content', `DeliveryChallan_${selectedChallan.challanNumber}`);
        } catch (error) {
            console.error('Print failed:', error);
            toast({ title: "Print failed", variant: "destructive" });
        }
    };

    const filteredChallans = getSortedChallans(challans.filter(challan => {
        const matchesSearch =
            (challan.challanNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (challan.customerName || '').toLowerCase().includes(searchTerm.toLowerCase());

        if (activeFilter === "All") return matchesSearch;
        return matchesSearch && (challan.status || '').toUpperCase() === activeFilter.toUpperCase();
    }));

    const { currentPage, totalPages, totalItems, itemsPerPage, paginatedItems, goToPage } = usePagination(filteredChallans, 10);

    const toggleSelectAll = () => {
        if (selectedChallans.length === filteredChallans.length) {
            setSelectedChallans([]);
        } else {
            setSelectedChallans(filteredChallans.map(c => c.id));
        }
    };

    const toggleSelectChallan = (id: string) => {
        setSelectedChallans(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
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
        <div className="flex h-screen animate-in fade-in duration-340 w-full overflow-hidden bg-slate-50">
            {selectedChallan && (
                <div
                    id="challan-pdf-content"
                    style={{
                        position: 'fixed',
                        left: '-9999px',
                        top: 0,
                        width: '210mm',
                        backgroundColor: 'white'
                    }}
                >
                    <UnifiedDeliveryChallan
                        challan={selectedChallan}
                        branding={branding}
                        organization={currentOrganization || undefined}
                    />
                </div>
            )}

            <ResizablePanelGroup key={`${selectedChallan ? "split" : "single"}-${isCompact ? "compact" : "full"}`} direction="horizontal" className="h-full w-full">
                {(!isCompact || !selectedChallan) && (
                    <ResizablePanel
                        defaultSize={isCompact ? 100 : (selectedChallan ? 33 : 100)}
                        minSize={isCompact ? 100 : (selectedChallan ? 33 : 100)}
                        maxSize={isCompact ? 100 : (selectedChallan ? 33 : 100)}
                        className="flex flex-col overflow-hidden bg-white border-r border-slate-200 min-w-[25%]"
                    >
                        <div className="flex flex-col h-full overflow-hidden">
                            <div className="flex items-center justify-between p-4 border-b border-border/60 bg-white sticky top-0 z-10 min-h-[73px] h-auto">
                                <div className="flex items-center gap-4 flex-1 overflow-hidden">
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    className="gap-2 text-2xl font-bold text-sidebar hover:text-sidebar hover:bg-transparent p-0 h-auto transition-colors text-left whitespace-normal font-display tracking-tight group"
                                                >
                                                    <span className="line-clamp-2">All Delivery Challans</span>
                                                    <ChevronDown className="h-5 w-5 text-sidebar/30 group-hover:text-sidebar/50 transition-colors shrink-0" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="start" className="w-64 p-1">
                                                <div className="px-3 py-2 text-[10px] font-bold text-sidebar/40 uppercase tracking-[0.2em] font-display mb-1">Filter by Status</div>
                                                <DropdownMenuItem onClick={() => setActiveFilter("All")} className="rounded-md focus:bg-sidebar/5 focus:text-sidebar font-medium">All Delivery Challans</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setActiveFilter("DRAFT")} className="rounded-md focus:bg-sidebar/5 focus:text-sidebar font-medium">Draft</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setActiveFilter("OPEN")} className="rounded-md focus:bg-sidebar/5 focus:text-sidebar font-medium">Open</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setActiveFilter("DELIVERED")} className="rounded-md focus:bg-sidebar/5 focus:text-sidebar font-medium">Delivered</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setActiveFilter("INVOICED")} className="rounded-md focus:bg-sidebar/5 focus:text-sidebar font-medium">Invoiced</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                        <div className="h-6 w-px bg-sidebar/10 mx-1 hidden sm:block"></div>
                                        <Badge variant="secondary" className="bg-sidebar/5 text-sidebar/60 border-sidebar/10 font-bold font-display px-2.5 py-0.5 rounded-full text-[11px]">
                                            {filteredChallans.length}
                                        </Badge>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {selectedChallan ? (
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
                                                placeholder="Search challans..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="pl-10 h-10 border-sidebar/10 focus:border-sidebar/20 bg-sidebar-accent/5 focus:bg-white transition-all text-sidebar font-medium rounded-lg"
                                                data-testid="input-search-challans"
                                            />
                                        </div>
                                    )}


                                    <Link href="/delivery-challans/new">
                                        <Button
                                            className={`bg-sidebar hover:bg-sidebar/90 text-white gap-2 h-9 px-4 font-bold font-display uppercase tracking-wider text-[11px] shadow-sm transition-all hover:translate-y-[-1px] ${selectedChallan ? 'w-9 px-0' : ''}`}
                                            data-testid="button-new-challan"
                                            size={selectedChallan ? "icon" : "default"}
                                        >
                                            <Plus className={`h-4 w-4 transition-transform group-hover:rotate-90`} />
                                            {!selectedChallan && "New"}
                                        </Button>
                                    </Link>
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
                                                        <DropdownMenuItem onClick={() => handleSort('date')} data-testid="sort-date">
                                                            Date {sortBy.field === 'date' && (sortBy.order === 'asc' ? '↑' : '↓')}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleSort('challanNumber')} data-testid="sort-number">
                                                            Challan Number {sortBy.field === 'challanNumber' && (sortBy.order === 'asc' ? '↑' : '↓')}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleSort('customerName')} data-testid="sort-customer">
                                                            Customer Name {sortBy.field === 'customerName' && (sortBy.order === 'asc' ? '↑' : '↓')}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleSort('amount')} data-testid="sort-amount">
                                                            Amount {sortBy.field === 'amount' && (sortBy.order === 'asc' ? '↑' : '↓')}
                                                        </DropdownMenuItem>
                                                    </DropdownMenuSubContent>
                                                </DropdownMenuPortal>
                                            </DropdownMenuSub>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={handleImport} data-testid="menu-import">
                                                <Download className="mr-2 h-4 w-4" /> Import Challans
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={async () => {
                                                const { exportToExcel } = await import("@/lib/export-utils");
                                                toast({ title: "Exporting...", description: "Your file is being prepared." });
                                                const exportData = filteredChallans.map(c => ({
                                                    'Challan Number': c.challanNumber,
                                                    'Customer Name': c.customerName,
                                                    'Date': c.date,
                                                    'Amount': c.amount,
                                                    'Status': c.status,
                                                    'Invoice Status': c.invoiceStatus
                                                }));
                                                await exportToExcel(exportData, 'delivery-challans', 'Challans');
                                            }} data-testid="menu-export">
                                                <Download className="mr-2 h-4 w-4" /> Export Challans
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>



                            <div className="flex-1 flex flex-col min-h-0 bg-white">
                                <div className="flex-1 overflow-auto scrollbar-hide min-h-0">
                                    {!selectedChallan ? (
                                        <table className="w-full">
                                            <thead className="bg-[#f8fafc] sticky top-0 z-10">
                                                <tr className="border-b border-sidebar/5">
                                                    <th className="p-4 w-10">
                                                        <Checkbox
                                                            checked={selectedChallans.length === filteredChallans.length && filteredChallans.length > 0}
                                                            onCheckedChange={toggleSelectAll}
                                                            data-testid="checkbox-select-all"
                                                            className="border-sidebar/20 data-[state=checked]:bg-sidebar data-[state=checked]:border-sidebar"
                                                        />
                                                    </th>
                                                    <th className="p-4 text-left font-bold font-display text-[10px] uppercase tracking-[0.1em] text-sidebar/50">Date</th>
                                                    <th className="p-4 text-left font-bold font-display text-[10px] uppercase tracking-[0.1em] text-sidebar/50">Delivery Challan#</th>
                                                    <th className="p-4 text-left font-bold font-display text-[10px] uppercase tracking-[0.1em] text-sidebar/50">Reference Number</th>
                                                    <th className="p-4 text-left font-bold font-display text-[10px] uppercase tracking-[0.1em] text-sidebar/50">Customer Name</th>
                                                    <th className="p-4 text-left font-bold font-display text-[10px] uppercase tracking-[0.1em] text-sidebar/50">Status</th>
                                                    <th className="p-4 text-right font-bold font-display text-[10px] uppercase tracking-[0.1em] text-sidebar/50">Amount</th>
                                                    <th className="p-4 w-10"></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {loading ? (
                                                    <tr>
                                                        <td colSpan={8} className="p-8 text-center text-muted-foreground">
                                                            Loading...
                                                        </td>
                                                    </tr>
                                                ) : filteredChallans.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={8} className="p-8 text-center text-muted-foreground">
                                                            No delivery challans found
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    paginatedItems.map((challan) => (
                                                        <tr
                                                            key={challan.id}
                                                            className="border-b border-slate-100 hover:bg-slate-50/50 cursor-pointer transition-colors"
                                                            onClick={() => handleSelectChallan(challan)}
                                                            data-testid={`row-challan-${challan.id}`}
                                                        >
                                                            <td className="p-4" onClick={(e) => e.stopPropagation()}>
                                                                <Checkbox
                                                                    checked={selectedChallans.includes(challan.id)}
                                                                    onCheckedChange={() => toggleSelectChallan(challan.id)}
                                                                    data-testid={`checkbox-challan-${challan.id}`}
                                                                />
                                                            </td>
                                                            <td className="p-4 text-sm text-slate-600 font-medium">{formatDate(challan.date)}</td>
                                                            <td className="p-4">
                                                                <span className="text-blue-600 font-medium text-sm" data-testid={`text-challan-number-${challan.id}`}>
                                                                    {challan.challanNumber}
                                                                </span>
                                                            </td>
                                                            <td className="p-4 text-sm text-slate-400">
                                                                {challan.referenceNumber || '-'}
                                                            </td>
                                                            <td className="p-4 text-sm font-semibold uppercase text-slate-900">{challan.customerName}</td>
                                                            <td className="p-4">
                                                                <Badge
                                                                    variant="outline"
                                                                    className={`text-[10px] h-4.5 px-1.5 font-bold uppercase tracking-wider ${getStatusColor(challan.status)}`}
                                                                    data-testid={`badge-status-${challan.id}`}
                                                                >
                                                                    {challan.status}
                                                                </Badge>
                                                            </td>
                                                            <td className="p-4 text-right text-sm font-bold text-slate-900">
                                                                {formatCurrency(challan.amount)}
                                                            </td>
                                                            <td className="p-4" onClick={(e) => e.stopPropagation()}>
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`button-actions-${challan.id}`}>
                                                                            <MoreHorizontal className="h-4 w-4 text-slate-400" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end">
                                                                        <DropdownMenuItem onClick={() => setLocation(`/delivery-challans/${challan.id}/edit`)} data-testid={`action-edit-${challan.id}`}>
                                                                            <Pencil className="h-4 w-4 mr-2" />
                                                                            Edit
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => handleConvertToInvoice(challan.id)} data-testid={`action-convert-${challan.id}`}>
                                                                            <ArrowRight className="h-4 w-4 mr-2" />
                                                                            Convert to Invoice
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuSeparator />
                                                                        <DropdownMenuItem
                                                                            className="text-destructive"
                                                                            onClick={() => {
                                                                                setChallanToDelete(challan.id);
                                                                                setDeleteDialogOpen(true);
                                                                            }}
                                                                            data-testid={`action-delete-${challan.id}`}
                                                                        >
                                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                                            Delete
                                                                        </DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <div className="flex flex-col h-full">
                                            {paginatedItems.map((challan) => (
                                                <div
                                                    key={challan.id}
                                                    className={`p-4 border-b border-sidebar/5 hover:bg-sidebar/[0.02] cursor-pointer transition-all ${selectedChallan?.id === challan.id ? 'bg-sidebar/[0.04] border-l-2 border-l-sidebar' : ''}`}
                                                    onClick={() => handleSelectChallan(challan)}
                                                    data-testid={`row-challan-${challan.id}`}
                                                >
                                                    <div className="flex justify-between items-start mb-1">
                                                        <span className="font-bold font-display text-sidebar uppercase text-sm truncate pr-2">
                                                            {challan.customerName}
                                                        </span>
                                                        <span className="text-sm font-bold text-sidebar font-display">
                                                            {formatCurrency(challan.amount)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-sidebar/40 uppercase tracking-wider mb-2">
                                                        <span>{challan.challanNumber}</span>
                                                        <span>•</span>
                                                        <span className="text-sidebar/30">{formatDate(challan.date)}</span>
                                                    </div>
                                                    <div>
                                                        <Badge
                                                            variant="outline"
                                                            className={`text-[9px] h-4 px-1.5 font-bold uppercase tracking-[0.1em] rounded-md ${getStatusColor(challan.status)}`}
                                                            data-testid={`badge-status-${challan.id}`}
                                                        >
                                                            {challan.status}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {filteredChallans.length > 0 && (
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

                {selectedChallan && (
                    <>
                        {!isCompact && (
                            <ResizableHandle withHandle className="w-1 bg-slate-200 hover:bg-blue-400 hover:w-1.5 transition-all cursor-col-resize" />
                        )}
                        <ResizablePanel defaultSize={isCompact ? 100 : 65} minSize={isCompact ? 100 : 34} className="bg-white">
                            <div className="w-full border-l border-border/60 flex flex-col bg-background h-full">
                                <div className="flex items-center justify-between gap-2 p-3 border-b border-border/60">
                                    <h2 className="font-semibold text-lg" data-testid="text-selected-challan-number">
                                        {selectedChallan.challanNumber}
                                    </h2>
                                    <div className="flex items-center gap-1">
                                        <Button variant="ghost" size="icon" onClick={() => setLocation(`/delivery-challans/${selectedChallan.id}/edit`)} data-testid="button-edit-detail">
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" data-testid="button-comment">
                                            <MessageSquare className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={handleCloseDetail} data-testid="button-close-detail">
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 p-3 border-b border-border/60">
                                    <Button variant="outline" size="sm" className="gap-1" onClick={() => setLocation(`/delivery-challans/${selectedChallan.id}/edit`)} data-testid="button-edit-challan">
                                        <Pencil className="h-4 w-4" />
                                        Edit
                                    </Button>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" size="sm" className="gap-1" data-testid="button-pdf-print">
                                                <FileText className="h-4 w-4" />
                                                PDF/Print
                                                <ChevronDown className="h-3 w-3" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            <DropdownMenuItem onClick={handleGeneratePDF} data-testid="action-download-pdf">
                                                <Download className="h-4 w-4 mr-2" />
                                                Download PDF
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={handlePrint} data-testid="action-print">
                                                <Printer className="h-4 w-4 mr-2" />
                                                Print
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                    {!selectedChallan.invoiceStatus && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="gap-1"
                                            onClick={() => handleConvertToInvoice(selectedChallan.id)}
                                            data-testid="button-convert-to-invoice"
                                        >
                                            <ArrowRight className="h-4 w-4" />
                                            Convert to Invoice
                                        </Button>
                                    )}
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" size="sm" data-testid="button-more-actions">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            {!selectedChallan.invoiceId && (
                                                <DropdownMenuItem
                                                    onClick={() => handleConvertToInvoice(selectedChallan.id)}
                                                    className="text-primary font-medium"
                                                    data-testid="action-convert-invoice"
                                                >
                                                    Convert to Invoice
                                                </DropdownMenuItem>
                                            )}
                                            {selectedChallan.status === 'DELIVERED' && (
                                                <DropdownMenuItem
                                                    onClick={() => handleStatusChange(selectedChallan.id, 'OPEN')}
                                                    data-testid="action-revert-open"
                                                >
                                                    Revert to Open
                                                </DropdownMenuItem>
                                            )}
                                            {selectedChallan.status === 'OPEN' && (
                                                <DropdownMenuItem
                                                    onClick={() => handleStatusChange(selectedChallan.id, 'DELIVERED')}
                                                    data-testid="action-mark-delivered"
                                                >
                                                    Mark as Delivered
                                                </DropdownMenuItem>
                                            )}
                                            {selectedChallan.status === 'DRAFT' && (
                                                <DropdownMenuItem
                                                    onClick={() => handleStatusChange(selectedChallan.id, 'OPEN')}
                                                    data-testid="action-mark-open"
                                                >
                                                    Mark as Open
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuItem
                                                onClick={() => setLocation(`/e-way-bills/create?challanId=${selectedChallan.id}`)}
                                                data-testid="action-eway-bill"
                                            >
                                                Add e-Way Bill Details
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => handleCloneChallan(selectedChallan.id)}
                                                data-testid="action-clone"
                                            >
                                                <Copy className="h-4 w-4 mr-2" />
                                                Clone
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                className="text-destructive"
                                                onClick={() => {
                                                    setChallanToDelete(selectedChallan.id);
                                                    setDeleteDialogOpen(true);
                                                }}
                                                data-testid="action-delete-selected"
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                <ScrollArea className="flex-1">
                                    <div className="flex-1 overflow-auto scrollbar-hide bg-slate-50/50 p-8 flex justify-center">
                                        <div className="shadow-2xl mb-8 w-full max-w-[210mm]">
                                            <UnifiedDeliveryChallan challan={selectedChallan} branding={branding} organization={currentOrganization || undefined} isPreview={true} />
                                        </div>
                                    </div>

                                    <div className="px-6 pb-6">
                                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                                            <TabsList className="w-full justify-start h-auto p-0 bg-transparent gap-6">
                                                <TabsTrigger
                                                    value="whats-next"
                                                    data-testid="tab-whats-next"
                                                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-2 py-3 bg-transparent hover:bg-transparent transition-none"
                                                >
                                                    What's Next
                                                </TabsTrigger>
                                                <TabsTrigger
                                                    value="activity"
                                                    data-testid="tab-activity"
                                                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-2 py-3 bg-transparent hover:bg-transparent transition-none"
                                                >
                                                    Activity
                                                </TabsTrigger>
                                            </TabsList>
                                            <TabsContent value="whats-next" className="mt-4">
                                                <div className="space-y-3">
                                                    <Button variant="outline" className="w-full justify-start gap-2" data-testid="button-send-email">
                                                        <Send className="h-4 w-4" />
                                                        Send Delivery Challan via Email
                                                    </Button>
                                                    {!selectedChallan.invoiceStatus && (
                                                        <Button
                                                            variant="outline"
                                                            className="w-full justify-start gap-2"
                                                            onClick={() => handleConvertToInvoice(selectedChallan.id)}
                                                            data-testid="button-create-invoice"
                                                        >
                                                            <FileText className="h-4 w-4" />
                                                            Create Invoice from Challan
                                                        </Button>
                                                    )}
                                                </div>
                                            </TabsContent>
                                            <TabsContent value="activity" className="mt-4">
                                                <div className="space-y-4">
                                                    {selectedChallan.activityLogs?.map((log) => (
                                                        <div key={log.id} className="flex gap-3">
                                                            <div className="mt-1.5">{getActivityIcon(log.action)}</div>
                                                            <div className="flex-1">
                                                                <p className="text-sm">{log.description}</p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {formatDateTime(log.timestamp)} by {log.user}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </TabsContent>
                                        </Tabs>
                                    </div>
                                </ScrollArea>
                            </div>
                        </ResizablePanel>
                    </>
                )}
            </ResizablePanelGroup>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Delivery Challan</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this delivery challan? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteChallan} className="bg-destructive text-destructive-foreground" data-testid="button-confirm-delete">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
