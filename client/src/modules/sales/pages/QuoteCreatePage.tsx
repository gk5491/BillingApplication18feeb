import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Plus, X, Search, Upload, Pencil, AlertCircle, ArrowLeft, Loader2, FileText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ManageSalespersonsDialog } from "@/components/ManageSalespersonsDialog";
import { useTransactionBootstrap } from "@/hooks/use-transaction-bootstrap";
import { formatAddressDisplay } from "@/lib/customer-snapshot";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface Customer {
  id: string;
  name: string;
  email: string;
  billingAddress: any;
  shippingAddress: any;
}

interface Item {
  id: string;
  name: string;
  description: string;
  rate: string;
  hsnSac: string;
  intraStateTax?: string;
  interStateTax?: string;
}

interface QuoteItem {
  id: string;
  itemId: string;
  name: string;
  description: string;
  quantity: number;
  rate: number;
  discount: number;
  discountType: string;
  tax: string;
  amount: number;
}

const taxOptions = [
  { value: "none", label: "No Tax" },
  { value: "GST0", label: "GST (0%)" },
  { value: "GST5", label: "GST (5%)" },
  { value: "GST12", label: "GST (12%)" },
  { value: "GST18", label: "GST (18%)" },
  { value: "GST28", label: "GST (28%)" },
];

const getTaxRate = (taxValue: string): number => {
  const rates: Record<string, number> = {
    "none": 0,
    "GST0": 0,
    "GST5": 5,
    "GST12": 12,
    "GST18": 18,
    "GST28": 28,
  };
  return rates[taxValue] || 0;
};

interface AttachedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  data: string;
}

export default function QuoteCreatePage() {
  const [location, setLocation] = useLocation();

  // Transaction bootstrap for auto-population
  const {
    customerId: bootstrapCustomerId,
    customerSnapshot,
    taxRegime,
    isLoadingCustomer,
    customerError,
    formData: bootstrapFormData,
    onCustomerChange
  } = useTransactionBootstrap({ transactionType: 'quote' });

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [nextQuoteNumber, setNextQuoteNumber] = useState("QT-000005");
  const [showManageSalespersons, setShowManageSalespersons] = useState(false);
  const [salespersons, setSalespersons] = useState<{ id: string; name: string }[]>([]);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    customerId: "",
    customerName: "",
    billingAddress: {},
    shippingAddress: {},
    quoteNumber: "",
    referenceNumber: "",
    quoteDate: new Date().toISOString().split('T')[0],
    expiryDate: "",
    salesperson: "",
    projectName: "",
    subject: "",
    customerNotes: "",
    termsAndConditions: "",
    shippingCharges: 0,
    tdsType: "",
    adjustment: 0,
    adjustmentDescription: "",
  });

  // Sync with bootstrap customer
  useEffect(() => {
    if (bootstrapCustomerId && !formData.customerId) {
      setFormData(prev => ({ ...prev, customerId: bootstrapCustomerId }));
    }
  }, [bootstrapCustomerId]);

  // Update form data when customer snapshot changes
  useEffect(() => {
    if (customerSnapshot) {
      setFormData(prev => ({
        ...prev,
        customerName: customerSnapshot.displayName || customerSnapshot.customerName
      }));
    }
  }, [customerSnapshot]);

  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([
    {
      id: "1",
      itemId: "",
      name: "",
      description: "",
      quantity: 1,
      rate: 0,
      discount: 0,
      discountType: "percentage",
      tax: "none",
      amount: 0,
    }
  ]);

  useEffect(() => {
    fetchCustomers();
    fetchItems();
    fetchNextQuoteNumber();
    fetchSalespersons();

    // Handle clone parameter
    const params = new URLSearchParams(location.split('?')[1]);
    const cloneFromId = params.get('cloneFrom');
    if (cloneFromId) {
      fetchQuoteToClone(cloneFromId);
    }
  }, [location]);

  const fetchQuoteToClone = async (quoteId: string) => {
    try {
      const response = await fetch(`/api/quotes/${quoteId}`);
      if (response.ok) {
        const data = await response.json();
        const quote = data.data;

        // Pre-populate form with cloned quote data
        setFormData(prev => ({
          ...prev,
          customerId: quote.customerId || "",
          customerName: quote.customerName || "",
          referenceNumber: quote.referenceNumber || "",
          quoteDate: new Date().toISOString().split('T')[0],
          expiryDate: quote.expiryDate ? new Date(quote.expiryDate).toISOString().split('T')[0] : "",
          salesperson: quote.salesperson || "",
          projectName: quote.projectName || "",
          subject: quote.subject || "",
          customerNotes: quote.customerNotes || "",
          termsAndConditions: quote.termsAndConditions || "",
          shippingCharges: quote.shippingCharges || 0,
          adjustment: quote.adjustment || 0,
        }));

        // Pre-populate items
        if (quote.items && quote.items.length > 0) {
          const clonedItems = quote.items.map((item: any, index: number) => ({
            id: String(Date.now() + index),
            itemId: item.itemId || "",
            name: item.name || "",
            description: item.description || "",
            quantity: item.quantity || 1,
            rate: item.rate || 0,
            discount: item.discount || 0,
            discountType: item.discountType || "percentage",
            tax: item.taxName || "none",
            amount: item.amount || 0,
          }));
          setQuoteItems(clonedItems);
        }
      }
    } catch (error) {
      console.error('Failed to fetch quote for cloning:', error);
    }
  };

  const fetchSalespersons = async () => {
    try {
      const response = await fetch('/api/salespersons');
      if (response.ok) {
        const data = await response.json();
        setSalespersons(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch salespersons:', error);
    }
  };

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

  const fetchItems = async () => {
    try {
      const response = await fetch('/api/items');
      if (response.ok) {
        const data = await response.json();
        setItems(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch items:', error);
    }
  };

  const fetchNextQuoteNumber = async () => {
    try {
      const response = await fetch('/api/quotes/next-number');
      if (response.ok) {
        const data = await response.json();
        setNextQuoteNumber(data.data?.quoteNumber || "QT-000005");
        setFormData(prev => ({ ...prev, quoteNumber: data.data?.quoteNumber || "QT-000005" }));
      }
    } catch (error) {
      console.error('Failed to fetch next quote number:', error);
    }
  };

  const handleCustomerChange = (customerId: string) => {
    if (customerId === "add_new_customer") {
      setLocation("/customers/new?returnTo=quotes/new");
      return;
    }
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setFormData(prev => ({
        ...prev,
        customerId,
        customerName: customer.name,
        billingAddress: customer.billingAddress || {},
        shippingAddress: customer.shippingAddress || customer.billingAddress || {}
      }));
    }
  };

  const handleItemChange = (index: number, itemId: string) => {
    if (itemId === "add_new_item") {
      setLocation("/products/new?returnTo=quotes/new");
      return;
    }
    const item = items.find(i => i.id === itemId);
    if (item) {
      const updatedItems = [...quoteItems];
      const rate = parseFloat(item.rate.replace(/[₹,]/g, '')) || 0;

      // Auto-populate tax from item
      // Default to intraStateTax if available, map it to our tax options
      let taxValue = "none";
      if (item.intraStateTax) {
        // Map "GST18" -> "GST18", "GST (18%)" -> "GST18" logic if needed
        // Assuming item.intraStateTax stores values like "GST18", "GST12" etc matching our taxOptions values
        taxValue = item.intraStateTax;
      }

      updatedItems[index] = {
        ...updatedItems[index],
        itemId,
        name: item.name,
        description: item.description || '',
        rate,
        tax: taxValue,
        amount: rate * updatedItems[index].quantity
      };
      setQuoteItems(updatedItems);
    }
  };

  const updateQuoteItem = (index: number, field: string, value: any) => {
    const updatedItems = [...quoteItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };

    const quantity = updatedItems[index].quantity;
    const rate = updatedItems[index].rate;
    const discount = updatedItems[index].discount;
    const discountType = updatedItems[index].discountType;

    let subtotal = quantity * rate;
    if (discountType === 'percentage') {
      subtotal = subtotal - (subtotal * discount / 100);
    } else {
      subtotal = subtotal - discount;
    }

    updatedItems[index].amount = Math.max(0, subtotal);
    setQuoteItems(updatedItems);
  };

  const addNewRow = () => {
    setQuoteItems([
      ...quoteItems,
      {
        id: String(Date.now()),
        itemId: "",
        name: "",
        description: "",
        quantity: 1,
        rate: 0,
        discount: 0,
        discountType: "percentage",
        tax: "none",
        amount: 0,
      }
    ]);
  };

  const removeRow = (index: number) => {
    if (quoteItems.length > 1) {
      setQuoteItems(quoteItems.filter((_, i) => i !== index));
    }
  };

  const calculateSubTotal = () => {
    return quoteItems.reduce((sum, item) => sum + item.amount, 0);
  };

  const calculateTax = () => {
    return quoteItems.reduce((sum, item) => {
      const taxRate = getTaxRate(item.tax);
      return sum + (item.amount * taxRate / 100);
    }, 0);
  };

  const calculateTotal = () => {
    const subTotal = calculateSubTotal();
    const tax = calculateTax();
    const shipping = formData.shippingCharges || 0;
    const adjustment = formData.adjustment || 0;
    return subTotal + tax + shipping + adjustment;
  };

  const handleSubmit = async (status: string) => {
    setLoading(true);
    try {
      const subTotal = calculateSubTotal();
      const taxAmount = calculateTax();

      const quoteData = {
        customerId: formData.customerId,
        customerName: formData.customerName,
        billingAddress: formData.billingAddress || {},
        shippingAddress: formData.shippingAddress || formData.billingAddress || {},
        quoteNumber: formData.quoteNumber,
        referenceNumber: formData.referenceNumber,
        date: formData.quoteDate,
        expiryDate: formData.expiryDate,
        salesperson: formData.salesperson,
        projectName: formData.projectName,
        subject: formData.subject,
        items: quoteItems.filter(item => item.itemId).map(item => ({
          id: item.id,
          itemId: item.itemId,
          name: item.name,
          description: item.description,
          quantity: item.quantity,
          unit: "",
          rate: item.rate,
          discount: item.discount,
          discountType: item.discountType,
          tax: getTaxRate(item.tax),
          taxName: item.tax,
          amount: item.amount
        })),
        subTotal,
        shippingCharges: formData.shippingCharges,
        cgst: taxRegime === 'inter-state' ? 0 : taxAmount / 2,
        sgst: taxRegime === 'inter-state' ? 0 : taxAmount / 2,
        igst: taxRegime === 'inter-state' ? taxAmount : 0,
        adjustment: formData.adjustment,
        total: calculateTotal(),
        customerNotes: formData.customerNotes,
        termsAndConditions: formData.termsAndConditions,
        status,
        createdBy: "Admin User",
        attachments: attachedFiles.map(f => ({ id: f.id, name: f.name, size: f.size, type: f.type }))
      };

      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quoteData)
      });

      if (response.ok) {
        setLocation('/quotes');
      } else {
        console.error('Failed to create quote');
      }
    } catch (error) {
      console.error('Error creating quote:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const maxFiles = 5;
    const maxSize = 10 * 1024 * 1024;

    if (attachedFiles.length + files.length > maxFiles) {
      alert(`You can only upload a maximum of ${maxFiles} files`);
      return;
    }

    Array.from(files).forEach(file => {
      if (file.size > maxSize) {
        alert(`File ${file.name} exceeds 10MB limit`);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const newFile: AttachedFile = {
          id: String(Date.now() + Math.random()),
          name: file.name,
          size: file.size,
          type: file.type,
          data: reader.result as string
        };
        setAttachedFiles(prev => [...prev, newFile]);
      };
      reader.readAsDataURL(file);
    });

    event.target.value = '';
  };

  const removeFile = (fileId: string) => {
    setAttachedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 h-screen animate-in slide-in-from-right duration-300">
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 z-10 flex-shrink-0">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation('/quotes')}
            className="h-9 w-9 hover:bg-sidebar/10 text-sidebar/70 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-slate-900 font-display">New Quote</h1>
        </div>
        <div className="flex items-center gap-3">
        </div>
      </div>

      <div className="flex-1 overflow-y-auto invisible-scrollbar">
        <div className="max-w-6xl mx-auto p-8 pb-32">
          <div className="space-y-8">
            {/* Quote Details Card */}
            <Card className="overflow-hidden border-slate-200 shadow-sm">
              <CardContent className="p-0">
                <div className="px-6 py-3 border-b border-slate-100 bg-sidebar/5">
                  <h2 className="text-[11px] font-bold text-sidebar uppercase tracking-widest font-display">Quote Details</h2>
                </div>
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-medium after:content-['*'] after:ml-0.5 after:text-red-500">Customer Name</Label>
                      <Select value={formData.customerId} onValueChange={handleCustomerChange}>
                        <SelectTrigger className="bg-white border-slate-200">
                          <SelectValue placeholder="Select or add a customer" />
                        </SelectTrigger>
                        <SelectContent>
                          {customers.map(customer => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.name}
                            </SelectItem>
                          ))}
                          <Separator className="my-1" />
                          <SelectItem value="add_new_customer" className="text-blue-600 font-medium">
                            <div className="flex items-center gap-2">
                              <Plus className="h-4 w-4" />
                              New Customer
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Placeholder for alignment if needed, or remove */}
                    <div className="hidden"></div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-medium after:content-['*'] after:ml-0.5 after:text-red-500">Quote Number</Label>
                      <div className="flex gap-2">
                        <Input
                          value={formData.quoteNumber || nextQuoteNumber}
                          onChange={(e) => setFormData(prev => ({ ...prev, quoteNumber: e.target.value }))}
                          className="flex-1 font-mono bg-slate-50"
                        />
                        <Button variant="outline" size="icon" className="h-10 w-10 shrink-0">
                          <Pencil className="h-4 w-4 text-slate-500" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-medium">Reference Number</Label>
                      <Input
                        value={formData.referenceNumber}
                        onChange={(e) => setFormData(prev => ({ ...prev, referenceNumber: e.target.value }))}
                        className="bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-medium after:content-['*'] after:ml-0.5 after:text-red-500">Quote Date</Label>
                      <Input
                        type="date"
                        value={formData.quoteDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, quoteDate: e.target.value }))}
                        className="bg-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-medium">Expiry Date</Label>
                      <Input
                        type="date"
                        value={formData.expiryDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
                        className="bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-medium">Salesperson</Label>
                      <Select value={formData.salesperson} onValueChange={(v) => {
                        if (v === "manage_salespersons") {
                          setShowManageSalespersons(true);
                        } else {
                          setFormData(prev => ({ ...prev, salesperson: v }));
                        }
                      }}>
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Select or Add Salesperson" />
                        </SelectTrigger>
                        <SelectContent>
                          <div className="p-2">
                            <div className="relative">
                              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input placeholder="Search" className="pl-8 h-9" />
                            </div>
                          </div>
                          {salespersons.map(sp => (
                            <SelectItem key={sp.id} value={sp.name}>{sp.name}</SelectItem>
                          ))}
                          <div
                            className="flex items-center gap-2 p-2 text-sm text-blue-600 cursor-pointer hover:bg-slate-100 border-t mt-1"
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

                  <div className="space-y-2">
                    <Label className="text-slate-700 font-medium">Subject</Label>
                    <div className="flex gap-2">
                      <Input
                        value={formData.subject}
                        onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                        placeholder="Let your customer know what this Quote is for"
                        className="flex-1 bg-white"
                      />
                      <Button variant="outline" size="icon" className="h-10 w-10 shrink-0">
                        <Pencil className="h-4 w-4 text-slate-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Items Card */}
            <Card className="overflow-hidden border-slate-200 shadow-sm">
              <CardContent className="p-0">
                <div className="px-6 py-3 border-b border-slate-100 bg-sidebar/5 flex justify-between items-center">
                  <h2 className="text-[11px] font-bold text-sidebar uppercase tracking-widest font-display">Items</h2>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-sidebar-accent/5 border-b border-slate-200">
                      <tr className="hover:bg-transparent">
                        <th className="px-6 py-3 text-left text-[10px] font-bold text-sidebar/60 uppercase tracking-wider font-display w-8">#</th>
                        <th className="px-6 py-3 text-left text-[10px] font-bold text-sidebar/60 uppercase tracking-wider font-display">Item Details</th>
                        <th className="px-6 py-3 text-center text-[10px] font-bold text-sidebar/60 uppercase tracking-wider font-display w-32">Quantity</th>
                        <th className="px-6 py-3 text-right text-[10px] font-bold text-sidebar/60 uppercase tracking-wider font-display w-36">Rate (₹)</th>
                        <th className="px-6 py-3 text-center text-[10px] font-bold text-sidebar/60 uppercase tracking-wider font-display w-36">Discount</th>
                        <th className="px-6 py-3 text-left text-[10px] font-bold text-sidebar/60 uppercase tracking-wider font-display w-40">Tax</th>
                        <th className="px-6 py-3 text-right text-[10px] font-bold text-sidebar/60 uppercase tracking-wider font-display w-32">Amount</th>
                        <th className="px-6 py-3 w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {quoteItems.map((item, index) => (
                        <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 text-xs text-slate-400 font-mono">{index + 1}</td>
                          <td className="px-6 py-4">
                            <Select value={item.itemId} onValueChange={(v) => handleItemChange(index, v)}>
                              <SelectTrigger className="border-0 bg-transparent hover:bg-white focus:bg-white shadow-none hover:shadow-sm transition-all h-auto py-2 font-bold font-display text-sidebar">
                                <SelectValue placeholder="Select an item" />
                              </SelectTrigger>
                              <SelectContent>
                                {items.map(i => (
                                  <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                                ))}
                                <Separator className="my-1" />
                                <SelectItem value="add_new_item" className="text-blue-600 font-medium">
                                  <div className="flex items-center gap-2">
                                    <Plus className="h-4 w-4" />
                                    Add New Item
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            {item.description && (
                              <p className="text-xs text-slate-500 mt-1 px-3">{item.description}</p>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateQuoteItem(index, 'quantity', parseFloat(e.target.value) || 1)}
                              className="text-center h-9"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.rate}
                              onChange={(e) => updateQuoteItem(index, 'rate', parseFloat(e.target.value) || 0)}
                              className="text-right h-9"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                min="0"
                                value={item.discount}
                                onChange={(e) => updateQuoteItem(index, 'discount', parseFloat(e.target.value) || 0)}
                                className="w-20 text-center h-9"
                              />
                              <Select
                                value={item.discountType}
                                onValueChange={(v) => updateQuoteItem(index, 'discountType', v)}
                              >
                                <SelectTrigger className="w-16 h-9 px-2">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="percentage">%</SelectItem>
                                  <SelectItem value="amount">₹</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Select value={item.tax} onValueChange={(v) => updateQuoteItem(index, 'tax', v)}>
                              <SelectTrigger className="h-9">
                                <SelectValue placeholder="Select Tax" />
                              </SelectTrigger>
                              <SelectContent>
                                {taxOptions.map(tax => (
                                  <SelectItem key={tax.value} value={tax.value}>{tax.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-6 py-4 text-right font-medium text-slate-700">
                            {formatCurrency(item.amount + (item.amount * getTaxRate(item.tax) / 100))}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removeRow(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-4 border-t border-slate-100 bg-sidebar/5">
                  <Button variant="link" className="text-sidebar hover:text-sidebar/80 h-auto p-0 font-bold font-display gap-2" onClick={addNewRow}>
                    <Plus className="h-4 w-4" />
                    Add Another Line
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Terms & Attributes Card */}
            <Card className="overflow-hidden border-slate-200 shadow-sm">
              <CardContent className="p-0">
                <div className="px-6 py-3 border-b border-slate-100 bg-sidebar/5">
                  <h2 className="text-[11px] font-bold text-sidebar uppercase tracking-widest font-display">Terms & Attributes</h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-12">
                    {/* Left Column: Notes & Terms */}
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label className="text-slate-700 font-medium">Customer Notes</Label>
                        <Textarea
                          value={formData.customerNotes}
                          onChange={(e) => setFormData(prev => ({ ...prev, customerNotes: e.target.value }))}
                          placeholder="Looking forward for your business."
                          className="min-h-[100px] resize-y"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-700 font-medium">Terms & Conditions</Label>
                        <Textarea
                          value={formData.termsAndConditions}
                          onChange={(e) => setFormData(prev => ({ ...prev, termsAndConditions: e.target.value }))}
                          placeholder="Enter the terms and conditions..."
                          className="min-h-[100px] resize-y"
                        />
                      </div>
                    </div>

                    {/* Right Column: Totals */}
                    <div className="bg-sidebar-accent/5 rounded-lg p-6 space-y-4 border border-sidebar/10">
                      <div className="flex justify-between items-center text-sm font-display">
                        <span className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Sub Total</span>
                        <span className="font-bold text-slate-900">{formatCurrency(calculateSubTotal())}</span>
                      </div>
                      {calculateTax() > 0 && (
                        taxRegime === 'inter-state' ? (
                          <div className="flex justify-between items-center text-sm font-display">
                            <span className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">IGST</span>
                            <span className="font-bold text-slate-900">{formatCurrency(calculateTax())}</span>
                          </div>
                        ) : (
                          <>
                            <div className="flex justify-between items-center text-sm font-display">
                              <span className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">CGST</span>
                              <span className="font-bold text-slate-900">{formatCurrency(calculateTax() / 2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm font-display">
                              <span className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">SGST</span>
                              <span className="font-bold text-slate-900">{formatCurrency(calculateTax() / 2)}</span>
                            </div>
                          </>
                        )
                      )}
                      <div className="flex justify-between items-center text-sm font-display font-bold">
                        <span className="text-slate-500 uppercase text-[10px] tracking-widest">Shipping Charges</span>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.shippingCharges}
                          onChange={(e) => setFormData(prev => ({ ...prev, shippingCharges: parseFloat(e.target.value) || 0 }))}
                          className="w-32 text-right h-8 bg-white border-slate-200 font-bold text-slate-900"
                        />
                      </div>
                      <div className="flex justify-between items-center text-sm font-display font-bold">
                        <span className="text-slate-500 uppercase text-[10px] tracking-widest">Adjustment</span>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            step="0.01"
                            value={formData.adjustment}
                            onChange={(e) => setFormData(prev => ({ ...prev, adjustment: parseFloat(e.target.value) || 0 }))}
                            className="w-32 text-right h-8 bg-white border-slate-200 font-bold text-slate-900"
                          />
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-4 border-t border-slate-200 font-display">
                        <span className="text-base font-bold text-slate-900">Total ( ₹ )</span>
                        <span className="text-2xl font-bold text-sidebar animate-in fade-in zoom-in duration-300">
                          {formatCurrency(calculateTotal())}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Attachment Section */}
                  <div className="mt-8 pt-8 border-t border-slate-100">
                    <div className="space-y-4">
                      <Label className="text-slate-700 font-medium">Attach Files</Label>
                      <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center hover:bg-slate-50 transition-colors">
                        <input
                          type="file"
                          id="file-upload"
                          multiple
                          className="hidden"
                          onChange={handleFileUpload}
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                        />
                        <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2">
                          <div className="h-10 w-10 bg-blue-50 rounded-full flex items-center justify-center">
                            <Upload className="h-5 w-5 text-blue-600" />
                          </div>
                          <p className="text-sm font-medium text-blue-600">Click to upload files</p>
                          <p className="text-xs text-slate-400">PDF, DOC, XLS, Images up to 10MB</p>
                        </label>
                      </div>

                      {attachedFiles.length > 0 && (
                        <div className="grid grid-cols-2 gap-3">
                          {attachedFiles.map(file => (
                            <div key={file.id} className="flex items-center justify-between bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 rounded">
                                  <FileText className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-slate-700 truncate max-w-[200px]">{file.name}</p>
                                  <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
                                </div>
                              </div>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50" onClick={() => removeFile(file.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-4 pt-4 pb-20">
              <Button
                variant="outline"
                className="h-9 px-6 font-bold font-display text-slate-600 hover:bg-slate-50 border-slate-200"
                onClick={() => setLocation('/quotes')}
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                className="h-9 px-6 font-bold font-display text-sidebar border-sidebar/20 hover:bg-sidebar/5"
                onClick={() => handleSubmit('DRAFT')}
                disabled={loading}
              >
                Save as Draft
              </Button>
              <Button
                className="h-9 bg-sidebar hover:bg-sidebar/90 text-white font-bold font-display px-8 shadow-sm hover:shadow-md transition-all"
                onClick={() => handleSubmit('SENT')}
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save & Send
              </Button>
            </div>
          </div>
        </div>
      </div>

      <ManageSalespersonsDialog
        open={showManageSalespersons}
        onOpenChange={setShowManageSalespersons}
        onSalespersonChange={fetchSalespersons}
      />
    </div>
  );
}