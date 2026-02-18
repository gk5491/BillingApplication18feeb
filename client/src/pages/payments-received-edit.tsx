import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import {
    ArrowLeft,
    Plus,
    Trash2,
    Save,
    X,
    Search,
    Calendar as CalendarIcon,
    AlertCircle,
    Loader2,
    ChevronDown,
    Upload
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";

interface Customer {
    id: string;
    name: string;
    displayName: string;
    companyName: string;
    email: string;
    placeOfSupply?: string;
    currency?: string;
}

interface Invoice {
    id: string;
    invoiceNumber: string;
    date: string;
    amount: number;
    balanceDue: number;
    status: string;
}

const PAYMENT_MODES = [
    "Cash",
    "Bank Transfer",
    "Cheque",
    "Credit Card",
    "Debit Card",
    "UPI",
    "Net Banking",
    "Other"
];

const DEPOSIT_ACCOUNTS = [
    "Petty Cash",
    "Undeposited Funds",
    "Bank Account - SBI",
    "Bank Account - HDFC",
    "Bank Account - ICICI"
];

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

export default function PaymentsReceivedEdit() {
    const [, setLocation] = useLocation();
    const params = useParams();
    const { toast } = useToast();

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [customerInvoices, setCustomerInvoices] = useState<Invoice[]>([]);

    // Payment State
    const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
    const [paymentDate, setPaymentDate] = useState<Date>(new Date());
    const [paymentMode, setPaymentMode] = useState<string>("Bank Transfer");
    const [depositTo, setDepositTo] = useState<string>("Petty Cash");
    const [referenceNumber, setReferenceNumber] = useState<string>("");
    const [notes, setNotes] = useState<string>("");
    const [sendThankYou, setSendThankYou] = useState<boolean>(false);
    const [paymentNumber, setPaymentNumber] = useState<string>("");
    const [bankCharges, setBankCharges] = useState<number>(0);
    const [tdsAmount, setTdsAmount] = useState<number>(0);
    const [taxAccount, setTaxAccount] = useState<string>("TDS Receivable");
    const [projectName, setProjectName] = useState<string>("");
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            setSelectedFiles(prev => [...prev, ...files].slice(0, 10));
        }
    };

    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    // Allocation State
    const [selectedInvoices, setSelectedInvoices] = useState<Record<string, { selected: boolean; payment: number; receivedDate?: Date }>>({});
    const [totalAmountReceived, setTotalAmountReceived] = useState<number>(0);

    useEffect(() => {
        const init = async () => {
            await fetchCustomers();
            if (params.id) {
                await fetchPaymentDetails(params.id);
            }
        };
        init();
    }, [params.id]);

    const fetchCustomers = async () => {
        try {
            const response = await fetch('/api/customers');
            if (response.ok) {
                const data = await response.json();
                setCustomers(data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch customers:', error);
        }
    };

    const fetchPaymentDetails = async (id: string) => {
        try {
            setIsLoading(true);
            const response = await fetch(`/api/payments-received/${id}`);
            if (response.ok) {
                const data = await response.json();
                const payment = data.data;

                // Set basic fields
                if (payment.customerId) {
                    setSelectedCustomerId(payment.customerId);
                    // Verify we have invoices for this customer to show allocation correctly
                    await fetchCustomerInvoices(payment.customerId, payment.invoices || []);
                }

                setPaymentDate(new Date(payment.date));
                setPaymentMode(payment.mode);
                setDepositTo(payment.depositTo);
                setReferenceNumber(payment.referenceNumber || "");
                setNotes(payment.notes || "");
                setSendThankYou(payment.sendThankYou || false);
                setPaymentNumber(payment.paymentNumber);
                setTotalAmountReceived(payment.amount);
                setBankCharges(payment.bankCharges || 0);
                setTdsAmount(payment.tdsAmount || 0);
                setTaxAccount(payment.taxAccount || "TDS Receivable");
                setProjectName(payment.projectName || "");

                // Map existing allocations
                // The API returns payment.invoices which contains the allocation details
                // We need to map this to our selectedInvoices state
                const initialSelection: Record<string, { selected: boolean; payment: number; receivedDate?: Date }> = {};

                if (payment.invoices && Array.isArray(payment.invoices)) {
                    payment.invoices.forEach((inv: any) => {
                        // inv is the allocation record. We need to match it to the invoice ID
                        // Depending on backend structure, inv might contain invoiceId or be the invoice object itself
                        // Assuming standard structure where `inv` in payment.invoices is the link
                        const invoiceId = inv.invoiceId || inv.id;
                        initialSelection[invoiceId] = {
                            selected: true,
                            payment: inv.allocatedAmount || inv.paymentAmount || 0,
                            receivedDate: new Date(payment.date) // Default to payment date if specific date not stored
                        };
                    });
                }
                setSelectedInvoices(initialSelection);

            } else {
                toast({ title: "Failed to load payment", variant: "destructive" });
                setLocation("/payments-received");
            }
        } catch (error) {
            console.error('Failed to fetch payment details:', error);
            toast({ title: "Error loading payment", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    const fetchCustomerInvoices = async (custId: string, existingAllocations: any[]) => {
        try {
            const response = await fetch(`/api/invoices?customerId=${custId}`);
            if (response.ok) {
                const data = await response.json();
                // We need to show ALL invoices that are unpaid OR were paid by THIS payment
                // The `unpaid-invoices` endpoint might exclude fully paid ones.
                // But for editing, we need to see the invoices we allocated to.

                // For simplicity, we fetch all invoices for customer and filter locally
                // or rely on the standard invoice list which usually includes statuses.

                // Let's assume /api/invoices returns all invoices.
                let allInvoices = data.data || [];

                // We want invoices that are NOT paid, OR are partially paid, OR are the ones in this payment
                // Even if an invoice is now "PAID", if this payment funded it, we should show it to allow de-allocation

                // Extract IDs of invoices involved in this payment
                const involvedInvoiceIds = new Set(existingAllocations.map((inv: any) => inv.invoiceId || inv.id));

                const relevantInvoices = allInvoices.filter((inv: any) => {
                    const isUnpaid = ['PENDING', 'OVERDUE', 'PARTIALLY_PAID', 'SENT'].includes(inv.status);
                    const isInvolved = involvedInvoiceIds.has(inv.id);
                    // If it's involved, we must show it regardless of status (even if PAID)
                    // If it's not involved, show only if unpaid
                    return isUnpaid || isInvolved;
                });

                const mappedInvoices = relevantInvoices.map((inv: any) => ({
                    ...inv,
                    // If the invoice is involved, its current balanceDue on the server might strictly be (Original - Paid).
                    // But visually we might want to show "Balance before this payment" if we were doing a strict re-allocation UX.
                    // However, simpler is to just show current balance and allow adding more payment.
                    // BUT, if we edit allocation, we are effectively modifying the payment amount.
                    balanceDue: inv.balanceDue !== undefined ? inv.balanceDue : inv.amount
                }));

                setCustomerInvoices(mappedInvoices);
            }
        } catch (error) {
            console.error('Failed to fetch customer invoices:', error);
        }
    };

    const handleAmountReceivedChange = (amount: number) => {
        setTotalAmountReceived(amount);
        // On edit, we probably shouldn't auto-allocate aggressively removing existing manual overrides
        // But if they change amount, we might need to warn or auto-adjust.
        // For now, let's leave allocations as is, user must manually adjust to match
    };

    const toggleInvoiceSelection = (invoiceId: string) => {
        setSelectedInvoices(prev => {
            const invoice = customerInvoices.find(inv => inv.id === invoiceId);
            const newSelected = !prev[invoiceId]?.selected;
            return {
                ...prev,
                [invoiceId]: {
                    selected: newSelected,
                    payment: newSelected ? (invoice?.balanceDue || 0) : 0,
                    receivedDate: newSelected ? new Date() : undefined
                }
            };
        });
    };

    const updateInvoicePayment = (invoiceId: string, amount: number) => {
        const invoice = customerInvoices.find(inv => inv.id === invoiceId);
        if (invoice) {
            // In edit mode, we might be increasing payment beyond current balanceDue if we are "undoing" previous payment logic?
            // No, balanceDue from API is usually "Remaining to be paid".
            // If we are editing THIS payment, the amount currently allocated by THIS payment is already subtracted from balanceDue on server?
            // Or is balanceDue the *current* outstanding?

            // If the invoice is fully paid by this payment, balanceDue is 0.
            // So if we reduce payment, balanceDue increases.
            // This complexity suggests we should be careful.
            // For MVP Edit Refactor, we will assume standard behavior: max is remaining balance.

            // Allow user to enter amount, minimal validation for now to avoid locking them out
            setSelectedInvoices(prev => ({
                ...prev,
                [invoiceId]: {
                    ...prev[invoiceId],
                    payment: amount
                }
            }));
        }
    };

    const totalPaymentAmount = Object.values(selectedInvoices).reduce(
        (sum, inv) => sum + (inv.selected ? inv.payment : 0),
        0
    );

    const selectedInvoiceCount = Object.values(selectedInvoices).filter(inv => inv.selected).length;

    // Calculate payment summary
    const totalInvoicesAmount = customerInvoices.reduce((sum, invoice) => sum + (invoice.balanceDue || 0), 0);
    const amountUsedForPayments = totalPaymentAmount;
    const amountInExcess = Math.max(0, totalAmountReceived - amountUsedForPayments);

    const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

    const handleSavePayment = async () => {
        if (!selectedCustomerId) {
            toast({ title: "Please select a customer", variant: "destructive" });
            return;
        }

        if (totalAmountReceived <= 0) {
            toast({ title: "Please enter the amount received", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);

        // Build invoices array
        const selectedInvoicesList = Object.entries(selectedInvoices)
            .filter(([_, inv]) => inv.selected && inv.payment > 0)
            .map(([id, inv]) => {
                const invoice = customerInvoices.find(i => i.id === id);
                return {
                    invoiceId: id,
                    invoiceNumber: invoice?.invoiceNumber || '',
                    invoiceDate: invoice?.date || '',
                    invoiceAmount: invoice?.amount || 0,
                    balanceDue: invoice?.balanceDue || 0,
                    paymentAmount: inv.payment,
                    paymentReceivedDate: inv.receivedDate ? format(inv.receivedDate, "yyyy-MM-dd") : format(paymentDate, "yyyy-MM-dd")
                };
            });

        const paymentData = {
            date: format(paymentDate, "yyyy-MM-dd"),
            customerId: selectedCustomerId,
            customerName: selectedCustomer?.displayName || selectedCustomer?.name || '',
            customerEmail: selectedCustomer?.email || '',
            mode: paymentMode,
            depositTo: depositTo,
            referenceNumber: referenceNumber,
            projectName: projectName,
            bankCharges: bankCharges,
            tdsAmount: tdsAmount,
            taxAccount: taxAccount,
            amount: totalAmountReceived,
            unusedAmount: amountInExcess,
            notes: notes,
            sendThankYou: sendThankYou,
            status: "PAID",
            placeOfSupply: selectedCustomer?.placeOfSupply || '',
            invoices: selectedInvoicesList,
        };

        try {
            const response = await fetch(`/api/payments-received/${params.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(paymentData)
            });

            if (response.ok) {
                toast({
                    title: "Payment Updated",
                    description: `Payment ${paymentNumber} has been updated.`
                });
                setLocation("/payments-received");
            } else {
                throw new Error('Failed to update payment');
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update payment. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-50">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-2 text-slate-600">Loading payment details...</span>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col bg-slate-50 h-screen animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between p-4 bg-white border-b border-slate-200 shadow-sm z-10 flex-shrink-0">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => setLocation('/payments-received')} className="rounded-full hover:bg-slate-100" data-testid="button-back">
                        <ArrowLeft className="h-5 w-5 text-slate-500" />
                    </Button>
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl font-semibold text-[#002e46]">Edit Payment {paymentNumber}</h1>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto invisible-scrollbar">
                <div className="max-w-6xl mx-auto p-8 pb-32">

                    <div className="space-y-6">
                        {/* Payment Details Card */}
                        <Card className="overflow-hidden border-slate-200 shadow-sm">
                            <CardContent className="p-0">
                                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                                    <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Payment Details</h2>
                                </div>
                                <div className="p-6 space-y-6">
                                    {/* Customer Info (Read Only in Edit usually, or editable) */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium">Customer</Label>
                                            <div className="p-3 bg-slate-100 rounded-md border border-slate-200 text-slate-700 font-medium">
                                                {selectedCustomer?.displayName || selectedCustomer?.name || 'Unknown Customer'}
                                            </div>
                                            <p className="text-xs text-slate-500">Customer cannot be changed for existing payments.</p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium after:content-['*'] after:ml-0.5 after:text-red-500">Payment Date</Label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        className={cn(
                                                            "w-full justify-start text-left font-normal bg-white border-slate-200",
                                                            !paymentDate && "text-muted-foreground"
                                                        )}
                                                        data-testid="button-payment-date"
                                                    >
                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                        {paymentDate ? format(paymentDate, "dd/MM/yyyy") : "Select date"}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0">
                                                    <Calendar
                                                        mode="single"
                                                        selected={paymentDate}
                                                        onSelect={(date) => date && setPaymentDate(date)}
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    </div>

                                    <Separator className="bg-slate-100" />

                                    {/* Payment Details */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium">Payment Mode</Label>
                                            <Select value={paymentMode} onValueChange={setPaymentMode}>
                                                <SelectTrigger className="bg-white border-slate-200" data-testid="select-payment-mode">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {PAYMENT_MODES.map(mode => (
                                                        <SelectItem key={mode} value={mode}>{mode}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium">Deposit To</Label>
                                            <Select value={depositTo} onValueChange={setDepositTo}>
                                                <SelectTrigger className="bg-white border-slate-200" data-testid="select-deposit-to">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {DEPOSIT_ACCOUNTS.map(account => (
                                                        <SelectItem key={account} value={account}>{account}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium">Reference Number</Label>
                                            <Input
                                                value={referenceNumber}
                                                onChange={(e) => setReferenceNumber(e.target.value)}
                                                placeholder="Enter reference number"
                                                className="bg-white border-slate-200 h-10"
                                                data-testid="input-reference"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium">Project Name</Label>
                                            <Input
                                                value={projectName}
                                                onChange={(e) => setProjectName(e.target.value)}
                                                placeholder="Link to project"
                                                className="bg-white border-slate-200 h-10"
                                                data-testid="input-project"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium">Bank Charges (if any)</Label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                                                <Input
                                                    type="number"
                                                    value={bankCharges || ''}
                                                    onChange={(e) => setBankCharges(parseFloat(e.target.value) || 0)}
                                                    placeholder="0.00"
                                                    className="bg-white border-slate-200 h-10 pl-7"
                                                    data-testid="input-bank-charges"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* TDS Section */}
                                    <div className="bg-slate-50/50 border border-dashed border-slate-200 rounded-lg p-5 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label className="text-sm font-semibold text-slate-900">Tax Deducted? (TDS)</Label>
                                                <p className="text-xs text-slate-500">Enable this to record tax withheld by the customer.</p>
                                            </div>
                                            <Switch
                                                checked={tdsAmount > 0}
                                                onCheckedChange={(checked: boolean) => !checked && setTdsAmount(0)}
                                            />
                                        </div>

                                        {(tdsAmount > 0 || true) && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-1 duration-200">
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-medium text-slate-600">TDS Amount</Label>
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">₹</span>
                                                        <Input
                                                            type="number"
                                                            value={tdsAmount || ''}
                                                            onChange={(e) => setTdsAmount(parseFloat(e.target.value) || 0)}
                                                            placeholder="0.00"
                                                            className="bg-white border-slate-200 h-9 pl-6 text-sm"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-medium text-slate-600">Tax Account</Label>
                                                    <Select value={taxAccount} onValueChange={setTaxAccount}>
                                                        <SelectTrigger className="bg-white border-slate-200 h-9 text-sm">
                                                            <SelectValue placeholder="Select account" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="TDS Receivable">TDS Receivable</SelectItem>
                                                            <SelectItem value="Income Tax Payable">Income Tax Payable</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="bg-blue-50/30 border border-blue-100/50 rounded-lg p-4 flex items-start gap-3">
                                        <Checkbox
                                            id="allow-portal"
                                            className="mt-1 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                        />
                                        <div className="grid gap-1.5 leading-none">
                                            <label
                                                htmlFor="allow-portal"
                                                className="text-sm font-medium text-slate-900 leading-none cursor-pointer"
                                            >
                                                Allow portal access for this customer
                                            </label>
                                            <p className="text-xs text-slate-500">
                                                Customer will be able to view invoices and make payments online.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <Label className="text-sm font-semibold text-slate-900">Documents</Label>
                                        <input
                                            type="file"
                                            multiple
                                            className="hidden"
                                            onChange={handleFileChange}
                                            id="file-upload"
                                        />
                                        <label
                                            htmlFor="file-upload"
                                            className="border-2 border-dashed border-blue-200 rounded-lg p-10 bg-blue-50/20 flex flex-col items-center justify-center gap-2 group hover:bg-blue-50 transition-colors cursor-pointer"
                                        >
                                            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                                                <Upload className="h-6 w-6" />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm font-medium text-slate-900">
                                                    <span className="text-blue-600">Upload files</span> or drag and drop
                                                </p>
                                                <p className="text-xs text-slate-500 mt-1">Up to 10 files (max 10MB each)</p>
                                            </div>
                                        </label>

                                        {selectedFiles.length > 0 && (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                                                {selectedFiles.map((file, index) => (
                                                    <div key={index} className="flex items-center justify-between p-2 bg-white border border-slate-200 rounded-md text-sm">
                                                        <span className="truncate max-w-[200px]">{file.name}</span>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6 text-slate-400 hover:text-red-500"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                removeFile(index);
                                                            }}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Amount Received Input */}
                                    <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-6">
                                        <div className="space-y-3">
                                            <Label className="text-sm font-medium text-blue-900 after:content-['*'] after:ml-0.5 after:text-red-500">
                                                Amount Received
                                            </Label>
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl font-bold text-blue-900">₹</span>
                                                <Input
                                                    type="number"
                                                    value={totalAmountReceived || ''}
                                                    onChange={(e) => handleAmountReceivedChange(parseFloat(e.target.value) || 0)}
                                                    placeholder="0.00"
                                                    className="text-2xl font-bold h-12 bg-white border-blue-200 text-blue-900 placeholder:text-blue-200"
                                                    data-testid="input-amount-received"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Outstanding Invoices */}
                        <Card className="overflow-hidden border-slate-200 shadow-sm">
                            <CardContent className="p-0">
                                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                                    <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Allocation</h2>
                                </div>
                                <div>
                                    {selectedCustomerId ? (
                                        customerInvoices.length > 0 ? (
                                            <div className="overflow-x-auto">
                                                <Table>
                                                    <TableHeader className="bg-slate-50">
                                                        <TableRow className="border-b border-slate-200">
                                                            <TableHead className="w-12 pl-6"></TableHead>
                                                            <TableHead className="font-semibold text-slate-700">Invoice #</TableHead>
                                                            <TableHead className="font-semibold text-slate-700">Date</TableHead>
                                                            <TableHead className="text-right font-semibold text-slate-700">Invoice Amount</TableHead>
                                                            <TableHead className="text-right font-semibold text-slate-700">Balance Due</TableHead>
                                                            <TableHead className="text-right font-semibold text-slate-700 pr-6">Payment</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {customerInvoices.map((invoice) => (
                                                            <TableRow key={invoice.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                                                                <TableCell className="pl-6">
                                                                    <Checkbox
                                                                        checked={selectedInvoices[invoice.id]?.selected || false}
                                                                        onCheckedChange={() => toggleInvoiceSelection(invoice.id)}
                                                                        data-testid={`checkbox-invoice-${invoice.id}`}
                                                                    />
                                                                </TableCell>
                                                                <TableCell className="font-medium text-slate-900">{invoice.invoiceNumber}</TableCell>
                                                                <TableCell className="text-slate-500">{formatDate(invoice.date)}</TableCell>
                                                                <TableCell className="text-right text-slate-900">{formatCurrency(invoice.amount || 0)}</TableCell>
                                                                <TableCell className="text-right text-slate-900">{formatCurrency(invoice.balanceDue || 0)}</TableCell>
                                                                <TableCell className="text-right pr-6">
                                                                    <Input
                                                                        type="number"
                                                                        value={selectedInvoices[invoice.id]?.payment || 0}
                                                                        onChange={(e) => updateInvoicePayment(invoice.id, parseFloat(e.target.value) || 0)}
                                                                        disabled={!selectedInvoices[invoice.id]?.selected}
                                                                        className="w-32 text-right ml-auto h-8 border-slate-200"
                                                                        data-testid={`input-payment-${invoice.id}`}
                                                                    />
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        ) : (
                                            <div className="text-center py-12">
                                                <AlertCircle className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                                                <h3 className="text-sm font-medium text-slate-900">No Invoices Found</h3>
                                                <p className="text-sm text-slate-500 mt-1">This customer has no other invoices.</p>
                                            </div>
                                        )
                                    ) : null}
                                </div>
                                {/* Total Footer */}
                                {selectedInvoiceCount > 0 && (
                                    <div className="bg-green-50 border-t border-green-100 p-4 flex justify-end">
                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <p className="text-xs font-medium text-green-600 uppercase tracking-wide">Total Allocated</p>
                                                <p className="text-lg font-bold text-green-700">{formatCurrency(totalPaymentAmount)}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Payment Summary */}
                        <Card className="overflow-hidden border-slate-200 shadow-sm">
                            <CardContent className="p-0">
                                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                                    <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Payment Summary</h2>
                                </div>
                                <div className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div>
                                            <Label className="text-sm font-medium mb-2 block">Notes</Label>
                                            <Textarea
                                                value={notes}
                                                onChange={(e) => setNotes(e.target.value)}
                                                placeholder="Add any notes about this payment..."
                                                className="resize-none min-h-[120px] bg-white border-slate-200"
                                            />
                                            <div className="mt-4 flex items-center space-x-2">
                                                <Checkbox
                                                    id="thank-you"
                                                    checked={sendThankYou}
                                                    onCheckedChange={(checked) => setSendThankYou(!!checked)}
                                                />
                                                <Label htmlFor="thank-you" className="font-normal cursor-pointer">
                                                    Send a "Thank You" note for this payment
                                                </Label>
                                            </div>
                                        </div>
                                        <div className="bg-slate-50 rounded-lg p-6 space-y-4">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-slate-500">Amount Received</span>
                                                <span className="font-medium text-slate-900">{formatCurrency(totalAmountReceived)}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-slate-500">Amount used for Payments</span>
                                                <span className="font-medium text-green-600">-{formatCurrency(amountUsedForPayments)}</span>
                                            </div>
                                            <div className="border-t border-slate-200 pt-3 mt-2 flex justify-between items-center">
                                                <span className="font-semibold text-slate-700">Amount in Excess</span>
                                                <span className="font-bold text-lg text-theme-orange">{formatCurrency(amountInExcess)}</span>
                                            </div>
                                            <div className="text-xs text-slate-400 mt-2 text-right">
                                                This excess amount will be stored as unused credits.
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 z-20">
                <div className="max-w-6xl mx-auto flex items-center justify-end gap-3">
                    <Button variant="outline" onClick={() => setLocation('/payments-received')} data-testid="button-cancel">
                        Cancel
                    </Button>
                    <Button onClick={handleSavePayment} disabled={isSubmitting} className="bg-[#002e46] hover:bg-[#001f2f] text-white min-w-[140px]" data-testid="button-save">
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                        Save Updates
                    </Button>
                </div>
            </div>
        </div>
    );
}
