import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  ChevronDown,
  Plus,
  Trash2,
  Save,
  X,
  Search,
  Calendar as CalendarIcon,
  AlertCircle,
  ArrowLeft,
  Loader2,
  Upload
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTransactionBootstrap } from "@/hooks/use-transaction-bootstrap";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";

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

interface PurchasedItem {
  id: string;
  itemId: string;
  name: string;
  description: string;
  unit: string;
  lastRate: number;
  totalQuantity: number;
  lastPurchaseDate: string;
  totalAmount: number;
  purchaseCount: number;
  tax: number;
  taxName: string;
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

export default function PaymentsReceivedCreate() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Use transaction bootstrap hook
  const {
    customerId,
    setCustomerId,
    customerSnapshot,
    taxRegime,
    isLoadingCustomer,
    customerError,
    formData,
    onCustomerChange
  } = useTransactionBootstrap({ transactionType: 'payment' });

  // Form state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerInvoices, setCustomerInvoices] = useState<Invoice[]>([]);
  const [customerPurchasedItems, setCustomerPurchasedItems] = useState<PurchasedItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [paymentDate, setPaymentDate] = useState<Date>(new Date());
  const [paymentMode, setPaymentMode] = useState<string>("Bank Transfer");
  const [depositTo, setDepositTo] = useState<string>("Petty Cash");
  const [referenceNumber, setReferenceNumber] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [sendThankYou, setSendThankYou] = useState<boolean>(false);
  const [selectedInvoices, setSelectedInvoices] = useState<Record<string, { selected: boolean; payment: number; receivedDate?: Date }>>({});
  const [totalAmountReceived, setTotalAmountReceived] = useState<number>(0);
  const [bankCharges, setBankCharges] = useState<number>(0);
  const [tdsAmount, setTdsAmount] = useState<number>(0);
  const [taxAccount, setTaxAccount] = useState<string>("TDS Receivable");
  const [projectName, setProjectName] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = { current: null as HTMLInputElement | null };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...files].slice(0, 10));
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Sync with bootstrap
  useEffect(() => {
    if (customerId) {
      setSelectedCustomerId(customerId);
      // Also update reference to trigger fetch
      if (customers.find(c => c.id === customerId)) {
        // ensure customer is in list, though fetchCustomers normally handles it.
      }
    }
  }, [customerId, customers]);

  // Fetch customers
  useEffect(() => {
    fetchCustomers();
  }, []);

  // Fetch invoices and purchased items when customer changes
  useEffect(() => {
    if (selectedCustomerId) {
      fetchCustomerInvoices(selectedCustomerId);
      fetchCustomerPurchasedItems(selectedCustomerId);
    } else {
      setCustomerInvoices([]);
      setCustomerPurchasedItems([]);
      setSelectedInvoices({});
    }
  }, [selectedCustomerId]);

  // Re-apply auto-allocation when customer invoices are loaded
  useEffect(() => {
    if (customerInvoices.length > 0 && totalAmountReceived > 0) {
      autoAllocatePayment(totalAmountReceived);
    }
  }, [customerInvoices]);

  const fetchCustomers = async () => {
    try {
      setCustomersLoading(true);
      const response = await fetch('/api/customers');
      if (response.ok) {
        const data = await response.json();
        setCustomers(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    } finally {
      setCustomersLoading(false);
    }
  };

  const fetchCustomerInvoices = async (custId: string) => {
    try {
      const response = await fetch(`/api/invoices?customerId=${custId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Raw invoices from API:', data.data);

        // Filter for unpaid invoices (PENDING, OVERDUE, PARTIALLY_PAID, or SENT)
        // Use balanceDue if available, otherwise use amount for new invoices
        const unpaidInvoices = (data.data || []).filter((inv: any) => {
          const balance = inv.balanceDue !== undefined ? inv.balanceDue : inv.amount;
          const isUnpaid = balance > 0 && ['PENDING', 'OVERDUE', 'PARTIALLY_PAID', 'SENT'].includes(inv.status);
          console.log(`Invoice ${inv.invoiceNumber}: balanceDue=${inv.balanceDue}, amount=${inv.amount}, status=${inv.status}, isUnpaid=${isUnpaid}`);
          return isUnpaid;
        }).map((inv: any) => ({
          ...inv,
          // Ensure balanceDue is set properly
          balanceDue: inv.balanceDue !== undefined && inv.balanceDue > 0 ? inv.balanceDue : inv.amount
        }));

        console.log('Filtered unpaid invoices:', unpaidInvoices);
        setCustomerInvoices(unpaidInvoices);

        // Initialize selection state
        const initialSelection: Record<string, { selected: boolean; payment: number; receivedDate?: Date }> = {};
        unpaidInvoices.forEach((inv: Invoice) => {
          // Keep existing selection if any
          if (selectedInvoices[inv.id]) {
            initialSelection[inv.id] = selectedInvoices[inv.id];
          } else {
            initialSelection[inv.id] = { selected: false, payment: 0, receivedDate: undefined };
          }
        });
        setSelectedInvoices(initialSelection);
      }
    } catch (error) {
      console.error('Failed to fetch customer invoices:', error);
    }
  };

  const fetchCustomerPurchasedItems = async (custId: string) => {
    try {
      const response = await fetch(`/api/customers/${custId}/purchased-items`);
      if (response.ok) {
        const data = await response.json();
        setCustomerPurchasedItems(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch customer purchased items:', error);
    }
  };

  const handleCustomerChange = (value: string) => {
    if (value === "add_new") {
      setLocation("/customers/new?returnTo=payments-received-create");
      return;
    }
    setSelectedCustomerId(value);
    onCustomerChange(value);
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
      const validAmount = Math.min(Math.max(0, amount), invoice.balanceDue);
      setSelectedInvoices(prev => ({
        ...prev,
        [invoiceId]: {
          ...prev[invoiceId],
          payment: validAmount
        }
      }));
    }
  };

  const updateInvoiceReceivedDate = (invoiceId: string, date: Date) => {
    setSelectedInvoices(prev => ({
      ...prev,
      [invoiceId]: {
        ...prev[invoiceId],
        receivedDate: date
      }
    }));
  };

  // Auto-allocation function
  const autoAllocatePayment = (totalAmount: number) => {
    if (customerInvoices.length === 0) {
      return; // No invoices to allocate to
    }

    if (totalAmount <= 0) {
      // Clear all selections if amount is 0 or negative
      const cleared: Record<string, { selected: boolean; payment: number; receivedDate?: Date }> = {};
      customerInvoices.forEach(invoice => {
        cleared[invoice.id] = {
          selected: false,
          payment: 0,
          receivedDate: undefined
        };
      });
      setSelectedInvoices(cleared);
      return;
    }

    // Sort invoices by date (oldest first) for allocation priority
    const sortedInvoices = [...customerInvoices].sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    let remainingAmount = totalAmount;
    const newSelectedInvoices: Record<string, { selected: boolean; payment: number; receivedDate?: Date }> = {};

    // Initialize all invoices first
    customerInvoices.forEach(invoice => {
      newSelectedInvoices[invoice.id] = {
        selected: false,
        payment: 0,
        receivedDate: undefined
      };
    });

    // Allocate amount across invoices (oldest first)
    for (const invoice of sortedInvoices) {
      if (remainingAmount <= 0) break;

      // Use balanceDue if available, otherwise use amount
      const invoiceBalance = invoice.balanceDue > 0 ? invoice.balanceDue : invoice.amount;
      console.log(`Allocating to invoice ${invoice.invoiceNumber}: balance=${invoiceBalance}, remaining=${remainingAmount}`);

      if (invoiceBalance > 0) {
        const paymentAmount = Math.min(remainingAmount, invoiceBalance);

        newSelectedInvoices[invoice.id] = {
          selected: true,
          payment: paymentAmount,
          receivedDate: new Date() // Default to today
        };

        remainingAmount -= paymentAmount;
        console.log(`Allocated ${paymentAmount} to ${invoice.invoiceNumber}, remaining: ${remainingAmount}`);
      }
    }

    setSelectedInvoices(newSelectedInvoices);
  };

  // Handle amount received change
  const handleAmountReceivedChange = (amount: number) => {
    setTotalAmountReceived(amount);
    autoAllocatePayment(amount);
  };

  const totalPaymentAmount = Object.values(selectedInvoices).reduce(
    (sum, inv) => sum + (inv.selected ? inv.payment : 0),
    0
  );

  const selectedInvoiceCount = Object.values(selectedInvoices).filter(inv => inv.selected).length;

  // Calculate payment summary
  const totalInvoicesAmount = customerInvoices.reduce((sum, invoice) => sum + (invoice.balanceDue || 0), 0);
  const amountReceived = totalAmountReceived;
  const amountUsedForPayments = totalPaymentAmount;
  const amountRefunded = 0; // This would be calculated from refunds
  const amountInExcess = Math.max(0, amountReceived - amountUsedForPayments);

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

    // Build invoices array from selected invoices
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

    console.log('Selected Invoices State:', selectedInvoices);
    console.log('Customer Invoices:', customerInvoices);
    console.log('Invoices to save:', selectedInvoicesList);

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
      unusedAmount: Math.max(0, totalAmountReceived - totalPaymentAmount),
      notes: notes,
      sendThankYou: sendThankYou,
      status: "PAID",
      placeOfSupply: customerSnapshot?.placeOfSupply || formData.placeOfSupply || '',
      invoices: selectedInvoicesList,
      // Store customer snapshot for immutability
      customerSnapshot: customerSnapshot
    };

    try {
      const response = await fetch('/api/payments-received', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData)
      });

      if (response.ok) {
        toast({
          title: "Payment Recorded",
          description: `Payment of ${formatCurrency(totalAmountReceived)} has been recorded.`
        });
        setLocation("/payments-received");
      } else {
        throw new Error('Failed to create payment');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to record payment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 h-screen animate-in slide-in-from-right duration-300">
      <div className="flex items-center justify-between p-4 bg-white border-b border-slate-200 shadow-sm z-10 flex-shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation('/payments-received')} className="rounded-full hover:bg-slate-100" data-testid="button-back">
            <ArrowLeft className="h-5 w-5 text-slate-500" />
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-[#002e46]">Record Payment</h1>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto invisible-scrollbar">
        <div className="max-w-6xl mx-auto p-8 pb-32">
          {customerError && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {customerError}. You can manually select a customer below.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-6">
            <Card className="overflow-hidden border-slate-200 shadow-sm">
              <CardContent className="p-0">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                  <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Payment Details</h2>
                </div>
                <div className="p-6 space-y-6">
                  {/* Customer Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium after:content-['*'] after:ml-0.5 after:text-red-500">Customer</Label>
                      <Select value={selectedCustomerId} onValueChange={handleCustomerChange}>
                        <SelectTrigger className="w-full bg-white border-slate-200" data-testid="select-customer">
                          <SelectValue placeholder={customersLoading ? "Loading..." : "Select customer"} />
                        </SelectTrigger>
                        <SelectContent>
                          {customers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id} data-testid={`customer-option-${customer.id}`}>
                              {customer.displayName || customer.name}
                            </SelectItem>
                          ))}
                          <Separator className="my-1" />
                          <SelectItem value="add_new" className="text-blue-600 font-medium">
                            <div className="flex items-center gap-2">
                              <Plus className="h-4 w-4" />
                              New Customer
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      {isLoadingCustomer && (
                        <p className="text-xs text-muted-foreground">Loading customer details...</p>
                      )}
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

                  {/* Customer Info Display */}
                  {selectedCustomer && customerSnapshot && (
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-slate-900">{customerSnapshot.displayName || customerSnapshot.customerName}</span>
                        {customerSnapshot.taxPreference === 'tax_exempt' && (
                          <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">
                            Tax Exempt
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-slate-500">
                        <div>
                          <span className="text-xs font-medium uppercase tracking-wide">Currency</span>
                          <p className="text-slate-900 mt-0.5">{customerSnapshot.currency || 'INR'}</p>
                        </div>
                        {customerSnapshot.placeOfSupply && (
                          <div>
                            <span className="text-xs font-medium uppercase tracking-wide">Place of Supply</span>
                            <p className="text-slate-900 mt-0.5">{customerSnapshot.placeOfSupply}</p>
                          </div>
                        )}
                        {customerSnapshot.gstin && (
                          <div>
                            <span className="text-xs font-medium uppercase tracking-wide">GSTIN</span>
                            <p className="text-slate-900 mt-0.5">{customerSnapshot.gstin}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

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
                      <p className="text-sm text-blue-700">
                        This amount will be automatically allocated to unpaid invoices starting with the oldest.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Outstanding Invoices */}
            <Card className="overflow-hidden border-slate-200 shadow-sm">
              <CardContent className="p-0">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Outstanding Invoices</h2>
                  {selectedInvoiceCount > 0 && (
                    <Badge className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100">{selectedInvoiceCount} Selected</Badge>
                  )}
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
                              <TableHead className="text-center font-semibold text-slate-700">Payment Date</TableHead>
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
                                <TableCell className="text-center">
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={!selectedInvoices[invoice.id]?.selected}
                                        className={cn(
                                          "w-32 justify-start text-left font-normal h-8 text-xs border-slate-200",
                                          !selectedInvoices[invoice.id]?.selected && "text-muted-foreground"
                                        )}
                                      >
                                        <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                                        {selectedInvoices[invoice.id]?.selected
                                          ? format(selectedInvoices[invoice.id]?.receivedDate || new Date(), "dd/MM/yyyy")
                                          : "-"
                                        }
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                      <Calendar
                                        mode="single"
                                        selected={selectedInvoices[invoice.id]?.receivedDate || new Date()}
                                        onSelect={(date) => date && updateInvoiceReceivedDate(invoice.id, date)}
                                        initialFocus
                                      />
                                    </PopoverContent>
                                  </Popover>
                                </TableCell>
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
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 mb-4">
                          <Search className="h-6 w-6 text-slate-400" />
                        </div>
                        <h3 className="text-sm font-medium text-slate-900">No Outstanding Invoices</h3>
                        <p className="text-sm text-slate-500 mt-1">This customer has no unpaid invoices.</p>
                      </div>
                    )
                  ) : (
                    <div className="text-center py-12">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 mb-4">
                        <Search className="h-6 w-6 text-slate-400" />
                      </div>
                      <h3 className="text-sm font-medium text-slate-900">Select a Customer</h3>
                      <p className="text-sm text-slate-500 mt-1">Please select a customer to view their outstanding invoices.</p>
                    </div>
                  )}
                </div>
                {/* Total Footer */}
                {selectedInvoiceCount > 0 && (
                  <div className="bg-green-50 border-t border-green-100 p-4 flex justify-end">
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-xs font-medium text-green-600 uppercase tracking-wide">Invoices Selected</p>
                        <p className="text-lg font-bold text-green-700">{selectedInvoiceCount}</p>
                      </div>
                      <div className="h-8 w-px bg-green-200"></div>
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
            {selectedCustomerId && (
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
                          <span className="text-slate-500">Total Outstanding</span>
                          <span className="font-medium text-slate-900">{formatCurrency(totalInvoicesAmount)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500">Amount Received</span>
                          <span className="font-medium text-slate-900">{formatCurrency(amountReceived)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500">Amount used for Payments</span>
                          <span className="font-medium text-green-600">-{formatCurrency(amountUsedForPayments)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500">Amount Refunded</span>
                          <span className="font-medium text-slate-900">{formatCurrency(amountRefunded)}</span>
                        </div>
                        <div className="border-t border-slate-200 pt-3 mt-2 flex justify-between items-center">
                          <span className="font-semibold text-slate-700">Amount in Excess</span>
                          <span className="font-bold text-lg text-[#ef8e33]">{formatCurrency(amountInExcess)}</span>
                        </div>
                        <div className="text-xs text-slate-400 mt-2 text-right">
                          This excess amount will be stored as unused credits.
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Customer Purchased Items (Collapsible or at bottom) */}
            <div className="pt-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 px-1">Purchase History</h3>
              <Card className="overflow-hidden border-slate-200 shadow-sm">
                <CardContent className="p-0">
                  {selectedCustomerId ? (
                    customerPurchasedItems.length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader className="bg-slate-50">
                            <TableRow className="border-b border-slate-200">
                              <TableHead className="pl-6">Item Name</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead>Unit</TableHead>
                              <TableHead className="text-right">Last Rate</TableHead>
                              <TableHead className="text-center">Total Qty</TableHead>
                              <TableHead className="text-center">Purchase Count</TableHead>
                              <TableHead>Last Purchase Date</TableHead>
                              <TableHead className="text-right pr-6">Total Amount</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {customerPurchasedItems.map((item) => (
                              <TableRow key={item.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                                <TableCell className="pl-6 font-medium text-slate-900">{item.name}</TableCell>
                                <TableCell className="text-slate-500 max-w-[200px] truncate" title={item.description}>
                                  {item.description || '-'}
                                </TableCell>
                                <TableCell className="text-slate-500">{item.unit}</TableCell>
                                <TableCell className="text-right text-slate-900">{formatCurrency(item.lastRate)}</TableCell>
                                <TableCell className="text-center text-slate-900">{item.totalQuantity}</TableCell>
                                <TableCell className="text-center">
                                  <Badge variant="secondary" className="bg-slate-100 text-slate-700">{item.purchaseCount}</Badge>
                                </TableCell>
                                <TableCell className="text-slate-500">{formatDate(item.lastPurchaseDate)}</TableCell>
                                <TableCell className="text-right pr-6 font-medium text-slate-900">{formatCurrency(item.totalAmount)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-500">
                        No items purchased by this customer yet
                      </div>
                    )
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      Select a customer to view purchased items
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
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
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
