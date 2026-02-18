import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { usePagination } from "@/hooks/use-pagination";
import { TablePagination } from "@/components/table-pagination";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
    Plus,
    Search,
    ChevronDown,
    MoreHorizontal,
    ArrowUpDown,
    Download
} from "lucide-react";
import { cn } from "@/lib/utils";
import { exportToExcel } from "@/lib/excel-utils";
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
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import EWayBillDetailPanel from "@/modules/e-way-bills/components/EWayBillDetailPanel";
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
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuPortal,
    DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";

interface EWayBillListItem {
    id: string;
    ewayBillNumber: string;
    documentType: string;
    documentNumber: string;
    customerName: string;
    customerGstin: string;
    customerId: string;
    date: string;
    expiryDate: string;
    total: number;
    status: string;
    transactionType: string;
}

interface EWayBillDetail extends EWayBillListItem {
    transactionSubType: string;
    dispatchFrom: {
        street: string;
        city: string;
        state: string;
        country: string;
        pincode: string;
    };
    billFrom: {
        street: string;
        city: string;
        state: string;
        country: string;
        pincode: string;
    };
    billTo: {
        street: string;
        city: string;
        state: string;
        country: string;
        pincode: string;
    };
    shipTo: {
        street: string;
        city: string;
        state: string;
        country: string;
        pincode: string;
    };
    placeOfDelivery: string;
    transporter: string;
    distance: number;
    modeOfTransportation: string;
    vehicleType: string;
    vehicleNo: string;
    transporterDocNo: string;
    transporterDocDate: string;
    items: any[];
    total: number;
    status: string;
    createdAt: string;
}

const transactionPeriods = [
    { value: 'this_month', label: 'This Month' },
    { value: 'last_month', label: 'Last Month' },
    { value: 'this_year', label: 'This Year' },
    { value: 'all', label: 'All Time' },
];

const transactionTypeFilters = [
    { value: 'invoices', label: 'Invoices' },
    { value: 'credit_notes', label: 'Credit Notes' },
    { value: 'delivery_challans', label: 'Delivery Challans' },
    { value: 'all', label: 'All Types' },
];

const ewayBillStatuses = [
    { value: 'all', label: 'All Statuses' },
    { value: 'generated', label: 'Generated' },
    { value: 'not_generated', label: 'Not Generated' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'expired', label: 'Expired' },
];

const formatCurrency = (amount: any) => {
    if (!amount || isNaN(Number(amount))) return '₹0.00';
    return `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
        case 'GENERATED':
            return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
        case 'NOT_GENERATED':
            return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800';
        case 'CANCELLED':
            return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
        case 'EXPIRED':
            return 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
        default:
            return 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
    }
};

export default function EWayBills() {
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const [ewayBills, setEwayBills] = useState<EWayBillListItem[]>([]);
    const [selectedBill, setSelectedBill] = useState<EWayBillDetail | null>(null);
    const [selectedBills, setSelectedBills] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [billToDelete, setBillToDelete] = useState<string | null>(null);

    const [periodFilter, setPeriodFilter] = useState('all');
    const [transactionTypeFilter, setTransactionTypeFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearchVisible, setIsSearchVisible] = useState(false);
    const [sortBy, setSortBy] = useState<'date' | 'billNumber' | 'customerName' | 'amount'>('date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [headerFilter, setHeaderFilter] = useState("All");

    useEffect(() => {
        fetchEWayBills();
    }, [periodFilter, transactionTypeFilter, statusFilter]);

    const fetchEWayBills = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (periodFilter !== 'all') params.append('period', periodFilter);
            if (transactionTypeFilter !== 'all') params.append('documentType', transactionTypeFilter);
            if (statusFilter !== 'all') params.append('status', statusFilter);

            const response = await fetch(`/api/eway-bills?${params.toString()}`);
            if (response.ok) {
                const data = await response.json();
                setEwayBills(data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch e-way bills:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchEWayBillDetail = async (id: string) => {
        try {
            const response = await fetch(`/api/eway-bills/${id}`);
            if (response.ok) {
                const data = await response.json();
                setSelectedBill(data.data);
            }
        } catch (error) {
            console.error('Error fetching bill details:', error);
        }
    };

    const handleDeleteBill = async () => {
        if (!billToDelete) return;
        try {
            const response = await fetch(`/api/eway-bills/${billToDelete}`, { method: 'DELETE' });
            if (response.ok) {
                toast({ title: "Success", description: "e-Way Bill deleted successfully" });
                setDeleteDialogOpen(false);
                setSelectedBill(null);
                fetchEWayBills();
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete e-Way Bill", variant: "destructive" });
        }
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedBills(ewayBills.map(b => b.id));
        } else {
            setSelectedBills([]);
        }
    };

    const handleSelectOne = (id: string, checked: boolean) => {
        if (checked) {
            setSelectedBills([...selectedBills, id]);
        } else {
            setSelectedBills(selectedBills.filter(i => i !== id));
        }
    };

    const handleExportBills = async () => {
        const dataToExport = filteredEwayBills.map(bill => ({
            'E-Way Bill Number': bill.ewayBillNumber || 'Draft',
            'Document Number': bill.documentNumber || '-',
            'Document Type': bill.documentType || '-',
            'Date': bill.date ? new Date(bill.date).toLocaleDateString('en-IN') : '-',
            'Customer Name': bill.customerName || '-',
            'Customer GSTIN': bill.customerGstin || '-',
            'Transaction Type': bill.transactionType || '-',
            'Status': bill.status || '-',
            'Expiry Date': bill.expiryDate ? new Date(bill.expiryDate).toLocaleDateString('en-IN') : '-',
            'Total Amount': bill.total || 0
        }));

        const success = await exportToExcel(dataToExport, 'e-way-bills', 'E-Way Bills');
        if (success) {
            toast({
                title: "Export Successful",
                description: `Exported ${dataToExport.length} e-way bills to Excel.`,
            });
        } else {
            toast({
                title: "Export Failed",
                description: "No data to export or an error occurred.",
                variant: "destructive",
            });
        }
    };

    const filteredEwayBills = ewayBills
        .filter(bill => {
            const matchesSearch = bill.ewayBillNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                bill.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                bill.documentNumber?.toLowerCase().includes(searchQuery.toLowerCase());

            if (!matchesSearch) return false;

            if (headerFilter === "All") return true;
            if (headerFilter === "Draft") {
                return bill.status?.toLowerCase() === 'not_generated';
            }
            if (headerFilter === "Open") {
                return bill.status?.toLowerCase() === 'generated';
            }
            if (headerFilter === "Delivered") {
                return bill.status?.toLowerCase() === 'delivered';
            }
            return true;
        })
        .sort((a, b) => {
            let comparison = 0;
            switch (sortBy) {
                case 'date':
                    comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
                    break;
                case 'billNumber':
                    comparison = (a.ewayBillNumber || '').localeCompare(b.ewayBillNumber || '');
                    break;
                case 'customerName':
                    comparison = (a.customerName || '').localeCompare(b.customerName || '');
                    break;
                case 'amount':
                    comparison = (a.total || 0) - (b.total || 0);
                    break;
            }
            return sortOrder === 'asc' ? comparison : -comparison;
        });

    const { currentPage, totalPages, totalItems, itemsPerPage, paginatedItems, goToPage } = usePagination(filteredEwayBills, 10);

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
        <div className="flex h-screen overflow-hidden bg-slate-50">
            <ResizablePanelGroup key={`${selectedBill ? "split" : "single"}-${isCompact ? "compact" : "full"}`} direction="horizontal" className="h-full w-full">
                {(!isCompact || !selectedBill) && (
                    <ResizablePanel
                        defaultSize={isCompact ? 100 : (selectedBill ? 33 : 100)}
                        minSize={isCompact ? 100 : (selectedBill ? 33 : 100)}
                        maxSize={isCompact ? 100 : (selectedBill ? 33 : 100)}
                        className="bg-white border-r min-w-[25%]"
                    >
                        <div className="flex flex-col h-full overflow-hidden">
                            <div className="flex items-center justify-between p-4 bg-white sticky top-0 z-10 min-h-[73px] h-auto">
                                <div className="flex items-center gap-4 flex-1 overflow-hidden">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                className="gap-1.5 text-xl font-semibold text-[#002e46] hover:text-[#001f2f] hover:bg-transparent p-0 h-auto transition-colors text-left whitespace-normal font-display"
                                            >
                                                <span className="line-clamp-2">{headerFilter === "All" ? "All E-Way Bills" : headerFilter}</span>
                                                <ChevronDown className="h-4 w-4 text-slate-500 shrink-0" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="start" className="w-56">
                                            <DropdownMenuItem onClick={() => setHeaderFilter("All")}>All E-Way Bills</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setHeaderFilter("Draft")}>Draft</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setHeaderFilter("Open")}>Open</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setHeaderFilter("Delivered")}>Delivered</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                    <span className="text-sm text-slate-400">({ewayBills.length})</span>
                                </div>

                                <div className="flex items-center gap-2">
                                    {selectedBill ? (
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
                                                placeholder="Search e-way bills..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="pl-9 h-9"
                                                data-testid="input-search-eway-bills"
                                            />
                                        </div>
                                    )}


                                    <Button
                                        className={cn(
                                            "bg-[#002e46] hover:bg-[#001f2f] text-white gap-1.5 h-9 font-semibold transition-all shadow-sm",
                                            selectedBill && "w-9 px-0"
                                        )}
                                        size={selectedBill ? "icon" : "default"}
                                        onClick={() => setLocation('/e-way-bills/create')}
                                        data-testid="button-new-eway-bill"
                                    >
                                        <Plus className="h-4 w-4" />
                                        {!selectedBill && <span>New</span>}
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
                                                        <DropdownMenuItem onClick={() => { setSortBy('date'); setSortOrder(sortBy === 'date' && sortOrder === 'desc' ? 'asc' : 'desc'); }} data-testid="sort-date">
                                                            Date {sortBy === 'date' && (sortOrder === 'desc' ? '↓' : '↑')}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => { setSortBy('billNumber'); setSortOrder(sortBy === 'billNumber' && sortOrder === 'desc' ? 'asc' : 'desc'); }} data-testid="sort-bill-number">
                                                            Bill Number {sortBy === 'billNumber' && (sortOrder === 'desc' ? '↓' : '↑')}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => { setSortBy('customerName'); setSortOrder(sortBy === 'customerName' && sortOrder === 'desc' ? 'asc' : 'desc'); }} data-testid="sort-customer-name">
                                                            Customer Name {sortBy === 'customerName' && (sortOrder === 'desc' ? '↓' : '↑')}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => { setSortBy('amount'); setSortOrder(sortBy === 'amount' && sortOrder === 'desc' ? 'asc' : 'desc'); }} data-testid="sort-amount">
                                                            Amount {sortBy === 'amount' && (sortOrder === 'desc' ? '↓' : '↑')}
                                                        </DropdownMenuItem>
                                                    </DropdownMenuSubContent>
                                                </DropdownMenuPortal>
                                            </DropdownMenuSub>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                data-testid="menu-import"
                                                onClick={() => {
                                                    const input = document.createElement('input');
                                                    input.type = 'file';
                                                    input.accept = '.json,.csv,.xlsx';
                                                    input.onchange = (e) => {
                                                        const file = (e.target as HTMLInputElement).files?.[0];
                                                        if (file) {
                                                            console.log('Importing file:', file.name);
                                                            toast({
                                                                title: "Import Started",
                                                                description: `Importing ${file.name}...`,
                                                            });
                                                        }
                                                    };
                                                    input.click();
                                                }}
                                            >
                                                <Download className="mr-2 h-4 w-4" /> Import Bills
                                            </DropdownMenuItem>
                                            <DropdownMenuItem data-testid="menu-export" onClick={handleExportBills}>
                                                <Download className="mr-2 h-4 w-4" /> Export Bills
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>

                            {!selectedBill && (
                                <div className="flex-none px-4 py-3 border-b">
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <Select value={periodFilter} onValueChange={setPeriodFilter} data-testid="select-period-filter">
                                            <SelectTrigger className="w-[120px] h-8 text-sm px-2" data-testid="select-trigger-period">
                                                <SelectValue placeholder="Period" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {transactionPeriods.map((period) => (
                                                    <SelectItem key={period.value} value={period.value} className="text-sm">
                                                        {period.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        <Select value={transactionTypeFilter} onValueChange={setTransactionTypeFilter} data-testid="select-type-filter">
                                            <SelectTrigger className="w-[110px] h-8 text-sm px-2" data-testid="select-trigger-type">
                                                <SelectValue placeholder="Type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {transactionTypeFilters.map((type) => (
                                                    <SelectItem key={type.value} value={type.value} className="text-sm">
                                                        {type.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        <Select value={statusFilter} onValueChange={setStatusFilter} data-testid="select-status-filter">
                                            <SelectTrigger className="w-[110px] h-8 text-sm px-2" data-testid="select-trigger-status">
                                                <SelectValue placeholder="Status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {ewayBillStatuses.map((status) => (
                                                    <SelectItem key={status.value} value={status.value} className="text-sm">
                                                        {status.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            )}

                            <div className="flex-1 overflow-hidden relative">
                                <div className="absolute inset-0 flex flex-col">
                                    <div className="flex-1 overflow-y-auto scrollbar-hide">
                                        <table className="w-full">
                                            <thead className="bg-[#f8fafc]/50 sticky top-0 z-10">
                                                <tr>
                                                    <th className="p-3 w-10">
                                                        <Checkbox
                                                            checked={selectedBills.length === ewayBills.length && ewayBills.length > 0}
                                                            onCheckedChange={handleSelectAll}
                                                            className="data-[state=checked]:bg-[#002e46] data-[state=checked]:border-[#002e46]"
                                                            data-testid="checkbox-select-all"
                                                        />
                                                    </th>
                                                    <th className="p-3 text-left font-display text-[11px] uppercase tracking-wider font-bold text-slate-500/80">E-Way Bill Details</th>
                                                    {!selectedBill && (
                                                        <>
                                                            <th className="p-3 text-left font-display text-[11px] uppercase tracking-wider font-bold text-slate-500/80">Customer</th>
                                                            <th className="p-3 text-left font-display text-[11px] uppercase tracking-wider font-bold text-slate-500/80">Status</th>
                                                            <th className="p-3 text-right font-display text-[11px] uppercase tracking-wider font-bold text-slate-500/80">Amount</th>
                                                        </>
                                                    )}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {loading ? (
                                                    <tr>
                                                        <td colSpan={selectedBill ? 2 : 5} className="p-8 text-center text-muted-foreground">
                                                            Loading e-way bills...
                                                        </td>
                                                    </tr>
                                                ) : filteredEwayBills.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={selectedBill ? 2 : 5} className="p-8 text-center text-muted-foreground">
                                                            No e-Way Bills found.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    paginatedItems.map((bill) => (
                                                        <tr
                                                            key={bill.id}
                                                            className={cn(
                                                                "hover:bg-slate-50 cursor-pointer transition-colors",
                                                                selectedBill?.id === bill.id && "bg-blue-50"
                                                            )}
                                                            onClick={() => fetchEWayBillDetail(bill.id)}
                                                        >
                                                            <td className="p-3" onClick={(e) => e.stopPropagation()}>
                                                                <Checkbox
                                                                    checked={selectedBills.includes(bill.id)}
                                                                    onCheckedChange={(checked) => handleSelectOne(bill.id, checked as boolean)}
                                                                    className="data-[state=checked]:bg-[#002e46] data-[state=checked]:border-[#002e46]"
                                                                    data-testid={`checkbox-select-${bill.id}`}
                                                                />
                                                            </td>
                                                            <td className="p-3">
                                                                <div className="flex flex-col">
                                                                    <span className="font-semibold text-[#002e46] font-display">{bill.ewayBillNumber || 'Draft'}</span>
                                                                    <span className="text-[11px] text-slate-500 font-medium font-display">{bill.documentNumber} • {formatDate(bill.date)}</span>
                                                                </div>
                                                            </td>
                                                            {!selectedBill && (
                                                                <>
                                                                    <td className="p-3 text-sm font-semibold text-[#002e46] font-display">{bill.customerName}</td>
                                                                    <td className="p-3">
                                                                        <Badge variant="outline" className={cn("text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border-2", getStatusColor(bill.status))}>
                                                                            {bill.status.replace('_', ' ')}
                                                                        </Badge>
                                                                    </td>
                                                                    <td className="p-3 text-right text-sm font-bold text-[#002e46] font-display">{formatCurrency(bill.total)}</td>
                                                                </>
                                                            )}
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="flex-none border-t bg-white">
                                        <TablePagination
                                            currentPage={currentPage}
                                            totalPages={totalPages}
                                            totalItems={totalItems}
                                            itemsPerPage={itemsPerPage}
                                            onPageChange={goToPage}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </ResizablePanel>
                )}

                {selectedBill && (
                    <>
                        {!isCompact && (
                            <ResizableHandle withHandle className="w-1 bg-slate-200 hover:bg-blue-400 transition-all" />
                        )}
                        <ResizablePanel defaultSize={isCompact ? 100 : 65} minSize={isCompact ? 100 : 30} className="bg-white">
                            <EWayBillDetailPanel
                                bill={selectedBill}
                                onClose={() => setSelectedBill(null)}
                                onEdit={() => setLocation(`/e-way-bills/${selectedBill.id}/edit`)}
                                onDelete={() => {
                                    setBillToDelete(selectedBill.id);
                                    setDeleteDialogOpen(true);
                                }}
                            />
                        </ResizablePanel>
                    </>
                )}
            </ResizablePanelGroup>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete E-Way Bill</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this e-way bill? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteBill} className="bg-red-600 hover:bg-red-700" data-testid="button-confirm-delete">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div >
    );
}