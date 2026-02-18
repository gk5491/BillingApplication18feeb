import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLocation, useParams } from "wouter";
import {
  Calendar as CalendarIcon,
  ChevronDown,
  Plus,
  Trash2,
  Save,
  Send,
  ArrowLeft,
  Printer,
  Share2,
  X,
  Clock,
  Search,
  Settings,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { addDays, endOfMonth, addMonths, format, parse } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ManageSalespersonsDialog } from "@/components/ManageSalespersonsDialog";

interface InvoiceItem {
  id: string;
  itemId: string;
  name: string;
  description: string;
  quantity: number;
  rate: number;
  discount: number;
  discountType: 'percentage' | 'flat';
  tax: string;
  originalTaxName: string;
  taxAmount: number;
  amount: number;
  isModified?: boolean;
  taxModified?: boolean;
}

interface ItemOption {
  id: string;
  name: string;
  description?: string;
  rate: string;
  hsnSac: string;
  type: string;
  taxPreference: string;
  intraStateTax: string;
  interStateTax: string;
  usageUnit: string;
  isActive: boolean;
}

const TAX_OPTIONS = [
  { label: "Non-taxable", value: "none", rate: 0 },
  { label: "GST0 [0%]", value: "GST0", rate: 0 },
  { label: "GST5 [5%]", value: "GST5", rate: 5 },
  { label: "GST12 [12%]", value: "GST12", rate: 12 },
  { label: "GST18 [18%]", value: "GST18", rate: 18 },
  { label: "GST28 [28%]", value: "GST28", rate: 28 },
];

const TERMS_OPTIONS = [
  { value: "Due on Receipt", label: "Due on Receipt", days: 0 },
  { value: "Net 15", label: "Net 15", days: 15 },
  { value: "Net 30", label: "Net 30", days: 30 },
  { value: "Net 45", label: "Net 45", days: 45 },
  { value: "Net 60", label: "Net 60", days: 60 },
];

const getTaxRate = (taxValue: string): number => {
  const option = TAX_OPTIONS.find(t => t.value === taxValue);
  return option?.rate || 0;
};

export default function InvoiceEdit() {
  const isMobile = useIsMobile();
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [dueDate, setDueDate] = useState<Date>(new Date());
  const [customerName, setCustomerName] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("Net 30");
  const [billingAddress, setBillingAddress] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [termsAndConditions, setTermsAndConditions] = useState("");
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [itemOptions, setItemOptions] = useState<ItemOption[]>([]);
  const [shippingCharges, setShippingCharges] = useState(0);
  const [adjustment, setAdjustment] = useState(0);
  const [selectedSalesperson, setSelectedSalesperson] = useState("");
  const [showManageSalespersons, setShowManageSalespersons] = useState(false);
  const [salespersons, setSalespersons] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetchInvoice();
    fetchSalespersons();
    fetchItems();
  }, [params.id]);

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

  const fetchItems = async () => {
    try {
      const response = await fetch('/api/items');
      if (response.ok) {
        const data = await response.json();
        const items = data.data || data.items || [];
        // Filter only active items
        const activeItems = items.filter((item: ItemOption) => item.isActive !== false);
        setItemOptions(activeItems);
      } else {
        console.error('Failed to fetch items:', response.statusText);
      }
    } catch (error) {
      console.error('Failed to fetch items:', error);
    }
  };

  const fetchInvoice = async () => {
    try {
      const response = await fetch(`/api/invoices/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        const invoice = data.data;

        setInvoiceNumber(invoice.invoiceNumber);
        setDate(new Date(invoice.date));
        setDueDate(new Date(invoice.dueDate));
        setCustomerName(invoice.customerName);
        setCustomerId(invoice.customerId);
        setPaymentTerms(invoice.paymentTerms);
        setBillingAddress(invoice.billingAddress?.street || '');
        setCustomerNotes(invoice.customerNotes || '');
        setTermsAndConditions(invoice.termsAndConditions || '');
        setItems(invoice.items.map((item: any, index: number) => {
          const storedTaxName = item.taxName || 'GST18';
          const knownTax = TAX_OPTIONS.find(t => t.value === storedTaxName);
          return {
            id: item.id || String(index + 1),
            itemId: item.itemId || '',
            name: item.name,
            description: item.description || '',
            quantity: item.quantity,
            rate: item.rate,
            discount: item.discountType === 'percentage'
              ? (item.rate && item.quantity ? (item.discount / (item.rate * item.quantity)) * 100 : 0)
              : (item.discount || 0),
            discountType: item.discountType || 'flat',
            tax: knownTax ? storedTaxName : 'custom',
            originalTaxName: storedTaxName,
            taxAmount: item.tax || 0,
            amount: item.amount,
            isModified: false,
            taxModified: false
          };
        }));
        setShippingCharges(invoice.shippingCharges || 0);
        setAdjustment(invoice.adjustment || 0);
        setSelectedSalesperson(invoice.salesperson || "");
      }
    } catch (error) {
      console.error('Failed to fetch invoice:', error);
      toast({
        title: "Error",
        description: "Failed to load invoice",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateLineItem = (item: InvoiceItem, forceRecalc: boolean = false) => {
    const baseAmount = item.quantity * item.rate;
    let discountAmount = 0;
    if (item.discountType === 'percentage') {
      discountAmount = baseAmount * (Math.min(item.discount, 100) / 100);
    } else {
      discountAmount = item.discount;
    }
    discountAmount = Math.min(discountAmount, baseAmount);
    const taxableAmount = baseAmount - discountAmount;

    if (!item.isModified && !forceRecalc) {
      return {
        baseAmount,
        discountAmount,
        taxableAmount,
        taxAmount: item.taxAmount,
        total: item.amount
      };
    }

    const taxRate = getTaxRate(item.tax);
    const taxAmount = taxableAmount * (taxRate / 100);
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
      subtotal: acc.subtotal + line.taxableAmount,
      totalTax: acc.totalTax + line.taxAmount,
      grandTotal: acc.grandTotal + line.total
    };
  }, { subtotal: 0, totalTax: 0, grandTotal: 0 });

  const finalTotal = totals.grandTotal + shippingCharges + adjustment;

  const handleItemChange = (index: number, itemId: string) => {
    const selectedItem = itemOptions.find(i => i.id === itemId);
    if (selectedItem) {
      const rate = parseFloat(selectedItem.rate.toString().replace(/[₹,]/g, '')) || 0;
      // Extract tax rate from intraStateTax field
      const taxRate = selectedItem.intraStateTax?.includes('18') ? 18 :
        selectedItem.intraStateTax?.includes('12') ? 12 :
          selectedItem.intraStateTax?.includes('5') ? 5 :
            selectedItem.intraStateTax?.includes('28') ? 28 : 0;

      const newItems = [...items];
      newItems[index] = {
        ...newItems[index],
        itemId,
        name: selectedItem.name,
        description: selectedItem.description || '',
        rate,
        tax: `GST${taxRate}`,
        isModified: true,
        taxModified: newItems[index].taxModified
      };
      const calc = calculateLineItem(newItems[index], true);
      newItems[index].taxAmount = calc.taxAmount;
      newItems[index].amount = calc.total;
      setItems(newItems);
    }
  };

  const handleUpdateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      [field]: value
    };
    if (field === 'quantity' || field === 'rate' || field === 'discount' || field === 'discountType' || field === 'tax') {
      newItems[index].isModified = true;
      if (field === 'tax') {
        newItems[index].taxModified = true;
      }
      const calc = calculateLineItem(newItems[index], true);
      newItems[index].taxAmount = calc.taxAmount;
      newItems[index].amount = calc.total;
    }
    setItems(newItems);
  };

  const handleAddItem = () => {
    setItems([...items, {
      id: String(Date.now()),
      itemId: '',
      name: '',
      description: '',
      quantity: 1,
      rate: 0,
      discount: 0,
      discountType: 'percentage',
      tax: 'GST18',
      originalTaxName: 'GST18',
      taxAmount: 0,
      amount: 0,
      isModified: true,
      taxModified: true
    }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const invoiceItems = items.map(item => {
        const lineCalc = calculateLineItem(item);
        const effectiveTaxName = item.taxModified
          ? (item.tax === 'custom' ? item.originalTaxName : item.tax)
          : item.originalTaxName;
        return {
          id: item.id,
          itemId: item.itemId,
          name: item.name,
          description: item.description,
          quantity: item.quantity,
          unit: 'pcs',
          rate: item.rate,
          discount: lineCalc.discountAmount,
          discountType: item.discountType,
          tax: lineCalc.taxAmount,
          taxName: effectiveTaxName,
          amount: lineCalc.total
        };
      });

      const invoiceData = {
        date: format(date, 'yyyy-MM-dd'),
        dueDate: format(dueDate, 'yyyy-MM-dd'),
        customerId,
        customerName,
        billingAddress: {
          street: billingAddress,
          city: '',
          state: '',
          country: 'India',
          pincode: ''
        },
        shippingAddress: {
          street: '',
          city: '',
          state: '',
          country: 'India',
          pincode: ''
        },
        paymentTerms,
        salesperson: selectedSalesperson,
        items: invoiceItems,
        subTotal: totals.subtotal,
        shippingCharges,
        cgst: totals.totalTax / 2,
        sgst: totals.totalTax / 2,
        igst: 0,
        adjustment,
        total: finalTotal,
        customerNotes,
        termsAndConditions
      };

      const response = await fetch(`/api/invoices/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoiceData)
      });

      if (response.ok) {
        toast({
          title: "Invoice Updated",
          description: `Invoice ${invoiceNumber} has been updated successfully.`,
        });
        setLocation("/invoices");
      } else {
        throw new Error('Failed to update invoice');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update invoice. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Loading invoice...</p>
      </div>
    );
  }

  return (
    <div className={`mx-auto space-y-4 md:space-y-8 pb-32 relative overflow-y-auto scrollbar-hide max-h-screen ${isMobile ? 'px-0' : 'max-w-7xl px-4 sm:px-6'}`}>

      {isMobile ? (
        <div className="sticky top-0 z-50 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/invoices")} className="h-9 w-9">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">Edit Invoice</h1>
              <p className="text-[10px] text-slate-500 font-mono">#{invoiceNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-500">
              <Printer className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-500">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Button variant="ghost" size="sm" onClick={() => setLocation("/invoices")} className="h-8 -ml-2 text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back to Invoices
                </Button>
              </div>
              <h1 className="text-3xl font-display font-bold text-sidebar tracking-tight">Edit Invoice</h1>
              <p className="text-sidebar/60 mt-1 font-mono text-sm font-medium">#{invoiceNumber}</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" className="gap-2 bg-card hover:bg-secondary/50">
                <Printer className="h-4 w-4" /> Print
              </Button>
              <Button variant="outline" className="gap-2 bg-card hover:bg-secondary/50">
                <Share2 className="h-4 w-4" /> Share
              </Button>
            </div>
          </div>
        </div>
      )}

      <Card className={`mb-6 ${isMobile ? 'rounded-none border-x-0' : ''}`}>
        <CardHeader>
          <CardTitle className="text-xl font-display font-bold text-sidebar">Invoice Details</CardTitle>
        </CardHeader>
        <CardContent className={isMobile ? "p-4 space-y-6" : "space-y-6"}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[11px] uppercase tracking-[0.05em] text-sidebar/60 font-bold font-display">Customer Name</Label>
              <Input value={customerName} disabled className="bg-muted/50 h-11 md:h-9" data-testid="input-customer-name" />
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] uppercase tracking-[0.05em] text-sidebar/60 font-bold font-display">Invoice #</Label>
              <Input value={invoiceNumber} disabled className="bg-muted/50 h-11 md:h-9" data-testid="input-invoice-number" />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label className="text-[11px] uppercase tracking-[0.05em] text-sidebar/60 font-bold font-display">Invoice Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal h-11 md:h-9", !date && "text-muted-foreground")}
                    data-testid="button-invoice-date"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "dd/MM/yyyy") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label className="text-[11px] uppercase tracking-[0.05em] text-sidebar/60 font-bold font-display">Terms</Label>
              <span className="md:h-9">
                <Select value={paymentTerms} onValueChange={setPaymentTerms}>
                  <SelectTrigger className="h-11 md:h-9" data-testid="select-payment-terms">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TERMS_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </span>
            </div>

            <div className="space-y-2">
              <Label className="text-[11px] uppercase tracking-[0.05em] text-sidebar/60 font-bold font-display">Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal h-11 md:h-9", !dueDate && "text-muted-foreground")}
                    data-testid="button-due-date"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "dd/MM/yyyy") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dueDate} onSelect={(d) => d && setDueDate(d)} />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2 col-span-2 md:col-span-1">
              <Label className="text-[11px] uppercase tracking-[0.05em] text-sidebar/60 font-bold font-display">Salesperson</Label>
              <Select value={selectedSalesperson} onValueChange={(val) => {
                if (val === "manage_salespersons") {
                  setShowManageSalespersons(true);
                } else {
                  setSelectedSalesperson(val);
                }
              }}>
                <SelectTrigger className="h-11 md:h-9" data-testid="select-salesperson">
                  <SelectValue placeholder="Select salesperson" />
                </SelectTrigger>
                <SelectContent>
                  {salespersons.map((sp) => (
                    <SelectItem key={sp.id} value={sp.id}>{sp.name}</SelectItem>
                  ))}
                  <Separator className="my-1" />
                  <div
                    className="flex items-center gap-2 px-2 py-1.5 text-sm text-blue-600 cursor-pointer hover:bg-accent"
                    onClick={() => setShowManageSalespersons(true)}
                  >
                    <Settings className="h-4 w-4" />
                    Manage Salespersons
                  </div>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className={`mb-6 ${isMobile ? 'rounded-none border-x-0' : ''}`}>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle className="text-xl font-display font-bold text-sidebar">Item Table</CardTitle>
          <Button variant="outline" onClick={handleAddItem} data-testid="button-add-item" className={`${isMobile ? "h-9 px-3" : "gap-2"} border-slate-200 text-sidebar hover:bg-sidebar/5 font-bold font-display uppercase tracking-wider text-[10px] shadow-sm`}>
            <Plus className="h-4 w-4 mr-1" /> Add Item
          </Button>
        </CardHeader>
        <CardContent className={isMobile ? "p-4" : ""}>
          {!isMobile ? (
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader className="bg-sidebar/5">
                  <TableRow className="border-sidebar/10">
                    <TableHead className="w-[30%] min-w-[200px] text-[10px] font-bold text-sidebar/50 uppercase tracking-widest font-display">Item Details</TableHead>
                    <TableHead className="w-[10%] min-w-[80px] text-[10px] font-bold text-sidebar/50 uppercase tracking-widest font-display">Qty</TableHead>
                    <TableHead className="w-[12%] min-w-[100px] text-[10px] font-bold text-sidebar/50 uppercase tracking-widest font-display">Rate</TableHead>
                    <TableHead className="w-[15%] min-w-[120px] text-[10px] font-bold text-sidebar/50 uppercase tracking-widest font-display">Discount</TableHead>
                    <TableHead className="w-[13%] min-w-[100px] text-[10px] font-bold text-sidebar/50 uppercase tracking-widest font-display">Tax</TableHead>
                    <TableHead className="w-[10%] min-w-[80px] text-[10px] font-bold text-sidebar/50 uppercase tracking-widest font-display">Tax Amt</TableHead>
                    <TableHead className="w-[10%] min-w-[100px] text-right text-[10px] font-bold text-sidebar/50 uppercase tracking-widest font-display">Amount</TableHead>
                    <TableHead className="w-[5%] min-w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => {
                    const lineCalc = calculateLineItem(item);
                    return (
                      <TableRow key={item.id} className="align-top">
                        <TableCell className="py-3">
                          <div className="space-y-2">
                            <Select
                              value={item.itemId || "custom"}
                              onValueChange={(val) => {
                                if (val === "create_new_item") {
                                  setLocation('/items/create');
                                  return;
                                }
                                handleItemChange(index, val);
                              }}
                            >
                              <SelectTrigger className="h-9" data-testid={`select-item-${index}`}>
                                <SelectValue placeholder="Select item">
                                  {item.name || "Select item"}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {itemOptions.map((opt) => (
                                  <SelectItem key={opt.id} value={opt.id}>{opt.name}</SelectItem>
                                ))}
                                <Separator className="my-1" />
                                <SelectItem value="create_new_item" className="text-primary font-medium cursor-pointer">
                                  + Create New Item
                                </SelectItem>
                              </SelectContent>
                            </Select>

                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          <Input
                            type="number"
                            min="0"
                            value={item.quantity}
                            onChange={(e) => handleUpdateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                            className="h-9"
                            data-testid={`input-item-qty-${index}`}
                          />
                        </TableCell>
                        <TableCell className="py-3">
                          <Input
                            type="number"
                            min="0"
                            value={item.rate}
                            onChange={(e) => handleUpdateItem(index, 'rate', parseFloat(e.target.value) || 0)}
                            className="h-9"
                            data-testid={`input-item-rate-${index}`}
                          />
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="flex shadow-sm rounded-md">
                            <Input
                              type="number"
                              min="0"
                              max={item.discountType === 'percentage' ? 100 : undefined}
                              value={item.discount}
                              onChange={(e) => handleUpdateItem(index, 'discount', parseFloat(e.target.value) || 0)}
                              className="h-9 rounded-r-none border-r-0"
                              data-testid={`input-item-discount-${index}`}
                            />
                            <Select
                              value={item.discountType}
                              onValueChange={(val: 'percentage' | 'flat') => handleUpdateItem(index, 'discountType', val)}
                            >
                              <SelectTrigger className="h-9 w-[55px] rounded-l-none border-l-0 bg-muted/30">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="percentage">%</SelectItem>
                                <SelectItem value="flat">Rs</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          <Select
                            value={item.tax}
                            onValueChange={(val) => handleUpdateItem(index, 'tax', val)}
                          >
                            <SelectTrigger className="h-9" data-testid={`select-item-tax-${index}`}>
                              <SelectValue placeholder="Tax" />
                            </SelectTrigger>
                            <SelectContent>
                              {TAX_OPTIONS.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="py-3 text-sm text-muted-foreground">
                          {formatCurrency(lineCalc.taxAmount)}
                        </TableCell>
                        <TableCell className="py-3 text-right font-medium">
                          {formatCurrency(lineCalc.total)}
                        </TableCell>
                        <TableCell className="py-3">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveItem(index)}
                            className="text-muted-foreground hover:text-destructive"
                            data-testid={`button-remove-item-${index}`}
                          >
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
              {items.map((item, index) => {
                const lineCalc = calculateLineItem(item);
                return (
                  <div key={item.id} className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-white px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Line Item #{index + 1}</span>
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(index)} className="h-7 w-7 text-slate-400 hover:text-red-500">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="p-4 space-y-4">
                      <div className="space-y-1.5">
                        <Label className="text-[11px] font-semibold text-slate-400 uppercase">Item</Label>
                        <Select
                          value={item.itemId || "custom"}
                          onValueChange={(val) => {
                            if (val === "create_new_item") {
                              setLocation('/items/create');
                              return;
                            }
                            handleItemChange(index, val);
                          }}
                        >
                          <SelectTrigger className="h-11 bg-white border-slate-200">
                            <SelectValue placeholder="Select item">
                              {item.name || "Choose item..."}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {itemOptions.map((opt) => (
                              <SelectItem key={opt.id} value={opt.id}>{opt.name}</SelectItem>
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
                            value={item.quantity}
                            onChange={(e) => handleUpdateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                            className="h-11 bg-white border-slate-200"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[11px] font-semibold text-slate-400 uppercase">Rate</Label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
                            <Input
                              type="number"
                              value={item.rate}
                              onChange={(e) => handleUpdateItem(index, 'rate', parseFloat(e.target.value) || 0)}
                              className="h-11 pl-7 bg-white border-slate-200"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-[11px] font-semibold text-slate-400 uppercase">Discount</Label>
                          <div className="flex border border-slate-200 rounded-lg overflow-hidden h-11 bg-white">
                            <Input
                              type="number"
                              value={item.discount}
                              onChange={(e) => handleUpdateItem(index, 'discount', parseFloat(e.target.value) || 0)}
                              className="flex-1 border-none focus-visible:ring-0"
                            />
                            <Select
                              value={item.discountType}
                              onValueChange={(val: 'percentage' | 'flat') => handleUpdateItem(index, 'discountType', val)}
                            >
                              <SelectTrigger className="w-14 border-y-0 border-r-0 border-l border-slate-200 bg-slate-100 px-2 rounded-none h-11">
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
                          <Label className="text-[11px] font-semibold text-slate-400 uppercase">Tax</Label>
                          <Select
                            value={item.tax}
                            onValueChange={(val) => handleUpdateItem(index, 'tax', val)}
                          >
                            <SelectTrigger className="h-11 bg-white border-slate-200">
                              <SelectValue placeholder="Tax" />
                            </SelectTrigger>
                            <SelectContent>
                              {TAX_OPTIONS.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="pt-2 flex items-center justify-between border-t border-slate-200">
                        <span className="text-sm font-medium text-slate-600">Total</span>
                        <span className="text-lg font-bold text-slate-900 font-mono">₹{lineCalc.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-20 md:mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6 order-2 lg:order-1">
          <Card className={isMobile ? "rounded-none border-x-0" : ""}>
            <CardHeader className="py-4">
              <CardTitle className="text-sm font-display font-bold text-sidebar uppercase tracking-wider">Customer Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                placeholder="Notes visible to customer..."
                rows={4}
                className="resize-none"
                data-testid="textarea-customer-notes"
              />
            </CardContent>
          </Card>
          <Card className={isMobile ? "rounded-none border-x-0" : ""}>
            <CardHeader className="py-4">
              <CardTitle className="text-sm font-display font-bold text-sidebar uppercase tracking-wider">Terms & Conditions</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={termsAndConditions}
                onChange={(e) => setTermsAndConditions(e.target.value)}
                placeholder="Terms and conditions..."
                rows={4}
                className="resize-none"
                data-testid="textarea-terms"
              />
            </CardContent>
          </Card>
        </div>

        <Card className={`h-fit order-1 lg:order-2 ${isMobile ? 'rounded-none border-x-0 bg-slate-50' : ''}`}>
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-display font-bold text-sidebar uppercase tracking-wider">Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center font-display">
                <span className="text-sidebar/60 font-medium font-display">Subtotal</span>
                <span className="font-semibold text-sidebar">{formatCurrency(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sidebar/60 font-medium font-display">Tax</span>
                <span className="font-semibold text-sidebar">{formatCurrency(totals.totalTax)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sidebar/60 font-medium font-display">Shipping Charges</span>
                <Input
                  type="number"
                  value={shippingCharges}
                  onChange={(e) => setShippingCharges(parseFloat(e.target.value) || 0)}
                  className="w-24 h-9 text-right bg-white border-sidebar/10 focus:border-primary/40"
                  data-testid="input-shipping"
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sidebar/60 font-medium font-display">Adjustment</span>
                <Input
                  type="number"
                  value={adjustment}
                  onChange={(e) => setAdjustment(parseFloat(e.target.value) || 0)}
                  className="w-24 h-9 text-right bg-white border-sidebar/10 focus:border-primary/40"
                  data-testid="input-adjustment"
                />
              </div>
              <Separator className="bg-sidebar/10" />
              <div className="flex justify-between items-baseline py-2 px-1">
                <span className="text-lg font-bold text-sidebar font-display">Total</span>
                <span className="text-2xl font-bold text-primary font-display" data-testid="text-total">{formatCurrency(finalTotal)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className={`fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-sidebar/10 z-50 transition-all duration-300 ${isMobile ? 'pb-safe' : 'md:left-64'}`}>
        <div className={`max-w-6xl mx-auto flex items-center justify-between gap-3 ${isMobile ? 'px-4 py-3' : 'px-6 py-4'}`}>
          <Button variant="outline" className="text-slate-500 border-slate-200 bg-slate-50/50 hover:bg-slate-100 hover:text-slate-600 font-medium h-10 md:h-11 px-6 shadow-none" onClick={() => setLocation("/invoices")}>
            {isMobile ? <X className="h-5 w-5" /> : "Cancel"}
          </Button>
          <div className="flex items-center gap-2 md:gap-3 flex-1 justify-end">
            <Button
              onClick={handleSave}
              disabled={saving}
              className={`flex-1 md:flex-none max-w-[200px] gap-2 bg-sidebar hover:bg-sidebar/90 hover:translate-y-[-1px] transition-all text-white shadow-sm h-11 md:h-11 px-8 font-bold font-display uppercase tracking-wider text-xs`}
              data-testid="button-save"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? "Saving..." : "Save Changes"}</span>
            </Button>
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
