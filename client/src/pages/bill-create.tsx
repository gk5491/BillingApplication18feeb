import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  FileText, Plus, Trash2, ChevronDown, Search,
  Upload, Info, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AccountSelectDropdown } from "@/components/AccountSelectDropdown";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";

interface Vendor {
  id: string;
  name: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  email?: string;
  phone?: string;
  gstin?: string;
  billingAddress?: {
    street1?: string;
    street2?: string;
    city?: string;
    state?: string;
    pinCode?: string;
    country?: string;
  };
}

interface BillItem {
  id: string;
  itemName: string;
  description?: string;
  account: string;
  quantity: number;
  rate: number;
  tax?: string;
  taxAmount?: number;
  customerDetails?: string;
  amount: number;
}

interface Account {
  id: string;
  name: string;
  type: string;
}

interface Tax {
  id: string;
  name: string;
  rate: number;
}

interface Product {
  id: string;
  name: string;
  sku?: string;
  type?: string;
  unit?: string;
  usageUnit?: string;
  sellingPrice?: number;
  costPrice?: number;
  rate?: string | number;
  purchaseRate?: string | number;
  description?: string;
  purchaseDescription?: string;
  hsnCode?: string;
  hsnSac?: string;
  sacCode?: string;
  taxPreference?: string;
  purchaseAccount?: string;
}

interface Customer {
  id: string;
  name: string;
  displayName?: string;
  companyName?: string;
}

export default function BillCreate() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorSearchTerm, setVendorSearchTerm] = useState("");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (attachments.length + files.length > 5) {
      toast({ title: "You can only upload up to 5 files", variant: "destructive" });
      return;
    }

    const formDataUpload = new FormData();
    for (let i = 0; i < files.length; i++) {
      if (files[i].size > 10 * 1024 * 1024) {
        toast({ title: `File ${files[i].name} exceeds 10MB limit`, variant: "destructive" });
        continue;
      }
      formDataUpload.append('files', files[i]);
    }

    setUploading(true);
    try {
      const response = await fetch('/api/bills/upload', {
        method: 'POST',
        body: formDataUpload
      });

      if (response.ok) {
        const result = await response.json();
        setAttachments(prev => [...prev, ...result.data]);
        toast({ title: "Files uploaded successfully" });
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      toast({ title: "Failed to upload files", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingPO, setLoadingPO] = useState(false);
  const [poDataLoaded, setPoDataLoaded] = useState(false);

  // Get query params from URL
  const urlParams = new URLSearchParams(window.location.search);
  const purchaseOrderId = urlParams.get('purchaseOrderId');
  const vendorIdFromUrl = urlParams.get('vendorId');

  const [formData, setFormData] = useState({
    vendorId: "",
    vendorName: "",
    vendorAddress: {
      street1: "",
      street2: "",
      city: "",
      state: "",
      pinCode: "",
      country: "India",
      gstin: ""
    },
    billNumber: "",
    orderNumber: "",
    billDate: new Date().toISOString().split('T')[0],
    dueDate: new Date().toISOString().split('T')[0],
    paymentTerms: "Due on Receipt",
    reverseCharge: false,
    subject: "",
    notes: "",
    items: [] as BillItem[],
    subTotal: 0,
    discountType: "percent",
    discountValue: 0,
    discountAmount: 0,
    taxType: "TDS",
    taxCategory: "none",
    taxAmount: 0,
    tcsType: "TCS",
    tcsCategory: "none",
    tcsValue: 0,
    tdsValue: 0,
    adjustment: 0,
    adjustmentDescription: "",
    total: 0,
    purchaseOrderId: ""
  });

  useEffect(() => {
    fetchVendors();
    fetchAccounts();
    fetchTaxes();
    fetchProducts();
    fetchNextBillNumber();
    fetchCustomers();
    if (purchaseOrderId) {
      fetchPurchaseOrderData(purchaseOrderId);
    }
  }, [purchaseOrderId]);

  // Pre-fill vendor data if vendorId is in URL
  useEffect(() => {
    if (vendorIdFromUrl && vendors.length > 0 && !formData.vendorId) {
      const vendor = vendors.find(v => v.id === vendorIdFromUrl);
      if (vendor) {
        setFormData(prev => ({
          ...prev,
          vendorId: vendor.id,
          vendorName: vendor.displayName || `${(vendor as any).firstName} ${(vendor as any).lastName}`.trim() || vendor.companyName || "",
          vendorAddress: {
            street1: vendor.billingAddress?.street1 || "",
            street2: vendor.billingAddress?.street2 || "",
            city: vendor.billingAddress?.city || "",
            state: vendor.billingAddress?.state || "",
            pinCode: vendor.billingAddress?.pinCode || "",
            country: vendor.billingAddress?.country || "India",
            gstin: vendor.gstin || ""
          }
        }));
      }
    }
  }, [vendorIdFromUrl, vendors]);

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

  // Helper function to parse rate values that might contain commas
  const parseRateValue = (value: string | number | undefined): number => {
    if (typeof value === 'number') return value;
    if (!value) return 0;
    // Remove commas and parse as float
    const stringValue = String(value).replace(/,/g, '');
    const parsed = parseFloat(stringValue);
    return isNaN(parsed) ? 0 : parsed;
  };

  const getCustomerDisplayName = (customerId: string) => {
    if (!customerId || customerId === 'none') return 'None';
    const customer = customers.find(c => c.id === customerId);
    return customer ? (customer.displayName || customer.name) : 'None';
  };

  const filteredVendors = vendors.filter(vendor => {
    const vendorName = vendor.displayName || `${(vendor as any).firstName} ${(vendor as any).lastName}`.trim() || vendor.companyName || "";
    return vendorName.toLowerCase().includes(vendorSearchTerm.toLowerCase());
  });

  const fetchPurchaseOrderData = async (poId: string) => {
    try {
      setLoadingPO(true);
      const response = await fetch(`/api/purchase-orders/${poId}`);
      if (response.ok) {
        const data = await response.json();
        const po = data.data;
        if (po && !poDataLoaded) {
          // Map PO items to bill items
          const billItems: BillItem[] = (po.items || []).map((item: any, index: number) => {
            const product = products.find(p => p.id === item.itemId);
            return {
              id: `item-${Date.now()}-${index}`,
              itemName: item.itemName || item.name || "",
              description: item.description || "",
              account: item.account || product?.purchaseAccount || "Cost of Goods Sold",
              quantity: item.quantity || 1,
              rate: item.rate || 0,
              tax: item.tax || "",
              taxAmount: item.taxAmount || 0,
              customerDetails: "none",
              amount: (item.quantity || 1) * (item.rate || 0)
            };
          });

          // Calculate totals using the refined logic later, but initialize from PO
          setFormData(prev => ({
            ...prev,
            vendorId: po.vendorId || "",
            vendorName: po.vendorName || "",
            vendorAddress: po.vendorAddress || prev.vendorAddress,
            orderNumber: po.purchaseOrderNumber || "",
            subject: `Bill for Purchase Order #${po.purchaseOrderNumber}`,
            notes: po.notes || "",
            items: billItems,
            subTotal: po.subTotal || 0,
            discountType: po.discountType || "percent",
            discountValue: po.discountValue || 0,
            discountAmount: po.discountAmount || 0,
            taxAmount: po.taxAmount || 0,
            tcsValue: po.tcsAmount || 0,
            tdsValue: po.tdsAmount || 0,
            adjustment: po.adjustment || 0,
            adjustmentDescription: po.adjustmentDescription || "",
            total: po.total || 0,
            purchaseOrderId: po.id
          }));
          setPoDataLoaded(true);
          toast({ title: `Loaded data from Purchase Order #${po.purchaseOrderNumber}` });
        }
      }
    } catch (error) {
      console.error('Failed to fetch purchase order:', error);
      toast({ title: "Failed to load purchase order data", variant: "destructive" });
    } finally {
      setLoadingPO(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      const response = await fetch('/api/items');
      if (response.ok) {
        const data = await response.json();
        setProducts(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchVendors = async () => {
    try {
      const response = await fetch('/api/vendors');
      if (response.ok) {
        const data = await response.json();
        setVendors(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch vendors:', error);
    }
  };

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/bills/accounts');
      if (response.ok) {
        const data = await response.json();
        setAccounts(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
    }
  };

  const fetchTaxes = async () => {
    try {
      const response = await fetch('/api/bills/taxes');
      if (response.ok) {
        const data = await response.json();
        setTaxes(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch taxes:', error);
    }
  };

  const fetchNextBillNumber = async () => {
    try {
      const response = await fetch('/api/bills/next-number');
      if (response.ok) {
        const data = await response.json();
        setFormData(prev => ({ ...prev, billNumber: data.data.billNumber }));
      }
    } catch (error) {
      console.error('Failed to fetch next bill number:', error);
    }
  };

  const handleVendorChange = (vendorId: string) => {
    if (vendorId === "__add_new_vendor__") {
      setLocation("/vendors/new");
      return;
    }

    const vendor = vendors.find(v => v.id === vendorId);
    if (vendor) {
      setFormData(prev => ({
        ...prev,
        vendorId: vendor.id,
        vendorName: vendor.displayName || `${(vendor as any).firstName} ${(vendor as any).lastName}`.trim() || vendor.companyName || "",
        vendorAddress: {
          street1: vendor.billingAddress?.street1 || "",
          street2: vendor.billingAddress?.street2 || "",
          city: vendor.billingAddress?.city || "",
          state: vendor.billingAddress?.state || "",
          pinCode: vendor.billingAddress?.pinCode || "",
          country: vendor.billingAddress?.country || "India",
          gstin: vendor.gstin || ""
        }
      }));
    }
  };

  const addItem = () => {
    const newItem: BillItem = {
      id: String(Date.now()),
      itemName: "",
      description: "",
      account: "",
      quantity: 1,
      rate: 0,
      tax: "",
      taxAmount: 0,
      customerDetails: "none",
      amount: 0
    };
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  const calculateSubTotal = () =>
    formData.items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.rate) || 0), 0);

  const calculateTaxTotal = () =>
    formData.items.reduce((sum, item) => sum + (Number(item.taxAmount) || 0), 0);

  const calculateDiscount = () => {
    const subTotal = calculateSubTotal();
    return formData.discountType === "percent"
      ? (subTotal * (Number(formData.discountValue) || 0)) / 100
      : (Number(formData.discountValue) || 0);
  };

  const calculateTCS = () => (Number(formData.tcsValue) || 0);

  const calculateTDS = () => (Number(formData.tdsValue) || 0);

  const calculateTotal = () => {
    const subTotal = calculateSubTotal();
    const discount = calculateDiscount();
    const taxTotal = calculateTaxTotal();
    const adjustment = Number(formData.adjustment) || 0;
    const tcs = calculateTCS();
    return (subTotal - discount + taxTotal + adjustment + tcs);
  };

  const calculateBalanceDue = () => {
    return calculateTotal() - calculateTDS();
  };

  const getGSTSplits = () => {
    // In bills, organization state is the destination. Vendor state is source.
    // We need the organization's state. Assuming it's in the organization data or hardcoded for now as MH.
    // Let's use a default or fetch if available.
    const orgState = "Maharashtra"; // This should ideally be fetched from org settings
    const vendorState = formData.vendorAddress.state;

    const isIntraState = !vendorState || vendorState.toLowerCase().includes(orgState.toLowerCase());
    const splits: { [key: string]: number } = {};

    formData.items.forEach(item => {
      if (item.tax && item.tax !== "none" && item.tax !== "") {
        const rate = parseInt(item.tax.replace(/\D/g, "")) || 0;
        const taxAmount = Number(item.taxAmount) || 0;

        if (isIntraState) {
          const halfRate = rate / 2;
          const halfAmount = taxAmount / 2;
          splits[`CGST${halfRate}`] = (splits[`CGST${halfRate}`] || 0) + halfAmount;
          splits[`SGST${halfRate}`] = (splits[`SGST${halfRate}`] || 0) + halfAmount;
        } else {
          splits[`IGST${rate}`] = (splits[`IGST${rate}`] || 0) + taxAmount;
        }
      }
    });

    return splits;
  };

  const updateItem = (id: string, field: keyof BillItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          if (field === 'quantity' || field === 'rate') {
            updatedItem.amount = (Number(updatedItem.quantity) || 0) * (Number(updatedItem.rate) || 0);
            if (updatedItem.tax) {
              const taxRate = taxes.find(t => t.name === updatedItem.tax)?.rate || 0;
              updatedItem.taxAmount = (updatedItem.amount * taxRate) / 100;
            }
          }
          if (field === 'tax') {
            const taxRate = taxes.find(t => t.name === value)?.rate || 0;
            updatedItem.taxAmount = (updatedItem.amount * taxRate) / 100;
          }
          return updatedItem;
        }
        return item;
      })
    }));
  };

  const removeItem = (id: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }));
  };

  const handleProductSelect = (itemId: string, productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.map(item => {
          if (item.id === itemId) {
            const rate = parseRateValue(product.purchaseRate) || parseRateValue(product.rate) || product.costPrice || product.sellingPrice || 0;
            return {
              ...item,
              itemName: product.name,
              description: product.purchaseDescription || product.description || "",
              account: product.purchaseAccount || item.account || "",
              rate: rate,
              amount: item.quantity * rate
            };
          }
          return item;
        })
      }));
    }
  };

  const handleSubmit = async (status: string) => {
    if (!formData.vendorId) {
      toast({ title: "Please select a vendor", variant: "destructive" });
      return;
    }
    if (!formData.billNumber) {
      toast({ title: "Please enter a bill number", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          status,
          attachments,
          subTotal: calculateSubTotal(),
          discountAmount: calculateDiscount(),
          taxAmount: calculateTaxTotal(),
          tcsAmount: calculateTCS(),
          tdsAmount: calculateTDS(),
          total: calculateTotal(),
          balanceDue: calculateBalanceDue()
        })
      });

      if (response.ok) {
        toast({ title: status === 'DRAFT' ? "Bill saved as draft" : "Bill created successfully" });
        setLocation("/bills");
      } else {
        throw new Error('Failed to create bill');
      }
    } catch (error) {
      toast({ title: "Failed to create bill", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 h-screen">
      <div className="flex-1 overflow-y-auto invisible-scrollbar">
        <div className="max-w-6xl mx-auto p-6 pb-24">
          <div className="flex items-center gap-3 mb-6">
            <FileText className="h-6 w-6 text-slate-600" />
            <h1 className="text-2xl font-semibold text-slate-900" data-testid="text-page-title">New Bill</h1>
          </div>

          {purchaseOrderId && (
            <div className="bg-sidebar/5 border border-sidebar/10 rounded-lg p-4 mb-4 flex items-center gap-3">
              <FileText className="h-5 w-5 text-sidebar" />
              <div>
                <p className="text-sm font-medium text-sidebar">
                  {loadingPO ? "Loading purchase order data..." : `Creating bill from Purchase Order`}
                </p>
                {formData.orderNumber && (
                  <p className="text-xs text-sidebar">PO# {formData.orderNumber}</p>
                )}
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <div className="grid gap-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label className="text-black">Vendor Name
                    <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex gap-2 mt-1">
                    <Select onValueChange={handleVendorChange} value={formData.vendorId}>
                      <SelectTrigger className="flex-1" data-testid="select-vendor">
                        <SelectValue placeholder="Select a Vendor" />
                      </SelectTrigger>
                      <SelectContent>
                        <div className="p-2">
                          <div className="flex items-center gap-2 mb-2">
                            <Search className="h-4 w-4 text-gray-400" />
                            <Input
                              placeholder="Search vendors..."
                              className="h-8"
                              value={vendorSearchTerm}
                              onChange={(e) => setVendorSearchTerm(e.target.value)}
                            />
                          </div>
                        </div>
                        {filteredVendors.map(vendor => (
                          <SelectItem key={vendor.id} value={vendor.id}>
                            {vendor.displayName || `${(vendor as any).firstName} ${(vendor as any).lastName}`.trim() || vendor.companyName}
                          </SelectItem>
                        ))}
                        <div className="border-t mt-1 pt-1">
                          <SelectItem
                            value="__add_new_vendor__"
                            onSelect={() => {
                              setLocation("/vendors/new");
                            }}
                          >
                            <div className="flex items-center gap-2 text-sidebar">
                              <Plus className="h-4 w-4" />
                              Add New Vendor
                            </div>
                          </SelectItem>
                        </div>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon" onClick={() => setLocation("/vendors/new")} data-testid="button-add-vendor">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div></div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label className="text-black">Bill#
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={formData.billNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, billNumber: e.target.value }))}
                    className="mt-1"
                    data-testid="input-bill-number"
                  />
                </div>
                <div>
                  <Label>Order Number</Label>
                  <Input
                    value={formData.orderNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, orderNumber: e.target.value }))}
                    className="mt-1"
                    data-testid="input-order-number"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label className="text-black">Bill Date
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={formData.billDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, billDate: e.target.value }))}
                    className="mt-1"
                    data-testid="input-bill-date"
                  />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label>Due Date</Label>
                    <Input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                      className="mt-1"
                      data-testid="input-due-date"
                    />
                  </div>
                  <div className="flex-1">
                    <Label>Payment Terms</Label>
                    <Select
                      value={formData.paymentTerms}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, paymentTerms: value }))}
                    >
                      <SelectTrigger className="mt-1" data-testid="select-payment-terms">
                        <SelectValue placeholder="Select terms" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Due on Receipt">Due on Receipt</SelectItem>
                        <SelectItem value="Net 15">Net 15</SelectItem>
                        <SelectItem value="Net 30">Net 30</SelectItem>
                        <SelectItem value="Net 45">Net 45</SelectItem>
                        <SelectItem value="Net 60">Net 60</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="reverse-charge"
                  checked={formData.reverseCharge}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, reverseCharge: checked as boolean }))}
                />
                <Label htmlFor="reverse-charge" className="text-sm">
                  This transaction is applicable for reverse charge
                </Label>
              </div>

              <div>
                <Label className="flex items-center gap-1">
                  Subject <Info className="h-3 w-3 text-slate-400" />
                </Label>
                <Textarea
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Enter a subject within 250 characters"
                  className="mt-1 resize-none"
                  maxLength={250}
                  data-testid="input-subject"
                />
              </div>

              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span>At Transaction Level</span>
                <ChevronDown className="h-4 w-4" />
              </div>

              <div className="border rounded-lg overflow-hidden">
                <div className="bg-sidebar/5 px-4 py-2 flex items-center justify-between border-b">
                  <h3 className="font-medium text-slate-700">Item Table</h3>
                  <Button variant="link" size="sm" className="text-sidebar font-display">
                    Bulk Actions
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-sidebar/5">
                      <TableHead className="w-[200px] text-xs">ITEM DETAILS</TableHead>
                      <TableHead className="w-[150px] text-xs">ACCOUNT</TableHead>
                      <TableHead className="w-[100px] text-xs text-center">QUANTITY</TableHead>
                      <TableHead className="w-[140px] text-xs text-right">RATE (₹)</TableHead>
                      <TableHead className="w-[120px] text-xs">TAX</TableHead>
                      <TableHead className="w-[150px] text-xs">CUSTOMER DETAILS</TableHead>
                      <TableHead className="w-[100px] text-xs text-right">AMOUNT</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formData.items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                          No items added yet. Click "Add New Row" to add items.
                        </TableCell>
                      </TableRow>
                    ) : (
                      formData.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Select
                              value={item.itemName || ""}
                              onValueChange={(value) => {
                                if (value === "__add_new_item__") {
                                  setLocation("/products/new?returnTo=bills/new");
                                  return;
                                }
                                const product = products.find(p => p.name === value);
                                if (product) {
                                  handleProductSelect(item.id, product.id);
                                }
                              }}
                            >
                              <SelectTrigger className="text-sm" data-testid={`select-item-${item.id}`} disabled={!!formData.purchaseOrderId}>
                                <SelectValue placeholder={loadingProducts ? "Loading items..." : "Select an item"} />
                              </SelectTrigger>
                              <SelectContent>
                                {loadingProducts ? (
                                  <SelectItem value="loading" disabled>Loading items...</SelectItem>
                                ) : products.length === 0 ? (
                                  <SelectItem value="none" disabled>No items available</SelectItem>
                                ) : (
                                  products.map(product => {
                                    const displayPrice = parseRateValue(product.purchaseRate) || parseRateValue(product.rate) || product.costPrice || product.sellingPrice || 0;
                                    return (
                                      <SelectItem key={product.id} value={product.name}>
                                        {product.name} {product.usageUnit ? `(${product.usageUnit})` : ''} - ₹{displayPrice.toLocaleString('en-IN')}
                                      </SelectItem>
                                    );
                                  })
                                )}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <AccountSelectDropdown
                              value={item.account}
                              onValueChange={(value) => updateItem(item.id, 'account', value)}
                              placeholder="Select an account"
                              triggerClassName="text-sm"
                              testId={`select-account-${item.id}`}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}

                              className="text-sm text-center"
                              min={0}
                              step={0.01}
                              data-testid={`input-quantity-${item.id}`}
                              disabled={!!formData.purchaseOrderId}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={item.rate}
                              onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}

                              className="text-sm text-right"
                              min={0}
                              step={0.01}
                              data-testid={`input-rate-${item.id}`}
                              disabled={!!formData.purchaseOrderId}
                            />
                          </TableCell>
                          <TableCell>
                            <Select
                              value={item.tax || ""}
                              onValueChange={(value) => updateItem(item.id, 'tax', value)}
                            >
                              <SelectTrigger className="text-sm" data-testid={`select-tax-${item.id}`}>
                                <SelectValue placeholder="Select a Tax" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">No Tax</SelectItem>
                                {taxes.map(tax => (
                                  <SelectItem key={tax.id} value={tax.name}>
                                    {tax.name} ({tax.rate}%)
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={item.customerDetails || "none"}
                              onValueChange={(value) => {
                                updateItem(item.id, 'customerDetails', value);
                              }}
                            >
                              <SelectTrigger className="text-sm">
                                <SelectValue placeholder="Select Customer">
                                  {getCustomerDisplayName(item.customerDetails || "none")}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                {customers.map(customer => (
                                  <SelectItem key={customer.id} value={customer.id}>
                                    {customer.displayName || customer.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {item.amount.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500"
                              onClick={() => removeItem(item.id)}
                              data-testid={`button-remove-item-${item.id}`}
                              disabled={!!formData.purchaseOrderId}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                <div className="p-3 border-t">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-1.5" data-testid="button-add-new-row" disabled={!!formData.purchaseOrderId}>
                        <Plus className="h-4 w-4" />
                        Add New Row
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={addItem}>Add Item</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="flex justify-end">
                <div className="w-80 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Sub Total</span>
                    <span className="font-medium">
                      ₹{calculateSubTotal().toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-sm text-slate-600 shrink-0">Discount</span>
                    <div className="flex-1 flex gap-2">
                      <Input
                        type="number"
                        className="h-8"
                        value={formData.discountValue}
                        onChange={(e) => setFormData({ ...formData, discountValue: parseFloat(e.target.value) || 0 })}
                      />
                      <Select value={formData.discountType} onValueChange={(v) => setFormData({ ...formData, discountType: v })}>
                        <SelectTrigger className="h-8 w-24"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percent">%</SelectItem>
                          <SelectItem value="amount">₹</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <span className="text-sm font-medium w-24 text-right">
                      -₹{calculateDiscount().toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Tax Total</span>
                    <span className="font-medium">
                      ₹{calculateTaxTotal().toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* GST Splits */}
                  <div className="space-y-1 pl-4 border-l-2 border-slate-100">
                    {Object.entries(getGSTSplits()).map(([label, amount]) => (
                      <div key={label} className="flex justify-between text-xs text-slate-500">
                        <span>{label}</span>
                        <span>₹{amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-sm text-slate-600 shrink-0">Adjustment</span>
                    <Input
                      type="number"
                      className="h-8 flex-1"
                      value={formData.adjustment}
                      onChange={(e) => setFormData({ ...formData, adjustment: parseFloat(e.target.value) || 0 })}
                    />
                    <span className="text-sm font-medium w-24 text-right">
                      ₹{formData.adjustment.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* TCS & TDS Section */}
                  <div className="pt-4 border-t border-slate-200 mt-4 space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <Label className="text-xs text-slate-500 uppercase font-semibold">TCS</Label>
                        <div className="flex gap-2">
                          <Select value={formData.tcsType} onValueChange={(v) => setFormData({ ...formData, tcsType: v })}>
                            <SelectTrigger className="h-8 w-24"><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="TCS">TCS</SelectItem></SelectContent>
                          </Select>
                          <Input type="number" className="h-8 flex-1" value={formData.tcsValue} onChange={(e) => setFormData({ ...formData, tcsValue: parseFloat(e.target.value) || 0 })} />
                        </div>
                      </div>
                      <span className="text-sm font-medium w-24 text-right pt-6">
                        ₹{(Number(formData.tcsValue) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <span className="text-lg font-semibold text-slate-900">Total (₹)</span>
                      <span className="text-lg font-bold text-slate-900">
                        ₹{calculateTotal().toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 pt-2 border-t border-dashed border-slate-200">
                      <div className="flex-1">
                        <Label className="text-xs text-slate-500 uppercase font-semibold">TDS</Label>
                        <div className="flex gap-2">
                          <Select value={formData.taxType} onValueChange={(v) => setFormData({ ...formData, taxType: v })}>
                            <SelectTrigger className="h-8 w-24"><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="TDS">TDS</SelectItem></SelectContent>
                          </Select>
                          <Input type="number" className="h-8 flex-1" value={formData.tdsValue} onChange={(e) => setFormData({ ...formData, tdsValue: parseFloat(e.target.value) || 0 })} />
                        </div>
                      </div>
                      <span className="text-sm font-medium w-24 text-right pt-6 text-red-600">
                        -₹{(Number(formData.tdsValue) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="flex justify-between items-center pt-2 bg-sidebar/5 p-2 rounded">
                      <span className="text-base font-semibold text-sidebar">Balance Due (₹)</span>
                      <span className="text-base font-bold text-sidebar">
                        ₹{calculateBalanceDue().toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mt-6 p-4 bg-slate-50 rounded-lg">
                <div>
                  <Label>Notes</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Enter notes"
                    className="mt-1 resize-none bg-white"
                    data-testid="input-notes"
                  />
                  <p className="text-xs text-slate-500 mt-1">It will not be shown in PDF</p>
                </div>
                <div>
                  <Label>Attach File(s) to Bill</Label>
                  <div className="mt-1 border-2 border-dashed border-slate-200 rounded-lg p-4 text-center bg-white relative">
                    <input
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={uploading}
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    />
                    <Button variant="outline" size="sm" className="gap-1.5" disabled={uploading}>
                      <Upload className="h-4 w-4" />
                      {uploading ? "Uploading..." : "Upload File"}
                    </Button>
                    <p className="text-xs text-slate-500 mt-2">You can upload a maximum of 5 files, 10MB each</p>
                  </div>
                  {attachments.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {attachments.map((file: any) => (
                        <div key={file.id} className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-100">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <FileText className="h-4 w-4 text-slate-400 flex-shrink-0" />
                            <span className="text-xs text-slate-600 truncate">{file.fileName}</span>
                            <span className="text-[10px] text-slate-400">({(file.fileSize / 1024 / 1024).toFixed(2)} MB)</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-slate-400 hover:text-red-500"
                            onClick={() => removeAttachment(file.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <p className="text-sm text-slate-500">
                Additional Fields: Start adding custom fields for your payments made by going to Settings - Purchases - Bills.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-6 p-4 bg-white rounded-lg shadow-sm border border-slate-200">
            <Button
              variant="outline"
              onClick={() => handleSubmit('DRAFT')}
              disabled={loading}
              data-testid="button-save-draft"
              className="font-display"
            >
              Save as Draft
            </Button>
            <Button
              className="bg-sidebar hover:bg-sidebar/90 font-display"
              onClick={() => handleSubmit('OPEN')}
              disabled={loading}
              data-testid="button-save-open"
            >
              Save as Open
            </Button>
            <Button
              variant="outline"
              onClick={() => setLocation("/bills")}
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
