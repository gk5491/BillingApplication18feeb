import { useState, useRef, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLocation } from "wouter";
import { useOrganization } from "@/context/OrganizationContext";
import {
  Calendar as CalendarIcon,
  ChevronDown,
  Plus,
  Trash2,
  UploadCloud,
  Save,
  Send,
  Clock,
  Printer,
  Share2,
  X,
  UserPlus,
  HelpCircle,
  Search,
  Check,
  Settings,
  Edit3,
  AlertCircle,
  Receipt,
  ArrowLeft,
  Package,
  FileText,
  ClipboardList,
  Paperclip
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAppStore, type ContactPerson } from "@/lib/store";
import { useTransactionBootstrap } from "@/hooks/use-transaction-bootstrap";
import { calculateItemTax, formatAddressDisplay } from "@/lib/customer-snapshot";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { addDays, endOfMonth, addMonths } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AdvancedDatePicker } from "@/components/ui/advanced-date-picker";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ManageSalespersonsDialog } from "@/components/ManageSalespersonsDialog";

interface InvoiceItem {
  id: number;
  name: string;
  description: string;
  qty: number;
  rate: number;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  gstRate: number; // 0, 5, 12, 18, 28, -1 (Non-taxable)
  productId?: string; // Track the selected product ID
}

interface TaxOption {
  label: string;
  value: number;
}

const DEFAULT_TAX_OPTIONS: TaxOption[] = [
  { label: "Non-taxable", value: -1 },
  { label: "GST0 [0%]", value: 0 },
  { label: "GST5 [5%]", value: 5 },
  { label: "GST12 [12%]", value: 12 },
  { label: "GST18 [18%]", value: 18 },
  { label: "GST28 [28%]", value: 28 },
];

const TERMS_OPTIONS = [
  { value: "due_on_receipt", label: "Due on Receipt", days: 0 },
  { value: "net15", label: "Net 15", days: 15 },
  { value: "net30", label: "Net 30", days: 30 },
  { value: "net45", label: "Net 45", days: 45 },
  { value: "net60", label: "Net 60", days: 60 },
  { value: "end_of_month", label: "Due end of the month", days: -1 },
  { value: "end_of_next_month", label: "Due end of next month", days: -2 },
  { value: "paid", label: "PAID", days: -99 },
];

interface Customer {
  id: string;
  name: string;
  displayName: string;
  companyName: string;
  email: string;
  workPhone: string;
  billingAddress?: any;
}

interface Product {
  id: string;
  name: string;
  description: string;
  rate: string;
  hsnSac: string;
  type: string;
  taxPreference: string;
  intraStateTax: string;
  interStateTax: string;
  usageUnit: string;
  purchaseRate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function InvoiceCreate() {
  const { token } = useAuthStore();
  const [, setLocation] = useLocation();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const { addInvoice, invoices, contactPersons, addContactPerson, pendingCustomerId, setPendingCustomerId } = useAppStore();

  // Transaction bootstrap for auto-population
  const {
    customerId: bootstrapCustomerId,
    customerSnapshot,
    taxRegime,
    isLoadingCustomer,
    customerError,
    formData,
    onCustomerChange
  } = useTransactionBootstrap({ transactionType: 'invoice' });

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const [customerIdFromUrl, setCustomerIdFromUrl] = useState<string | null>(null);
  const [salesOrderId, setSalesOrderId] = useState<string | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [convertAll, setConvertAll] = useState(false);

  const [date, setDate] = useState<Date>(new Date());
  const [dueDate, setDueDate] = useState<Date>(new Date(new Date().setDate(new Date().getDate() + 30)));
  const [hasShipping, setHasShipping] = useState(false);
  const [shippingAmount, setShippingAmount] = useState(0);
  const [paymentReceived, setPaymentReceived] = useState(false);
  const [adjustment, setAdjustment] = useState(0);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [shippingAddress, setShippingAddress] = useState<string>("");

  const [selectedTerms, setSelectedTerms] = useState<string>("net30");
  const [termsSearchQuery, setTermsSearchQuery] = useState("");
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [billingAddress, setBillingAddress] = useState<string>("");
  const [isEditingBillingAddress, setIsEditingBillingAddress] = useState(false);
  const [notes, setNotes] = useState<string>("");
  const [terms, setTerms] = useState<string>("");

  // Sync with bootstrap customer
  useEffect(() => {
    if (bootstrapCustomerId && !selectedCustomerId) {
      setSelectedCustomerId(bootstrapCustomerId);
    }
  }, [bootstrapCustomerId]);

  // Update form data when customer snapshot changes
  useEffect(() => {
    if (customerSnapshot) {
      setBillingAddress(formatAddressDisplay(customerSnapshot.billingAddress));
      setShippingAddress(formatAddressDisplay(customerSnapshot.shippingAddress));

      // Update payment terms if customer has default
      if (customerSnapshot.paymentTerms) {
        const termsMap: Record<string, string> = {
          'Due on Receipt': 'due_on_receipt',
          'Net 15': 'net15',
          'Net 30': 'net30',
          'Net 45': 'net45',
          'Net 60': 'net60'
        };
        const termValue = termsMap[customerSnapshot.paymentTerms] || 'net30';
        setSelectedTerms(termValue);
      }
    }
  }, [customerSnapshot]);

  useEffect(() => {
    if (pendingCustomerId) {
      setSelectedCustomerId(pendingCustomerId);
      setPendingCustomerId(null);
    }
  }, [pendingCustomerId, setPendingCustomerId]);

  useEffect(() => {
    if (selectedCustomerId && !customerSnapshot) {
      const customer = customers.find(c => c.id === selectedCustomerId);
      if (customer) {
        let addressStr = '';
        if (customer.billingAddress) {
          if (typeof customer.billingAddress === 'string') {
            addressStr = customer.billingAddress;
          } else {
            const addr = customer.billingAddress;
            const parts = [addr.street, addr.city, addr.state, addr.country, addr.pincode].filter(Boolean);
            addressStr = parts.join('\n');
          }
        }
        const defaultAddress = addressStr ||
          `${customer.companyName}\n${customer.email}\n${customer.workPhone}`;
        setBillingAddress(defaultAddress);
      }
    }
  }, [selectedCustomerId, customers, customerSnapshot]);

  useEffect(() => {
    const termsOption = TERMS_OPTIONS.find(t => t.value === selectedTerms);
    if (termsOption) {
      let newDueDate: Date;
      if (termsOption.days === -99) {
        newDueDate = date;
      } else if (termsOption.days === -1) {
        newDueDate = endOfMonth(date);
      } else if (termsOption.days === -2) {
        newDueDate = endOfMonth(addMonths(date, 1));
      } else {
        newDueDate = addDays(date, termsOption.days);
      }
      setDueDate(newDueDate);
    }
  }, [selectedTerms, date]);

  useEffect(() => {
    fetchSalespersons();
    fetchCustomers();
    fetchProducts();
    // Handle clone parameter, customerId, and sales order conversion from URL
    const params = new URLSearchParams(window.location.search);
    const cloneFromId = params.get('cloneFrom');
    const urlCustomerId = params.get('customerId');
    const salesOrderIdParam = params.get('salesOrderId');
    const convertAllParam = params.get('convertAll');
    const selectedItemsParam = params.get('selectedItems');

    if (cloneFromId) {
      fetchInvoiceToClone(cloneFromId);
    } else if (urlCustomerId) {
      setCustomerIdFromUrl(urlCustomerId);
    } else if (salesOrderIdParam) {
      setSalesOrderId(salesOrderIdParam);
      setConvertAll(convertAllParam === 'true');
      if (selectedItemsParam) {
        setSelectedItemIds(selectedItemsParam.split(','));
      }
      fetchSalesOrderForConversion(salesOrderIdParam);
    }
  }, [location]);

  // Set customer from URL after customers are loaded
  useEffect(() => {
    if (customerIdFromUrl && customers.length > 0) {
      const customer = customers.find(c => c.id === customerIdFromUrl);
      if (customer) {
        setSelectedCustomerId(customer.id);
        setCustomerIdFromUrl(null);
      }
    }
  }, [customerIdFromUrl, customers]);

  const fetchCustomers = async () => {
    try {
      setCustomersLoading(true);
      const response = await fetch('/api/customers', {
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      });
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

  const fetchProducts = async () => {
    try {
      setProductsLoading(true);
      const response = await fetch('/api/items', {
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched products data:', data);
        const items = data.data || data.items || [];
        console.log('Items array:', items);
        // Filter only active items
        const activeItems = items.filter((item: Product) => item.isActive !== false);
        console.log('Active items:', activeItems);
        setProducts(activeItems);
      } else {
        console.error('Failed to fetch products:', response.statusText, response.status);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setProductsLoading(false);
    }
  };

  const fetchInvoiceToClone = async (invoiceId: string) => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      });
      if (response.ok) {
        const data = await response.json();
        const invoice = data.data;

        // Pre-populate form with cloned invoice data
        setSelectedCustomerId(invoice.customerId);
        setDate(new Date());
        setDueDate(new Date(new Date().setDate(new Date().getDate() + 30)));
        setSelectedTerms(invoice.paymentTerms || 'net30');
        setBillingAddress(invoice.billingAddress?.street || '');
        setSelectedSalesperson(invoice.salesperson || '');
        setHasShipping(invoice.shippingCharges > 0);
        setShippingAmount(invoice.shippingCharges || 0);
        setAdjustment(invoice.adjustment || 0);

        // Pre-populate items
        if (invoice.items && invoice.items.length > 0) {
          const clonedItems = invoice.items.map((item: any, index: number) => ({
            id: Math.random(),
            name: item.name,
            description: item.description || '',
            qty: item.quantity,
            rate: item.rate,
            discountType: item.discountType || 'percentage',
            discountValue: item.discountType === 'percentage'
              ? (item.rate && item.quantity ? (item.discount / (item.rate * item.quantity)) * 100 : 0)
              : (item.discount || 0),
            gstRate: item.tax && item.tax > 0 ? (item.tax / (item.rate * item.quantity - (item.discount || 0))) * 100 : 18
          }));
          setItems(clonedItems);
        }

        toast({
          title: "Invoice Cloned",
          description: "Invoice data has been pre-filled. Edit as needed and save.",
        });
      }
    } catch (error) {
      console.error('Failed to fetch invoice for cloning:', error);
      toast({
        title: "Clone Failed",
        description: "Could not load invoice data for duplication.",
        variant: "destructive"
      });
    }
  };

  const fetchSalesOrderForConversion = async (salesOrderId: string) => {
    try {
      const response = await fetch(`/api/sales-orders/${salesOrderId}`, {
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      });
      if (response.ok) {
        const data = await response.json();
        const salesOrder = data.data;

        // Pre-populate form with sales order data
        setSelectedCustomerId(salesOrder.customerId);
        setDate(new Date());
        setDueDate(new Date(new Date().setDate(new Date().getDate() + 30)));
        setSelectedTerms(salesOrder.paymentTerms || 'net30');
        setBillingAddress(salesOrder.billingAddress?.street || '');
        setShippingAddress(salesOrder.shippingAddress?.street || '');
        setSelectedSalesperson(salesOrder.salesperson || '');

        // Handle items - either all items or selected items
        let itemsToConvert = salesOrder.items || [];

        if (!convertAll && selectedItemIds.length > 0) {
          // Filter to only selected items
          itemsToConvert = salesOrder.items.filter((item: any) =>
            selectedItemIds.includes(item.id)
          );
        }

        if (itemsToConvert.length > 0) {
          const convertedItems = itemsToConvert.map((item: any) => ({
            id: Math.random(),
            name: item.name,
            description: item.description || '',
            qty: item.quantity - (item.invoicedQty || 0), // Only uninvoiced quantity
            rate: item.rate,
            discountType: item.discountType || 'percentage',
            discountValue: item.discountType === 'percentage'
              ? (item.rate && item.quantity ? (item.discount / (item.rate * item.quantity)) * 100 : 0)
              : (item.discount || 0),
            gstRate: item.tax && item.tax > 0 ? (item.tax / (item.rate * item.quantity - (item.discount || 0))) * 100 : 18
          })).filter((item: InvoiceItem) => item.qty > 0); // Only include items with remaining quantity

          setItems(convertedItems);
        }

        toast({
          title: "Sales Order Loaded",
          description: `Converting ${convertAll ? 'all' : 'selected'} items from sales order ${salesOrder.salesOrderNumber}`,
        });
      }
    } catch (error) {
      console.error('Failed to fetch sales order for conversion:', error);
      toast({
        title: "Conversion Failed",
        description: "Could not load sales order data for conversion.",
        variant: "destructive"
      });
    }
  };

  const fetchSalespersons = async () => {
    try {
      const response = await fetch('/api/salespersons', {
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      });
      if (response.ok) {
        const data = await response.json();
        setSalespersons(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch salespersons:', error);
    }
  };

  const filteredTermsOptions = TERMS_OPTIONS.filter(opt =>
    opt.label.toLowerCase().includes(termsSearchQuery.toLowerCase())
  );

  const getTermsLabel = () => {
    const term = TERMS_OPTIONS.find(t => t.value === selectedTerms);
    return term?.label || "Select Terms";
  };

  const handleTermsSelect = (value: string) => {
    setSelectedTerms(value);
    setIsTermsOpen(false);
    setTermsSearchQuery("");
  };

  const handleCustomerChange = (value: string) => {
    if (value === "add_new_customer") {
      setPendingCustomerId(null);
      setLocation("/customers/new?returnTo=invoice");
    } else {
      setSelectedCustomerId(value);
      onCustomerChange(value);
    }
  };

  // Custom Tax Modal State
  const [isTaxModalOpen, setIsTaxModalOpen] = useState(false);
  const [newTaxName, setNewTaxName] = useState("");
  const [newTaxRate, setNewTaxRate] = useState("");
  const [taxOptions, setTaxOptions] = useState<TaxOption[]>(DEFAULT_TAX_OPTIONS);

  // Salesperson state
  const [selectedSalesperson, setSelectedSalesperson] = useState<string>("");
  const [isAddPersonModalOpen, setIsAddPersonModalOpen] = useState(false);
  const [showManageSalespersons, setShowManageSalespersons] = useState(false);
  const [salespersons, setSalespersons] = useState<{ id: string; name: string }[]>([]);
  const [newPersonFirstName, setNewPersonFirstName] = useState("");
  const [newPersonLastName, setNewPersonLastName] = useState("");
  const [newPersonEmail, setNewPersonEmail] = useState("");
  const [newPersonPhone, setNewPersonPhone] = useState("");
  const [newPersonCustomerId, setNewPersonCustomerId] = useState("");

  const { currentOrganization } = useOrganization();
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState("");

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  // Fetch next invoice number
  const getNextInvoiceNumber = async () => {
    try {
      const response = await fetch("/api/invoices/next-number", {
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      });
      const data = await response.json();
      if (data.success) {
        setInvoiceNumber(data.data.invoiceNumber);
      }
    } catch (error) {
      console.error("Error fetching next invoice number:", error);
    }
  };

  useEffect(() => {
    getNextInvoiceNumber();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveInvoice = async (saveStatus: "draft" | "pending" = "pending") => {
    const formattedDate = format(date, "yyyy-MM-dd");
    const formattedDueDate = format(dueDate, "yyyy-MM-dd");

    let finalStatus = saveStatus.toUpperCase();
    if (saveStatus !== "draft") {
      if (selectedTerms === "paid" || paymentReceived) {
        finalStatus = "PAID";
      } else {
        finalStatus = "PENDING";
      }
    } else {
      finalStatus = "DRAFT";
    }

    const invoiceItems = items.map(item => {
      const lineCalc = calculateLineItem(item);
      return {
        id: String(item.id),
        itemId: String(item.id),
        name: item.name,
        description: item.description,
        quantity: item.qty,
        unit: 'pcs',
        rate: item.rate,
        discount: lineCalc.discountAmount,
        discountType: item.discountType,
        tax: lineCalc.taxAmount,
        taxName: item.gstRate > 0 ? `GST${item.gstRate}` : 'Non-taxable',
        amount: lineCalc.total
      };
    });

    // Calculate taxes based on tax regime (intra = CGST+SGST, inter = IGST, exempt = 0)
    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;

    if (taxRegime.regime === 'exempt' || customerSnapshot?.taxPreference === 'tax_exempt') {
      // Tax exempt - no taxes
      cgstAmount = 0;
      sgstAmount = 0;
      igstAmount = 0;
    } else if (taxRegime.regime === 'inter') {
      // Inter-state - use IGST
      cgstAmount = 0;
      sgstAmount = 0;
      igstAmount = totals.totalTax;
    } else {
      // Intra-state - split between CGST and SGST
      cgstAmount = totals.totalTax / 2;
      sgstAmount = totals.totalTax / 2;
      igstAmount = 0;
    }

    const invoiceData = {
      date: formattedDate,
      dueDate: formattedDueDate,
      customerId: selectedCustomerId,
      customerName: customerSnapshot?.displayName || selectedCustomer?.displayName || "Unknown Customer",
      billingAddress: customerSnapshot?.billingAddress || {
        street: billingAddress,
        city: '',
        state: '',
        country: 'India',
        pincode: ''
      },
      shippingAddress: customerSnapshot?.shippingAddress || {
        street: shippingAddress,
        city: '',
        state: '',
        country: 'India',
        pincode: ''
      },
      salesperson: selectedSalesperson,
      paymentTerms: getTermsLabel(),
      items: invoiceItems,
      subTotal: totals.taxableSubtotal,
      shippingCharges: shippingAmount,
      cgst: cgstAmount,
      sgst: sgstAmount,
      igst: igstAmount,
      adjustment: adjustment,
      total: finalTotal,
      customerNotes: '',
      termsAndConditions: '',
      status: finalStatus,
      // Store customer snapshot for immutability
      gstTreatment: customerSnapshot?.gstTreatment || '',
      taxPreference: customerSnapshot?.taxPreference || 'taxable',
      placeOfSupply: customerSnapshot?.placeOfSupply || '',
      gstin: customerSnapshot?.gstin || '',
      customerSnapshot: customerSnapshot
    };

    try {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify(invoiceData)
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: saveStatus === "draft" ? "Invoice Saved as Draft" : "Invoice Created",
          description: `Invoice ${result.data.invoiceNumber} has been ${saveStatus === "draft" ? "saved as draft" : "created"}.`,
        });
        setLocation("/invoices");
      } else {
        throw new Error('Failed to create invoice');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create invoice. Please try again.",
        variant: "destructive"
      });
    }
  };

  const [items, setItems] = useState<InvoiceItem[]>([]);

  // Calculations
  const calculateLineItem = (item: InvoiceItem) => {
    const baseAmount = item.qty * item.rate;

    let discountAmount = 0;
    if (item.discountType === 'percentage') {
      discountAmount = baseAmount * (Math.min(item.discountValue, 100) / 100);
    } else {
      discountAmount = item.discountValue;
    }

    // Ensure discount doesn't exceed base amount
    discountAmount = Math.min(discountAmount, baseAmount);

    const taxableAmount = baseAmount - discountAmount;

    let taxAmount = 0;
    if (item.gstRate > 0) {
      taxAmount = taxableAmount * (item.gstRate / 100);
    }

    return {
      baseAmount,
      discountAmount,
      taxableAmount,
      taxAmount,
      total: taxableAmount + taxAmount
    };
  };

  const totals = items.reduce((acc, item) => {
    const line = calculateLineItem(item);
    return {
      subtotal: acc.subtotal + line.baseAmount, // Usually subtotal is before discount/tax in many systems, but user asked for "Line Total (Qty × Rate − Discount + GST)". Let's treat subtotal as sum of line totals for now?
      // Actually, standard invoice subtotal is usually sum of (Qty * Rate).
      // Then Total Discount.
      // Then Total Tax.
      // Let's follow the user's "Subtotal" requirement.
      // "Editing any item field recalculates: ... Subtotal, Tax Summary, Final Total"
      // I will calculate Subtotal as the sum of (Qty * Rate) - Discount. i.e. Taxable Value.
      taxableSubtotal: acc.taxableSubtotal + line.taxableAmount,
      totalTax: acc.totalTax + line.taxAmount,
      grandTotal: acc.grandTotal + line.total
    };
  }, { subtotal: 0, taxableSubtotal: 0, totalTax: 0, grandTotal: 0 });

  const finalTotal = totals.grandTotal + (hasShipping ? shippingAmount : 0) + adjustment;

  const updateItem = (id: number, field: keyof InvoiceItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const addItem = () => {
    setItems([...items, {
      id: Math.random(),
      name: "",
      description: "",
      productId: undefined,
      qty: 1,
      rate: 0,
      discountType: 'percentage',
      discountValue: 0,
      gstRate: 0
    }]);
  };

  const removeItem = (id: number) => {
    setItems(items.filter(i => i.id !== id));
  };

  const handleAddTax = () => {
    if (newTaxName && newTaxRate) {
      const rate = parseFloat(newTaxRate);
      if (!isNaN(rate)) {
        setTaxOptions([...taxOptions, { label: `${newTaxName} [${rate}%]`, value: rate }]);
        setIsTaxModalOpen(false);
        setNewTaxName("");
        setNewTaxRate("");
      }
    }
  };

  const handleAddNewPerson = () => {
    if (newPersonFirstName && newPersonCustomerId) {
      const newPerson = addContactPerson({
        customerId: newPersonCustomerId,
        firstName: newPersonFirstName,
        lastName: newPersonLastName,
        email: newPersonEmail,
        workPhone: newPersonPhone,
      });
      setSelectedSalesperson(newPerson.id);
      setIsAddPersonModalOpen(false);
      setNewPersonFirstName("");
      setNewPersonLastName("");
      setNewPersonEmail("");
      setNewPersonPhone("");
      setNewPersonCustomerId("");
      toast({
        title: "Contact Person Added",
        description: `${newPersonFirstName} ${newPersonLastName} has been added successfully.`,
      });
    }
  };

  const getSalespersonName = (id: string) => {
    const person = contactPersons.find(p => p.id === id);
    return person ? `${person.firstName} ${person.lastName}` : "";
  };

  return (
    <div className={`mx-auto space-y-4 md:space-y-8 pb-32 relative overflow-y-auto scrollbar-hide max-h-screen ${isMobile ? 'px-0' : 'max-w-7xl px-4 sm:px-6'}`}>

      {isMobile ? (
        <div className="sticky top-0 z-50 bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/invoices")} className="h-9 w-9">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-tight">Create Invoice</h1>
            {salesOrderId && (
              <Badge variant="secondary" className="px-1.5 py-0 h-4 text-[10px] bg-blue-100 text-blue-700 border-blue-200">
                SO Conversion
              </Badge>
            )}
          </div>
        </div>
      ) : (
        <div className="pt-6">
          <div className="flex items-center gap-2 mb-1">
            <Button variant="ghost" size="sm" onClick={() => setLocation("/invoices")} className="h-8 -ml-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          </div>
          <h1 className="text-3xl font-display font-bold text-sidebar tracking-tight">Create Invoice</h1>
          <p className="text-sidebar/60 mt-1 font-medium">Draft a new invoice for your customer.</p>
          {salesOrderId && (
            <div className="mt-4">
              <Badge variant="secondary" className="bg-sidebar/5 text-sidebar/70 border-sidebar/10 px-3 py-1 rounded-full text-xs font-semibold">
                <Receipt className="w-3.5 h-3.5 mr-2 opacity-70" />
                Converting from Sales Order
                {convertAll ? ' (All Items)' : ` (${selectedItemIds.length} Selected Items)`}
              </Badge>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Main Invoice Details */}
        <div className="lg:col-span-3 space-y-6">

          {/* Header Card */}
          <Card className={`border-border/60 shadow-sm ${isMobile ? 'rounded-none border-x-0' : ''}`}>
            <CardContent className={isMobile ? "p-4" : "p-6 md:p-8"}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6">

                {/* Customer Section */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[11px] uppercase tracking-[0.05em] text-sidebar/60 font-bold font-display">Customer</Label>
                    <Select value={selectedCustomerId} onValueChange={handleCustomerChange}>
                      <SelectTrigger className="w-full h-11 bg-white border-border/60 focus:ring-primary/20" data-testid="select-customer">
                        <SelectValue placeholder={customersLoading ? "Loading customers..." : "Select or search customer"} />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-slate-200 shadow-lg z-100 max-h-60 overflow-y-auto scrollbar-hide">
                        {customersLoading ? (
                          <div className="p-2 text-sm text-muted-foreground">Loading customers...</div>
                        ) : customers.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground">No customers found</div>
                        ) : (
                          customers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id} data-testid={`customer-option-${customer.id}`}>
                              {customer.displayName || customer.name}
                            </SelectItem>
                          ))
                        )}
                        <Separator className="my-1" />
                        <SelectItem value="add_new_customer" className="text-primary font-medium">
                          <div className="flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            New Customer
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="p-4 rounded-lg bg-secondary/30 border border-border/50 text-sm space-y-2 wrap-break-word">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-foreground">{selectedCustomer?.displayName || "Select a customer"}</p>
                      {selectedCustomer && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs text-blue-600 hover:text-blue-700"
                          onClick={() => setIsEditingBillingAddress(!isEditingBillingAddress)}
                        >
                          <Edit3 className="h-3 w-3 mr-1" />
                          {isEditingBillingAddress ? "Done" : "Edit"}
                        </Button>
                      )}
                    </div>
                    {isEditingBillingAddress ? (
                      <Textarea
                        value={billingAddress}
                        onChange={(e) => setBillingAddress(e.target.value)}
                        className="min-h-20 text-sm bg-white border-border/60"
                        placeholder="Enter billing address..."
                      />
                    ) : (
                      <div className="text-muted-foreground whitespace-pre-line">
                        {billingAddress || (selectedCustomer ? `${selectedCustomer.companyName}\n${selectedCustomer.email}` : "No address available")}
                      </div>
                    )}
                  </div>
                </div>

                {/* Invoice Meta Data */}
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[11px] uppercase tracking-[0.05em] text-sidebar/60 font-bold font-display">Invoice #</Label>
                      <div className="flex items-center w-full">
                        <span className="bg-secondary/50 border border-r-0 border-border/60 rounded-l-md px-3 py-2.5 text-sm text-muted-foreground whitespace-nowrap">INV-</span>
                        <Input
                          className="flex-1 min-w-0 rounded-l-none border-l-0 focus-visible:ring-0 focus-visible:border-primary"
                          value={invoiceNumber || ""}
                          onChange={(e) => setInvoiceNumber(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[11px] uppercase tracking-[0.05em] text-sidebar/60 font-bold font-display">Order #</Label>
                      <Input placeholder="Optional" className="w-full bg-secondary/20 border-border/60" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4 min-w-0">
                    <div className="space-y-2 min-w-0">
                      <Label className="text-[11px] uppercase tracking-[0.05em] text-sidebar/60 font-bold font-display">Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={`w-full pl-3 text-left font-normal border-border/60 ${isMobile ? 'bg-white' : 'bg-secondary/20'}`}>
                            {date ? format(date, "dd/MM/yyyy") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <AdvancedDatePicker date={date} onSelect={(d: Date) => d && setDate(d)} />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2 min-w-0 relative">
                      <Label className="text-[11px] uppercase tracking-[0.05em] text-sidebar/60 font-bold font-display">Terms</Label>
                      <Popover open={isTermsOpen} onOpenChange={setIsTermsOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={`w-full justify-between border-border/60 font-normal ${isMobile ? 'bg-white' : 'bg-secondary/20'}`}
                          >
                            <span className={selectedTerms === "paid" ? "text-green-600 font-semibold" : ""}>
                              {getTermsLabel()}
                            </span>
                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-60 p-0 bg-white border border-slate-200 shadow-lg z-100" align="start">
                          <div className="p-2 border-b border-slate-100">
                            <div className="relative">
                              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="Search terms..."
                                value={termsSearchQuery}
                                onChange={(e) => setTermsSearchQuery(e.target.value)}
                                className="pl-8 h-9 bg-slate-50 border-slate-200"
                              />
                            </div>
                          </div>
                          <div className="max-h-[200px] overflow-y-auto scrollbar-hide">
                            {filteredTermsOptions.map((option) => (
                              <div
                                key={option.value}
                                className={cn(
                                  "flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-slate-50 transition-colors",
                                  selectedTerms === option.value && "bg-blue-50"
                                )}
                                onClick={() => handleTermsSelect(option.value)}
                              >
                                <span className={cn(
                                  "text-sm",
                                  option.value === "paid" && "text-green-600 font-semibold"
                                )}>
                                  {option.label}
                                </span>
                                {selectedTerms === option.value && (
                                  <Check className="h-4 w-4 text-blue-600" />
                                )}
                              </div>
                            ))}
                            {filteredTermsOptions.length === 0 && (
                              <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                                No terms found
                              </div>
                            )}
                          </div>
                          <div className="border-t border-slate-100 p-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start text-muted-foreground hover:text-foreground"
                            >
                              <Settings className="h-4 w-4 mr-2" />
                              Configure Terms
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2 min-w-0">
                      <Label className="text-[11px] uppercase tracking-[0.05em] text-sidebar/60 font-bold font-display">Due Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={`w-full pl-3 text-left font-normal border-border/60 ${isMobile ? 'bg-white' : 'bg-secondary/20'}`}>
                            {dueDate ? format(dueDate, "dd/MM/yyyy") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <AdvancedDatePicker date={dueDate} onSelect={(d: Date) => d && setDueDate(d)} />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[11px] uppercase tracking-[0.05em] text-sidebar/60 font-bold font-display">Salesperson</Label>
                    <Select value={selectedSalesperson} onValueChange={(val) => {
                      if (val === "manage_salespersons") {
                        setShowManageSalespersons(true);
                      } else {
                        setSelectedSalesperson(val);
                      }
                    }}>
                      <SelectTrigger className={`border-border/60 ${isMobile ? 'bg-white h-11' : 'bg-secondary/20'}`}>
                        <SelectValue placeholder="Select salesperson">
                          {selectedSalesperson || "Select salesperson"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="z-100">
                        <div className="p-2">
                          <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search" className="pl-8 h-9" />
                          </div>
                        </div>
                        {salespersons.map((sp) => (
                          <SelectItem key={sp.id} value={sp.name}>
                            {sp.name}
                          </SelectItem>
                        ))}
                        <Separator className="my-1" />
                        <div
                          className="flex items-center gap-2 p-2 text-sm text-blue-600 cursor-pointer hover:bg-slate-100"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowManageSalespersons(true);
                          }}
                        >
                          <Plus className="h-4 w-4" />
                          Manage Salespersons
                        </div>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator className="my-8 bg-border/60" />

              {/* Items Table / Mobile Cards */}
              <div className={`rounded-lg border-border/60 bg-background relative overflow-visible ${isMobile ? 'border-none' : 'border'}`}>

                {!isMobile ? (
                  <div className="overflow-x-auto overflow-y-visible relative">
                    <Table className="w-full">
                      <TableHeader className="bg-secondary/30">
                        <TableRow className="hover:bg-transparent border-border/40">
                          <TableHead className="w-[30%] min-w-[200px] pl-4 text-[10px] font-bold text-sidebar/50 uppercase tracking-widest font-display">Item Details</TableHead>
                          <TableHead className="w-[10%] min-w-20 text-[10px] font-bold text-sidebar/50 uppercase tracking-widest font-display">Quantity</TableHead>
                          <TableHead className="w-[12%] min-w-[100px] text-[10px] font-bold text-sidebar/50 uppercase tracking-widest font-display">Rate</TableHead>
                          <TableHead className="w-[15%] min-w-[140px] text-[10px] font-bold text-sidebar/50 uppercase tracking-widest font-display">Discount</TableHead>
                          <TableHead className="w-[13%] min-w-[120px] text-[10px] font-bold text-sidebar/50 uppercase tracking-widest font-display">GST</TableHead>
                          <TableHead className="w-[15%] min-w-[100px] text-right pr-4 text-[10px] font-bold text-sidebar/50 uppercase tracking-widest font-display">Amount</TableHead>
                          <TableHead className="w-[5%] min-w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                              <div className="flex flex-col items-center gap-2">
                                <Plus className="h-8 w-8 text-muted-foreground/50" />
                                <p>No items added yet</p>
                                <Button variant="outline" onClick={addItem} className="mt-2 gap-2 border-slate-200 text-sidebar hover:bg-sidebar/5 font-bold font-display uppercase tracking-wider text-[10px] shadow-sm" data-testid="button-add-first-item">
                                  <Plus className="h-4 w-4" /> Add Item
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                        {items.map((item) => {
                          const lineCalc = calculateLineItem(item);
                          return (
                            <TableRow
                              key={item.id}
                              className="hover:bg-secondary/10 border-border/60 align-top relative overflow-visible"
                            >

                              <TableCell className="pl-4 py-3 relative overflow-visible">

                                <div className="space-y-2">
                                  <Select
                                    value={item.productId || ""}
                                    onValueChange={(val) => {
                                      if (val === "create_new_item") {
                                        setLocation('/items/create');
                                        return;
                                      }

                                      console.log('Selected value:', val);
                                      console.log('Available products:', products);

                                      const selectedProduct = products.find(p => p.id === val);
                                      console.log('Found product:', selectedProduct);

                                      if (selectedProduct) {
                                        const rateStr = selectedProduct.rate?.toString() || '0';
                                        const rateNum = parseFloat(rateStr.replace(/[^\d.]/g, '')) || 0;

                                        const gstRate = selectedProduct.intraStateTax?.includes('18') ? 18 :
                                          selectedProduct.intraStateTax?.includes('12') ? 12 :
                                            selectedProduct.intraStateTax?.includes('5') ? 5 :
                                              selectedProduct.intraStateTax?.includes('28') ? 28 : 0;

                                        // Batch all updates into a single state change for better performance
                                        setItems(prevItems => prevItems.map(prevItem => {
                                          if (prevItem.id === item.id) {
                                            return {
                                              ...prevItem,
                                              productId: selectedProduct.id,
                                              name: selectedProduct.name,
                                              description: selectedProduct.description || '',
                                              rate: rateNum,
                                              gstRate: gstRate
                                            };
                                          }
                                          return prevItem;
                                        }));
                                      }
                                    }}
                                  >
                                    <SelectTrigger className="h-9 border-transparent hover:border-border/60 focus:border-primary bg-transparent px-2 -ml-2 font-medium text-base" data-testid={`select-item-${item.id}`}>
                                      <SelectValue placeholder="Select item">{item.name || "Select item"}</SelectValue>
                                    </SelectTrigger>
                                    <SelectContent className="max-h-60 overflow-y-auto scrollbar-hide">
                                      {productsLoading ? (
                                        <div className="p-2 text-sm text-muted-foreground">Loading items...</div>
                                      ) : products.length === 0 ? (
                                        <div className="p-2 text-sm text-muted-foreground">No items found</div>
                                      ) : (
                                        [
                                          ...products.map((product) => {
                                            const rateStr = product.rate?.toString() || '0';
                                            const rateNum = parseFloat(rateStr.replace(/[^\d.]/g, '')) || 0;
                                            return (
                                              <SelectItem key={product.id} value={product.id} data-testid={`item-option-${product.id}`}>
                                                {product.name} {rateNum > 0 ? `- ₹${rateNum.toFixed(2)}` : ''}
                                              </SelectItem>
                                            );
                                          }),
                                          <Separator key="separator" className="my-1" />,
                                          <SelectItem key="create-new" value="create_new_item" className="text-primary font-medium cursor-pointer">
                                            + Create New Item
                                          </SelectItem>
                                        ]
                                      )}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </TableCell>
                              <TableCell className="py-3 align-top relative overflow-visible">

                                <Input
                                  type="number"
                                  min="0"
                                  value={item.qty}
                                  onChange={(e) => updateItem(item.id, "qty", parseFloat(e.target.value) || 0)}
                                  className="h-9 w-full min-w-[70px] bg-transparent border-border/60 focus:bg-background"
                                  data-testid={`input-item-qty-${item.id}`}
                                />
                              </TableCell>
                              <TableCell className="py-3 align-top relative overflow-visible">

                                <Input
                                  type="number"
                                  min="0"
                                  value={item.rate}
                                  onChange={(e) => updateItem(item.id, "rate", parseFloat(e.target.value) || 0)}
                                  className="h-9 w-full min-w-[90px] bg-transparent border-border/60 focus:bg-background"
                                />
                              </TableCell>
                              <TableCell className="py-3 align-top relative overflow-visible">

                                <div className="flex shadow-sm rounded-md">
                                  <div className="relative flex-1">
                                    <Input
                                      type="number"
                                      min="0"
                                      max={item.discountType === 'percentage' ? 100 : undefined}
                                      value={item.discountValue}
                                      onChange={(e) => updateItem(item.id, "discountValue", parseFloat(e.target.value) || 0)}
                                      className="h-9 w-full min-w-20 rounded-r-none bg-transparent border-border/60 focus:bg-background border-r-0"
                                    />
                                  </div>
                                  <Select
                                    value={item.discountType}
                                    onValueChange={(val: 'percentage' | 'flat') => updateItem(item.id, "discountType", val)}
                                  >
                                    <SelectTrigger className="h-9 w-[55px] rounded-l-none border-l-0 bg-secondary/20 px-2">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="percentage">%</SelectItem>
                                      <SelectItem value="flat">Rs</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                {lineCalc.discountAmount > 0 && (
                                  <span className="text-[10px] text-green-600 mt-1 block pl-1">
                                    -Rs {lineCalc.discountAmount.toFixed(2)}
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="py-3 align-top relative overflow-visible">

                                <Select
                                  value={item.gstRate.toString()}
                                  onValueChange={(val) => {
                                    if (val === "new") {
                                      setIsTaxModalOpen(true);
                                    } else {
                                      updateItem(item.id, "gstRate", parseFloat(val));
                                    }
                                  }}
                                >
                                  <SelectTrigger className="h-9 w-full min-w-[110px] border-border/60 bg-transparent">
                                    <SelectValue placeholder="Tax" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {taxOptions.map(opt => (
                                      <SelectItem key={opt.label} value={opt.value.toString()}>
                                        {opt.label}
                                      </SelectItem>
                                    ))}
                                    <Separator className="my-1" />
                                    <SelectItem value="new" className="text-primary font-medium cursor-pointer">
                                      + New Tax
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell className="text-right font-medium py-3 align-top pr-4">
                                <div className="h-9 flex items-center justify-end">
                                  Rs {lineCalc.total.toFixed(2)}
                                </div>
                              </TableCell>
                              <TableCell className="py-3 align-top relative overflow-visible">

                                <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {items.length === 0 && (
                      <div className="p-8 text-center bg-white rounded-xl border border-dashed border-slate-200">
                        <Package className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm text-slate-500">No items added yet</p>
                      </div>
                    )}
                    {items.map((item, index) => {
                      const lineCalc = calculateLineItem(item);
                      return (
                        <div key={item.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                          <div className="bg-slate-50/80 px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Item #{index + 1}</span>
                            <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} className="h-7 w-7 text-slate-400 hover:text-red-500">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                          <div className="p-4 space-y-4">
                            {/* Item Selection */}
                            <div className="space-y-1.5">
                              <Label className="text-[11px] font-semibold text-slate-400 uppercase">Item Name</Label>
                              <Select
                                value={item.productId || ""}
                                onValueChange={(val) => {
                                  if (val === "create_new_item") {
                                    setLocation('/items/create');
                                    return;
                                  }
                                  const selectedProduct = products.find(p => p.id === val);
                                  if (selectedProduct) {
                                    const rateStr = selectedProduct.rate?.toString() || '0';
                                    const rateNum = parseFloat(rateStr.replace(/[^\d.]/g, '')) || 0;
                                    const gstRate = selectedProduct.intraStateTax?.includes('18') ? 18 :
                                      selectedProduct.intraStateTax?.includes('12') ? 12 :
                                        selectedProduct.intraStateTax?.includes('5') ? 5 :
                                          selectedProduct.intraStateTax?.includes('28') ? 28 : 0;

                                    setItems(prevItems => prevItems.map(prevItem => {
                                      if (prevItem.id === item.id) {
                                        return {
                                          ...prevItem,
                                          productId: selectedProduct.id,
                                          name: selectedProduct.name,
                                          description: selectedProduct.description || '',
                                          rate: rateNum,
                                          gstRate: gstRate
                                        };
                                      }
                                      return prevItem;
                                    }));
                                  }
                                }}
                              >
                                <SelectTrigger className="h-11 bg-slate-50 border-slate-200">
                                  <SelectValue placeholder="Select item">{item.name || "Choose item..."}</SelectValue>
                                </SelectTrigger>
                                <SelectContent className="max-h-60">
                                  {products.map((product) => (
                                    <SelectItem key={product.id} value={product.id}>
                                      {product.name}
                                    </SelectItem>
                                  ))}
                                  <Separator className="my-1" />
                                  <SelectItem value="create_new_item" className="text-primary">+ Create New</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <Label className="text-[11px] font-semibold text-slate-400 uppercase">Qty</Label>
                                <Input
                                  type="number"
                                  value={item.qty}
                                  onChange={(e) => updateItem(item.id, "qty", parseFloat(e.target.value) || 0)}
                                  className="h-11 bg-slate-50 border-slate-200"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-[11px] font-semibold text-slate-400 uppercase">Rate</Label>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
                                  <Input
                                    type="number"
                                    value={item.rate}
                                    onChange={(e) => updateItem(item.id, "rate", parseFloat(e.target.value) || 0)}
                                    className="h-11 pl-7 bg-slate-50 border-slate-200"
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <Label className="text-[11px] font-semibold text-slate-400 uppercase">Discount</Label>
                                <div className="flex border border-slate-200 rounded-lg overflow-hidden h-11">
                                  <Input
                                    type="number"
                                    value={item.discountValue}
                                    onChange={(e) => updateItem(item.id, "discountValue", parseFloat(e.target.value) || 0)}
                                    className="flex-1 border-none bg-slate-50 rounded-none focus-visible:ring-0"
                                  />
                                  <Select
                                    value={item.discountType}
                                    onValueChange={(val: 'percentage' | 'flat') => updateItem(item.id, "discountType", val)}
                                  >
                                    <SelectTrigger className="w-14 border-y-0 border-r-0 border-l border-slate-200 bg-slate-100 px-2 rounded-none">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="percentage">%</SelectItem>
                                      <SelectItem value="flat">₹</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-[11px] font-semibold text-slate-400 uppercase">Tax GST</Label>
                                <Select
                                  value={item.gstRate.toString()}
                                  onValueChange={(val) => {
                                    if (val === "new") {
                                      setIsTaxModalOpen(true);
                                    } else {
                                      updateItem(item.id, "gstRate", parseFloat(val));
                                    }
                                  }}
                                >
                                  <SelectTrigger className="h-11 bg-slate-50 border-slate-200">
                                    <SelectValue placeholder="Tax" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {taxOptions.map(opt => (
                                      <SelectItem key={opt.label} value={opt.value.toString()}>
                                        {opt.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                              <span className="text-sm font-medium text-slate-600">Line Amount</span>
                              <span className="text-lg font-bold text-slate-900 font-mono">₹{lineCalc.total.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-secondary/10 border-t border-border/60 gap-4">
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={addItem} className="gap-2 border-slate-200 text-sidebar hover:bg-sidebar/5 font-bold font-display uppercase tracking-wider text-[10px] shadow-sm">
                      <Plus className="h-4 w-4" /> Add Line Item
                    </Button>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="gap-2 text-sidebar hover:text-sidebar hover:bg-sidebar/10 font-bold font-display uppercase tracking-wider text-[10px]">
                          <UploadCloud className="h-4 w-4" /> Add Items in Bulk
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Bulk Add Items</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <p className="text-sm text-muted-foreground">Paste items from a spreadsheet below.</p>
                          <Textarea placeholder="Item Name, Quantity, Rate" className="h-48 font-mono text-sm" />
                          <Button>Process & Add</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    Total Rows: {items.length}
                  </div>
                </div>
              </div>

              {/* Footer Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12 pb-20">
                <div className="lg:col-span-2 space-y-6 order-2 md:order-1">
                  <div className="space-y-4">
                    <Label className="text-[11px] uppercase tracking-[0.05em] text-sidebar/60 font-bold font-display flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Customer Notes
                    </Label>
                    <div className={`p-4 rounded-xl border border-border/40 ${isMobile ? 'bg-white' : 'bg-secondary/10'}`}>
                      <Textarea
                        placeholder="Will be displayed on the invoice"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="min-h-[100px] border-none bg-transparent focus-visible:ring-0 p-0 resize-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-[11px] uppercase tracking-[0.05em] text-sidebar/60 font-bold font-display flex items-center gap-2">
                      <ClipboardList className="h-4 w-4" />
                      Terms & Conditions
                    </Label>
                    <div className={`p-4 rounded-xl border border-border/40 ${isMobile ? 'bg-white' : 'bg-secondary/10'}`}>
                      <Textarea
                        placeholder="Define your terms and conditions..."
                        value={terms}
                        onChange={(e) => setTerms(e.target.value)}
                        className="min-h-[100px] border-none bg-transparent focus-visible:ring-0 p-0 resize-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-[11px] uppercase tracking-[0.05em] text-sidebar/60 font-bold font-display flex items-center gap-2">
                      <Paperclip className="h-4 w-4" />
                      Attachments
                    </Label>
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border/60 rounded-xl cursor-pointer bg-secondary/10 hover:bg-secondary/20 transition-all group">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Plus className="w-8 h-8 mb-2 text-muted-foreground group-hover:scale-110 transition-transform" />
                          <p className="text-sm text-muted-foreground">Click to upload or drag and drop</p>
                          <p className="text-xs text-muted-foreground/60 mt-1">Maximum file size: 5MB</p>
                        </div>
                        <input type="file" className="hidden" multiple onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          setAttachments((prev) => [...prev, ...files]);
                        }} />
                      </label>
                    </div>

                    {attachments.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                        {attachments.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-background border border-border/60 rounded-lg group animate-in fade-in slide-in-from-top-1">
                            <div className="flex items-center gap-3 overflow-hidden">
                              <FileText className="h-4 w-4 text-primary shrink-0" />
                              <span className="text-sm truncate">{file.name}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== index))}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className={`space-y-4 p-6 rounded-xl border border-border/40 h-fit order-1 md:order-2 ${isMobile ? 'bg-slate-50 border-x-0 rounded-none -mx-0' : 'bg-secondary/10'}`}>
                  <div className="flex justify-between text-sm">
                    <span className="text-sidebar/60 font-medium">Subtotal (Taxable)</span>
                    <span className="font-semibold text-sidebar">Rs {totals.taxableSubtotal.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-sidebar/60 font-medium">Shipping Charges</span>
                      <Switch checked={hasShipping} onCheckedChange={setHasShipping} className="scale-75 data-[state=checked]:bg-primary" />
                    </div>
                    {hasShipping ? (
                      <Input
                        type="number"
                        value={shippingAmount}
                        onChange={(e) => setShippingAmount(parseFloat(e.target.value) || 0)}
                        className="w-24 h-8 text-right bg-white border-sidebar/10 focus:border-primary/30"
                        placeholder="0.00"
                      />
                    ) : (
                      <span className="text-sidebar/30">-</span>
                    )}
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-sidebar/60 font-medium">Total GST</span>
                    <span className="font-semibold text-sidebar">Rs {totals.totalTax.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between items-center text-sm pt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sidebar/60 font-medium">Adjustment</span>
                      <Popover>
                        <PopoverTrigger>
                          <HelpCircle className="h-3 w-3 text-sidebar/40 hover:text-sidebar/60" />
                        </PopoverTrigger>
                        <PopoverContent className="text-xs w-60 bg-sidebar text-white border-none shadow-xl">
                          Add any positive or negative adjustment to the final total (e.g. Rounding off).
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={adjustment}
                        onChange={(e) => setAdjustment(parseFloat(e.target.value) || 0)}
                        className="w-24 h-8 text-right bg-white border-sidebar/10 focus:border-primary/30"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <Separator className="bg-sidebar/10" />

                  <div className="flex justify-between items-baseline pt-2">
                    <span className="font-bold text-lg text-sidebar font-display">Total</span>
                    <span className="font-bold text-2xl text-primary font-display">Rs {finalTotal.toFixed(2)}</span>
                  </div>

                  <div className="pt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Switch id="payment-received" checked={paymentReceived} onCheckedChange={setPaymentReceived} />
                      <Label htmlFor="payment-received" className="font-medium cursor-pointer">I have received the payment</Label>
                    </div>

                    {paymentReceived && (
                      <div className="p-4 bg-background border border-border/60 rounded-lg space-y-3 animate-in slide-in-from-top-2 fade-in duration-200">
                        <div className="grid grid-cols-2 gap-3">
                          <Select defaultValue="cash">
                            <SelectTrigger><SelectValue placeholder="Mode" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cash">Cash</SelectItem>
                              <SelectItem value="bank">Bank Transfer</SelectItem>
                              <SelectItem value="check">Check</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input placeholder="Amount" defaultValue={finalTotal.toFixed(2)} />
                        </div>
                        <div className="flex items-center gap-2 text-xs text-primary cursor-pointer hover:underline">
                          <Plus className="h-3 w-3" /> Add another payment (Split)
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>
        </div>
      </div>

      {/* Sticky Bottom Bar */}
      <div className={`fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-sidebar/10 z-50 transition-all duration-300 ${isMobile ? 'pb-safe' : 'md:left-64'}`}>
        <div className={`max-w-6xl mx-auto flex items-center justify-between gap-3 ${isMobile ? 'px-4 py-3' : 'px-6 py-4'}`}>
          <Button variant="outline" className="text-slate-500 border-slate-200 bg-slate-50/50 hover:bg-slate-100 hover:text-slate-600 font-medium h-10 md:h-11 px-6 shadow-none" onClick={() => setLocation("/invoices")}>
            {isMobile ? <X className="h-5 w-5" /> : "Cancel"}
          </Button>
          <div className="flex items-center gap-2 md:gap-3 flex-1 justify-end">
            {!isMobile && (
              <Button variant="outline" className="gap-2 border-slate-200 text-sidebar hover:bg-sidebar/5 font-bold font-display uppercase tracking-wider text-[10px] h-10 md:h-11 px-6 shadow-sm" onClick={() => handleSaveInvoice("draft")}>
                <Save className="h-4 w-4" /> Save as Draft
              </Button>
            )}
            <Button variant="outline" className={`${isMobile ? 'px-3 h-10' : 'gap-2 px-6'} border-slate-200 text-sidebar hover:bg-sidebar/5 font-bold font-display uppercase tracking-wider text-[10px] h-10 md:h-11 shadow-sm`} onClick={() => handleSaveInvoice("pending")}>
              {isMobile ? <Clock className="h-5 w-5" /> : <><Clock className="h-4 w-4" /> Schedule</>}
            </Button>
            <div className="h-8 w-px bg-sidebar/10 mx-1 hidden md:block"></div>
            <div className="flex items-center rounded-lg bg-sidebar shadow-sm hover:shadow-md hover:translate-y-[-1px] transition-all overflow-hidden flex-1 md:flex-none max-w-[180px] md:max-w-none">
              <Button className="flex-1 rounded-none border-r border-white/20 bg-transparent shadow-none hover:bg-white/10 h-10 md:h-11 px-6 text-white font-bold font-display uppercase tracking-wider text-xs" onClick={() => handleSaveInvoice("pending")}>
                <Send className="h-4 w-4 mr-2" />
                <span>{isMobile ? "Save" : "Save & Send"}</span>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="rounded-none px-2 bg-transparent shadow-none hover:bg-white/10 h-10 md:h-11 text-white">
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-1">
                  <DropdownMenuItem onClick={() => handleSaveInvoice("pending")} className="rounded-md focus:bg-sidebar/5">
                    <Printer className="mr-2 h-4 w-4 opacity-70" /> Save and Print
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSaveInvoice("pending")} className="rounded-md focus:bg-sidebar/5">
                    <Share2 className="mr-2 h-4 w-4 opacity-70" /> Save and Share
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSaveInvoice("pending")} className="rounded-md focus:bg-sidebar/5">
                    <Clock className="mr-2 h-4 w-4 opacity-70" /> Save and Send Later
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* New Tax Modal */}
      <Dialog open={isTaxModalOpen} onOpenChange={setIsTaxModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Tax</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tax-name" className="text-right">
                Name
              </Label>
              <Input
                id="tax-name"
                placeholder="e.g., GST28"
                className="col-span-3"
                value={newTaxName}
                onChange={(e) => setNewTaxName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tax-rate" className="text-right">
                Rate (%)
              </Label>
              <Input
                id="tax-rate"
                type="number"
                placeholder="28"
                className="col-span-3"
                value={newTaxRate}
                onChange={(e) => setNewTaxRate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTaxModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAddTax}>Save Tax</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add New Person Modal */}
      <Dialog open={isAddPersonModalOpen} onOpenChange={setIsAddPersonModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Contact Person</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="person-customer">Customer *</Label>
              <Select value={newPersonCustomerId} onValueChange={setNewPersonCustomerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent className="z-200">
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="person-firstname">First Name *</Label>
                <Input
                  id="person-firstname"
                  placeholder="First Name"
                  value={newPersonFirstName}
                  onChange={(e) => setNewPersonFirstName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="person-lastname">Last Name</Label>
                <Input
                  id="person-lastname"
                  placeholder="Last Name"
                  value={newPersonLastName}
                  onChange={(e) => setNewPersonLastName(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="person-email">Email</Label>
              <Input
                id="person-email"
                type="email"
                placeholder="email@example.com"
                value={newPersonEmail}
                onChange={(e) => setNewPersonEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="person-phone">Work Phone</Label>
              <Input
                id="person-phone"
                placeholder="+1 (555) 123-4567"
                value={newPersonPhone}
                onChange={(e) => setNewPersonPhone(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddPersonModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAddNewPerson} disabled={!newPersonFirstName || !newPersonCustomerId}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Person
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ManageSalespersonsDialog
        open={showManageSalespersons}
        onOpenChange={setShowManageSalespersons}
        onSalespersonChange={fetchSalespersons}
      />
    </div>
  );
}