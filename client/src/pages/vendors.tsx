
import { useState, useEffect, useMemo } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLocation } from "wouter";
import { useOrganization } from "@/context/OrganizationContext";
import { useBranding } from "@/hooks/use-branding";
import { cn } from "@/lib/utils";
import {
    Plus,
    Search,
    MoreHorizontal,
    Pencil,
    Trash2,
    ChevronDown,
    Mail,
    Phone,
    MapPin,
    Building2,
    FileText,
    Filter,
    ArrowUpDown,
    ChevronUp,
    X,
    Send,
    Printer,
    Download,
    MessageSquare,
    History,
    Receipt,
    BadgeIndianRupee,
    Settings,
    Clock,
    User,
    CreditCard,
    Briefcase,
    Notebook,
    Tag,
    ChevronRight,
    RefreshCw,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
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
    DropdownMenuLabel,
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
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { TablePagination } from "@/components/table-pagination";
import { usePagination } from "@/hooks/use-pagination";
// removed import { formatCurrency } from "@/lib/utils";
import { robustIframePrint } from "@/lib/robust-print";
import { generatePDFFromElement } from "@/lib/pdf-utils";

interface ContactPerson {
    salutation?: string;
    firstName: string;
    lastName: string;
    email?: string;
    workPhone?: string;
    mobile?: string;
    isPrimary?: boolean;
}

interface Vendor {
    id: string;
    name: string;
    mobile?: string;
    workPhone?: string;
    phone?: string;
    displayName?: string;
    firstName?: string;
    lastName?: string;
    companyName?: string;
    email?: string;
    gstin?: string;
    gstTreatment?: string;
    currency?: string;
    openingBalance?: number;
    totalBilled?: number;
    paymentTerms?: string;
    sourceOfSupply?: string;
    billingAddress?: {
        attention?: string;
        street1?: string;
        street2?: string;
        city?: string;
        state?: string;
        pinCode?: string;
        country?: string;
        phone?: string;
        faxNumber?: string;
    };
    shippingAddress?: {
        attention?: string;
        street1?: string;
        street2?: string;
        city?: string;
        state?: string;
        pinCode?: string;
        country?: string;
        phone?: string;
        faxNumber?: string;
    };
    bankDetails?: {
        accountHolderName?: string;
        bankName?: string;
        accountNumber?: string;
        ifscCode?: string;
        swiftCode?: string;
        branchName?: string;
    };
    salutation?: string;
    pan?: string;
    expenseAccount?: string;
    msmeRegistered?: boolean;
    msmeRegistrationType?: string;
    msmeRegistrationNumber?: string;
    remarks?: string;
    contactPersons?: ContactPerson[];
    payables?: number;
    unusedCredits?: number;
    status?: string;
    isCrm?: boolean;
    isPortalEnabled?: boolean;
    createdAt?: string;
}

interface Comment {
    id: string;
    text: string;
    author: string;
    createdAt: string;
}

interface Transaction {
    id: string;
    type: string;
    date: string;
    number: string;
    orderNumber?: string;
    amount: number;
    balance: number;
    status: string;
    vendor?: string;
    paidThrough?: string;
}

interface SystemMail {
    id: string;
    to: string;
    subject: string;
    date: string;
    status: string;
    type: string;
}

interface ActivityItem {
    id: string;
    type: string;
    title: string;
    description: string;
    user: string;
    date: string;
    time: string;
}

const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2
    }).format(amount);
};

interface VendorDetailPanelProps {
    vendor: Vendor;
    onClose: () => void;
    onEdit: () => void;
    onDelete: () => void;
}

function VendorDetailPanel({ vendor, onClose, onEdit, onDelete }: VendorDetailPanelProps) {
    const { currentOrganization } = useOrganization();
    const { data: branding } = useBranding();
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState("overview");
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [transactions, setTransactions] = useState<Record<string, Transaction[]>>({
        bills: [],
        billPayments: [],
        expenses: [],
        purchaseOrders: [],
        vendorCredits: [],
        journals: []
    });
    const [mails, setMails] = useState<SystemMail[]>([]);
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [fullVendor, setFullVendor] = useState<Vendor>(vendor);
    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        return {
            date: date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
            time: date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
        };
    };

    const combinedTransactions = useMemo(() => {
        const all = [
            ...(transactions.bills || []).map(b => ({ ...b, tType: 'Bill', displayAmount: b.amount, isCredit: true })),
            ...(transactions.billPayments || []).map(p => ({ ...p, tType: 'Payment', displayAmount: p.amount, isCredit: false })),
            ...(transactions.expenses || []).map(e => ({ ...e, tType: 'Expense', displayAmount: e.amount, isCredit: true })),
            ...(transactions.vendorCredits || []).map(vc => ({ ...vc, tType: 'Credit', displayAmount: vc.amount, isCredit: false }))
        ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        let runningBalance = fullVendor.openingBalance || 0;
        return all.map(t => {
            if (t.isCredit) {
                runningBalance += t.displayAmount;
            } else {
                runningBalance -= t.displayAmount;
            }
            return { ...t, runningBalance };
        });
    }, [transactions, fullVendor.openingBalance]);

    const statementPeriod = useMemo(() => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return {
            start: formatDate(start.toISOString()),
            end: formatDate(end.toISOString())
        };
    }, []);

    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        bills: true,
        billPayments: true,
        expenses: false,
        purchaseOrders: false,
        vendorCredits: false
    });

    useEffect(() => {
        if (vendor.id) {
            setFullVendor(vendor);
            fetchVendorData();
        }
    }, [vendor.id]);

    const fetchVendorData = async () => {
        setLoading(true);
        try {
            const [vendorRes, commentsRes, transactionsRes, mailsRes, activitiesRes] = await Promise.all([
                fetch(`/api/vendors/${vendor.id}`),
                fetch(`/api/vendors/${vendor.id}/comments`),
                fetch(`/api/vendors/${vendor.id}/transactions`),
                fetch(`/api/vendors/${vendor.id}/mails`),
                fetch(`/api/vendors/${vendor.id}/activities`)
            ]);

            if (vendorRes.ok) {
                const data = await vendorRes.json();
                if (data.success) {
                    setFullVendor(data.data);
                }
            }

            if (commentsRes.ok) {
                const data = await commentsRes.json();
                setComments(data.data || []);
            }
            if (transactionsRes.ok) {
                const data = await transactionsRes.json();
                setTransactions(data.data || {
                    bills: [],
                    billPayments: [],
                    expenses: [],
                    purchaseOrders: [],
                    vendorCredits: [],
                    journals: []
                });
            }
            if (mailsRes.ok) {
                const data = await mailsRes.json();
                setMails(data.data || []);
            }
            if (activitiesRes.ok) {
                const data = await activitiesRes.json();
                setActivities(data.data || []);
            }
        } catch (error) {
            console.error('Error fetching vendor data:', error);
            toast({ title: "Failed to fetch vendor data", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleAddComment = async () => {
        if (!newComment.trim()) return;
        try {
            const response = await fetch(`/api/vendors/${vendor.id}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: newComment })
            });
            if (response.ok) {
                const data = await response.json();
                setComments([...comments, data.data]);
                setNewComment("");
                toast({ title: "Comment added successfully" });
            }
        } catch (error) {
            toast({ title: "Failed to add comment", variant: "destructive" });
        }
    };

    const handlePrint = () => {
        toast({ title: "Preparing print...", description: "Opening print dialog." });
        robustIframePrint("vendor-statement");
    };

    const handleDownloadPDF = async () => {
        toast({ title: "Preparing download...", description: "Please wait while we generate your PDF." });
        try {
            await generatePDFFromElement("vendor-statement", `Statement-${vendor.name}.pdf`);
            toast({ title: "Success", description: "Statement downloaded successfully." });
        } catch (error) {
            console.error("PDF generation error:", error);
            toast({ title: "Error", description: "Failed to generate PDF. Please try again.", variant: "destructive" });
        }
    };

    const toggleSection = (section: string) => {
        setExpandedSections((prev: Record<string, boolean>) => ({ ...prev, [section]: !prev[section] }));
    };


    return (
        <div className="h-full flex flex-col bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between px-4 py-4 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                        <ChevronDown className="h-4 w-4 rotate-90" />
                    </Button>
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white truncate">
                        {fullVendor.displayName || fullVendor.name}
                    </h2>
                </div>
                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button className="bg-sidebar hover:bg-sidebar/90 text-white gap-1.5 h-9 font-display font-medium shadow-sm">
                                <Plus className="h-4 w-4" />
                                New Transaction
                                <ChevronDown className="h-3 w-3" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => setLocation(`/bills/new?vendorId=${fullVendor.id}`)}>
                                <Receipt className="mr-2 h-4 w-4" /> Bill
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setLocation(`/expenses?vendorId=${fullVendor.id}`)}>
                                <BadgeIndianRupee className="mr-2 h-4 w-4" /> Expense
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setLocation(`/purchase-orders/new?vendorId=${fullVendor.id}`)}>
                                <Briefcase className="mr-2 h-4 w-4" /> Purchase Order
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setLocation(`/payments-made/new?vendorId=${fullVendor.id}`)}>
                                <CreditCard className="mr-2 h-4 w-4" /> Payment Made
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setLocation(`/vendor-credits/new?vendorId=${fullVendor.id}`)}>
                                <Notebook className="mr-2 h-4 w-4" /> Vendor Credit
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button variant="outline" size="sm" onClick={onEdit} className="h-9">
                        <Pencil className="h-4 w-4 mr-2" /> Edit
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-1.5 h-9">
                                More
                                <ChevronDown className="h-3 w-3" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={onDelete} className="text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                <div className="flex items-center px-6 border-b border-slate-200 dark:border-slate-700">
                    <TabsList className="h-auto p-0 bg-transparent gap-6">
                        {[
                            { value: "overview", label: "Overview", icon: Building2 },
                            { value: "comments", label: "Comments", icon: MessageSquare },
                            { value: "transactions", label: "Transactions", icon: History },
                            { value: "mails", label: "Mails", icon: Mail },
                            { value: "statement", label: "Statement", icon: FileText }
                        ].map((tab) => (
                            <TabsTrigger
                                key={tab.value}
                                value={tab.value}
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-sidebar data-[state=active]:text-sidebar data-[state=active]:bg-transparent data-[state=active]:shadow-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-2 py-3 bg-transparent hover:bg-transparent transition-none gap-2 font-display font-medium"
                            >
                                <tab.icon className="h-4 w-4" />
                                {tab.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>

                <TabsContent value="overview" className="flex-1 overflow-y-auto scrollbar-hide p-0 mt-0">
                    <div className="p-4 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                            {/* Basic Info Card */}
                            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                                <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex items-center gap-2">
                                    <Building2 className="h-5 w-5 text-sidebar" />
                                    <h3 className="font-semibold text-slate-900 dark:text-white">Vendor Information</h3>
                                </div>
                                <div className="p-5 space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase font-semibold">Vendor Name</p>
                                            <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{fullVendor.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase font-semibold">Display Name</p>
                                            <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{fullVendor.displayName || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase font-semibold">Company Name</p>
                                            <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{fullVendor.companyName || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase font-semibold">GSTIN</p>
                                            <p className="text-sm font-medium text-sidebar mt-1 uppercase">{fullVendor.gstin || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase font-semibold">GST Treatment</p>
                                            <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{fullVendor.gstTreatment || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase font-semibold">Currency</p>
                                            <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{fullVendor.currency || 'INR'}</p>
                                        </div>
                                        {fullVendor.pan && (
                                            <div>
                                                <p className="text-xs text-slate-500 uppercase font-semibold">PAN</p>
                                                <p className="text-sm font-medium text-slate-900 dark:text-white mt-1 font-mono">{fullVendor.pan}</p>
                                            </div>
                                        )}
                                        {fullVendor.expenseAccount && (
                                            <div>
                                                <p className="text-xs text-slate-500 uppercase font-semibold">Expense Account</p>
                                                <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{fullVendor.expenseAccount}</p>
                                            </div>
                                        )}
                                    </div>

                                    {fullVendor.msmeRegistered && (
                                        <div className="pt-3 border-t border-slate-100 dark:border-slate-700">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Tag className="h-4 w-4 text-orange-500" />
                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">MSME Details</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 bg-orange-50/50 dark:bg-orange-900/10 p-3 rounded-lg border border-orange-100 dark:border-orange-900/20">
                                                <div>
                                                    <p className="text-[10px] text-orange-600 dark:text-orange-400 uppercase font-bold">Type</p>
                                                    <p className="text-xs font-medium text-slate-900 dark:text-white capitalize">{fullVendor.msmeRegistrationType}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-orange-600 dark:text-orange-400 uppercase font-bold">Registration No</p>
                                                    <p className="text-xs font-medium text-slate-900 dark:text-white font-mono">{fullVendor.msmeRegistrationNumber}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="pt-4 border-t border-slate-100 dark:border-slate-700 grid grid-cols-2 gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-sidebar/5 dark:bg-sidebar/20 text-sidebar">
                                                <Mail className="h-4 w-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[10px] text-slate-500 uppercase font-bold truncate">Email</p>
                                                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{fullVendor.email || '-'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/30 text-green-600">
                                                <Phone className="h-4 w-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[10px] text-slate-500 uppercase font-bold truncate">Phone</p>
                                                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{fullVendor.phone || fullVendor.mobile || '-'}</p>
                                            </div>
                                        </div>
                                    </div>
                                    {(fullVendor.isCrm || fullVendor.isPortalEnabled) && (
                                        <div className="flex gap-2 pt-2">
                                            {fullVendor.isCrm && <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-600 border-blue-100">CRM Vendor</Badge>}
                                            {fullVendor.isPortalEnabled && <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-600 border-purple-100">Portal Enabled</Badge>}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Payables Card */}
                            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                                <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <BadgeIndianRupee className="h-5 w-5 text-green-600" />
                                        <h3 className="font-semibold text-slate-900 dark:text-white">Payables & Balances</h3>
                                    </div>
                                    <Badge className="bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 border-none">Active</Badge>
                                </div>
                                <div className="p-6 space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="p-4 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-900/30">
                                            <p className="text-xs text-orange-600 dark:text-orange-400 font-bold uppercase mb-1">Total Payables</p>
                                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(fullVendor.payables || 0)}</p>
                                        </div>
                                        <div className="p-4 rounded-xl bg-sidebar/5 dark:bg-sidebar/20 border border-sidebar/10 dark:border-sidebar/30">
                                            <p className="text-xs text-sidebar dark:text-sidebar/80 font-bold uppercase mb-1">Unused Credits</p>
                                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(fullVendor.unusedCredits || 0)}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div className="flex justify-between p-2 border-b border-slate-100 dark:border-slate-700">
                                            <span className="text-slate-500">Opening Balance</span>
                                            <span className="font-medium">{formatCurrency(fullVendor.openingBalance || 0)}</span>
                                        </div>
                                        <div className="flex justify-between p-2 border-b border-slate-100 dark:border-slate-700">
                                            <span className="text-slate-500">Payment Terms</span>
                                            <span className="font-medium text-sidebar">{fullVendor.paymentTerms || 'Due on Receipt'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Addresses Card */}
                            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden col-span-1 lg:col-span-2">
                                <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex items-center gap-2">
                                    <MapPin className="h-5 w-5 text-red-600" />
                                    <h3 className="font-semibold text-slate-900 dark:text-white">Addresses</h3>
                                </div>
                                <div className="px-4 py-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Billing Address</h4>
                                            <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] text-sidebar">Copy to Shipping</Button>
                                        </div>
                                        <div className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg">
                                            {fullVendor.billingAddress?.street1 || fullVendor.billingAddress?.street2 || fullVendor.billingAddress?.city ? (
                                                <>
                                                    <p className="font-medium text-slate-900 dark:text-slate-200">{fullVendor.billingAddress.attention || fullVendor.name}</p>
                                                    <p>{fullVendor.billingAddress.street1}</p>
                                                    {fullVendor.billingAddress.street2 && <p>{fullVendor.billingAddress.street2}</p>}
                                                    <p>{fullVendor.billingAddress.city}, {fullVendor.billingAddress.state} - {fullVendor.billingAddress.pinCode}</p>
                                                    <p>{fullVendor.billingAddress.country}</p>
                                                    {(fullVendor.billingAddress.phone || fullVendor.billingAddress.faxNumber) && (
                                                        <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-[11px] space-y-0.5">
                                                            {fullVendor.billingAddress.phone && <p>Phone: {fullVendor.billingAddress.phone}</p>}
                                                            {fullVendor.billingAddress.faxNumber && <p>Fax: {fullVendor.billingAddress.faxNumber}</p>}
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <p className="text-slate-400 italic">No billing address specified</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Shipping Address</h4>
                                        <div className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg">
                                            {fullVendor.shippingAddress?.street1 || fullVendor.shippingAddress?.street2 || fullVendor.shippingAddress?.city ? (
                                                <>
                                                    <p className="font-medium text-slate-900 dark:text-slate-200">{fullVendor.shippingAddress.attention || fullVendor.name}</p>
                                                    <p>{fullVendor.shippingAddress.street1}</p>
                                                    {fullVendor.shippingAddress.street2 && <p>{fullVendor.shippingAddress.street2}</p>}
                                                    <p>{fullVendor.shippingAddress.city}, {fullVendor.shippingAddress.state} - {fullVendor.shippingAddress.pinCode}</p>
                                                    <p>{fullVendor.shippingAddress.country}</p>
                                                    {(fullVendor.shippingAddress.phone || fullVendor.shippingAddress.faxNumber) && (
                                                        <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-[11px] space-y-0.5">
                                                            {fullVendor.shippingAddress.phone && <p>Phone: {fullVendor.shippingAddress.phone}</p>}
                                                            {fullVendor.shippingAddress.faxNumber && <p>Fax: {fullVendor.shippingAddress.faxNumber}</p>}
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <p className="text-slate-400 italic">No shipping address specified</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Bank Details Card */}
                                {fullVendor.bankDetails && (fullVendor.bankDetails.bankName || fullVendor.bankDetails.accountNumber) && (
                                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden col-span-1 lg:col-span-2">
                                        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex items-center gap-2">
                                            <CreditCard className="h-5 w-5 text-sidebar" />
                                            <h3 className="font-semibold text-slate-900 dark:text-white">Bank Details</h3>
                                        </div>
                                        <div className="p-5">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                <div>
                                                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Account Holder</p>
                                                    <p className="text-sm font-medium text-slate-900 dark:text-white">{fullVendor.bankDetails.accountHolderName || '-'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Bank Name</p>
                                                    <p className="text-sm font-medium text-slate-900 dark:text-white">{fullVendor.bankDetails.bankName || '-'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Branch Name</p>
                                                    <p className="text-sm font-medium text-slate-900 dark:text-white">{fullVendor.bankDetails.branchName || '-'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Account Number</p>
                                                    <p className="text-sm font-medium text-sidebar font-mono">{fullVendor.bankDetails.accountNumber || '-'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">IFSC Code</p>
                                                    <p className="text-sm font-medium text-sidebar font-mono uppercase">{fullVendor.bankDetails.ifscCode || '-'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">SWIFT Code</p>
                                                    <p className="text-sm font-medium text-slate-900 dark:text-white font-mono uppercase">{fullVendor.bankDetails.swiftCode || '-'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Contact Persons Section */}
                                {fullVendor.contactPersons && fullVendor.contactPersons.length > 0 && (
                                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden col-span-1 lg:col-span-2">
                                        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex items-center gap-2">
                                            <User className="h-5 w-5 text-blue-600" />
                                            <h3 className="font-semibold text-slate-900 dark:text-white">Contact Persons</h3>
                                        </div>
                                        <div className="p-0 divide-y divide-slate-100 dark:divide-slate-700">
                                            {fullVendor.contactPersons.map((cp, idx) => (
                                                <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-9 w-9 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold">
                                                            {cp.firstName?.charAt(0) || cp.lastName?.charAt(0) || 'U'}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{cp.salutation} {cp.firstName} {cp.lastName}</p>
                                                            <p className="text-xs text-slate-500">{cp.email || 'No email specified'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-6">
                                                        {cp.workPhone && (
                                                            <div className="text-right">
                                                                <p className="text-[10px] text-slate-400 uppercase font-bold">Work</p>
                                                                <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{cp.workPhone}</p>
                                                            </div>
                                                        )}
                                                        {cp.mobile && (
                                                            <div className="text-right">
                                                                <p className="text-[10px] text-slate-400 uppercase font-bold">Mobile</p>
                                                                <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{cp.mobile}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                    {fullVendor.remarks && (
                                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden col-span-1 lg:col-span-2">
                                            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex items-center gap-2">
                                                <Notebook className="h-5 w-5 text-amber-500" />
                                                <h3 className="font-semibold text-slate-900 dark:text-white">Internal Remarks</h3>
                                            </div>
                                            <div className="p-5">
                                                <div className="bg-amber-50/50 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-100 dark:border-amber-900/20">
                                                    <p className="text-sm text-slate-700 dark:text-slate-300 italic">"{fullVendor.remarks}"</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Activity Timeline Section */}
                                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden col-span-1 lg:col-span-2">
                                        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-white dark:bg-slate-800">
                                            <div className="flex items-center gap-2.5">
                                                <div className="h-10 w-10 rounded-xl bg-sidebar/10 flex items-center justify-center text-sidebar">
                                                    <Clock className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-slate-900 dark:text-white">Recent Activity</h3>
                                                    <p className="text-xs text-slate-500 font-medium">Real-time event tracking</p>
                                                </div>
                                            </div>
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                onClick={fetchVendorData}
                                                className="h-9 px-3 text-sidebar hover:bg-sidebar/5 font-semibold gap-2"
                                            >
                                                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                                                Refresh
                                            </Button>
                                        </div>
                                        <div className="p-0">
                                            {activities.length === 0 ? (
                                                <div className="p-12 text-center bg-slate-50/50 dark:bg-slate-900/50">
                                                    <div className="h-16 w-16 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center mx-auto mb-4">
                                                        <Clock className="h-8 w-8 text-slate-300" />
                                                    </div>
                                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">No activity yet</h4>
                                                    <p className="text-xs text-slate-500 mt-1 max-w-[200px] mx-auto leading-relaxed">System logs for transactions and updates will appear here automatically.</p>
                                                </div>
                                            ) : (
                                                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                                                    {activities.map((activity) => {
                                                        const { date, time } = formatDateTime(activity.date);
                                                        const typeColors: Record<string, string> = {
                                                            'bill': 'bg-blue-50 text-blue-600 border-blue-100',
                                                            'payment': 'bg-green-50 text-green-600 border-green-100',
                                                            'vendor_credit': 'bg-purple-50 text-purple-600 border-purple-100',
                                                            'expense': 'bg-orange-50 text-orange-600 border-orange-100'
                                                        };
                                                        
                                                        return (
                                                            <div key={activity.id} className="p-6 flex gap-6 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-all duration-300 group">
                                                                <div className="flex flex-col items-center gap-2 w-16 flex-shrink-0">
                                                                    <span className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{time.split(' ')[1]}</span>
                                                                    <div className="h-10 w-10 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center group-hover:scale-110 group-hover:border-sidebar/30 transition-all duration-300">
                                                                        <span className="text-[10px] font-bold text-slate-900 dark:text-white">{time.split(' ')[0]}</span>
                                                                    </div>
                                                                    <div className="w-px h-full bg-slate-100 dark:bg-slate-800 group-last:hidden"></div>
                                                                </div>
                                                                <div className="flex-1 space-y-3">
                                                                    <div className="flex items-center justify-between gap-4">
                                                                        <div className="space-y-1">
                                                                            <h5 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">{activity.title}</h5>
                                                                            <div className="flex items-center gap-2">
                                                                                <Badge variant="outline" className={cn("text-[10px] px-1.5 h-4.5 font-black uppercase tracking-widest", typeColors[activity.type] || 'bg-slate-50 text-slate-500 border-slate-100')}>
                                                                                    {activity.type.replace('_', ' ')}
                                                                                </Badge>
                                                                                <span className="text-[10px] font-bold text-slate-300 dark:text-slate-600">•</span>
                                                                                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">{date}</span>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex -space-x-2">
                                                                            <div className="h-8 w-8 rounded-full border-2 border-white dark:border-slate-800 bg-sidebar/10 text-sidebar flex items-center justify-center text-[10px] font-bold uppercase shadow-sm">
                                                                                {activity.user.charAt(0)}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 p-4 rounded-2xl shadow-sm group-hover:border-sidebar/20 transition-all duration-300">
                                                                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">{activity.description}</p>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-400">
                                                                        <span>Modified by</span>
                                                                        <span className="text-sidebar bg-sidebar/5 px-2 py-0.5 rounded-full">{activity.user}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="comments" className="flex-1 overflow-y-auto scrollbar-hide p-0 mt-0">
                    <div className="flex-1 overflow-auto scrollbar-hide p-6">
                        <div className="max-w-3xl mx-auto space-y-6">
                            {comments.length === 0 ? (
                                <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                                    <MessageSquare className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                                    <h3 className="text-lg font-medium text-slate-900 dark:text-white">No comments yet</h3>
                                    <p className="text-slate-500 max-w-xs mx-auto mt-1">Add notes or internal comments about this vendor to keep your team informed.</p>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    <h3 className="text-sm font-bold text-slate-400 uppercase mb-4 px-2">Recent Comments</h3>
                                    <div className="space-y-4">
                                        {comments.map((comment) => (
                                            <div key={comment.id} className="flex gap-4 p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm">
                                                <div className="h-10 w-10 rounded-xl bg-sidebar/10 dark:bg-sidebar/20 text-sidebar flex items-center justify-center font-bold text-lg flex-none">
                                                    {comment.author.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="font-semibold text-slate-900 dark:text-white">{comment.author}</span>
                                                        <span className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
                                                            <Clock className="h-3 w-3" />
                                                            {formatDate(comment.createdAt)}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{comment.text}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
                        <div className="max-w-3xl mx-auto">
                            <div className="relative group">
                                <Textarea
                                    placeholder="Type a comment or internal note..."
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    className="min-h-[100px] bg-slate-50 dark:bg-slate-800 border-none focus-visible:ring-1 focus-visible:ring-sidebar rounded-xl p-4 pr-16 text-sm resize-none shadow-inner"
                                />
                                <Button
                                    onClick={handleAddComment}
                                    disabled={!newComment.trim()}
                                    className="absolute right-3 bottom-3 h-10 w-10 rounded-lg p-0 bg-sidebar hover:bg-sidebar/90 shadow-lg shadow-sidebar/20"
                                >
                                    <Send className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="transactions" className="flex-1 overflow-y-auto scrollbar-hide p-6 mt-0" data-vendor-transactions-scroll-container>
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                            <Loader2 className="h-10 w-10 text-sidebar animate-spin mb-4" />
                            <p className="text-slate-500 font-medium">Fetching transaction history...</p>
                        </div>
                    ) : (
                        <>
                            {/* Go to transactions dropdown */}
                            <div className="flex items-center justify-between mb-4">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm" className="gap-1.5">
                                            Go to transactions
                                            <ChevronDown className="h-3 w-3" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="w-48">
                                        {[
                                            { id: 'bills', label: 'Bills' },
                                            { id: 'billPayments', label: 'Payments Made' },
                                            { id: 'expenses', label: 'Expenses' },
                                            { id: 'purchaseOrders', label: 'Purchase Orders' },
                                            { id: 'vendorCredits', label: 'Vendor Credits' }
                                        ].map((section) => (
                                            <DropdownMenuItem
                                                key={section.id}
                                                onClick={() => {
                                                    // First expand the section
                                                    setExpandedSections((prev: Record<string, boolean>) => ({ ...prev, [section.id]: true }));
                                                    // Use timeout to allow section to expand fully
                                                    setTimeout(() => {
                                                        const element = document.getElementById(`vendor-section-${section.id}`);
                                                        const scrollContainer = document.querySelector('[data-vendor-transactions-scroll-container]');
                                                        if (element && scrollContainer) {
                                                            // Get the parent container's padding/offset (the div with p-6 = 24px)
                                                            const containerPadding = 24;
                                                            // Calculate scroll position - element's position relative to container
                                                            const elementTop = element.offsetTop;

                                                            scrollContainer.scrollTo({
                                                                top: elementTop - containerPadding - 60, // 60px offset for the dropdown header
                                                                behavior: 'smooth'
                                                            });
                                                        } else if (element) {
                                                            element.scrollIntoView({
                                                                behavior: 'smooth',
                                                                block: 'start'
                                                            });
                                                        }
                                                    }, 300);
                                                }}
                                            >
                                                {section.label}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <div className="space-y-4">
                                {[
                                    { id: 'bills', label: 'Bills', icon: Receipt, count: transactions.bills.length, items: transactions.bills },
                                    { id: 'billPayments', label: 'Payments Made', icon: CreditCard, count: transactions.billPayments.length, items: transactions.billPayments },
                                    { id: 'expenses', label: 'Expenses', icon: BadgeIndianRupee, count: transactions.expenses.length, items: transactions.expenses },
                                    { id: 'purchaseOrders', label: 'Purchase Orders', icon: Briefcase, count: transactions.purchaseOrders.length, items: transactions.purchaseOrders },
                                    { id: 'vendorCredits', label: 'Vendor Credits', icon: Notebook, count: transactions.vendorCredits.length, items: transactions.vendorCredits }
                                ].map((section) => (
                                    <Collapsible
                                        key={section.id}
                                        open={expandedSections[section.id]}
                                        onOpenChange={() => toggleSection(section.id)}
                                    >
                                        <div id={`vendor-section-${section.id}`} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                                            <CollapsibleTrigger asChild>
                                                <div className="w-full px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-lg ${section.count > 0 ? 'bg-sidebar/5 dark:bg-sidebar/20 text-sidebar' : 'bg-slate-50 dark:bg-slate-700 text-slate-400'}`}>
                                                            <section.icon className="h-4 w-4" />
                                                        </div>
                                                        <div>
                                                            <h4 className="text-sm font-semibold text-slate-900 dark:text-white capitalize">{section.label}</h4>
                                                            <p className="text-xs text-slate-500">{section.count} {section.count === 1 ? 'record' : 'records'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        {section.count > 0 && <Badge variant="outline" className="bg-sidebar/5 text-sidebar border-sidebar/20 hidden sm:inline-flex">View All</Badge>}
                                                        <div className={`p-1 rounded-md bg-slate-100 dark:bg-slate-700 transition-transform duration-200 ${expandedSections[section.id] ? 'rotate-180' : ''}`}>
                                                            <ChevronDown className="h-4 w-4 text-slate-500" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </CollapsibleTrigger>
                                            <CollapsibleContent>
                                                <div className="border-t border-slate-100 dark:border-slate-700 overflow-x-auto">
                                                    {section.items.length === 0 ? (
                                                        <div className="px-5 py-8 text-center bg-slate-50/30 dark:bg-slate-900/10">
                                                            <p className="text-sm text-slate-400">No {section.label.toLowerCase()} found for this period.</p>
                                                        </div>
                                                    ) : (
                                                        <table className="w-full text-sm">
                                                            <thead>
                                                                <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
                                                                    <th className="px-5 py-2.5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Date</th>
                                                                    <th className="px-5 py-2.5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Number</th>
                                                                    <th className="px-5 py-2.5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                                                                    <th className="px-5 py-2.5 text-right text-[11px] font-bold text-slate-400 uppercase tracking-wider">Amount</th>
                                                                    <th className="px-5 py-2.5 text-right text-[11px] font-bold text-slate-400 uppercase tracking-wider">Amount Sent</th>
                                                                    <th className="px-5 py-2.5 text-right text-[11px] font-bold text-slate-400 uppercase tracking-wider">Due Balance</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                                                {section.items.map((item) => (
                                                                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-pointer transition-colors group" onClick={() => {
                                                                        const basePath = section.id === 'billPayments' ? 'payments-made' :
                                                                            section.id === 'vendorCredits' ? 'vendor-credits' :
                                                                                section.id === 'purchaseOrders' ? 'purchase-orders' :
                                                                                    section.id;
                                                                        setLocation(`/${basePath}?id=${item.id}`);
                                                                    }}>
                                                                        <td className="px-5 py-3 text-slate-600 dark:text-slate-400 font-medium whitespace-nowrap">{formatDate(item.date)}</td>
                                                                        <td className="px-5 py-3 whitespace-nowrap">
                                                                            <div className="text-sidebar font-semibold group-hover:underline decoration-sidebar/30 underline-offset-4">{item.number}</div>
                                                                            {item.mode && (
                                                                                <div className="text-[10px] text-slate-400 font-medium mt-0.5">{item.mode}</div>
                                                                            )}
                                                                        </td>
                                                                        <td className="px-5 py-3">
                                                                            <Badge variant="outline" className={`
                                                                        ${item.status === 'Paid' || item.status === 'Sent' || item.status === 'Closed' ? 'bg-green-50 text-green-600 border-green-200' : ''}
                                                                        ${item.status === 'Partially Paid' ? 'bg-yellow-50 text-yellow-600 border-yellow-200' : ''}
                                                                        ${item.status === 'Open' || item.status === 'Draft' ? 'bg-sidebar/5 text-sidebar border-sidebar/20' : ''}
                                                                        ${item.status === 'Overdue' ? 'bg-red-50 text-red-600 border-red-200' : ''}
                                                                    `}>
                                                                                {item.status}
                                                                            </Badge>
                                                                        </td>
                                                                        <td className="px-5 py-3 text-right font-semibold text-slate-900 dark:text-white whitespace-nowrap">{formatCurrency(item.amount)}</td>
                                                                        <td className="px-5 py-3 text-right font-medium text-blue-600 dark:text-blue-400 whitespace-nowrap">{formatCurrency(item.paidAmount || 0)}</td>
                                                                        <td className="px-5 py-3 text-right font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">{formatCurrency(item.balance)}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    )}
                                                </div>
                                            </CollapsibleContent>
                                        </div>
                                    </Collapsible>
                                ))}
                            </div>
                        </>
                    )}
                </TabsContent>

                <TabsContent value="mails" className="flex-1 overflow-y-auto scrollbar-hide p-6 mt-0">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                <Mail className="h-5 w-5 text-sidebar" />
                                Communication History
                            </h3>
                            <Button variant="outline" size="sm" className="gap-2">
                                <Send className="h-4 w-4" /> Send Email
                            </Button>
                        </div>

                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <Loader2 className="h-8 w-8 text-sidebar animate-spin mb-4" />
                                <p className="text-slate-500">Loading mails...</p>
                            </div>
                        ) : mails.length === 0 ? (
                            <div className="text-center py-24 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                                <Mail className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                                <h3 className="text-lg font-medium text-slate-900 dark:text-white">No mails sent yet</h3>
                                <p className="text-slate-500 max-w-xs mx-auto mt-1">When you send statements, bills, or receipts to this vendor, they will appear here.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {mails.map((mail) => (
                                    <div key={mail.id} className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group">
                                        <div className="flex items-start justify-between">
                                            <div className="flex gap-4">
                                                <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 group-hover:bg-sidebar/5 dark:group-hover:bg-sidebar/20 group-hover:text-sidebar transition-colors">
                                                    <Mail className="h-5 w-5" />
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="font-semibold text-slate-900 dark:text-white truncate group-hover:text-sidebar transition-colors">{mail.subject}</h4>
                                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                                                        <span className="text-xs text-slate-500 flex items-center gap-1">
                                                            <User className="h-3 w-3" /> To: {mail.to}
                                                        </span>
                                                        <span className="text-xs text-slate-500 flex items-center gap-1">
                                                            <Clock className="h-3 w-3" /> {formatDate(mail.date)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <Badge className={`
                                                ${mail.status === 'Sent' || mail.status === 'Delivered' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-slate-100 text-slate-600 border-slate-200'}
                                            `}>
                                                {mail.status}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </TabsContent >

                <TabsContent value="statement" className="flex-1 overflow-y-auto scrollbar-hide p-0 mt-0">
                    <div className="flex-none p-4 px-6 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="gap-2">
                                        <Filter className="h-4 w-4" /> This Month
                                        <ChevronDown className="h-3 w-3" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start">
                                    <DropdownMenuItem>This Month</DropdownMenuItem>
                                    <DropdownMenuItem>Last Month</DropdownMenuItem>
                                    <DropdownMenuItem>This Quarter</DropdownMenuItem>
                                    <DropdownMenuItem>Last Quarter</DropdownMenuItem>
                                    <DropdownMenuItem>Financial Year</DropdownMenuItem>
                                    <DropdownMenuItem>Custom Range</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" className="gap-2" onClick={handlePrint}>
                                <Printer className="h-4 w-4" /> Print
                            </Button>
                            <Button variant="outline" size="sm" className="gap-2" onClick={handleDownloadPDF}>
                                <Download className="h-4 w-4" /> PDF
                            </Button>
                            <Button className="bg-sidebar hover:bg-sidebar/90 text-white gap-2 font-display font-medium shadow-sm" size="sm">
                                <Send className="h-4 w-4" /> Send Email
                            </Button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto scrollbar-hide bg-slate-100 dark:bg-slate-900/90 p-4 md:p-8 flex justify-center">
                        <div
                            id="vendor-statement"
                            className="bg-white dark:bg-white text-slate-900 shadow-xl w-full max-w-[210mm] min-h-[296mm] h-fit flex flex-col"
                            style={{ color: '#000000' }}
                        >
                            <div className="px-8 md:px-10 py-10 flex-1 flex flex-col">
                                <div className="flex justify-between items-start mb-12 border-b-2 border-slate-900 pb-10">
                                    <div className="flex flex-col gap-4">
                                        {branding?.logo?.url && (
                                            <img
                                                src={branding.logo.url}
                                                alt="Company Logo"
                                                className="h-16 w-auto object-contain"
                                            />
                                        )}
                                        <div>
                                            <h2 className="text-2xl font-bold uppercase text-slate-900 tracking-tight leading-none">{currentOrganization?.name}</h2>
                                            <div className="text-sm text-slate-600 mt-3 space-y-1">
                                                {currentOrganization?.street1 && <p>{currentOrganization.street1}</p>}
                                                {currentOrganization?.street2 && <p>{currentOrganization.street2}</p>}
                                                <p>
                                                    {[currentOrganization?.city, currentOrganization?.state, currentOrganization?.postalCode].filter(Boolean).join(', ')}
                                                </p>
                                                {currentOrganization?.gstin && (
                                                    <p className="font-bold text-slate-900 pt-1 text-[11px] uppercase tracking-wider mt-2 border-t border-slate-100 w-fit">GSTIN: {currentOrganization.gstin}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <h1 className="text-4xl font-light text-slate-400 uppercase tracking-widest mb-4">Statement</h1>
                                        <div className="space-y-1 text-sm text-slate-600">
                                            <p><span className="text-slate-400 uppercase font-medium">Date:</span> {formatDate(new Date().toISOString())}</p>
                                            <p><span className="text-slate-400 uppercase font-medium">Period:</span> {statementPeriod.start} - {statementPeriod.end}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-12 mb-12">
                                    <div>
                                        <h3 className="text-xs font-bold text-slate-400 uppercase mb-4 tracking-widest">To:</h3>
                                        <p className="font-bold text-lg text-slate-900 mb-1">{vendor.name}</p>
                                        <p className="text-slate-600 leading-relaxed font-medium text-sm">
                                            {vendor.billingAddress?.street1}<br />
                                            {vendor.billingAddress?.city}, {vendor.billingAddress?.state}<br />
                                            {vendor.billingAddress?.pinCode}
                                        </p>
                                    </div>
                                    <div>
                                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                                            <h3 className="text-[10px] font-bold text-slate-400 uppercase mb-3 tracking-widest">Account Summary</h3>
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-slate-600">Opening Balance</span>
                                                    <span className="font-semibold text-slate-900">{formatCurrency(vendor.openingBalance || 0)}</span>
                                                </div>
                                                <div className="flex justify-between text-sm text-sidebar font-bold border-t border-slate-200 pt-2 mt-2">
                                                    <span className="uppercase text-[11px] tracking-tight">Current Balance</span>
                                                    <span className="text-lg">{formatCurrency(vendor.payables || 0)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <table className="w-full text-sm mb-8">
                                    <thead>
                                        <tr className="border-b-2 border-slate-900 text-slate-900">
                                            <th className="py-3 text-left font-bold uppercase tracking-wider text-[11px]">Date</th>
                                            <th className="py-3 text-left font-bold uppercase tracking-wider text-[11px]">Description</th>
                                            <th className="py-3 text-right font-bold uppercase tracking-wider text-[11px]">Credits</th>
                                            <th className="py-3 text-right font-bold uppercase tracking-wider text-[11px]">Debits</th>
                                            <th className="py-3 text-right font-bold uppercase tracking-wider text-[11px]">Balance</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-700">
                                        <tr className="bg-slate-50/50">
                                            <td className="py-4 italic font-medium">01/01/2026</td>
                                            <td className="py-4 font-bold text-slate-600">Opening Balance</td>
                                            <td className="py-4 text-right font-medium">-</td>
                                            <td className="py-4 text-right font-medium">-</td>
                                            <td className="py-4 text-right font-bold text-slate-900">{formatCurrency(vendor.openingBalance || 0)}</td>
                                        </tr>
                                        {combinedTransactions.map((t) => (
                                            <tr key={`${t.tType}-${t.id}`}>
                                                <td className="py-4 font-medium text-slate-600">{formatDate(t.date)}</td>
                                                <td className="py-4">
                                                    <p className="font-bold text-slate-900">{t.tType}: {t.number}</p>
                                                    {t.orderNumber && (
                                                        <p className="text-[11px] text-slate-500 font-medium">Ref: {t.orderNumber}</p>
                                                    )}
                                                </td>
                                                <td className="py-4 text-right font-bold text-slate-900">
                                                    {t.isCredit ? formatCurrency(t.displayAmount) : '-'}
                                                </td>
                                                <td className="py-4 text-right font-bold text-slate-900">
                                                    {!t.isCredit ? formatCurrency(t.displayAmount) : '-'}
                                                </td>
                                                <td className="py-4 text-right font-bold text-slate-900">{formatCurrency(t.runningBalance)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                <div className="border-t-2 border-slate-900 pt-6 mt-auto flex justify-end">
                                    <div className="w-64 space-y-3">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500 font-bold uppercase tracking-tight text-[11px]">Total Purchases</span>
                                            <span className="font-bold text-slate-900">{formatCurrency(transactions.bills.reduce((acc, b) => acc + b.amount, 0))}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500 font-bold uppercase tracking-tight text-[11px]">Total Payments</span>
                                            <span className="font-bold text-slate-900">{formatCurrency(transactions.billPayments.reduce((acc, p) => acc + p.amount, 0))}</span>
                                        </div>
                                        <div className="flex justify-between pt-4 border-t border-slate-200">
                                            <span className="text-lg font-black uppercase tracking-tighter text-sidebar">Balance Due</span>
                                            <span className="text-2xl font-black text-sidebar">{formatCurrency(vendor.payables || 0)}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-12 text-[10px] text-slate-400 text-center uppercase tracking-[0.2em] font-bold">
                                    This is a computer generated document.
                                </div>
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs >
        </div >
    );
}

export default function VendorsPage() {
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
    const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentView, setCurrentView] = useState("all");
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [vendorToDelete, setVendorToDelete] = useState<string | null>(null);
    const [isSearchVisible, setIsSearchVisible] = useState(false);
    const [isCompact, setIsCompact] = useState(false);

    useEffect(() => {
        const checkCompact = () => {
            setIsCompact(window.innerWidth < 1280);
        };

        checkCompact();
        window.addEventListener('resize', checkCompact);
        return () => window.removeEventListener('resize', checkCompact);
    }, []);

    useEffect(() => {
        fetchVendors();
    }, []);

    const fetchVendors = async () => {
        try {
            const response = await fetch('/api/vendors');
            if (response.ok) {
                const data = await response.json();
                setVendors(data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch vendors:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleVendorClick = (vendor: Vendor) => {
        setSelectedVendor(vendor);
    };

    const handleClosePanel = () => {
        setSelectedVendor(null);
    };

    const handleEditVendor = () => {
        if (selectedVendor) {
            setLocation(`/vendors/${selectedVendor.id}/edit`);
        }
    };

    const handleDeleteClick = () => {
        if (selectedVendor) {
            setVendorToDelete(selectedVendor.id);
            setDeleteDialogOpen(true);
        }
    };

    const confirmDelete = async () => {
        if (!vendorToDelete) return;
        try {
            const response = await fetch(`/api/vendors/${vendorToDelete}`, { method: 'DELETE' });
            if (response.ok) {
                toast({ title: "Vendor deleted successfully" });
                handleClosePanel();
                fetchVendors();
            }
        } catch (error) {
            toast({ title: "Failed to delete vendor", variant: "destructive" });
        } finally {
            setDeleteDialogOpen(false);
            setVendorToDelete(null);
        }
    };

    const [sortBy, setSortBy] = useState<string>("name");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
    const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
    const [columnPreferences, setColumnPreferences] = useState({
        showEmail: true,
        showPhone: true,
        showCompany: true,
        showPayables: true,
        showUnusedCredits: true,
        showStatus: true,
    });

    const filteredVendors = useMemo(() => {
        let filtered = vendors.filter(vendor =>
            (vendor.displayName || vendor.name).toLowerCase().includes(searchTerm.toLowerCase()) ||
            (vendor.email && vendor.email.toLowerCase().includes(searchTerm.toLowerCase()))
        );

        // Apply View Filters
        if (currentView === "active") {
            filtered = filtered.filter(v => v.status === "active");
        } else if (currentView === "inactive") {
            filtered = filtered.filter(v => v.status === "inactive");
        } else if (currentView === "crm") {
            filtered = filtered.filter(v => v.isCrm === true);
        } else if (currentView === "portal_enabled") {
            filtered = filtered.filter(v => v.isPortalEnabled === true);
        } else if (currentView === "portal_disabled") {
            filtered = filtered.filter(v => v.isPortalEnabled !== true);
        } else if (currentView === "duplicates") {
            const seenNames = new Map<string, string[]>();
            const seenEmails = new Map<string, string[]>();
            const duplicates = new Set<string>();

            vendors.forEach(v => {
                const name = (v.displayName || v.name).toLowerCase();
                const email = (v.email || "").toLowerCase();

                if (name) {
                    const ids = seenNames.get(name) || [];
                    ids.push(v.id);
                    seenNames.set(name, ids);
                }
                if (email) {
                    const ids = seenEmails.get(email) || [];
                    ids.push(v.id);
                    seenEmails.set(email, ids);
                }
            });

            seenNames.forEach(ids => {
                if (ids.length > 1) ids.forEach(id => duplicates.add(id));
            });
            seenEmails.forEach(ids => {
                if (ids.length > 1) ids.forEach(id => duplicates.add(id));
            });

            filtered = filtered.filter(v => duplicates.has(v.id));
        }

        return filtered.sort((a, b) => {
            let valA: any = a[sortBy as keyof Vendor] || "";
            let valB: any = b[sortBy as keyof Vendor] || "";

            if (sortBy === "createdAt") {
                valA = new Date(valA).getTime();
                valB = new Date(valB).getTime();
            }

            if (typeof valA === "string") valA = valA.toLowerCase();
            if (typeof valB === "string") valB = valB.toLowerCase();

            if (valA < valB) return sortOrder === "asc" ? -1 : 1;
            if (valA > valB) return sortOrder === "asc" ? 1 : -1;
            return 0;
        });
    }, [vendors, searchTerm, sortBy, sortOrder]);

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
        input.accept = '.json,.csv,.xlsx,.xls';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            toast({ title: "Import Started", description: `Importing ${file.name}...` });

            try {
                if (file.name.endsWith('.json')) {
                    const text = await file.text();
                    const data = JSON.parse(text);
                    const vendorsToImport = Array.isArray(data) ? data : data.vendors || [];

                    for (const vendor of vendorsToImport) {
                        await fetch('/api/vendors', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(vendor)
                        });
                    }
                    toast({ title: "Import Complete", description: `Imported ${vendorsToImport.length} vendors.` });
                    fetchVendors();
                } else if (file.name.endsWith('.csv')) {
                    const text = await file.text();
                    const lines = text.split('\n').filter(line => line.trim());
                    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

                    let importCount = 0;
                    for (let i = 1; i < lines.length; i++) {
                        const values = lines[i].split(',');
                        const vendor: Record<string, string> = {};
                        headers.forEach((header, idx) => {
                            vendor[header] = values[idx]?.trim() || '';
                        });

                        await fetch('/api/vendors', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                name: vendor.name || vendor.vendor_name,
                                email: vendor.email,
                                phone: vendor.phone,
                                companyName: vendor.company_name || vendor.companyname
                            })
                        });
                        importCount++;
                    }
                    toast({ title: "Import Complete", description: `Imported ${importCount} vendors.` });
                    fetchVendors();
                } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                    const XLSX = await import('xlsx');
                    const arrayBuffer = await file.arrayBuffer();
                    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const data = XLSX.utils.sheet_to_json(worksheet);

                    for (const row of data) {
                        const r = row as Record<string, any>;
                        await fetch('/api/vendors', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                name: r.name || r.Name || r['Vendor Name'],
                                email: r.email || r.Email,
                                phone: r.phone || r.Phone,
                                companyName: r.companyName || r['Company Name']
                            })
                        });
                    }
                    toast({ title: "Import Complete", description: `Imported ${data.length} vendors.` });
                    fetchVendors();
                }
            } catch (error) {
                console.error('Import failed:', error);
                toast({ title: "Import Failed", description: "Please check your file format.", variant: "destructive" });
            }
        };
        input.click();
    };

    const handleExport = async (format: 'json' | 'csv' | 'excel') => {
        try {
            const exportData = vendors.map(v => ({
                Name: v.name || v.displayName,
                Email: v.email || '',
                Phone: v.phone || '',
                Company: v.companyName || '',
                'Source of Supply': v.sourceOfSupply || '',
                'Opening Balance': v.openingBalance || 0,
                'Total Billed': v.totalBilled || 0,
                Payables: v.payables || 0,
                'Unused Credits': v.unusedCredits || 0,
                Status: v.status || 'Active'
            }));

            if (format === 'json') {
                const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `vendors_${new Date().toISOString().split('T')[0]}.json`;
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
                a.download = `vendors_${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
                URL.revokeObjectURL(url);
                toast({ title: "Export Complete", description: "CSV file downloaded." });
            } else if (format === 'excel') {
                const XLSX = await import('xlsx');
                const ws = XLSX.utils.json_to_sheet(exportData);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, 'Vendors');
                XLSX.writeFile(wb, `vendors_${new Date().toISOString().split('T')[0]}.xlsx`);
                toast({ title: "Export Complete", description: "Excel file downloaded." });
            }
        } catch (error) {
            console.error('Export failed:', error);
            toast({ title: "Export Failed", variant: "destructive" });
        }
    };

    const handleResetColumnWidth = () => {
        toast({
            title: "Success",
            description: "Column widths reset to default.",
        });
    };

    const { currentOrganization } = useOrganization();
    const { currentPage, totalPages, totalItems, itemsPerPage, paginatedItems, goToPage } = usePagination(filteredVendors, 10);

    const toggleSelectVendor = (id: string, e?: React.MouseEvent) => {
        if (e && e.stopPropagation) e.stopPropagation();
        if (selectedVendors.includes(id)) {
            setSelectedVendors(selectedVendors.filter(i => i !== id));
        } else {
            setSelectedVendors([...selectedVendors, id]);
        }
    }

    return (
        <div className="flex h-screen animate-in fade-in duration-300 w-full overflow-hidden bg-slate-50">
            <ResizablePanelGroup key={`${selectedVendor ? "split" : "single"}-${isCompact ? "compact" : "full"}`} direction="horizontal" className="h-full w-full">
                {(!isCompact || !selectedVendor) && (
                    <ResizablePanel
                        defaultSize={isCompact ? 100 : (selectedVendor ? 29 : 100)}
                        minSize={isCompact ? 100 : (selectedVendor ? 29 : 100)}
                        maxSize={isCompact ? 100 : (selectedVendor ? 29 : 100)}
                        className="flex flex-col overflow-hidden bg-white border-r border-slate-200 min-w-[25%]"
                    >
                        <div className="flex flex-col h-full overflow-hidden">

                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white sticky top-0 z-10 min-h-[73px] h-auto">
                                <div className="flex items-center gap-2 flex-1">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="text-xl font-semibold text-slate-900 px-2 h-auto gap-2 hover:bg-slate-50">
                                                {currentView === "all" ? "All Vendors" :
                                                    currentView === "active" ? "Active Vendors" :
                                                        currentView === "inactive" ? "Inactive Vendors" :
                                                            currentView === "crm" ? "CRM Vendors" :
                                                                currentView === "duplicates" ? "Duplicate Vendors" :
                                                                    currentView === "portal_enabled" ? "Vendor Portal Enabled" :
                                                                        "Vendor Portal Disabled"}
                                                <ChevronDown className={cn("h-5 w-5 text-blue-600 transition-transform duration-200", false ? "rotate-180" : "")} />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="start" className="w-64 p-0">
                                            <div className="py-2">
                                                {[
                                                    { id: "all", label: "All Vendors" },
                                                    { id: "active", label: "Active Vendors" },
                                                    { id: "crm", label: "CRM Vendors" },
                                                    { id: "duplicates", label: "Duplicate Vendors" },
                                                    { id: "inactive", label: "Inactive Vendors" },
                                                    { id: "portal_enabled", label: "Vendor Portal Enabled" },
                                                    { id: "portal_disabled", label: "Vendor Portal Disabled" },
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
                                    {selectedVendor ? (
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
                                                placeholder="Search vendors..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="pl-9 h-9"
                                            />
                                        </div>
                                    )}

                                    <Button
                                        onClick={() => setLocation("/vendors/new")}
                                        className={cn(
                                            "bg-[#002e46] hover:bg-[#001f2f] text-white h-9 font-display font-bold shadow-sm",
                                            selectedVendor ? 'w-9 px-0' : 'gap-2'
                                        )}
                                        size={selectedVendor ? "icon" : "default"}
                                    >
                                        <Plus className="h-4 w-4" />
                                        {!selectedVendor && "New"}
                                    </Button>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" size="icon" className="h-9 w-9">
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
                                                        <DropdownMenuItem onClick={() => handleSort("name")} className={cn(sortBy === "name" && "bg-blue-50 text-blue-700 font-medium")}>
                                                            Name {sortBy === "name" && (sortOrder === "asc" ? "↑" : "↓")}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleSort("companyName")} className={cn(sortBy === "companyName" && "bg-blue-50 text-blue-700 font-medium")}>
                                                            Company Name {sortBy === "companyName" && (sortOrder === "asc" ? "↑" : "↓")}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleSort("payables")} className={cn(sortBy === "payables" && "bg-blue-50 text-blue-700 font-medium")}>
                                                            Payables {sortBy === "payables" && (sortOrder === "asc" ? "↑" : "↓")}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleSort("unusedCredits")} className={cn(sortBy === "unusedCredits" && "bg-blue-50 text-blue-700 font-medium")}>
                                                            Unused Credits {sortBy === "unusedCredits" && (sortOrder === "asc" ? "↑" : "↓")}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleSort("createdAt")} className={cn(sortBy === "createdAt" && "bg-blue-50 text-blue-700 font-medium")}>
                                                            Created Time {sortBy === "createdAt" && (sortOrder === "asc" ? "↑" : "↓")}
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
                                                        <DropdownMenuItem onClick={handleImport}>Import Vendors</DropdownMenuItem>
                                                    </DropdownMenuSubContent>
                                                </DropdownMenuPortal>
                                            </DropdownMenuSub>
                                            <DropdownMenuSub>
                                                <DropdownMenuSubTrigger className="gap-2">
                                                    <Download className="h-4 w-4 rotate-180" />
                                                    <span>Export</span>
                                                </DropdownMenuSubTrigger>
                                                <DropdownMenuPortal>
                                                    <DropdownMenuSubContent>
                                                        <DropdownMenuItem onClick={() => handleExport('excel')}>Export as Excel (.xlsx)</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleExport('csv')}>Export as CSV</DropdownMenuItem>
                                                    </DropdownMenuSubContent>
                                                </DropdownMenuPortal>
                                            </DropdownMenuSub>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem className="gap-2" onClick={() => setIsPreferencesOpen(true)}>
                                                <Settings className="h-4 w-4" />
                                                Preferences
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>

                            {/* List */}
                            <div className="flex-1 flex flex-col min-h-0">
                                <div className="flex-1 overflow-auto scrollbar-hide">
                                    {loading ? (
                                        <div className="p-8 text-center text-slate-500">Loading vendors...</div>
                                    ) : filteredVendors.length === 0 ? (
                                        <div className="p-8 text-center text-slate-500">No vendors found.</div>
                                    ) : selectedVendor ? (
                                        <div className="divide-y divide-slate-100">
                                            {filteredVendors.map(vendor => (
                                                <div
                                                    key={vendor.id}
                                                    className={`p-4 hover:bg-slate-50 cursor-pointer ${selectedVendor.id === vendor.id ? 'bg-sidebar/5 border-l-2 border-l-sidebar' : ''}`}
                                                    onClick={() => handleVendorClick(vendor)}
                                                >
                                                    <div className="font-medium text-slate-900">{vendor.displayName || vendor.name}</div>
                                                    <div className="text-sm text-slate-500">{vendor.companyName}</div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <table className="w-full text-sm">
                                            <thead className="bg-sidebar/5 sticky top-0 z-10">
                                                <tr className="border-b border-slate-200">
                                                    <th className="w-10 px-3 py-3 text-left">
                                                        <Checkbox />
                                                    </th>
                                                    <th className="px-3 py-3 text-left text-[11px] font-bold text-sidebar/70 uppercase tracking-wider font-display">Name</th>
                                                    <th className="px-3 py-3 text-left text-[11px] font-bold text-sidebar/70 uppercase tracking-wider font-display">Company</th>
                                                    <th className="px-3 py-3 text-left text-[11px] font-bold text-sidebar/70 uppercase tracking-wider font-display">Email</th>
                                                    <th className="px-3 py-3 text-left text-[11px] font-bold text-sidebar/70 uppercase tracking-wider font-display">Phone</th>
                                                    <th className="px-3 py-3 text-right text-[11px] font-bold text-sidebar/70 uppercase tracking-wider font-display">Opening Balance</th>
                                                    <th className="px-3 py-3 text-right text-[11px] font-bold text-sidebar/70 uppercase tracking-wider font-display">Total Billed</th>
                                                    <th className="px-3 py-3 text-right text-[11px] font-bold text-sidebar/70 uppercase tracking-wider font-display">Payables</th>
                                                    <th className="px-3 py-3 text-right text-[11px] font-bold text-sidebar/70 uppercase tracking-wider font-display">Unused Credits</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {paginatedItems.map(vendor => (
                                                    <tr
                                                        key={vendor.id}
                                                        className="hover:bg-slate-50 cursor-pointer"
                                                        onClick={() => handleVendorClick(vendor)}
                                                    >
                                                        <td className="px-3 py-3"><Checkbox onClick={e => toggleSelectVendor(vendor.id, e)} /></td>
                                                        <td className="px-3 py-3 font-medium text-sidebar">{vendor.displayName || vendor.name}</td>
                                                        <td className="px-3 py-3 text-slate-600">{vendor.companyName || '-'}</td>
                                                        <td className="px-3 py-3 text-slate-600">{vendor.email || '-'}</td>
                                                        <td className="px-3 py-3 text-slate-600">{vendor.mobile || vendor.workPhone || vendor.phone || '-'}</td>
                                                        <td className="px-3 py-3 text-right font-medium">{formatCurrency(vendor.openingBalance || 0)}</td>
                                                        <td className="px-3 py-3 text-right font-medium">{formatCurrency(vendor.totalBilled || 0)}</td>
                                                        <td className="px-3 py-3 text-right font-medium">{formatCurrency(vendor.payables || 0)}</td>
                                                        <td className="px-3 py-3 text-right font-medium text-green-600">{formatCurrency(vendor.unusedCredits || 0)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
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
                        </div>
                    </ResizablePanel>
                )}

                {selectedVendor && (
                    <>
                        {!isCompact && (
                            <ResizableHandle withHandle className="w-1 bg-slate-200 hover:bg-blue-400 hover:w-1.5 transition-all cursor-col-resize" />
                        )}
                        <ResizablePanel defaultSize={isCompact ? 100 : 71} minSize={isCompact ? 100 : 30} className="bg-white">
                            <VendorDetailPanel
                                vendor={selectedVendor}
                                onClose={handleClosePanel}
                                onEdit={handleEditVendor}
                                onDelete={handleDeleteClick}
                            />
                        </ResizablePanel>
                    </>
                )}
            </ResizablePanelGroup>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Vendor</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this vendor? This action cannot be undone.
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

            <Dialog open={isPreferencesOpen} onOpenChange={setIsPreferencesOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Preferences</DialogTitle>
                        <DialogDescription>
                            Configure how your vendor list is displayed.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="show-email">Show Email Column</Label>
                            <Switch
                                id="show-email"
                                checked={columnPreferences.showEmail}
                                onCheckedChange={(checked) =>
                                    setColumnPreferences((prev) => ({ ...prev, showEmail: checked }))
                                }
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="show-phone">Show Phone Column</Label>
                            <Switch
                                id="show-phone"
                                checked={columnPreferences.showPhone}
                                onCheckedChange={(checked) =>
                                    setColumnPreferences((prev) => ({ ...prev, showPhone: checked }))
                                }
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="show-company">Show Company Column</Label>
                            <Switch
                                id="show-company"
                                checked={columnPreferences.showCompany}
                                onCheckedChange={(checked) =>
                                    setColumnPreferences((prev) => ({ ...prev, showCompany: checked }))
                                }
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="show-payables">Show Payables Column</Label>
                            <Switch
                                id="show-payables"
                                checked={columnPreferences.showPayables}
                                onCheckedChange={(checked) =>
                                    setColumnPreferences((prev) => ({ ...prev, showPayables: checked }))
                                }
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="show-unused-credits">Show Unused Credits Column</Label>
                            <Switch
                                id="show-unused-credits"
                                checked={columnPreferences.showUnusedCredits}
                                onCheckedChange={(checked) =>
                                    setColumnPreferences((prev) => ({ ...prev, showUnusedCredits: checked }))
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
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setColumnPreferences({
                                    showEmail: true,
                                    showPhone: true,
                                    showCompany: true,
                                    showPayables: true,
                                    showUnusedCredits: true,
                                    showStatus: true,
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
        </div>
    );
}
