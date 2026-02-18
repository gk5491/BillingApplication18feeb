import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import {
  Calendar as CalendarIcon,
  Plus,
  X,
  ArrowLeft,
  Trash2,
  Loader2,
  Save,
  UploadCloud
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

interface ChallanItem {
  id: number;
  name: string;
  description: string;
  hsnSac: string;
  qty: number;
  rate: number;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  gstRate: number;
}

interface Customer {
  id: string;
  displayName: string;
  companyName: string;
  email: string;
  gstin?: string;
  billingAddress?: any;
  shippingAddress?: any;
}

interface InventoryItem {
  id: string;
  name: string;
  description?: string;
  hsnSac?: string;
  rate?: string | number;
  sellingPrice?: number;
  unit?: string;
  type?: string;
  intraStateTax?: string;
}

const CHALLAN_TYPES = [
  { value: "supply_on_approval", label: "Supply on Approval" },
  { value: "supply_for_job_work", label: "Supply for Job Work" },
  { value: "supply_for_repair", label: "Supply for Repair" },
  { value: "removal_for_own_use", label: "Removal for Own Use" },
  { value: "others", label: "Others" }
];

const TAX_OPTIONS = [
  { label: "Non-taxable", value: -1 },
  { label: "GST0 [0%]", value: 0 },
  { label: "GST5 [5%]", value: 5 },
  { label: "GST12 [12%]", value: 12 },
  { label: "GST18 [18%]", value: 18 },
  { label: "GST28 [28%]", value: 28 },
];

export default function DeliveryChallanEdit() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/delivery-challans/:id/edit");
  const { toast } = useToast();

  const [date, setDate] = useState<Date>(new Date());
  const [challanNumber, setChallanNumber] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [challanType, setChallanType] = useState<string>("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [customerNotes, setCustomerNotes] = useState("");
  const [termsAndConditions, setTermsAndConditions] = useState("");
  const [adjustment, setAdjustment] = useState(0);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("DRAFT");

  const [items, setItems] = useState<ChallanItem[]>([]);

  useEffect(() => {
    fetchCustomers();
    fetchInventoryItems();
    if (params?.id) {
      fetchChallan(params.id);
    }
  }, [params?.id]);

  const fetchChallan = async (id: string) => {
    try {
      const response = await fetch(`/api/delivery-challans/${id}`);
      if (response.ok) {
        const data = await response.json();
        const challan = data.data as any;

        setChallanNumber((challan.challanNumber || "").replace("DC-", ""));
        setReferenceNumber(challan.referenceNumber || "");
        setDate(new Date(challan.date));
        setSelectedCustomerId(challan.customerId);
        setChallanType(challan.challanType);
        setCustomerNotes(challan.customerNotes || "");
        setTermsAndConditions(challan.termsAndConditions || "");
        setAdjustment(challan.adjustment || 0);
        setStatus(challan.status);

        const challanItems = challan.items.map((item: any, index: number) => ({
          id: index + 1,
          name: item.name,
          description: item.description || "",
          hsnSac: item.hsnSac || "",
          qty: item.quantity,
          rate: item.rate,
          discountType: item.discountType || 'percentage',
          discountValue: item.discount || 0,
          gstRate: item.taxName?.includes('18') ? 18 : (item.taxName?.includes('12') ? 12 : (item.taxName?.includes('5') ? 5 : (item.taxName?.includes('28') ? 28 : 0)))
        }));

        setItems(challanItems.length > 0 ? challanItems : [{
          id: 1,
          name: "",
          description: "",
          hsnSac: "",
          qty: 1,
          rate: 0,
          discountType: 'percentage',
          discountValue: 0,
          gstRate: 18
        }]);
      }
    } catch (error) {
      console.error('Failed to fetch challan:', error);
      toast({
        title: "Error",
        description: "Failed to load delivery challan.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
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

  const fetchInventoryItems = async () => {
    try {
      const response = await fetch('/api/items');
      if (response.ok) {
        const data = await response.json();
        setInventoryItems(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch items:', error);
    }
  };

  const handleItemSelect = (challanItemId: number, inventoryItemId: string) => {
    const inventoryItem = inventoryItems.find(i => i.id === inventoryItemId);
    if (inventoryItem) {
      let itemRate = 0;
      if (typeof inventoryItem.rate === 'string') {
        itemRate = parseFloat(inventoryItem.rate.replace(/,/g, '')) || 0;
      } else if (typeof inventoryItem.rate === 'number') {
        itemRate = inventoryItem.rate;
      } else if (inventoryItem.sellingPrice) {
        itemRate = typeof inventoryItem.sellingPrice === 'string'
          ? parseFloat(inventoryItem.sellingPrice.replace(/,/g, '')) || 0
          : inventoryItem.sellingPrice;
      }

      let gstRate = 0;
      if (inventoryItem.intraStateTax) {
        const match = inventoryItem.intraStateTax.match(/\d+/);
        if (match) gstRate = parseInt(match[0]);
      }

      setItems(items.map(item => {
        if (item.id === challanItemId) {
          return {
            ...item,
            name: inventoryItem.name,
            description: inventoryItem.description || "",
            hsnSac: inventoryItem.hsnSac || "",
            rate: itemRate,
            gstRate: gstRate
          };
        }
        return item;
      }));
    }
  };

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  const calculateLineItem = (item: ChallanItem) => {
    const baseAmount = item.qty * item.rate;
    let discountAmount = 0;
    if (item.discountType === 'percentage') {
      discountAmount = baseAmount * (Math.min(item.discountValue, 100) / 100);
    } else {
      discountAmount = item.discountValue;
    }
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
      taxableSubtotal: acc.taxableSubtotal + line.taxableAmount,
      totalTax: acc.totalTax + line.taxAmount,
      grandTotal: acc.grandTotal + line.total
    };
  }, { taxableSubtotal: 0, totalTax: 0, grandTotal: 0 });

  const finalTotal = totals.grandTotal + adjustment;

  const updateItem = (id: number, field: keyof ChallanItem, value: any) => {
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
      hsnSac: "",
      qty: 1,
      rate: 0,
      discountType: 'percentage',
      discountValue: 0,
      gstRate: 18
    }]);
  };

  const removeItem = (id: number) => {
    if (items.length > 1) {
      setItems(items.filter(i => i.id !== id));
    }
  };

  const handleSave = async (newStatus?: string) => {
    if (!selectedCustomerId) {
      toast({
        title: "Validation Error",
        description: "Please select a customer.",
        variant: "destructive"
      });
      return;
    }

    if (!challanType) {
      toast({
        title: "Validation Error",
        description: "Please select a challan type.",
        variant: "destructive"
      });
      return;
    }

    const validItems = items.filter(item => item.name.trim() !== '');
    if (validItems.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one item with a name.",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    const challanItems = validItems.map(item => {
      const lineCalc = calculateLineItem(item);
      return {
        id: String(item.id),
        itemId: String(item.id),
        name: item.name,
        description: item.description,
        hsnSac: item.hsnSac,
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

    const challanData = {
      date: format(date, "yyyy-MM-dd"),
      referenceNumber,
      customerId: selectedCustomerId,
      customerName: selectedCustomer?.displayName || "Unknown Customer",
      challanType,
      billingAddress: selectedCustomer?.billingAddress || {},
      shippingAddress: selectedCustomer?.shippingAddress || selectedCustomer?.billingAddress || {},
      placeOfSupply: '',
      gstin: selectedCustomer?.gstin || '',
      items: challanItems,
      subTotal: totals.taxableSubtotal,
      cgst: totals.totalTax / 2,
      sgst: totals.totalTax / 2,
      igst: 0,
      adjustment: adjustment,
      total: finalTotal,
      customerNotes,
      termsAndConditions,
      status: newStatus || status
    };

    try {
      const response = await fetch(`/api/delivery-challans/${params?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(challanData)
      });

      if (response.ok) {
        toast({
          title: "Delivery Challan Updated",
          description: "Your changes have been saved.",
        });
        setLocation("/delivery-challans");
      } else {
        throw new Error('Failed to update delivery challan');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update delivery challan. Please try again.",
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
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 text-sidebar animate-spin" />
          <p className="text-sidebar/60 font-bold font-display uppercase tracking-widest text-[10px]">Loading Delivery Challan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-50 h-screen animate-in slide-in-from-right duration-300">
      <div className="flex items-center justify-between p-4 bg-white border-b border-sidebar/10 sticky top-0 z-50 flex-shrink-0 min-h-[73px]">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/delivery-challans")} className="rounded-full hover:bg-sidebar/5 transition-colors" data-testid="button-back">
            <ArrowLeft className="h-5 w-5 text-sidebar/60" />
          </Button>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-sidebar font-display tracking-tight">Edit Delivery Challan</h1>
            <p className="text-[10px] text-sidebar/40 font-bold font-display uppercase tracking-widest leading-none mt-0.5">Sales {" > "} DC-{challanNumber}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto invisible-scrollbar">
        <div className="max-w-6xl mx-auto p-8 pb-32">
          <div className="space-y-8">
            <Card className="overflow-hidden border-sidebar/10 shadow-sm">
              <CardContent className="p-0">
                <div className="px-6 py-4 border-b border-sidebar/5 bg-sidebar/[0.02] flex items-center justify-between">
                  <h2 className="text-[10px] font-bold text-sidebar/40 uppercase tracking-[0.2em] font-display">Challan Details</h2>
                  <Badge className="bg-sidebar/[0.05] text-sidebar border-sidebar/10 text-[10px] font-bold py-0.5 px-2">DC-{challanNumber}</Badge>
                </div>
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sidebar/60 font-bold font-display uppercase tracking-wider text-[10px] after:content-['*'] after:ml-0.5 after:text-red-500">Customer Name</Label>
                      <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                        <SelectTrigger className="bg-white border-sidebar/10 focus:border-sidebar/20 shadow-sm h-10 transition-all font-medium" data-testid="select-customer">
                          <SelectValue placeholder="Select a customer" />
                        </SelectTrigger>
                        <SelectContent>
                          {customers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id} className="focus:bg-sidebar/5 focus:text-sidebar font-medium">
                              {customer.displayName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sidebar/60 font-bold font-display uppercase tracking-wider text-[10px] after:content-['*'] after:ml-0.5 after:text-red-500">Challan Type</Label>
                      <Select value={challanType} onValueChange={setChallanType}>
                        <SelectTrigger className="bg-white border-sidebar/10 focus:border-sidebar/20 shadow-sm h-10 transition-all font-medium" data-testid="select-challan-type">
                          <SelectValue placeholder="Choose a challan type" />
                        </SelectTrigger>
                        <SelectContent>
                          {CHALLAN_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value} className="focus:bg-sidebar/5 focus:text-sidebar font-medium">
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <Label className="text-sidebar/60 font-bold font-display uppercase tracking-wider text-[10px] after:content-['*'] after:ml-0.5 after:text-red-500">Delivery Challan#</Label>
                      <div className="flex items-center shadow-sm rounded-md overflow-hidden bg-sidebar/[0.03] border border-sidebar/10">
                        <span className="px-3 py-2 text-xs font-bold font-display text-sidebar/40">DC-</span>
                        <Input
                          value={challanNumber}
                          disabled
                          className="rounded-l-none border-none focus:ring-0 bg-transparent font-mono transition-all h-10 text-sidebar/60"
                          data-testid="input-challan-number"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sidebar/60 font-bold font-display uppercase tracking-wider text-[10px]">Reference#</Label>
                      <Input
                        value={referenceNumber}
                        onChange={(e) => setReferenceNumber(e.target.value)}
                        placeholder="Ref-001"
                        className="border-sidebar/10 focus:border-sidebar/20 focus:ring-0 bg-white transition-all h-10 shadow-sm"
                        data-testid="input-reference-number"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <Label className="text-sidebar/60 font-bold font-display uppercase tracking-wider text-[10px] after:content-['*'] after:ml-0.5 after:text-red-500">Delivery Challan Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn("w-full justify-start text-left font-medium bg-white border-sidebar/10 hover:border-sidebar/20 shadow-sm h-10", !date && "text-muted-foreground")}
                            data-testid="button-date"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4 text-sidebar/40" />
                            {date ? format(date, "dd MMM yyyy") : "Select date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={date}
                            onSelect={(d) => d && setDate(d)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-sidebar/10 shadow-sm">
              <CardContent className="p-0">
                <div className="px-6 py-4 border-b border-sidebar/5 bg-sidebar/[0.02] flex items-center justify-between">
                  <h2 className="text-[10px] font-bold text-sidebar/40 uppercase tracking-[0.2em] font-display">Items & Inventory</h2>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="text-sidebar/60 hover:text-sidebar hover:bg-sidebar/5 font-bold font-display uppercase tracking-wider text-[10px] gap-2">
                      <UploadCloud className="h-3.5 w-3.5" /> Bulk Add
                    </Button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-sidebar/[0.02]">
                      <TableRow className="hover:bg-transparent border-sidebar/10">
                        <TableHead className="w-[40%] text-sidebar/60 font-bold font-display uppercase tracking-wider text-[10px] py-4">Item Details</TableHead>
                        <TableHead className="w-[15%] text-right text-sidebar/60 font-bold font-display uppercase tracking-wider text-[10px]">Quantity</TableHead>
                        <TableHead className="w-[15%] text-right text-sidebar/60 font-bold font-display uppercase tracking-wider text-[10px]">Rate</TableHead>
                        <TableHead className="w-[10%] text-right text-sidebar/60 font-bold font-display uppercase tracking-wider text-[10px]">GST %</TableHead>
                        <TableHead className="w-[15%] text-right text-sidebar/60 font-bold font-display uppercase tracking-wider text-[10px]">Amount</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item, index) => (
                        <TableRow key={item.id} className="group hover:bg-sidebar/[0.01] transition-colors border-sidebar/5">
                          <TableCell className="align-top py-4">
                            <div className="space-y-2">
                              <Select
                                value={item.name ? inventoryItems.find(i => i.name === item.name)?.id : ""}
                                onValueChange={(val) => handleItemSelect(item.id, val)}
                              >
                                <SelectTrigger className="w-full bg-white border-sidebar/10 group-hover:border-sidebar/20 shadow-none h-9 transition-all font-medium" data-testid={`select-item-${index}`}>
                                  <SelectValue placeholder="Type or select an item" />
                                </SelectTrigger>
                                <SelectContent>
                                  {inventoryItems.map((inv) => (
                                    <SelectItem key={inv.id} value={inv.id} className="focus:bg-sidebar/5 focus:text-sidebar font-medium">
                                      {inv.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Input
                                placeholder="Description"
                                value={item.description}
                                onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                className="bg-transparent border-none focus:ring-0 p-0 text-xs text-sidebar/60 italic placeholder:text-sidebar/30 h-6 h-auto"
                              />
                            </div>
                          </TableCell>
                          <TableCell className="align-top text-right py-4">
                            <Input
                              type="number"
                              value={item.qty}
                              onChange={(e) => updateItem(item.id, 'qty', parseFloat(e.target.value) || 1)}
                              className="w-20 ml-auto bg-white border-sidebar/10 group-hover:border-sidebar/20 text-right h-9"
                              data-testid={`input-qty-${index}`}
                            />
                          </TableCell>
                          <TableCell className="align-top text-right py-4">
                            <Input
                              type="number"
                              value={item.rate}
                              onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                              className="w-24 ml-auto bg-white border-sidebar/10 group-hover:border-sidebar/20 text-right h-9"
                              data-testid={`input-rate-${index}`}
                            />
                          </TableCell>
                          <TableCell className="align-top text-right py-4">
                            <Select
                              value={String(item.gstRate)}
                              onValueChange={(val) => updateItem(item.id, 'gstRate', parseInt(val))}
                            >
                              <SelectTrigger className="w-20 ml-auto bg-white border-sidebar/10 group-hover:border-sidebar/20 h-9 transition-all text-right font-medium" data-testid={`select-gst-${index}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {TAX_OPTIONS.map((opt) => (
                                  <SelectItem key={opt.value} value={String(opt.value)} className="focus:bg-sidebar/5 focus:text-sidebar font-medium">
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="align-top text-right py-4 font-bold text-sidebar font-display">
                            {formatCurrency(calculateLineItem(item).total)}
                          </TableCell>
                          <TableCell className="align-top py-4">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeItem(item.id)}
                              className="h-8 w-8 text-sidebar/20 hover:text-red-500 hover:bg-red-50 rounded-full transition-all opacity-0 group-hover:opacity-100"
                              disabled={items.length === 1}
                              data-testid={`button-remove-${index}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="p-6 bg-sidebar/[0.01]">
                  <div className="flex items-center gap-3">
                    <Button onClick={addItem} variant="outline" className="border-sidebar/10 text-sidebar hover:bg-sidebar/5 font-bold font-display uppercase tracking-wider text-[10px] h-9 px-4 gap-2 shadow-sm" data-testid="button-add-item">
                      <Plus className="h-4 w-4" /> Add Another Line
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-sidebar/10 shadow-sm overflow-hidden bg-white ml-auto max-w-md w-full">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sidebar/60">
                    <span className="text-xs font-bold font-display uppercase tracking-wider">Sub Total</span>
                    <span className="font-bold text-sm font-display">{formatCurrency(totals.taxableSubtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sidebar/60">
                    <span className="text-xs font-bold font-display uppercase tracking-wider">Adjustment</span>
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        value={adjustment}
                        onChange={(e) => setAdjustment(parseFloat(e.target.value) || 0)}
                        className="w-20 h-8 text-right bg-slate-50/50 border-sidebar/10 focus:ring-0 focus:border-sidebar/20 shadow-none text-xs font-bold font-mono"
                        data-testid="input-adjustment"
                      />
                    </div>
                  </div>
                  <div className="pt-4 mt-4 border-t border-sidebar/10">
                    <div className="flex justify-between items-center text-sidebar">
                      <span className="font-bold font-display uppercase tracking-wider text-xs">Total</span>
                      <span className="font-bold text-xl font-display text-sidebar">{formatCurrency(finalTotal)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="border-sidebar/10 shadow-sm overflow-hidden">
                <CardContent className="p-0">
                  <div className="px-6 py-3 border-b border-sidebar/5 bg-sidebar/[0.02]">
                    <h3 className="text-[10px] font-bold text-sidebar/40 uppercase tracking-widest font-display">Notes</h3>
                  </div>
                  <div className="p-6">
                    <Textarea
                      placeholder="Notes to be displayed on DC"
                      value={customerNotes}
                      onChange={(e) => setCustomerNotes(e.target.value)}
                      className="min-h-[100px] border-sidebar/10 focus:border-sidebar/20 focus:ring-0 bg-slate-50/30 font-medium text-sidebar"
                      data-testid="textarea-customer-notes"
                    />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-sidebar/10 shadow-sm overflow-hidden">
                <CardContent className="p-0">
                  <div className="px-6 py-3 border-b border-sidebar/5 bg-sidebar/[0.02]">
                    <h3 className="text-[10px] font-bold text-sidebar/40 uppercase tracking-widest font-display">Terms & Conditions</h3>
                  </div>
                  <div className="p-6">
                    <Textarea
                      placeholder="Terms and conditions..."
                      value={termsAndConditions}
                      onChange={(e) => setTermsAndConditions(e.target.value)}
                      className="min-h-[100px] border-sidebar/10 focus:border-sidebar/20 focus:ring-0 bg-slate-50/30 font-medium text-sidebar"
                      data-testid="textarea-terms"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-sidebar/10 z-50 md:left-64">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 px-6 py-4">
          <Button variant="ghost" className="text-sidebar/60 hover:text-sidebar hover:bg-sidebar/5 font-bold font-display uppercase tracking-wider text-[10px] h-10 px-6 shadow-sm" onClick={() => setLocation("/delivery-challans")}>
            Cancel
          </Button>
          <div className="flex items-center gap-3 flex-1 justify-end">
            <Button variant="outline" className="gap-2 border-sidebar/10 text-sidebar hover:bg-sidebar/5 font-bold font-display uppercase tracking-wider text-[10px] h-10 px-6 shadow-sm" onClick={() => handleSave()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Changes
            </Button>
            <div className="h-8 w-px bg-sidebar/10 mx-1"></div>
            <Button
              className="min-w-[160px] bg-sidebar hover:bg-sidebar/90 text-white shadow-md hover:translate-y-[-1px] transition-all h-10 px-8 font-bold font-display uppercase tracking-wider text-xs"
              onClick={() => handleSave('OPEN')}
              disabled={saving}
              data-testid="button-save-confirm"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {status === 'OPEN' ? "Update & Confirm" : "Save and Confirm"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
