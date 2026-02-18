import { useState, useEffect, useRef, useMemo } from "react";
import { useLocation, useSearch } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, RefreshCw, Upload, Plus, Trash2, Search, FileText, Info, X } from "lucide-react";
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
  { value: "cgst_9", label: "CGST [9%]" },
  { value: "cgst_14", label: "CGST [14%]" },
  { value: "sgst_9", label: "SGST [9%]" },
  { value: "sgst_14", label: "SGST [14%]" },
  { value: "exempt", label: "Exempt" },
  { value: "nil", label: "Nil Rated" },
];

// normalizeAccountValue is imported from AccountSelectDropdown component

// Helper function to normalize tax value from bill format (e.g., "IGST18", "CGST9") to select option format (e.g., "igst_18", "cgst_9")
const normalizeTaxValue = (tax: string): string => {
  if (!tax) return "";
  // Extract prefix and percentage: "IGST18" -> ["IGST", "18"], "CGST9" -> ["CGST", "9"]
  const match = tax.match(/^([A-Za-z]+)(\d+)$/);
  if (match) {
    const prefix = match[1].toLowerCase();
    const percent = match[2];
    return `${prefix}_${percent}`;
  }
  // Already in correct format or unknown
  return tax.toLowerCase().replace(/\s+/g, '_');
};

interface Vendor {
  id: string;
  displayName: string;
  companyName?: string;
}

interface Item {
  id: string;
  name: string;
  rate: number | string;
  description?: string;
  type?: string;
  costPrice?: number;
  sellingPrice?: number;
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
  billId?: string;
  billNumber?: string;
  billDate?: string;
  balanceDue?: number;
  billTotal?: number;
  originalQuantity?: number;
  availableQuantity?: number;
  billStatus?: string;
}

export default function VendorCreditCreate() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  // Helper function to parse rate values that might contain commas
  const parseRateValue = (value: string | number | undefined): number => {
    if (typeof value === 'number') return value;
    if (!value) return 0;
    // Remove commas and parse as float
    const stringValue = String(value).replace(/,/g, '');
    const parsed = parseFloat(stringValue);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Get query params from URL using wouter's useSearch for proper reactivity
  const urlParams = new URLSearchParams(searchString);
  const billId = urlParams.get('billId');
  const vendorIdFromUrl = urlParams.get('vendorId');

  const [formData, setFormData] = useState({
    vendorId: "",
    vendorName: "",
    creditNoteNumber: "",
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
    attachments: [] as any[],
    billId: billId || "",
    billNumber: "",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (formData.attachments.length + files.length > 5) {
      toast({ title: "Maximum 5 files allowed", variant: "destructive" });
      return;
    }

    setUploading(true);
    const formDataUpload = new FormData();
    for (let i = 0; i < files.length; i++) {
      formDataUpload.append('files', files[i]);
    }

    try {
      const response = await fetch('/api/vendor-credits/upload', {
        method: 'POST',
        body: formDataUpload,
      });

      if (response.ok) {
        const result = await response.json();
        setFormData(prev => ({
          ...prev,
          attachments: [...prev.attachments, ...result.data]
        }));
        toast({ title: "Files uploaded successfully" });
      } else {
        toast({ title: "Failed to upload files", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error uploading files", variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter(a => a.id !== id)
    }));
  };

  const [items, setItems] = useState<LineItem[]>([]);
  const [billDataLoaded, setBillDataLoaded] = useState(false);

  const { data: vendorsData, isLoading: vendorsLoading } = useQuery<{ success: boolean; data: Vendor[] }>({
    queryKey: ['/api/vendors'],
  });

  const { data: productsData, isLoading: productsLoading } = useQuery<{ success: boolean; data: Item[] }>({
    queryKey: ['/api/items'],
  });

  const { data: nextNumberData } = useQuery<{ success: boolean; data: { nextNumber: string } }>({
    queryKey: ['/api/vendor-credits/next-number'],
  });

  // Fetch bill data if billId is provided
  const { data: billData, isLoading: billLoading } = useQuery<{ success: boolean; data: any }>({
    queryKey: ['/api/bills', billId],
    enabled: !!billId,
  });

  useEffect(() => {
    if (nextNumberData?.data?.nextNumber) {
      setFormData(prev => ({ ...prev, creditNoteNumber: nextNumberData.data.nextNumber }));
    }
  }, [nextNumberData]);

  // Pre-populate form with bill data when it loads
  useEffect(() => {
    if (billData?.data && !billDataLoaded && productsData?.data) {
      const bill = billData.data;
      const productsList = productsData.data;

      setFormData(prev => ({
        ...prev,
        vendorId: bill.vendorId || "",
        vendorName: bill.vendorName || "",
        subject: `Vendor Credit for Bill #${bill.billNumber}`,
        reverseCharge: bill.reverseCharge || false,
        notes: `Created from Bill #${bill.billNumber}`,
        billId: bill.id,
        billNumber: bill.billNumber,
      }));

      // Pre-populate items from bill
      if (bill.items && bill.items.length > 0) {
        const billItems: LineItem[] = bill.items.map((item: any, index: number) => {
          const quantity = item.quantity || 1;
          const rate = item.rate || 0;
          const amount = quantity * rate;
          const tax = normalizeTaxValue(item.tax || "");
          let taxAmount = item.taxAmount || 0;

          // Calculate tax amount if not provided
          if (!taxAmount && tax) {
            const taxMatch = tax.match(/(\d+)/);
            if (taxMatch) {
              const taxPercent = parseFloat(taxMatch[1]);
              taxAmount = (amount * taxPercent) / 100;
            }
          }

          // Find matching product by name to get the correct itemId
          const itemName = item.itemName || item.name || "";
          const matchingProduct = productsList.find(
            (p: any) => p.name.toLowerCase() === itemName.toLowerCase()
          );

          return {
            id: `item-${Date.now()}-${index}`,
            itemId: matchingProduct?.id || "",
            itemName: itemName,
            description: item.description || "",
            account: normalizeAccountValue(item.account || ""),
            quantity,
            rate,
            tax,
            taxAmount,
            amount,
          };
        });
        setItems(billItems);
      }

      setBillDataLoaded(true);
    }
  }, [billData, billDataLoaded, productsData]);

  // Also handle vendor from URL if provided without bill
  useEffect(() => {
    if (vendorIdFromUrl && !billId && vendorsData?.data) {
      const vendor = vendorsData.data.find(v => v.id === vendorIdFromUrl);
      if (vendor) {
        setFormData(prev => ({
          ...prev,
          vendorId: vendor.id,
          vendorName: vendor.displayName,
        }));
      }
    }
  }, [vendorIdFromUrl, billId, vendorsData]);

  const vendors = vendorsData?.data || [];
  const products = productsData?.data || [];
  const { data: billItemsData, isLoading: billItemsLoading } = useQuery<{ success: boolean; data: any[] }>({
    queryKey: ['/api/vendors', formData.vendorId, 'bill-items'],
    queryFn: async () => {
      const response = await fetch(`/api/vendors/${formData.vendorId}/bill-items`);
      return response.json();
    },
    enabled: !!formData.vendorId && !billId,
  });

  // Fetch all bills for the vendor to populate the Bill dropdown
  const { data: vendorBillsData, isLoading: vendorBillsLoading } = useQuery<{ success: boolean; data: any[] }>({
    queryKey: ['/api/bills', { vendorId: formData.vendorId }],
    queryFn: async () => {
      const response = await fetch(`/api/bills?vendorId=${formData.vendorId}`);
      return response.json();
    },
    enabled: !!formData.vendorId,
  });

  const filteredProducts = useMemo(() => {
    return products;
  }, [products]);

  // Auto-populate items when bill items data is loaded
  useEffect(() => {
    // Only auto-populate from ALL bills if we don't have a specific bill selected (either via URL or dropdown)
    if (!billId && !formData.billId && billItemsData?.data) {
      if (billItemsData.data.length > 0) {
        // Remove PAID filtering to allow items from all bills
        const billItems: LineItem[] = billItemsData.data.map((item: any, index: number) => ({
          id: `item-${Date.now()}-${index}`,
          itemId: `${item.itemId || item.id}::${item.billId}`,
          itemName: item.itemName || item.name || "",
          description: item.description || "",
          account: normalizeAccountValue(item.account || "cost_of_goods_sold"),
          quantity: item.quantity || 1,
          rate: item.rate || 0,
          tax: normalizeTaxValue(item.tax || ""),
          taxAmount: item.taxAmount || 0,
          amount: (item.quantity || 1) * (item.rate || 0),
          billId: item.billId,
          billNumber: item.billNumber,
          billDate: item.billDate,
          balanceDue: item.balanceDue,
          billTotal: item.billTotal,
          billStatus: item.billStatus,
        }));
        setItems(billItems);
      }
    }
  }, [billItemsData, billId, formData.billId]);

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
      // Clear items when vendor changes unless we have a specific bill ID
      if (!billId) {
        setItems([]);
      }
    }
  };

  const handleBillChange = (selectedBillId: string) => {
    if (!selectedBillId || selectedBillId === "_empty") return;

    const bill = (vendorBillsData?.data || []).find((b: any) => b.id === selectedBillId);

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
        const billItems: LineItem[] = bill.items.map((item: any, index: number) => {
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
        setItems(billItems);
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
      amount: 0,
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
            const billItem = billItemsData?.data?.find((bi: any) => bi.itemId === pId && bi.billId === bId);

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

              // Helper to check if item is fully paid
              const isFullyPaid = billItem.billStatus === 'PAID';

              // If we just selected it, set quantity to 1 or available
              // But wait, if it's fully paid, we shouldn't be able to select it? 
              // The UI should prevent selection, but if somehow selected, handle gracefully
              updated.quantity = 1;
              updated.amount = updated.quantity * updated.rate;
            }
          } else {
            // Fallback for simple product selection if not using bill items (legacy or direct)
            const product = products.find(p => String(p.id) === String(value));
            if (product) {
              updated.itemId = value;
              updated.itemName = product.name;
              updated.description = product.description || '';
              updated.rate = product.costPrice || product.sellingPrice || parseRateValue(product.rate) || 0;
              updated.amount = updated.quantity * updated.rate;
            }
          }
        }
        if (field === 'quantity' || field === 'rate') {
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

  const calculateItemTaxAmount = () => {
    return items.reduce((sum, item) => {
      // Use stored taxAmount if available
      if (item.taxAmount !== undefined && item.taxAmount > 0) {
        return sum + item.taxAmount;
      }
      // Otherwise calculate from tax code
      if (item.tax) {
        const taxMatch = item.tax.match(/(\d+)/);
        if (taxMatch) {
          const taxPercent = parseFloat(taxMatch[1]);
          return sum + (item.amount * taxPercent) / 100;
        }
      }
      return sum;
    }, 0);
  };

  const calculateSubTotal = () => {
    return items.reduce((sum, item) => sum + item.amount, 0);
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
    const itemTaxAmount = calculateItemTaxAmount();
    const discount = calculateDiscount();
    const tdsTcs = calculateTdsTcs();
    const adjustment = parseFloat(formData.adjustment) || 0;

    if (formData.taxType === 'tds') {
      return subTotal + itemTaxAmount - discount - tdsTcs + adjustment;
    }
    return subTotal + itemTaxAmount - discount + tdsTcs + adjustment;
  };

  const handleSubmit = async (status: 'DRAFT' | 'OPEN') => {
    if (!formData.vendorId) {
      toast({ title: "Please select a vendor", variant: "destructive" });
      return;
    }

    // Restrictions removed as per user request

    setSaving(true);
    try {
      const payload = {
        ...formData,
        items,
        subTotal: calculateSubTotal(),
        taxAmount: calculateItemTaxAmount(),
        discountAmount: calculateDiscount(),
        tdsTcsAmount: calculateTdsTcs(),
        adjustment: parseFloat(formData.adjustment) || 0,
        total: calculateTotal(),
        amount: calculateTotal(),
        balance: calculateTotal(),
        status,
      };

      const response = await fetch('/api/vendor-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        // Invalidate the vendor credits query to ensure fresh data on list page
        queryClient.invalidateQueries({ queryKey: ['/api/vendor-credits'] });
        toast({ title: `Vendor credit ${status === 'DRAFT' ? 'saved as draft' : 'created'} successfully` });
        setLocation('/vendor-credits');
      } else {
        const error = await response.json();
        toast({ title: error.message || "Failed to save vendor credit", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Failed to save vendor credit", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 h-screen">
      <div className="border-b border-slate-200 bg-white px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/vendor-credits")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">New Vendor Credits</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-6 space-y-8 pb-24">
          {/* Show bill reference banner when creating from bill */}
          {billId && formData.billNumber && (
            <div className="bg-sidebar/5 border border-sidebar/20 rounded-lg p-4 flex items-center gap-3">
              <Info className="h-5 w-5 text-sidebar flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-sidebar">
                  Creating vendor credit from <span className="font-semibold">Bill #{formData.billNumber}</span>.
                  The vendor and items have been pre-populated from the bill.
                </p>
              </div>
              <Badge variant="outline" className="bg-sidebar/10 text-sidebar border-sidebar/30">
                <FileText className="h-3 w-3 mr-1" />
                From Bill
              </Badge>
            </div>
          )}

          {/* Loading state when fetching bill data */}
          {billLoading && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-center gap-3">
              <RefreshCw className="h-5 w-5 text-slate-500 animate-spin" />
              <p className="text-sm text-slate-600">Loading bill data...</p>
            </div>
          )}

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
                  ) : !vendorBillsData?.data || vendorBillsData.data.length === 0 ? (
                    <SelectItem value="_empty" disabled>No bills found</SelectItem>
                  ) : (
                    <>
                      <SelectItem value="_none">None (Direct Credit)</SelectItem>
                      {vendorBillsData.data
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-black">Credit Note#
                <span className="text-red-600">*</span>
              </Label>
              <div className="relative">
                <Input
                  value={formData.creditNoteNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, creditNoteNumber: e.target.value }))}
                  data-testid="input-credit-note-number"
                />
                <RefreshCw className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 cursor-pointer" />
              </div>
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
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Bulk Actions
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b">
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
                            <span className="text-slate-400">⋮⋮</span>
                          </td>
                          <td className="px-4 py-3">
                            <Select
                              value={item.itemId || ""}
                              onValueChange={(v) => updateItem(item.id, 'itemId', v)}
                            >
                              <SelectTrigger data-testid={`select-item-${index}`}>
                                <SelectValue placeholder="Select an item">
                                  {item.itemName || products.find(p => String(p.id) === String(item.itemId))?.name || "Select an item"}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {productsLoading || billItemsLoading ? (
                                  <SelectItem value="_loading" disabled>Loading...</SelectItem>
                                ) : billItemsData?.data && billItemsData.data.length > 0 ? (
                                  // Show only pending/partial items per bill
                                  billItemsData.data
                                    .filter((billItem: any) => billItem.billStatus !== 'PAID')
                                    .map((billItem: any) => {
                                      const isPaid = billItem.billStatus === 'PAID'; // Should be false now
                                      const compositeKey = `${billItem.itemId}::${billItem.billId}`;
                                      return (
                                        <SelectItem
                                          key={compositeKey}
                                          value={compositeKey}
                                          disabled={isPaid}
                                          className={isPaid ? "opacity-50" : ""}
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
                                ) : filteredProducts.length === 0 ? (
                                  <SelectItem value="_empty" disabled>No items found</SelectItem>
                                ) : (
                                  // Fallback to simple products list if no bill items found
                                  filteredProducts.map((product) => (
                                    <SelectItem key={product.id} value={String(product.id)}>
                                      {product.name}
                                    </SelectItem>
                                  ))
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
                                <SelectValue placeholder="Select a Tax">
                                  {TAX_OPTIONS.find(o => o.value === item.tax)?.label || item.tax || "Select a Tax"}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {TAX_OPTIONS.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-4 py-3 text-right font-medium">
                            {item.amount.toFixed(2)}
                          </td>
                          <td className="px-4 py-3">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeItem(item.id)}
                              className="text-red-500 h-8 w-8"
                              data-testid={`button-remove-item-${index}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex gap-4 mt-4">
              <Button
                variant="link"
                className="text-sidebar gap-1"
                onClick={addItem}
                data-testid="button-add-row"
              >
                <Plus className="h-4 w-4" />
                Add New Row
              </Button>
              <Button variant="link" className="text-sidebar gap-1">
                <Plus className="h-4 w-4" />
                Add Items in Bulk
              </Button>
            </div>
          </div>

          <div className="flex justify-end">
            <div className="w-80 space-y-3 bg-slate-50 p-4 rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Sub Total</span>
                <span className="font-medium">{calculateSubTotal().toFixed(2)}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600 flex-shrink-0">Discount</span>
                <Input
                  type="number"
                  step="0.01"
                  className="w-20 h-8"
                  value={formData.discountValue}
                  onChange={(e) => setFormData(prev => ({ ...prev, discountValue: e.target.value }))}
                  data-testid="input-discount"
                />
                <Select
                  value={formData.discountType}
                  onValueChange={(v: "percentage" | "amount") => setFormData(prev => ({ ...prev, discountType: v }))}
                >
                  <SelectTrigger className="w-16 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">%</SelectItem>
                    <SelectItem value="amount">₹</SelectItem>
                  </SelectContent>
                </Select>
                <span className="ml-auto font-medium">{calculateDiscount().toFixed(2)}</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex gap-2">
                  <label className="flex items-center gap-1 text-sm">
                    <input
                      type="radio"
                      name="taxType"
                      checked={formData.taxType === 'tds'}
                      onChange={() => setFormData(prev => ({ ...prev, taxType: 'tds' }))}
                    />
                    TDS
                  </label>
                  <label className="flex items-center gap-1 text-sm">
                    <input
                      type="radio"
                      name="taxType"
                      checked={formData.taxType === 'tcs'}
                      onChange={() => setFormData(prev => ({ ...prev, taxType: 'tcs' }))}
                    />
                    TCS
                  </label>
                </div>
                <Select
                  value={formData.tdsTcs}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, tdsTcs: v }))}
                >
                  <SelectTrigger className="flex-1 h-8" data-testid="select-tds-tcs">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {TDS_TCS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="font-medium text-sm">- {calculateTdsTcs().toFixed(2)}</span>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="text-xs h-8">
                  Adjustment
                </Button>
                <Input
                  type="number"
                  step="0.01"
                  className="w-24 h-8"
                  value={formData.adjustment}
                  onChange={(e) => setFormData(prev => ({ ...prev, adjustment: e.target.value }))}
                  data-testid="input-adjustment"
                />
                <span className="ml-auto font-medium">{(parseFloat(formData.adjustment) || 0).toFixed(2)}</span>
              </div>

              <div className="flex justify-between font-semibold text-lg border-t pt-3">
                <span>Total ( ₹ )</span>
                <span>{calculateTotal().toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <Label>Notes</Label>
              <Textarea
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="resize-none"
                data-testid="input-notes"
              />
            </div>

            <div>
              <Label>Attach File(s) to Vendor Credits</Label>
              <div className="flex flex-col gap-2 mt-2">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileUpload}
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    data-testid="button-upload-file"
                  >
                    {uploading ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    {uploading ? 'Uploading...' : 'Upload File'}
                  </Button>
                </div>

                {formData.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.attachments.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-md px-2 py-1 text-xs"
                      >
                        <FileText className="h-3 w-3 text-slate-500" />
                        <span className="truncate max-w-[150px]">{file.fileName}</span>
                        <button
                          onClick={() => removeAttachment(file.id)}
                          className="text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-2">You can upload a maximum of 5 files, 10MB each</p>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 bg-white px-6 py-4 sticky bottom-0">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => handleSubmit('DRAFT')}
              disabled={saving}
              data-testid="button-save-draft"
              className="font-display"
            >
              {saving ? 'Saving...' : 'Save as Draft'}
            </Button>
            <Button
              className="bg-sidebar hover:bg-sidebar/90 font-display"
              onClick={() => handleSubmit('OPEN')}
              disabled={saving}
              data-testid="button-save-open"
            >
              {saving ? 'Saving...' : 'Save as Open'}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setLocation('/vendor-credits')}
              data-testid="button-cancel"
              className="font-display"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
