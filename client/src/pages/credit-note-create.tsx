import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Search,
  X,
  HelpCircle,
  AlertCircle,
  Loader2,
  Calendar as CalendarIcon,
  ChevronsUpDown,
  Check,
  Upload,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useTransactionBootstrap } from "@/hooks/use-transaction-bootstrap";
import { formatAddressDisplay } from "@/lib/customer-snapshot";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AccountSelectDropdown } from "@/components/AccountSelectDropdown";

interface Customer {
  id: string;
  name: string;
  displayName?: string;
  email?: string;
  billingAddress?: any;
  gstin?: string;
  placeOfSupply?: string;
}

interface Item {
  id: string;
  name: string;
  type: string;
  unit: string;
  usageUnit?: string;
  sellingPrice?: number;
  rate?: string | number;
  hsnSac?: string;
  description?: string;
  salesAccount?: string;
}

interface Salesperson {
  id: string;
  name: string;
  email?: string;
}

interface LineItem {
  id: string;
  itemId: string;
  name: string;
  description: string;
  account: string;
  quantity: number;
  rate: number;
  discount: number;
  discountType: string;
  tax: number;
  taxName: string;
  amount: number;
}

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli",
  "Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

const TAX_OPTIONS = [
  { value: "none", label: "None", rate: 0 },
  { value: "GST0", label: "GST 0%", rate: 0 },
  { value: "GST5", label: "GST 5%", rate: 5 },
  { value: "GST12", label: "GST 12%", rate: 12 },
  { value: "GST18", label: "GST 18%", rate: 18 },
  { value: "GST28", label: "GST 28%", rate: 28 },
  { value: "IGST0", label: "IGST 0%", rate: 0 },
  { value: "IGST5", label: "IGST 5%", rate: 5 },
  { value: "IGST12", label: "IGST 12%", rate: 12 },
  { value: "IGST18", label: "IGST 18%", rate: 18 },
  { value: "IGST28", label: "IGST 28%", rate: 28 },
];

const formatCurrency = (amount: number | undefined | null) => {
  const safeAmount = typeof amount === "number" ? amount : 0;
  return `₹${safeAmount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const normalizePlaceOfSupply = (pos: string | undefined | null) => {
  if (!pos) return "";
  // Handle "Code - Name" format (e.g. "27 - Maharashtra")
  const parts = pos.split(" - ");
  const val = parts.length > 1 ? parts[parts.length - 1] : pos;
  return val.trim();
};

export default function CreditNoteCreate() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  // Transaction bootstrap for auto-population
  const {
    customerId: bootstrapCustomerId,
    customerSnapshot,
    taxRegime,
    isLoadingCustomer,
    customerError,
    formData: bootstrapFormData,
    onCustomerChange,
  } = useTransactionBootstrap({ transactionType: "credit_note" });

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [salespersons, setSalespersons] = useState<Salesperson[]>([]);
  const [nextCreditNoteNumber, setNextCreditNoteNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [invoices, setInvoices] = useState<any[]>([]);
  const [invoiceType, setInvoiceType] = useState("Regular");
  const [customerId, setCustomerId] = useState("");
  const [openCustomer, setOpenCustomer] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [reason, setReason] = useState("");
  const [creditNoteNumber, setCreditNoteNumber] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [creditNoteDate, setCreditNoteDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [salesperson, setSalesperson] = useState("");
  const [subject, setSubject] = useState("");
  const [billingAddress, setBillingAddress] = useState({
    street: "",
    city: "",
    state: "",
    country: "India",
    pincode: "",
  });
  const [gstin, setGstin] = useState("");
  const [placeOfSupply, setPlaceOfSupply] = useState("");

  // Sync with bootstrap customer
  useEffect(() => {
    if (bootstrapCustomerId && !customerId) {
      setCustomerId(bootstrapCustomerId);
    }
  }, [bootstrapCustomerId]);

  // Update form data when customer snapshot changes
  useEffect(() => {
    if (customerSnapshot) {
      setCustomerName(
        customerSnapshot.displayName || customerSnapshot.customerName,
      );
      if (customerSnapshot.billingAddress) {
        setBillingAddress(customerSnapshot.billingAddress);
      }
      if (customerSnapshot.gstin) setGstin(customerSnapshot.gstin);
      if (customerSnapshot.placeOfSupply)
        setPlaceOfSupply(normalizePlaceOfSupply(customerSnapshot.placeOfSupply));
    }
  }, [customerSnapshot]);

  const [lineItems, setLineItems] = useState<LineItem[]>([
    {
      id: "1",
      itemId: "",
      name: "",
      description: "",
      account: "",
      quantity: 1,
      rate: 0,
      discount: 0,
      discountType: "percentage",
      tax: 0,
      taxName: "none",
      amount: 0,
    },
  ]);

  const [subTotal, setSubTotal] = useState(0);
  const [shippingCharges, setShippingCharges] = useState(0);
  const [cgst, setCgst] = useState(0);
  const [sgst, setSgst] = useState(0);
  const [igst, setIgst] = useState(0);
  const [tdsType, setTdsType] = useState("TDS");
  const [tdsTax, setTdsTax] = useState("");
  const [adjustment, setAdjustment] = useState(0);
  const [total, setTotal] = useState(0);
  const [selectedInvoiceTotal, setSelectedInvoiceTotal] = useState(0);
  const [customerNotes, setCustomerNotes] = useState("");
  const [termsAndConditions, setTermsAndConditions] = useState("");

  const [salespersonDialogOpen, setSalespersonDialogOpen] = useState(false);
  const [newSalespersonName, setNewSalespersonName] = useState("");
  const [newSalespersonEmail, setNewSalespersonEmail] = useState("");
  const [fromInvoiceId, setFromInvoiceId] = useState<string | null>(null);
  const [fromInvoiceNumber, setFromInvoiceNumber] = useState<string | null>(
    null,
  );
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files).filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds 10MB limit`,
          variant: "destructive",
        });
        return false;
      }
      return true;
    });
    if (uploadedFiles.length + newFiles.length > 10) {
      toast({
        title: "Too many files",
        description: "Maximum 10 files allowed",
        variant: "destructive",
      });
      return;
    }
    setUploadedFiles(prev => [...prev, ...newFiles]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    fetchData();
    // Check for fromInvoice parameter - use window.location.search since wouter's location doesn't include query params
    const params = new URLSearchParams(window.location.search);
    const invoiceId = params.get("fromInvoice");
    if (invoiceId) {
      setFromInvoiceId(invoiceId);
      fetchInvoiceData(invoiceId);
    }
  }, []);

  const fetchInvoiceData = async (invoiceId: string) => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}`);
      if (response.ok) {
        const data = await response.json();
        const invoice = data.data;
        console.log("DEBUG: fetchInvoiceData fetched invoice:", invoice);
        setSelectedInvoiceTotal(invoice.total);

        // Pre-populate form with invoice data
        setFromInvoiceNumber(invoice.invoiceNumber);
        setCustomerId(invoice.customerId);
        setCustomerName(invoice.customerName);
        if (invoice.billingAddress) {
          setBillingAddress(invoice.billingAddress);
        }
        if (invoice.placeOfSupply) {
          const parts = invoice.placeOfSupply.split(" - ");
          setPlaceOfSupply(parts.length > 1 ? parts[1] : invoice.placeOfSupply);
        }
        onCustomerChange(invoice.customerId);
        setSubject(`Credit Note for Invoice #${invoice.invoiceNumber}`);
        setReason("sales_return");
        if (invoice.salesperson) setSalesperson(invoice.salesperson);
        setShippingCharges(invoice.shippingCharges || 0);
        setAdjustment(invoice.adjustment || 0);

        // Pre-populate items from invoice
        if (invoice.items && invoice.items.length > 0) {
          const invoiceItems: LineItem[] = invoice.items.map(
            (item: any, index: number) => {
              const quantity = item.quantity || 1;
              const rate = item.rate || 0;
              let discount = item.discount || 0;
              let discountType = item.discountType || "percentage";

              // Use the pre-calculated amount from invoice if available
              // This avoids issues with inconsistent discount data
              let amount = item.amount;

              // If no pre-calculated amount, calculate it
              if (amount === undefined || amount === null) {
                // If discount > 100 and type is percentage, it's likely stored as amount
                if (discountType === "percentage" && discount > 100) {
                  // Convert to actual percentage: discount amount / (qty * rate) * 100
                  const baseAmount = quantity * rate;
                  if (baseAmount > 0) {
                    discount = (discount / baseAmount) * 100;
                  }
                }

                let discountAmount =
                  discountType === "percentage"
                    ? (quantity * rate * discount) / 100
                    : discount;
                amount = quantity * rate - discountAmount;
              }

              // Normalize discount for display (if it was stored as amount, convert to percentage)
              if (discountType === "percentage" && discount > 100) {
                const baseAmount = quantity * rate;
                if (baseAmount > 0) {
                  discount = (item.discount / baseAmount) * 100;
                }
              }

              // Extract tax rate from taxName (e.g. "GST18" -> 18)
              const taxName = item.taxName || "none";
              let taxRate = 0;
              if (taxName.startsWith("GST") || taxName.startsWith("IGST")) {
                const match = taxName.match(/\d+/);
                if (match) taxRate = parseInt(match[0]);
              } else if (item.tax && item.tax < 100) {
                // If item.tax is already a small number, it might be the rate
                taxRate = item.tax;
              }

              return {
                id: String(index + 1),
                itemId: item.itemId || "",
                name: item.name || "",
                description: item.description || "",
                account: item.account || "sales",
                quantity,
                rate,
                discount: Math.round(discount * 100) / 100, // Round to 2 decimal places
                discountType,
                tax: taxRate,
                taxName: taxName,
                amount: amount,
              };
            },
          );
          setLineItems(invoiceItems);
        }
      }
    } catch (error) {
      console.error("Failed to fetch invoice data:", error);
      toast({
        title: "Error",
        description: "Failed to load invoice data",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    calculateTotals();
  }, [lineItems, shippingCharges, adjustment, taxRegime, placeOfSupply]);

  const fetchData = async () => {
    try {
      const [customersRes, itemsRes, salespersonsRes, nextNumberRes] =
        await Promise.all([
          fetch("/api/customers"),
          fetch("/api/items"),
          fetch("/api/salespersons"),
          fetch("/api/credit-notes/next-number"),
        ]);

      const customersData = await customersRes.json();
      const itemsData = await itemsRes.json();
      const salespersonsData = await salespersonsRes.json();
      const nextNumberData = await nextNumberRes.json();

      if (customersData.success) setCustomers(customersData.data);
      if (itemsData.success) setItems(itemsData.data);
      if (salespersonsData.success) setSalespersons(salespersonsData.data);
      if (nextNumberData.success) {
        setNextCreditNoteNumber(nextNumberData.data);
        setCreditNoteNumber(nextNumberData.data);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    }
  };

  const handleCustomerChange = async (customerId: string) => {
    if (customerId === "add_new_customer") {
      setLocation("/customers/new?returnTo=credit-notes/new");
      return;
    }
    const customer = customers.find((c) => c.id === customerId);
    if (customer) {
      setCustomerId(customer.id);
      setCustomerName(customer.displayName || customer.name);
      if (customer.billingAddress) {
        setBillingAddress(customer.billingAddress);
      }
      if (customer.gstin) setGstin(customer.gstin);
      if (customer.placeOfSupply) {
        // Handle "Code - Name" format (e.g. "27 - Maharashtra")
        const parts = customer.placeOfSupply.split(" - ");
        if (parts.length > 1) {
          setPlaceOfSupply(parts[1]);
        } else {
          setPlaceOfSupply(customer.placeOfSupply);
        }
      }
      onCustomerChange(customer.id);

      // Fetch invoices for this customer
      try {
        const response = await fetch(`/api/invoices?customerId=${customer.id}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setInvoices(data.data || []);
          }
        }
      } catch (error) {
        console.error("Failed to fetch customer invoices:", error);
      }
    }
  };

  const handleInvoiceChange = (invoiceId: string) => {
    const invoice = invoices.find((i) => i.id === invoiceId);
    if (invoice) {
      console.log("DEBUG: handleInvoiceChange selected invoice from list:", invoice);
      setFromInvoiceId(invoice.id);
      setFromInvoiceNumber(invoice.invoiceNumber); // Keep this for display badge if needed
      setSelectedInvoiceTotal(invoice.amount || invoice.total || 0); // Set the total of the selected invoice
      setReason("sales_return"); // Auto-select reason

      // Fetch full invoice details to get items
      fetchInvoiceData(invoice.id);
    } else {
      setFromInvoiceId(null);
      setFromInvoiceNumber(null);
      setSelectedInvoiceTotal(0);
      setLineItems([
        {
          id: "1",
          itemId: "",
          name: "",
          description: "",
          account: "",
          quantity: 1,
          rate: 0,
          discount: 0,
          discountType: "percentage",
          tax: 0,
          taxName: "none",
          amount: 0,
        },
      ]);
    }
  };

  const handleItemChange = (lineItemId: string, itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    if (item) {
      // Get the price from rate (string) or sellingPrice (number)
      // Remove commas from formatted numbers like "45,000.00" before parsing
      const rateStr = String(item.rate || "0").replace(/,/g, "");
      const price = parseFloat(rateStr) || item.sellingPrice || 0;
      const lineItem = lineItems.find((li) => li.id === lineItemId);
      const quantity = lineItem?.quantity || 1;

      // Extract tax rate from intraStateTax or interStateTax if available on the item object
      // (Assuming the items API might return this, or we fallback to 18)
      let taxRate = 18;
      const itemAny = item as any;
      const taxStr =
        taxRegime.regime === "inter"
          ? itemAny.interStateTax || itemAny.tax
          : itemAny.intraStateTax || itemAny.tax;

      if (taxStr) {
        const match = String(taxStr).match(/\d+/);
        if (match) taxRate = parseInt(match[0]);
      }

      updateLineItem(lineItemId, {
        itemId: item.id,
        name: item.name,
        description: item.description || "",
        account: item.salesAccount || "sales",
        rate: price,
        tax: taxRate,
        taxName:
          taxRegime.regime === "inter" ? `IGST${taxRate}` : `GST${taxRate}`,
        amount: price * quantity,
      });
    }
  };

  const updateLineItem = (id: string, updates: Partial<LineItem>) => {
    setLineItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, ...updates };
          const quantity = updated.quantity || 0;
          const rate = updated.rate || 0;
          const discount = updated.discount || 0;
          const discountType = updated.discountType || "percentage";

          let discountAmount =
            discountType === "percentage"
              ? (quantity * rate * discount) / 100
              : discount;

          const taxableAmount = quantity * rate - discountAmount;
          const taxRate = updated.tax || 0;
          const taxAmount = (taxableAmount * taxRate) / 100;

          updated.amount = taxableAmount + taxAmount;
          return updated;
        }
        return item;
      }),
    );
  };

  const addLineItem = () => {
    const newId = String(Date.now());
    setLineItems((prev) => [
      ...prev,
      {
        id: newId,
        itemId: "",
        name: "",
        description: "",
        account: "",
        quantity: 1,
        rate: 0,
        discount: 0,
        discountType: "percentage",
        tax: 0,
        taxName: "none",
        amount: 0,
      },
    ]);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const calculateTotals = () => {
    let subTotalAmount = 0;
    let totalTaxAmount = 0;
    let cgstVal = 0;
    let sgstVal = 0;
    let igstVal = 0;

    lineItems.forEach((item) => {
      const quantity = item.quantity || 0;
      const rate = item.rate || 0;
      const discount = item.discount || 0;
      const discountType = item.discountType || "percentage";

      let discountAmount =
        discountType === "percentage"
          ? (quantity * rate * discount) / 100
          : discount;

      const taxableAmount = quantity * rate - discountAmount;
      const taxRate = item.tax || 0;
      const taxAmount = (taxableAmount * taxRate) / 100;

      subTotalAmount += taxableAmount;
      totalTaxAmount += taxAmount;

      if (taxRegime.regime === "inter") {
        igstVal += taxAmount;
      } else {
        // Default to intra-state split
        cgstVal += taxAmount / 2;
        sgstVal += taxAmount / 2;
      }
    });

    setCgst(cgstVal);
    setSgst(sgstVal);
    setIgst(igstVal);
    setSubTotal(subTotalAmount);
    setTotal(subTotalAmount + totalTaxAmount + shippingCharges + adjustment);
  };

  const handleAddSalesperson = async () => {
    if (!newSalespersonName.trim()) return;
    try {
      const response = await fetch("/api/salespersons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newSalespersonName,
          email: newSalespersonEmail,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setSalespersons((prev) => [...prev, data.data]);
        setSalesperson(data.data.name);
        setSalespersonDialogOpen(false);
        setNewSalespersonName("");
        setNewSalespersonEmail("");
        toast({
          title: "Success",
          description: "Salesperson added successfully",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add salesperson",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (status: string) => {
    if (!customerId) {
      toast({
        title: "Error",
        description: "Please select a customer",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/credit-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: fromInvoiceId,
          invoiceNumber: fromInvoiceNumber,
          invoiceType,
          customerId,
          customerName,
          reason,
          referenceNumber,
          date: creditNoteDate,
          salesperson,
          subject,
          billingAddress,
          gstin,
          placeOfSupply,
          items: lineItems,
          originalInvoiceTotal: selectedInvoiceTotal,
          subTotal,
          shippingCharges,
          tdsType,
          tdsAmount: 0,
          cgst,
          sgst,
          igst,
          adjustment,
          total,
          customerNotes,
          termsAndConditions,
          status,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Success",
          description: "Credit note created successfully",
        });
        setLocation("/credit-notes");
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to create credit note",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create credit note",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 h-screen animate-in slide-in-from-right duration-300">
      <div className="flex items-center justify-between p-4 bg-white border-b border-slate-200 shadow-sm z-10 flex-none">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/credit-notes")}
            className="rounded-full hover:bg-slate-100"
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5 text-slate-500" />
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-[#002e46]">
              New Credit Note
            </h1>
            {fromInvoiceNumber && (
              <Badge className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100">
                From Invoice #{fromInvoiceNumber}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto invisible-scrollbar">
        <div className="max-w-6xl mx-auto p-8 pb-32">
          <div className="space-y-8">
            {/* Credit Note Details Card */}
            <Card className="overflow-hidden border-slate-200 shadow-sm">
              <CardContent className="p-0">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                  <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
                    Credit Note Details
                  </h2>
                </div>
                <div className="p-6 space-y-6">
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <Label className="text-slate-700 font-medium after:content-['*'] after:ml-0.5 after:text-red-500">
                        Customer Name
                      </Label>
                      <Popover
                        open={openCustomer}
                        onOpenChange={setOpenCustomer}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openCustomer}
                            className="w-full justify-between font-normal bg-white border-slate-200"
                            data-testid="combobox-customer"
                          >
                            {customerId
                              ? customers.find(
                                (customer) => customer.id === customerId,
                              )?.displayName ||
                              customers.find(
                                (customer) => customer.id === customerId,
                              )?.name
                              : "Select or search customer"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[400px] p-0" align="start">
                          <Command>
                            <CommandInput
                              placeholder="Search customer..."
                              value={customerSearch}
                              onValueChange={setCustomerSearch}
                            />
                            <CommandList>
                              <CommandEmpty>No customer found.</CommandEmpty>
                              <CommandGroup>
                                {customers.map((customer) => (
                                  <CommandItem
                                    key={customer.id}
                                    value={
                                      customer.displayName || customer.name
                                    }
                                    onSelect={() => {
                                      handleCustomerChange(customer.id);
                                      setOpenCustomer(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        customerId === customer.id
                                          ? "opacity-100"
                                          : "opacity-0",
                                      )}
                                    />
                                    {customer.displayName || customer.name}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                              <Separator />
                              <CommandGroup>
                                <CommandItem
                                  onSelect={() => {
                                    handleCustomerChange("add_new_customer");
                                    setOpenCustomer(false);
                                  }}
                                  className="text-blue-600 font-medium cursor-pointer"
                                >
                                  <Plus className="mr-2 h-4 w-4" />
                                  New Customer
                                </CommandItem>
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Dynamic Customer Details */}
                    {customerId && (
                      <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="grid grid-cols-2 gap-8 text-sm">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-slate-700 uppercase text-[10px] tracking-wider">
                                Billing Address
                              </span>
                            </div>
                            <div className="text-slate-600 leading-relaxed pl-1 border-l-2 border-slate-200">
                              {billingAddress.street ? (
                                <>
                                  <div className="font-medium text-slate-900">
                                    {billingAddress.city}
                                  </div>
                                  <div>{billingAddress.street}</div>
                                  <div>
                                    {billingAddress.state}{" "}
                                    {billingAddress.pincode}
                                  </div>
                                  <div>{billingAddress.country}</div>
                                </>
                              ) : (
                                <span className="text-slate-400 italic">
                                  No billing address
                                </span>
                              )}
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-slate-700 uppercase text-[10px] tracking-wider">
                                Shipping Address
                              </span>
                            </div>
                            <div className="text-slate-600 leading-relaxed pl-1 border-l-2 border-slate-200">
                              {billingAddress.street ? (
                                <>
                                  <div className="font-medium text-slate-900">
                                    {billingAddress.city}
                                  </div>
                                  <div>{billingAddress.street}</div>
                                  <div>
                                    {billingAddress.state}{" "}
                                    {billingAddress.pincode}
                                  </div>
                                  <div>{billingAddress.country}</div>
                                </>
                              ) : (
                                <span className="text-slate-400 italic">
                                  Same as billing address
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex gap-2 items-center">
                            <span className="text-slate-500 text-xs font-medium">
                              GST Treatment:
                            </span>
                            <span className="text-slate-900 text-sm">
                              {gstin
                                ? "Registered Business"
                                : "Unregistered Business"}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-slate-700 font-medium after:content-['*'] after:ml-0.5 after:text-red-500">
                          Place of Supply
                        </Label>
                        <Select
                          value={placeOfSupply}
                          onValueChange={setPlaceOfSupply}
                        >
                          <SelectTrigger
                            className="bg-white border-slate-200"
                            data-testid="select-place-of-supply"
                          >
                            <SelectValue placeholder="Select Place of Supply" />
                          </SelectTrigger>
                          <SelectContent>
                            {INDIAN_STATES.map((state) => (
                              <SelectItem key={state} value={state}>
                                {state === "Maharashtra"
                                  ? "[MH] - Maharashtra"
                                  : state}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-slate-700 font-medium">
                          Invoice#
                        </Label>
                        <Select
                          value={fromInvoiceId || ""}
                          onValueChange={handleInvoiceChange}
                          disabled={!customerId}
                        >
                          <SelectTrigger
                            className="bg-white border-slate-200"
                            data-testid="select-invoice"
                          >
                            <SelectValue
                              placeholder={
                                customerId
                                  ? "Select Invoice (Auto-populate items)"
                                  : "Select Customer First"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {invoices.length > 0 ? (
                              invoices.map((inv: any) => (
                                <SelectItem key={inv.id} value={inv.id}>
                                  {inv.invoiceNumber} -{" "}
                                  {format(new Date(inv.date), "dd/MM/yyyy")} - ₹
                                  {inv.amount}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="none" disabled>
                                No invoices found
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        {fromInvoiceNumber && (
                          <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500 font-medium bg-slate-50 p-2 rounded-md border border-slate-100">
                            <span className="flex h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                            Original Invoice Total: {formatCurrency(selectedInvoiceTotal)}
                            <span className="ml-auto text-[10px] text-slate-400">Total of items currently loaded</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-slate-700 font-medium">
                          Invoice Type
                        </Label>
                        <Select
                          value={invoiceType}
                          onValueChange={setInvoiceType}
                        >
                          <SelectTrigger className="bg-white border-slate-200">
                            <SelectValue placeholder="Select Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Regular">Regular</SelectItem>
                            <SelectItem value="Bill of Supply">
                              Bill of Supply
                            </SelectItem>
                            <SelectItem value="Export">Export</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-slate-700 font-medium">
                          Reason
                        </Label>
                        <Select value={reason} onValueChange={setReason}>
                          <SelectTrigger
                            className="bg-white border-slate-200"
                            data-testid="select-reason"
                          >
                            <SelectValue placeholder="Select a reason" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sales_return">
                              Sales Return
                            </SelectItem>
                            <SelectItem value="post_sale_discount">
                              Post Sale Discount
                            </SelectItem>
                            <SelectItem value="deficiency_in_services">
                              Deficiency in Services
                            </SelectItem>
                            <SelectItem value="correction_in_invoice">
                              Correction in Invoice
                            </SelectItem>
                            <SelectItem value="change_in_pos">
                              Change in POS
                            </SelectItem>
                            <SelectItem value="finalization_of_amount">
                              Finalization of Provisional Assessment
                            </SelectItem>
                            <SelectItem value="others">Others</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-medium flex items-center gap-1">
                        Credit Note#
                        <span className="text-red-500">*</span>
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          value={creditNoteNumber}
                          onChange={(e) => setCreditNoteNumber(e.target.value)}
                          className="bg-white"
                          data-testid="input-credit-note-number"
                        />
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-400"
                            >
                              <HelpCircle className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-64 text-xs text-slate-500">
                            This is the unique identifier for the credit note.
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-700 font-medium">
                        Reference#
                      </Label>
                      <Input
                        value={referenceNumber}
                        onChange={(e) => setReferenceNumber(e.target.value)}
                        className="bg-white border-slate-200 h-10"
                        data-testid="input-reference-number"
                      />
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
                      <div
                        className={`border-2 border-dashed rounded-lg p-10 flex flex-col items-center justify-center gap-2 group transition-colors cursor-pointer ${isDragging
                            ? "border-blue-500 bg-blue-100"
                            : "border-blue-200 bg-blue-50/20 hover:bg-blue-50"
                          }`}
                        onClick={() => document.getElementById("file-upload-create")?.click()}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        data-testid="dropzone-documents"
                      >
                        <input
                          id="file-upload-create"
                          type="file"
                          multiple
                          className="hidden"
                          onChange={(e) => handleFileSelect(e.target.files)}
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                          data-testid="input-file-upload"
                        />
                        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                          <Upload className="h-6 w-6" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium text-slate-900">
                            <span className="text-blue-600">Upload files</span> or drag and drop
                          </p>
                          <p className="text-xs text-slate-500 mt-1">Up to 10 files (max 10MB each)</p>
                        </div>
                      </div>
                      {uploadedFiles.length > 0 && (
                        <div className="space-y-2">
                          {uploadedFiles.map((file, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
                              data-testid={`file-item-${index}`}
                            >
                              <div className="flex items-center gap-3">
                                <FileText className="h-5 w-5 text-blue-600" />
                                <div>
                                  <p className="text-sm font-medium text-slate-900">{file.name}</p>
                                  <p className="text-xs text-slate-500">
                                    {(file.size / 1024).toFixed(1)} KB
                                  </p>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeFile(index);
                                }}
                                className="h-8 w-8 text-slate-400 hover:text-red-600"
                                data-testid={`button-remove-file-${index}`}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-700 font-medium flex items-center gap-1">
                        Credit Note Date
                        <span className="text-red-500">*</span>
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal bg-white border-slate-200",
                              !creditNoteDate && "text-muted-foreground",
                            )}
                            data-testid="input-credit-note-date"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {creditNoteDate &&
                              !isNaN(Date.parse(creditNoteDate))
                              ? format(new Date(creditNoteDate), "dd/MM/yyyy")
                              : "Select date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={
                              creditNoteDate
                                ? new Date(creditNoteDate)
                                : undefined
                            }
                            onSelect={(d) =>
                              d &&
                              setCreditNoteDate(d.toISOString().split("T")[0])
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-700 font-medium">
                        Salesperson
                      </Label>
                      <Select
                        value={salesperson}
                        onValueChange={setSalesperson}
                      >
                        <SelectTrigger
                          className="bg-white border-slate-200"
                          data-testid="select-salesperson"
                        >
                          <SelectValue placeholder="Select or Add Salesperson" />
                        </SelectTrigger>
                        <SelectContent>
                          {salespersons.map((sp) => (
                            <SelectItem key={sp.id} value={sp.name}>
                              {sp.name}
                            </SelectItem>
                          ))}
                          <div className="border-t my-1" />
                          <Button
                            variant="ghost"
                            className="w-full justify-start text-blue-600 h-9 px-2 font-normal"
                            onClick={(e) => {
                              e.preventDefault();
                              setSalespersonDialogOpen(true);
                            }}
                            data-testid="button-add-salesperson"
                          >
                            <Plus className="h-4 w-4 mr-2" /> Add Salesperson
                          </Button>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-700 font-medium flex items-center gap-1">
                        Subject
                        <Popover>
                          <PopoverTrigger asChild>
                            <HelpCircle className="h-3 w-3 text-slate-400 cursor-help" />
                          </PopoverTrigger>
                          <PopoverContent className="w-64 text-xs text-slate-500">
                            A brief description of the credit note for the
                            customer.
                          </PopoverContent>
                        </Popover>
                        <span className="text-slate-400 ml-1">
                          <HelpCircle className="h-3 w-3 inline text-slate-400" />
                        </span>
                      </Label>
                      <div className="relative">
                        <Textarea
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          placeholder="Let your customer know what this Credit Note is for"
                          className="bg-white resize-y min-h-[60px] pr-8"
                          data-testid="input-subject"
                        />
                        <div className="absolute bottom-2 right-2 text-slate-400">
                          {/* Placeholder for resize handle style or icon if needed specifically, though textarea usually has one */}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Items Card */}
            <Card className="overflow-hidden border-slate-200 shadow-sm">
              <CardContent className="p-0">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
                    Item Table
                  </h2>
                  <Button
                    variant="link"
                    size="sm"
                    className="text-blue-600 font-medium"
                    data-testid="button-bulk-actions"
                  >
                    Bulk Actions
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow className="border-b border-slate-200">
                        <TableHead className="w-10 pl-4">#</TableHead>
                        <TableHead className="w-[280px]">
                          Item Details
                        </TableHead>
                        <TableHead className="w-[180px]">Account</TableHead>
                        <TableHead className="text-right w-24">
                          Quantity
                        </TableHead>
                        <TableHead className="text-right w-28">Rate</TableHead>
                        <TableHead className="text-right w-24">
                          Discount
                        </TableHead>
                        <TableHead className="text-left w-32">
                          Tax (%)
                        </TableHead>
                        <TableHead className="text-right w-32">
                          Amount
                        </TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lineItems.map((item, index) => (
                        <TableRow
                          key={item.id}
                          className="border-b border-slate-100 hover:bg-slate-50/50"
                        >
                          <TableCell className="pl-4 text-slate-500 font-medium">
                            {index + 1}
                          </TableCell>
                          <TableCell>
                            {item.name &&
                              !items.find((i) => i.id === item.itemId) ? (
                              <div className="flex flex-col gap-1">
                                <span className="font-medium text-sm text-slate-900">
                                  {item.name}
                                </span>
                                <Select
                                  value=""
                                  onValueChange={(val) =>
                                    handleItemChange(item.id, val)
                                  }
                                >
                                  <SelectTrigger
                                    className="w-full h-8 text-xs border-dashed text-slate-500"
                                    data-testid={`select - item - ${index} `}
                                  >
                                    <SelectValue placeholder="Change item..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {items.map((i) => (
                                      <SelectItem key={i.id} value={i.id}>
                                        {i.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            ) : (
                              <Select
                                value={item.itemId}
                                onValueChange={(val) =>
                                  handleItemChange(item.id, val)
                                }
                              >
                                <SelectTrigger
                                  className="border-0 shadow-none focus:ring-0 px-0 h-auto font-medium text-slate-900"
                                  data-testid={`select - item - ${index} `}
                                >
                                  <SelectValue placeholder="Select Item" />
                                </SelectTrigger>
                                <SelectContent>
                                  {items.map((i) => (
                                    <SelectItem key={i.id} value={i.id}>
                                      {i.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </TableCell>
                          <TableCell>
                            <AccountSelectDropdown
                              value={item.account}
                              onValueChange={(val) =>
                                updateLineItem(item.id, { account: val })
                              }
                              placeholder="Select Account"
                              triggerClassName="w-full border-0 shadow-none focus:ring-0 bg-transparent px-0 h-9"
                              testId={`select - account - ${index} `}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) =>
                                updateLineItem(item.id, {
                                  quantity: parseFloat(e.target.value) || 0,
                                })
                              }
                              className="text-right h-9 border-slate-200"
                              data-testid={`input - quantity - ${index} `}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={item.rate}
                              onChange={(e) =>
                                updateLineItem(item.id, {
                                  rate: parseFloat(e.target.value) || 0,
                                })
                              }
                              className="text-right h-9 border-slate-200"
                              data-testid={`input - rate - ${index} `}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                value={item.discount}
                                onChange={(e) =>
                                  updateLineItem(item.id, {
                                    discount: parseFloat(e.target.value) || 0,
                                  })
                                }
                                className="text-right h-9 border-slate-200"
                                data-testid={`input - discount - ${index} `}
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={item.taxName}
                              onValueChange={(val) => {
                                const taxOption = TAX_OPTIONS.find(
                                  (t) => t.value === val,
                                );
                                updateLineItem(item.id, {
                                  taxName: val,
                                  tax: taxOption?.rate || 0,
                                });
                              }}
                            >
                              <SelectTrigger
                                className="h-9 border-slate-200 text-xs"
                                data-testid={`select - tax - ${index} `}
                              >
                                <SelectValue placeholder="Tax" />
                              </SelectTrigger>
                              <SelectContent>
                                {TAX_OPTIONS.map((tax) => (
                                  <SelectItem key={tax.value} value={tax.value}>
                                    {tax.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-right font-medium text-slate-900">
                            {item.amount.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeLineItem(item.id)}
                              className="h-8 w-8 text-slate-400 hover:text-red-600"
                              disabled={lineItems.length === 1}
                              data-testid={`button - remove - item - ${index} `}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="p-4 border-t border-slate-100 bg-slate-50/30 flex gap-4">
                  <Button
                    variant="link"
                    className="text-blue-600 hover:text-blue-700 h-auto p-0 font-medium"
                    onClick={addLineItem}
                    data-testid="button-add-row"
                  >
                    <Plus className="h-4 w-4 mr-1.5" />
                    Add Another Line
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Terms & Totals Card */}
            <Card className="overflow-hidden border-slate-200 shadow-sm">
              <CardContent className="p-0">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                  <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
                    Terms & Attributes
                  </h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-12">
                    {/* Left Column */}
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label className="text-slate-700 font-medium">
                          Customer Notes
                        </Label>
                        <Textarea
                          value={customerNotes}
                          onChange={(e) => setCustomerNotes(e.target.value)}
                          placeholder="Will be displayed on the credit note"
                          className="min-h-[100px] resize-y"
                          data-testid="input-customer-notes"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-700 font-medium">
                          Terms & Conditions
                        </Label>
                        <Textarea
                          value={termsAndConditions}
                          onChange={(e) =>
                            setTermsAndConditions(e.target.value)
                          }
                          placeholder="Enter the terms and conditions of your business..."
                          className="min-h-[100px] resize-y"
                          data-testid="input-terms"
                        />
                      </div>
                    </div>

                    {/* Right Column (Totals) */}
                    <div className="bg-slate-50/50 rounded-lg p-6 space-y-4">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600">Sub Total</span>
                        <span className="font-medium text-slate-900">
                          {subTotal.toFixed(2)}
                        </span>
                      </div>
                      {cgst > 0 && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-600">CGST</span>
                          <span className="font-medium text-slate-900">
                            {cgst.toFixed(2)}
                          </span>
                        </div>
                      )}
                      {sgst > 0 && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-600">SGST</span>
                          <span className="font-medium text-slate-900">
                            {sgst.toFixed(2)}
                          </span>
                        </div>
                      )}
                      {igst > 0 && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-600">IGST</span>
                          <span className="font-medium text-slate-900">
                            {igst.toFixed(2)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600">Shipping Charges</span>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={shippingCharges}
                            onChange={(e) =>
                              setShippingCharges(
                                parseFloat(e.target.value) || 0,
                              )
                            }
                            className="w-24 text-right h-8 bg-white"
                            data-testid="input-shipping-charges"
                          />
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-sm gap-2">
                        <div className="flex items-center gap-2">
                          <RadioGroup
                            value={tdsType}
                            onValueChange={setTdsType}
                            className="flex gap-2"
                          >
                            <div className="flex items-center gap-1">
                              <RadioGroupItem
                                value="TDS"
                                id="tds"
                                className="h-3 w-3"
                              />
                              <Label htmlFor="tds" className="text-xs">
                                TDS
                              </Label>
                            </div>
                            <div className="flex items-center gap-1">
                              <RadioGroupItem
                                value="TCS"
                                id="tcs"
                                className="h-3 w-3"
                              />
                              <Label htmlFor="tcs" className="text-xs">
                                TCS
                              </Label>
                            </div>
                          </RadioGroup>
                        </div>
                        <div className="flex items-center gap-2">
                          <Select value={tdsTax} onValueChange={setTdsTax}>
                            <SelectTrigger
                              className="w-24 h-8 text-xs bg-white"
                              data-testid="select-tds-tax"
                            >
                              <SelectValue placeholder="Tax" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              <SelectItem value="tds1">TDS 1%</SelectItem>
                              <SelectItem value="tds2">TDS 2%</SelectItem>
                            </SelectContent>
                          </Select>
                          <span className="w-20 text-right text-slate-900">
                            - 0.00
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600">Adjustment</span>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={adjustment}
                            onChange={(e) =>
                              setAdjustment(parseFloat(e.target.value) || 0)
                            }
                            className="w-24 text-right h-8 bg-white"
                            data-testid="input-adjustment"
                          />
                          <span className="text-slate-900 w-20 text-right">
                            {adjustment.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      {fromInvoiceNumber && (
                        <div className="flex justify-between py-1 text-slate-600 font-medium">
                          <span>Original Invoice Total</span>
                          <span>{formatCurrency(selectedInvoiceTotal)}</span>
                        </div>
                      )}
                      <div className="pt-4 mt-4 border-t border-slate-200">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-base text-slate-900">
                            Total (₹)
                          </span>
                          <span className="font-bold text-xl text-slate-900">
                            {total.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 z-50 transition-all duration-300 md:left-64">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 px-6 py-4">
          <Button
            variant="outline"
            className="text-slate-500 border-slate-200 bg-slate-50/50 hover:bg-slate-100 hover:text-slate-600 font-medium h-10 md:h-11 px-6 shadow-none"
            onClick={() => setLocation("/credit-notes")}
            data-testid="button-cancel"
          >
            Cancel
          </Button>
          <div className="flex items-center gap-2 md:gap-3 flex-1 justify-end">
            <Button
              variant="outline"
              onClick={() => handleSubmit("DRAFT")}
              disabled={isSubmitting}
              className="gap-2 border-slate-200 text-slate-700 hover:bg-slate-50 font-bold uppercase tracking-wider text-[10px] h-10 md:h-11 px-6 shadow-sm"
              data-testid="button-save-draft"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Save as Draft
            </Button>
            <Button
              onClick={() => handleSubmit("OPEN")}
              disabled={isSubmitting}
              className="bg-[#002e46] hover:bg-[#001f2f] text-white font-bold uppercase tracking-wider text-xs h-10 md:h-11 px-6 shadow-sm"
              data-testid="button-save-open"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Save as Open
            </Button>
          </div>
        </div>
      </div>

      < Dialog
        open={salespersonDialogOpen}
        onOpenChange={setSalespersonDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Salesperson</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name *</Label>
              <Input
                value={newSalespersonName}
                onChange={(e) => setNewSalespersonName(e.target.value)}
                placeholder="Enter salesperson name"
                data-testid="input-new-salesperson-name"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={newSalespersonEmail}
                onChange={(e) => setNewSalespersonEmail(e.target.value)}
                placeholder="Enter email (optional)"
                data-testid="input-new-salesperson-email"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSalespersonDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddSalesperson}
              data-testid="button-confirm-add-salesperson"
            >
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog >
    </div >
  );
}
