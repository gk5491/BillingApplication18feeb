import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { ArrowLeft, RefreshCw, Upload, Plus, Trash2, Search, FileText, Info, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AccountSelectDropdown, normalizeAccountValue } from "@/components/AccountSelectDropdown";
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

const TDS_TCS_OPTIONS = [
  { value: "commission_brokerage_2", label: "Commission or Brokerage [2%]" },
  { value: "professional_fees_10", label: "Professional Fees [10%]" },
  { value: "rent_10", label: "Rent [10%]" },
  { value: "contractor_1", label: "Payment to Contractor [1%]" },
  { value: "contractor_2", label: "Payment to Contractor [2%]" },
];

// Account dropdown is now handled by AccountSelectDropdown component

const TAX_OPTIONS = [
  { value: "gst_5", label: "GST [5%]" },
  { value: "gst_12", label: "GST [12%]" },
  { value: "gst_18", label: "GST [18%]" },
  { value: "gst_28", label: "GST [28%]" },
  { value: "igst_5", label: "IGST [5%]" },
  { value: "igst_12", label: "IGST [12%]" },
  { value: "igst_18", label: "IGST [18%]" },
  { value: "igst_28", label: "IGST [28%]" },
  { value: "exempt", label: "Exempt" },
  { value: "nil", label: "Nil Rated" },
];

interface Vendor {
  id: string;
  displayName: string;
  companyName?: string;
}

interface Product {
  id: string;
  name: string;
  rate?: number;
  costPrice?: number;
  sellingPrice?: number;
  description?: string;
  type?: string;
}

interface LineItem {
  id: string;
  itemId: string;
  itemName: string;
  description: string;
  account: string;
  quantity: number;
  rate: number;
  tax: string;
  taxAmount?: number;
  amount: number;
  hsnSac?: string;
  billId?: string;
  billNumber?: string;
  billDate?: string;
  balanceDue?: number;
  billTotal?: number;
  originalQuantity?: number;
  availableQuantity?: number;
  billStatus?: string;
}

export default function VendorCreditEdit() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const creditId = params.id;
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [vendorsLoading, setVendorsLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const [billItems, setBillItems] = useState<any[]>([]);
  const [billItemsLoading, setBillItemsLoading] = useState(false);
  const [vendorBills, setVendorBills] = useState<any[]>([]);
  const [vendorBillsLoading, setVendorBillsLoading] = useState(false);

  // Helper function to parse rate values that might contain commas
  const parseRateValue = (value: string | number | undefined): number => {
    if (typeof value === 'number') return value;
    if (!value) return 0;
    // Remove commas and parse as float
    const stringValue = String(value).replace(/,/g, '');
    const parsed = parseFloat(stringValue);
    return isNaN(parsed) ? 0 : parsed;
  };

  const [formData, setFormData] = useState({
    vendorId: "",
    vendorName: "",
    creditNoteNumber: "",
    referenceNumber: "",
    orderNumber: "",
    vendorCreditDate: new Date().toISOString().split('T')[0],
    subject: "",
    reverseCharge: false,
    taxType: "tds" as "tds" | "tcs",
    tdsTcs: "",
    discountType: "percentage" as "percentage" | "amount",
    discountValue: "",
    adjustment: "",
    notes: "",
    billId: "",
    billNumber: "",
  });

  const [items, setItems] = useState<LineItem[]>([]);

  const [initialDataLoaded, setInitialDataLoaded] = useState(false);

  useEffect(() => {
    fetchVendors();
    fetchProducts();
    if (creditId && !initialDataLoaded) {
      fetchVendorCredit();
      setInitialDataLoaded(true);
    }
  }, [creditId, initialDataLoaded]);

  const fetchVendors = async () => {
    try {
      setVendorsLoading(true);
      const response = await fetch('/api/vendors');
      if (response.ok) {
        const data = await response.json();
        setVendors(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch vendors:', error);
    } finally {
      setVendorsLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setProductsLoading(true);
      const response = await fetch('/api/items');
      if (response.ok) {
        const data = await response.json();
        setProducts(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setProductsLoading(false);
    }
  };

  const fetchBillItems = async (vendorId: string) => {
    try {
      setBillItemsLoading(true);
      const response = await fetch(`/api/vendors/${vendorId}/bill-items`);
      if (response.ok) {
        const data = await response.json();
        setBillItems(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch bill items:', error);
    } finally {
      setBillItemsLoading(false);
    }
  };

  const fetchVendorBills = async (vendorId: string) => {
    try {
      setVendorBillsLoading(true);
      const response = await fetch(`/api/bills?vendorId=${vendorId}`);
      if (response.ok) {
        const data = await response.json();
        setVendorBills(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch vendor bills:', error);
    } finally {
      setVendorBillsLoading(false);
    }
  };

  const fetchVendorCredit = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/vendor-credits/${creditId}`);
      if (response.ok) {
        const data = await response.json();
        const credit = data.data;
        if (credit) {
          setFormData({
            vendorId: credit.vendorId || "",
            vendorName: credit.vendorName || "",
            creditNoteNumber: credit.creditNumber || "",
            referenceNumber: credit.referenceNumber || "",
            orderNumber: credit.orderNumber || "",
            vendorCreditDate: credit.date || new Date().toISOString().split('T')[0],
            subject: credit.subject || "",
            reverseCharge: credit.reverseCharge || false,
            taxType: credit.taxType || "tds",
            tdsTcs: credit.tdsTcs || "",
            discountType: credit.discountType || "percentage",
            discountValue: credit.discountValue?.toString() || "",
            adjustment: credit.adjustment?.toString() || "",
            notes: credit.notes || "",
            billId: credit.billId || "",
            billNumber: credit.billNumber || "",
          });

          if (credit.vendorId) {
            fetchBillItems(credit.vendorId);
            fetchVendorBills(credit.vendorId);
          }

          if (credit.items && credit.items.length > 0) {
            setItems(credit.items.map((item: any) => ({
              id: item.id || `item-${Date.now()}-${Math.random()}`,
              itemId: item.itemId || "",
              itemName: item.itemName || "",
              description: item.description || "",
              account: item.account || "cost_of_goods_sold",
              quantity: item.quantity || 1,
              rate: parseFloat(item.rate) || 0,
              tax: item.tax || "",
              taxAmount: item.taxAmount || 0,
              amount: item.amount || 0,
              hsnSac: item.hsnSac || "",
              billStatus: item.billStatus,
            })));
          }
        }
      } else {
        toast({ title: "Failed to load vendor credit", variant: "destructive" });
        setLocation('/vendor-credits');
      }
    } catch (error) {
      console.error('Failed to fetch vendor credit:', error);
      toast({ title: "Failed to load vendor credit", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleVendorChange = (vendorId: string) => {
    const vendor = vendors.find(v => v.id === vendorId);
    if (vendor) {
      setFormData(prev => ({
        ...prev,
        vendorId: vendor.id,
        vendorName: vendor.displayName,
        billId: "",
        billNumber: "",
      }));
      setItems([]);
      fetchBillItems(vendor.id);
      fetchVendorBills(vendor.id);
    }
  };

  const handleBillChange = (selectedBillId: string) => {
    if (!selectedBillId || selectedBillId === "_empty") return;

    const bill = vendorBills.find((b: any) => b.id === selectedBillId);

    if (bill) {
      setFormData(prev => ({
        ...prev,
        billId: bill.id,
        billNumber: bill.billNumber,
        subject: `Vendor Credit for Bill #${bill.billNumber}`,
        notes: `Created from Bill #${bill.billNumber}`,
      }));

      // Pre-populate items from the selected bill
      if (bill.items && bill.items.length > 0) {
        const mappedItems: LineItem[] = bill.items.map((item: any, index: number) => {
          const quantity = item.quantity || 1;
          const rate = item.rate || 0;
          const amount = quantity * rate;
          const tax = normalizeTaxValue(item.tax || "");
          let taxAmount = item.taxAmount || 0;

          if (!taxAmount && tax) {
            const taxMatch = tax.match(/(\d+)/);
            if (taxMatch) {
              const taxPercent = parseFloat(taxMatch[1]);
              taxAmount = (amount * taxPercent) / 100;
            }
          }

          return {
            id: `item-${Date.now()}-${index}`,
            itemId: `${item.itemId || item.id}::${bill.id}`, // Use composite key for consistency
            itemName: item.itemName || item.name || "",
            description: item.description || "",
            account: normalizeAccountValue(item.account || "cost_of_goods_sold"),
            quantity,
            rate,
            tax,
            taxAmount,
            amount,
            billId: bill.id,
            billNumber: bill.billNumber,
            billDate: bill.billDate,
            balanceDue: bill.balanceDue,
            billTotal: bill.total,
            billStatus: bill.status,
          };
        });
        setItems(mappedItems);
      }
    } else {
      setFormData(prev => ({
        ...prev,
        billId: "",
        billNumber: "",
      }));
      setItems([]);
    }
  };

  // Re-define normalizeTaxValue since it was missing in edit page or needs to be consistent
  const normalizeTaxValue = (tax: string): string => {
    if (!tax) return "";
    const match = tax.match(/^([A-Za-z]+)(\d+)$/);
    if (match) {
      const prefix = match[1].toLowerCase();
      const percent = match[2];
      return `${prefix}_${percent}`;
    }
    return tax.toLowerCase().replace(/\s+/g, '_');
  };

  const addItem = () => {
    setItems(prev => [...prev, {
      id: `item-${Date.now()}`,
      itemId: "",
      itemName: "",
      description: "",
      account: "cost_of_goods_sold",
      quantity: 1,
      rate: 0,
      tax: "",
      taxAmount: 0,
      amount: 0,
      hsnSac: "",
    }]);
  };

  const removeItem = (itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
  };

  const updateItem = (itemId: string, field: string, value: any) => {
    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const updated = { ...item, [field]: value };
        if (field === 'itemId') {
          // Handle composite key referencing specific bill item
          if (value.includes('::')) {
            const [pId, bId] = value.split('::');
            const billItem = billItems.find((bi: any) => bi.itemId === pId && bi.billId === bId);

            if (billItem) {
              updated.itemId = value; // Keep composite key
              updated.itemName = billItem.itemName || billItem.name;
              updated.description = billItem.description || '';
              updated.rate = billItem.rate || 0;
              updated.billId = billItem.billId;
              updated.billNumber = billItem.billNumber;
              updated.billDate = billItem.billDate;
              updated.balanceDue = billItem.balanceDue;
              updated.billTotal = billItem.billTotal;
              updated.originalQuantity = billItem.originalQuantity;
              updated.availableQuantity = billItem.availableQuantity;
              updated.billStatus = billItem.billStatus;

              const isFullyPaid = billItem.billStatus === 'PAID';
              // If somehow selected (e.g. was already selected), maybe warn?
              // For new selection, updated from dropdown, we set q=1
              updated.quantity = 1;
              updated.amount = updated.quantity * updated.rate;
            }
          } else {
            const product = products.find(p => p.id === value);
            if (product) {
              updated.itemId = value;
              updated.itemName = product.name;
              updated.description = product.description || '';
              updated.rate = product.costPrice || product.sellingPrice || parseRateValue(product.rate) || 0;
              updated.amount = updated.quantity * updated.rate;

              // Try to find matching bill item if possible (legacy behavior)
              // But with composite key, this path is for non-bill items usually
              const billItem = billItems.find((bi: any) => bi.itemId === value);
              if (billItem) {
                updated.billId = billItem.billId;
                updated.billNumber = billItem.billNumber;
                updated.billDate = billItem.billDate;
                updated.balanceDue = billItem.balanceDue;
                updated.billTotal = billItem.billTotal;
                updated.originalQuantity = billItem.originalQuantity;
                updated.availableQuantity = billItem.availableQuantity;
                updated.billStatus = billItem.billStatus;
                updated.quantity = Math.min(updated.quantity, billItem.availableQuantity || 0);
              }
            }
          }
        }
        if (field === 'quantity' || field === 'rate') {
          // Validate quantity against available quantity if present
          if (field === 'quantity' && updated.availableQuantity !== undefined) {
            if (value > updated.availableQuantity) {
              toast({
                title: "Quantity limit exceeded",
                description: `Maximum available quantity for this item is ${updated.availableQuantity}`,
                variant: "destructive"
              });
              updated.quantity = updated.availableQuantity;
            }
          }
          updated.amount = updated.quantity * updated.rate;
          // Recalculate tax amount when quantity or rate changes
          if (updated.tax) {
            const taxMatch = updated.tax.match(/(\d+)/);
            if (taxMatch) {
              const taxPercent = parseFloat(taxMatch[1]);
              updated.taxAmount = (updated.amount * taxPercent) / 100;
            }
          }
        }
        if (field === 'tax') {
          const taxMatch = value.match(/(\d+)/);
          if (taxMatch) {
            const taxPercent = parseFloat(taxMatch[1]);
            updated.taxAmount = (updated.amount * taxPercent) / 100;
          } else {
            updated.taxAmount = 0;
          }
        }
        return updated;
      }
      return item;
    }));
  };

  const calculateSubTotal = () => {
    return items.reduce((sum, item) => sum + item.amount, 0);
  };

  const calculateTaxAmount = () => {
    return items.reduce((sum, item) => sum + (item.taxAmount || 0), 0);
  };

  const calculateDiscount = () => {
    const subTotal = calculateSubTotal();
    if (formData.discountType === 'percentage') {
      return subTotal * (parseFloat(formData.discountValue) || 0) / 100;
    }
    return parseFloat(formData.discountValue) || 0;
  };

  const calculateTdsTcs = () => {
    if (!formData.tdsTcs) return 0;
    const subTotal = calculateSubTotal() - calculateDiscount();
    const percentMatch = formData.tdsTcs.match(/(\d+)/);
    if (percentMatch) {
      const percent = parseFloat(percentMatch[1]);
      return subTotal * percent / 100;
    }
    return 0;
  };

  const calculateTotal = () => {
    const subTotal = calculateSubTotal();
    const taxAmount = calculateTaxAmount();
    const discount = calculateDiscount();
    const tdsTcs = calculateTdsTcs();
    const adjustment = parseFloat(formData.adjustment) || 0;

    if (formData.taxType === 'tds') {
      return subTotal + taxAmount - discount - tdsTcs + adjustment;
    }
    return subTotal + taxAmount - discount + tdsTcs + adjustment;
  };

  const handleSubmit = async () => {
    if (!formData.vendorId) {
      toast({ title: "Please select a vendor", variant: "destructive" });
      return;
    }

    // Restrictions removed as per user request

    setSaving(true);
    try {
      const payload = {
        ...formData,
        creditNumber: formData.creditNoteNumber,
        date: formData.vendorCreditDate,
        items,
        subTotal: calculateSubTotal(),
        taxAmount: calculateTaxAmount(),
        discountAmount: calculateDiscount(),
        tdsTcsAmount: calculateTdsTcs(),
        adjustment: parseFloat(formData.adjustment) || 0,
        total: calculateTotal(),
        amount: calculateTotal(),
        balance: calculateTotal(),
      };

      const response = await fetch(`/api/vendor-credits/${creditId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast({ title: "Vendor credit updated successfully" });
        setLocation('/vendor-credits');
      } else {
        const error = await response.json();
        toast({ title: error.message || "Failed to update vendor credit", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Failed to update vendor credit", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <RefreshCw className="h-5 w-5 animate-spin text-sidebar" />
          <span className="text-slate-600">Loading vendor credit...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-50 h-screen">
      <div className="border-b border-slate-200 bg-white px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/vendor-credits")}
              data-testid="button-back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold">Edit Vendor Credit</h1>
            <Badge variant="outline">{formData.creditNoteNumber}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setLocation("/vendor-credits")}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={saving}
              className="bg-sidebar hover:bg-sidebar/90 font-display"
              data-testid="button-save"
            >
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-6 space-y-8 pb-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            <div className="md:col-span-1">
              <Label className="text-black">Vendor Name
                <span className="text-red-600">*</span>
              </Label>
              <div className="flex gap-2">
                <Select
                  value={formData.vendorId}
                  onValueChange={handleVendorChange}
                >
                  <SelectTrigger className="flex-1" data-testid="select-vendor">
                    <SelectValue placeholder="Select a Vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendorsLoading ? (
                      <SelectItem value="_loading" disabled>Loading...</SelectItem>
                    ) : vendors.length === 0 ? (
                      <SelectItem value="_empty" disabled>No vendors found</SelectItem>
                    ) : (
                      vendors.map((vendor) => (
                        <SelectItem key={vendor.id} value={vendor.id}>
                          {vendor.displayName}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="md:col-span-1">
              <Label className="text-black">Bill Number</Label>
              <Select
                value={formData.billId}
                onValueChange={handleBillChange}
                disabled={!formData.vendorId}
              >
                <SelectTrigger className="flex-1" data-testid="select-bill">
                  <SelectValue placeholder={formData.vendorId ? "Select a Bill" : "Select a Vendor first"} />
                </SelectTrigger>
                <SelectContent>
                  {vendorBillsLoading ? (
                    <SelectItem value="_loading" disabled>Loading...</SelectItem>
                  ) : vendorBills.length === 0 ? (
                    <SelectItem value="_empty" disabled>No bills found</SelectItem>
                  ) : (
                    <>
                      <SelectItem value="_none">None (Direct Credit)</SelectItem>
                      {vendorBills
                        .filter((b: any) => b.status !== 'PAID')
                        .map((bill) => (
                          <SelectItem key={bill.id} value={bill.id}>
                            Bill #{bill.billNumber} ({bill.billDate}) - ₹{bill.balanceDue || bill.total} {bill.status === 'VOID' ? '(VOID)' : ''}
                          </SelectItem>
                        ))
                      }
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-1">
              <Label>Vendor Credit Date</Label>
              <Input
                type="date"
                value={formData.vendorCreditDate}
                onChange={(e) => setFormData(prev => ({ ...prev, vendorCreditDate: e.target.value }))}
                data-testid="input-vendor-credit-date"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label className="text-black">Credit Note#
                <span className="text-red-600">*</span>
              </Label>
              <Input
                value={formData.creditNoteNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, creditNoteNumber: e.target.value }))}
                data-testid="input-credit-note-number"
              />
            </div>

            <div>
              <Label>Reference Number</Label>
              <Input
                value={formData.referenceNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, referenceNumber: e.target.value }))}
                data-testid="input-reference-number"
              />
            </div>

            <div>
              <Label>Order Number</Label>
              <Input
                value={formData.orderNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, orderNumber: e.target.value }))}
                data-testid="input-order-number"
              />
            </div>
          </div>

          <div>
            <Label>Subject</Label>
            <Input
              placeholder="Enter a subject within 250 characters"
              maxLength={250}
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              data-testid="input-subject"
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              checked={formData.reverseCharge}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, reverseCharge: !!checked }))}
              data-testid="checkbox-reverse-charge"
            />
            <span className="text-sm text-slate-600">This transaction is applicable for reverse charge</span>
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-4">
              <RefreshCw className="h-4 w-4 text-slate-400" />
              <span className="text-sm text-slate-600">At Transaction Level</span>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-sidebar/5 border-b">
                <h3 className="font-medium">Item Table</h3>
                <Button variant="link" size="sm" className="text-sidebar">
                  Bulk Actions
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-sidebar/5 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-slate-600 uppercase text-xs w-8"></th>
                      <th className="px-4 py-3 text-left font-medium text-slate-600 uppercase text-xs">Item Details</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-600 uppercase text-xs">Account</th>
                      <th className="px-4 py-3 text-center font-medium text-slate-600 uppercase text-xs">Quantity</th>
                      <th className="px-4 py-3 text-right font-medium text-slate-600 uppercase text-xs">Rate</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-600 uppercase text-xs">Tax</th>
                      <th className="px-4 py-3 text-right font-medium text-slate-600 uppercase text-xs">Amount</th>
                      <th className="px-4 py-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                          <p>No items added yet. Click "Add New Row" to add items.</p>
                        </td>
                      </tr>
                    ) : (
                      items.map((item, index) => (
                        <tr key={item.id} className="border-b last:border-b-0">
                          <td className="px-4 py-3 text-center">
                            <span className="text-slate-400">:</span>
                          </td>
                          <td className="px-4 py-3">
                            <Select
                              value={item.itemId || ""}
                              onValueChange={(v) => updateItem(item.id, 'itemId', v)}
                            >
                              <SelectTrigger data-testid={`select-item-${index}`}>
                                <SelectValue placeholder="Select an item">
                                  {item.itemName || products.find(p => p.id === item.itemId)?.name || "Select an item"}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {productsLoading ? (
                                  <SelectItem value="_loading" disabled>Loading...</SelectItem>
                                ) : (products.length === 0 || (billItems.length > 0 && !billItems.some(bi => products.some(p => p.id === bi.itemId)))) ? (
                                  <SelectItem value="_empty" disabled>No items found</SelectItem>
                                ) : (
                                  // Show items per bill if bill items exist
                                  billItems.length > 0 ? (
                                    billItems
                                      .filter((bi: any) => bi.billStatus !== 'PAID' || items.some(i => i.itemId === `${bi.itemId}::${bi.billId}` || i.itemId === bi.itemId))
                                      .map((billItem: any) => {
                                        const isPaid = billItem.billStatus === 'PAID';
                                        const compositeKey = `${billItem.itemId}::${billItem.billId}`;
                                        // Check if this item is the currently selected one to allow it even if paid (edit mode)
                                        const isSelected = item.itemId === compositeKey || item.itemId === billItem.itemId; // Handle both key formats

                                        return (
                                          <SelectItem
                                            key={compositeKey}
                                            value={compositeKey}
                                            disabled={isPaid && !isSelected}
                                            className={isPaid && !isSelected ? "opacity-50" : ""}
                                          >
                                            <div className="flex flex-col">
                                              <span>{billItem.itemName || billItem.name}</span>
                                              <span className="text-xs text-muted-foreground">
                                                Bill #{billItem.billNumber} • {billItem.billStatus}
                                              </span>
                                            </div>
                                          </SelectItem>
                                        );
                                      })
                                  ) : (
                                    // Fallback to products
                                    products.map((product) => (
                                      <SelectItem key={product.id} value={product.id}>
                                        {product.name}
                                      </SelectItem>
                                    ))
                                  )
                                )}
                              </SelectContent>
                            </Select>
                            <div className="flex flex-col gap-1 mt-1">
                              {item.description && (
                                <div className="text-xs text-slate-500 line-clamp-1">{item.description}</div>
                              )}
                              {item.availableQuantity !== undefined && (
                                <div className="flex items-center gap-1">
                                  <Badge variant="outline" className="text-[10px] h-4 px-1.5 bg-blue-50 text-blue-600 border-blue-200">
                                    Available: {item.availableQuantity} / {item.originalQuantity}
                                  </Badge>
                                  {item.billNumber && (
                                    <Badge variant="outline" className="text-[10px] h-4 px-1.5 bg-slate-50 text-slate-600 border-slate-200">
                                      Bill #{item.billNumber}
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <AccountSelectDropdown
                              value={item.account}
                              onValueChange={(v) => updateItem(item.id, 'account', v)}
                              placeholder="Select an account"
                              testId={`select-account-${index}`}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              type="number"
                              step="0.01"
                              className="w-20 text-center"
                              value={item.quantity}
                              onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                              data-testid={`input-quantity-${index}`}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              type="number"
                              step="0.01"
                              className="w-24 text-right"
                              value={item.rate}
                              onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                              data-testid={`input-rate-${index}`}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <Select
                              value={item.tax || ""}
                              onValueChange={(v) => updateItem(item.id, 'tax', v)}
                            >
                              <SelectTrigger data-testid={`select-tax-${index}`}>
                                <SelectValue placeholder="Select tax">
                                  {TAX_OPTIONS.find(o => o.value === item.tax)?.label || item.tax || "Select tax"}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">No Tax</SelectItem>
                                {TAX_OPTIONS.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-4 py-3 text-right font-medium">
                            {item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeItem(item.id)}
                              data-testid={`button-remove-item-${index}`}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="px-4 py-3 border-t">
                <Button
                  variant="link"
                  className="text-sidebar p-0"
                  onClick={addItem}
                  data-testid="button-add-item"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add New Row
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <Label>Notes</Label>
              <Textarea
                placeholder="Notes for internal use"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="min-h-[100px]"
                data-testid="input-notes"
              />
            </div>

            <div className="space-y-3 bg-slate-50 p-4 rounded-lg">
              <div className="flex justify-between text-sm">
                <span>Sub Total</span>
                <span className="font-medium">{calculateSubTotal().toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm">Discount</span>
                <Select
                  value={formData.discountType}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, discountType: v as "percentage" | "amount" }))}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">%</SelectItem>
                    <SelectItem value="amount">Amount</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  className="w-20 text-right"
                  value={formData.discountValue}
                  onChange={(e) => setFormData(prev => ({ ...prev, discountValue: e.target.value }))}
                  data-testid="input-discount"
                />
                <span className="text-sm font-medium">-{calculateDiscount().toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>

              {calculateTaxAmount() > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Tax</span>
                  <span className="font-medium">{calculateTaxAmount().toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <span className="text-sm">TDS/TCS</span>
                <Select
                  value={formData.taxType}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, taxType: v as "tds" | "tcs" }))}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tds">TDS</SelectItem>
                    <SelectItem value="tcs">TCS</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={formData.tdsTcs}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, tdsTcs: v }))}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select TDS/TCS" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {TDS_TCS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm">Adjustment</span>
                <Input
                  type="number"
                  className="w-24 text-right"
                  value={formData.adjustment}
                  onChange={(e) => setFormData(prev => ({ ...prev, adjustment: e.target.value }))}
                  data-testid="input-adjustment"
                />
              </div>

              <div className="flex justify-between pt-3 border-t font-semibold">
                <span>Total (INR)</span>
                <span className="text-lg">{calculateTotal().toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
