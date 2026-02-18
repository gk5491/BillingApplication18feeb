import { useState, useEffect, useRef } from "react";
import { useLocation, useRoute } from "wouter";
import { Plus, X, Search, Upload, Pencil, ArrowLeft, Loader2, FileText, Trash2 } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { ManageSalespersonsDialog } from "@/components/ManageSalespersonsDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface AttachedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  data?: string;
}

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

const getTaxValueFromRate = (rate: number): string => {
  const rateMap: Record<number, string> = {
    0: "none",
    5: "GST5",
    12: "GST12",
    18: "GST18",
    28: "GST28",
  };
  return rateMap[rate] || "none";
};

export default function QuoteEditPage() {
  const [, estimateParams] = useRoute("/estimates/:id/edit");
  const [, quoteParams] = useRoute("/quotes/:id/edit");
  const quoteId = estimateParams?.id || quoteParams?.id;
  const isFromEstimates = !!estimateParams?.id;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
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
    status: "DRAFT",
  });

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
    fetchSalespersons();
  }, []);

  useEffect(() => {
    if (quoteId) {
      fetchQuoteData();
    }
  }, [quoteId]);

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

  const fetchQuoteData = async () => {
    try {
      const response = await fetch(`/api/quotes/${quoteId}`);
      if (response.ok) {
        const data = await response.json();
        const quote = data.data;

        setFormData({
          customerId: quote.customerId || "",
          customerName: quote.customerName || "",
          billingAddress: quote.billingAddress || {},
          shippingAddress: quote.shippingAddress || quote.billingAddress || {},
          quoteNumber: quote.quoteNumber || "",
          referenceNumber: quote.referenceNumber || "",
          quoteDate: quote.date || new Date().toISOString().split('T')[0],
          expiryDate: quote.expiryDate || "",
          salesperson: quote.salesperson || "",
          projectName: quote.projectName || "",
          subject: quote.subject || "",
          customerNotes: quote.customerNotes || "",
          termsAndConditions: quote.termsAndConditions || "",
          shippingCharges: quote.shippingCharges || 0,
          tdsType: quote.tdsType || "",
          adjustment: quote.adjustment || 0,
          adjustmentDescription: quote.adjustmentDescription || "",
          status: quote.status || "DRAFT",
        });

        if (quote.items && quote.items.length > 0) {
          setQuoteItems(quote.items.map((item: any) => ({
            id: item.id || String(Date.now()),
            itemId: item.itemId || "",
            name: item.name || "",
            description: item.description || "",
            quantity: item.quantity || 1,
            rate: item.rate || 0,
            discount: item.discount || 0,
            discountType: item.discountType || "percentage",
            tax: item.taxName || getTaxValueFromRate(item.tax || 0),
            amount: item.amount || 0,
          })));
        }

        if (quote.attachments && quote.attachments.length > 0) {
          setAttachedFiles(quote.attachments.map((att: any) => ({
            id: att.id || String(Date.now()),
            name: att.name,
            size: att.size || 0,
            type: att.type || 'application/octet-stream',
            data: att.data
          })));
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to load quote data",
          variant: "destructive",
        });
        setLocation(isFromEstimates ? '/estimates' : '/quotes');
      }
    } catch (error) {
      console.error('Failed to fetch quote:', error);
      toast({
        title: "Error",
        description: "Failed to load quote data",
        variant: "destructive",
      });
    } finally {
      setInitialLoading(false);
    }
  };

  const handleCustomerChange = (customerId: string) => {
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
      setLocation(`/products/new?returnTo=quotes/${quoteId}/edit`);
      return;
    }
    const item = items.find(i => i.id === itemId);
    if (item) {
      const updatedItems = [...quoteItems];
      const rate = parseFloat(item.rate.replace(/[₹,]/g, '')) || 0;
      updatedItems[index] = {
        ...updatedItems[index],
        itemId,
        name: item.name,
        description: item.description || '',
        rate,
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
        items: quoteItems.filter(item => item.itemId || item.name).map(item => ({
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
        cgst: taxAmount / 2,
        sgst: taxAmount / 2,
        igst: 0,
        adjustment: formData.adjustment,
        total: calculateTotal(),
        customerNotes: formData.customerNotes,
        termsAndConditions: formData.termsAndConditions,
        status,
        updatedBy: "Admin User",
        attachments: attachedFiles.map(f => ({ id: f.id, name: f.name, size: f.size, type: f.type, data: f.data }))
      };

      const response = await fetch(`/api/quotes/${quoteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quoteData)
      });

      if (response.ok) {
        toast({
          title: "Quote Updated",
          description: "The quote has been successfully updated.",
        });
        setLocation(isFromEstimates ? '/estimates' : '/quotes');
      } else {
        toast({
          title: "Error",
          description: "Failed to update quote",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating quote:', error);
      toast({
        title: "Error",
        description: "Failed to update quote",
        variant: "destructive",
      });
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
      toast({
        title: "Too many files",
        description: `You can only upload a maximum of ${maxFiles} files`,
        variant: "destructive"
      });
      return;
    }

    Array.from(files).forEach(file => {
      if (file.size > maxSize) {
        toast({
          title: "File too large",
          description: `File ${file.name} exceeds 10MB limit`,
          variant: "destructive"
        });
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

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-slate-500">Loading quote...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-50 h-screen animate-in slide-in-from-right duration-300">
      <div className="flex items-center justify-between p-4 bg-sidebar-accent/5 border-b border-sidebar/10 shadow-sm z-10 flex-shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation(isFromEstimates ? '/estimates' : '/quotes')} className="h-8 w-8 rounded-full hover:bg-sidebar/10 text-sidebar transition-all" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold font-display text-sidebar tracking-tight">Edit Quote</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto invisible-scrollbar">
        <div className="max-w-6xl mx-auto p-8 pb-32">
          <div className="space-y-8">
            {/* Quote Details Card */}
            <Card className="overflow-hidden border-slate-200 shadow-sm">
              <CardContent className="p-0">
                <div className="p-4 border-b border-sidebar/10 bg-sidebar-accent/5">
                  <h2 className="text-[10px] font-bold text-sidebar uppercase tracking-[0.2em] font-display">Quote Details</h2>
                </div>
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-medium after:content-['*'] after:ml-0.5 after:text-red-500">Customer Name</Label>
                      <Select value={formData.customerId} onValueChange={handleCustomerChange}>
                        <SelectTrigger className="bg-white border-slate-200" data-testid="select-customer">
                          <SelectValue placeholder="Select or add a customer" />
                        </SelectTrigger>
                        <SelectContent>
                          {customers.map(customer => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Placeholder or search icon */}
                    <div className="flex justify-end items-end">
                      <Button variant="outline" size="icon" className="h-10 w-10">
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-medium after:content-['*'] after:ml-0.5 after:text-red-500">Quote Number</Label>
                      <div className="flex gap-2">
                        <Input
                          value={formData.quoteNumber}
                          disabled
                          className="flex-1 font-mono bg-slate-100 text-slate-500"
                          data-testid="input-quote-number"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-medium">Reference Number</Label>
                      <Input
                        value={formData.referenceNumber}
                        onChange={(e) => setFormData(prev => ({ ...prev, referenceNumber: e.target.value }))}
                        className="bg-white"
                        data-testid="input-reference"
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
                        data-testid="input-quote-date"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-medium">Expiry Date</Label>
                      <Input
                        type="date"
                        value={formData.expiryDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
                        className="bg-white"
                        data-testid="input-expiry-date"
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
                        <SelectTrigger className="bg-white" data-testid="select-salesperson">
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
                        data-testid="input-subject"
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
                <div className="p-4 border-b border-sidebar/10 bg-sidebar-accent/5 flex justify-between items-center">
                  <h2 className="text-[10px] font-bold text-sidebar uppercase tracking-[0.2em] font-display">Items</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-sidebar-accent/5 border-b border-sidebar/10">
                      <tr>
                        <th className="px-6 py-4 text-left text-[10px] font-bold text-sidebar/70 uppercase tracking-[0.1em] font-display w-8">#</th>
                        <th className="px-6 py-4 text-left text-[10px] font-bold text-sidebar/70 uppercase tracking-[0.1em] font-display">Item Details</th>
                        <th className="px-6 py-4 text-center text-[10px] font-bold text-sidebar/70 uppercase tracking-[0.1em] font-display w-32">Quantity</th>
                        <th className="px-6 py-4 text-right text-[10px] font-bold text-sidebar/70 uppercase tracking-[0.1em] font-display w-36">Rate</th>
                        <th className="px-6 py-4 text-center text-[10px] font-bold text-sidebar/70 uppercase tracking-[0.1em] font-display w-36">Discount</th>
                        <th className="px-6 py-4 text-left text-[10px] font-bold text-sidebar/70 uppercase tracking-[0.1em] font-display w-40">Tax</th>
                        <th className="px-6 py-4 text-right text-[10px] font-bold text-sidebar/70 uppercase tracking-[0.1em] font-display w-32">Amount</th>
                        <th className="px-6 py-4 w-16"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {quoteItems.map((item, index) => (
                        <tr key={item.id} className="group hover:bg-sidebar-accent/5 transition-colors">
                          <td className="px-6 py-4 text-xs text-slate-400 font-mono">{index + 1}</td>
                          <td className="px-6 py-4">
                            <Select value={item.itemId} onValueChange={(v) => handleItemChange(index, v)}>
                              <SelectTrigger className="border-0 bg-transparent hover:bg-white focus:bg-white shadow-none hover:shadow-sm transition-all h-auto py-2 font-bold font-display text-sidebar" data-testid={`select-item-${index}`}>
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
                            {/* Description if available */}
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
                              data-testid={`input-quantity-${index}`}
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
                              data-testid={`input-rate-${index}`}
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
                                data-testid={`input-discount-${index}`}
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
                                  <SelectItem value="amount">INR</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Select value={item.tax} onValueChange={(v) => updateQuoteItem(index, 'tax', v)}>
                              <SelectTrigger className="h-9" data-testid={`select-tax-${index}`}>
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
                              data-testid={`button-remove-item-${index}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-4 border-t border-slate-100 bg-slate-50/30">
                  <Button variant="link" className="text-sidebar hover:text-sidebar/80 h-auto p-0 font-bold font-display text-xs uppercase tracking-wider" onClick={addNewRow} data-testid="button-add-row">
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Add Another Line
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Terms & Attributes Card */}
            <Card className="overflow-hidden border-slate-200 shadow-sm">
              <CardContent className="p-0">
                <div className="p-4 border-b border-sidebar/10 bg-sidebar-accent/5">
                  <h2 className="text-[10px] font-bold text-sidebar uppercase tracking-[0.2em] font-display">Terms & Attributes</h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-12">
                    {/* Left Column */}
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label className="text-slate-700 font-medium">Customer Notes</Label>
                        <Textarea
                          value={formData.customerNotes}
                          onChange={(e) => setFormData(prev => ({ ...prev, customerNotes: e.target.value }))}
                          placeholder=""
                          className="min-h-[100px] resize-y"
                          data-testid="input-customer-notes"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-700 font-medium">Terms & Conditions</Label>
                        <Textarea
                          value={formData.termsAndConditions}
                          onChange={(e) => setFormData(prev => ({ ...prev, termsAndConditions: e.target.value }))}
                          placeholder="Enter the terms and conditions..."
                          className="min-h-[100px] resize-y"
                          data-testid="input-terms"
                        />
                      </div>
                    </div>

                    {/* Right Column (Totals) */}
                    <div className="bg-sidebar-accent/5 rounded-lg p-6 space-y-4 border border-sidebar/10">
                      <div className="flex justify-between items-center text-sm font-display">
                        <span className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Sub Total</span>
                        <span className="font-bold text-slate-900">{formatCurrency(calculateSubTotal())}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm font-display font-bold">
                        <span className="text-slate-500 uppercase text-[10px] tracking-widest">Shipping Charges</span>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.shippingCharges}
                          onChange={(e) => setFormData(prev => ({ ...prev, shippingCharges: parseFloat(e.target.value) || 0 }))}
                          className="w-32 text-right h-8 bg-white border-slate-200 font-bold text-slate-900"
                          data-testid="input-shipping"
                        />
                      </div>
                      <div className="flex justify-between items-center text-sm font-display font-bold">
                        <span className="text-slate-500 uppercase text-[10px] tracking-widest">Adjustment</span>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.adjustment}
                          onChange={(e) => setFormData(prev => ({ ...prev, adjustment: parseFloat(e.target.value) || 0 }))}
                          className="w-32 text-right h-8 bg-white border-slate-200 font-bold text-slate-900"
                          data-testid="input-adjustment"
                        />
                      </div>
                      <div className="flex justify-between items-center pt-4 border-t border-slate-200 font-display">
                        <span className="text-base font-bold text-slate-900">Total ( ₹ )</span>
                        <span className="text-2xl font-bold text-sidebar animate-in fade-in zoom-in duration-300">
                          {formatCurrency(calculateTotal())}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Attachments Section */}
                  <div className="mt-8 pt-8 border-t border-slate-100">
                    <div className="space-y-4">
                      <Label className="text-slate-500 font-bold uppercase text-[10px] tracking-widest font-display">Attach Files</Label>
                      <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center hover:bg-slate-50 transition-colors">
                        <input
                          type="file"
                          ref={fileInputRef}
                          multiple
                          className="hidden"
                          onChange={handleFileUpload}
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                          data-testid="input-file-upload"
                        />
                        <Button
                          variant="ghost"
                          className="flex flex-col items-center gap-2 h-auto"
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          data-testid="button-upload-file"
                        >
                          <div className="h-10 w-10 bg-sidebar/5 rounded-full flex items-center justify-center">
                            <Upload className="h-5 w-5 text-sidebar" />
                          </div>
                          <p className="text-sm font-bold font-display text-sidebar">Click to upload files</p>
                          <p className="text-[11px] text-slate-400 font-medium">PDF, DOC, XLS, Images up to 10MB</p>
                        </Button>
                      </div>
                      {attachedFiles.length > 0 && (
                        <div className="grid grid-cols-2 gap-3">
                          {attachedFiles.map(file => (
                            <div key={file.id} className="flex items-center justify-between bg-white border border-slate-200 rounded-lg p-3 shadow-sm" data-testid={`file-item-${file.id}`}>
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-sidebar/5 rounded">
                                  <FileText className="h-4 w-4 text-sidebar" />
                                </div>
                                <div>
                                  <p className="text-sm font-bold font-display text-slate-700 truncate max-w-[200px]">{file.name}</p>
                                  <p className="text-[11px] font-medium text-slate-500">{formatFileSize(file.size)}</p>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-300 hover:text-red-500 hover:bg-red-50"
                                onClick={() => removeFile(file.id)}
                                data-testid={`button-remove-file-${file.id}`}
                              >
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
                onClick={() => setLocation(isFromEstimates ? '/estimates' : '/quotes')}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                className="h-9 px-6 font-bold font-display text-sidebar border-sidebar/20 hover:bg-sidebar/5"
                onClick={() => handleSubmit('DRAFT')}
                disabled={loading}
                data-testid="button-save-draft"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save as Draft
              </Button>
              <Button
                className="h-9 bg-sidebar hover:bg-sidebar/90 text-white font-bold font-display px-8 shadow-sm hover:shadow-md transition-all"
                onClick={() => handleSubmit(formData.status === 'DRAFT' ? 'SENT' : formData.status)}
                disabled={loading}
                data-testid="button-save"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save
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
