import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import {
  FileText,
  Plus,
  X,
  Search,
  Upload,
  ChevronDown,
  HelpCircle,
  Pencil,
  Trash2,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AccountSelectDropdown } from "@/components/AccountSelectDropdown";
import { VendorAddressModal } from "@/components/VendorAddressModal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Vendor {
  id: string;
  displayName: string;
  companyName?: string;
  firstName?: string;
  lastName?: string;
  billingAddress?: {
    street1?: string;
    street2?: string;
    city?: string;
    state?: string;
    pinCode?: string;
    countryRegion?: string;
  };
  gstin?: string;
  gstTreatment?: string;
}

interface Customer {
  id: string;
  name: string;
  displayName: string;
  email?: string;
  phone?: string;
  billingAddress?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;
  };
  shippingAddress?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;
  };
}

interface Item {
  id: string;
  name: string;
  description?: string;
  purchaseDescription?: string;
  rate?: string | number;
  purchaseRate?: string | number;
  sellingPrice?: number;
  purchasePrice?: number;
  hsnSac?: string;
  sku?: string;
  usageUnit?: string;
  unit?: string;
  intraStateTax?: string;
  interStateTax?: string;
  purchaseAccount?: string;
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
  taxAmount: number;
  amount: number;
}

const PAYMENT_TERMS = [
  "Due on Receipt",
  "Net 15",
  "Net 30",
  "Net 45",
  "Net 60",
  "Due end of the month",
  "Due end of next month",
];

const SHIPMENT_PREFERENCES = [
  "Standard Shipping",
  "Express Shipping",
  "Overnight Shipping",
  "Local Pickup",
  "Freight Shipping",
];

const TAX_OPTIONS = [
  { value: "none", label: "Select a Tax" },
  { value: "gst_5", label: "GST 5%" },
  { value: "gst_12", label: "GST 12%" },
  { value: "gst_18", label: "GST 18%" },
  { value: "gst_28", label: "GST 28%" },
];

const INDIAN_STATES = [
  "AN - Andaman and Nicobar Islands",
  "AP - Andhra Pradesh",
  "AR - Arunachal Pradesh",
  "AS - Assam",
  "BR - Bihar",
  "CH - Chandigarh",
  "CT - Chhattisgarh",
  "DD - Daman and Diu",
  "DL - Delhi",
  "GA - Goa",
  "GJ - Gujarat",
  "HP - Himachal Pradesh",
  "HR - Haryana",
  "JH - Jharkhand",
  "JK - Jammu and Kashmir",
  "KA - Karnataka",
  "KL - Kerala",
  "LA - Ladakh",
  "LD - Lakshadweep",
  "MH - Maharashtra",
  "ML - Meghalaya",
  "MN - Manipur",
  "MP - Madhya Pradesh",
  "MZ - Mizoram",
  "NL - Nagaland",
  "OR - Odisha",
  "PB - Punjab",
  "PY - Puducherry",
  "RJ - Rajasthan",
  "SK - Sikkim",
  "TN - Tamil Nadu",
  "TR - Tripura",
  "TS - Telangana",
  "UK - Uttarakhand",
  "UP - Uttar Pradesh",
  "WB - West Bengal",
];

export default function PurchaseOrderCreate() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [purchaseOrderNumber, setPurchaseOrderNumber] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [vendorSearchTerm, setVendorSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    vendorId: "",
    vendorName: "",
    gstTreatment: "",
    sourceOfSupply: "MH - Maharashtra",
    destinationOfSupply: "MH - Maharashtra",
    vendorBillingAddress: {
      street1: "",
      street2: "",
      city: "",
      state: "",
      pinCode: "",
      countryRegion: "India",
    },
    vendorShippingAddress: {
      street1: "",
      street2: "",
      city: "",
      state: "",
      pinCode: "",
      countryRegion: "India",
    },
    deliveryAddressType: "organization",
    deliveryAddress: {
      attention: "",
      street1: "",
      street2: "",
      city: "",
      state: "",
      pinCode: "",
      countryRegion: "India",
    },
    organizationDetails: {
      name: "Rohan Bhosale",
      address:
        "Hinjewadi - Wakad road\nHinjewadi\nPune, Maharashtra\nIndia, 411057",
    },
    selectedCustomer: null as Customer | null,
    customerSearchQuery: "",
    subject: "",
    referenceNumber: "",
    date: new Date().toISOString().split("T")[0],
    deliveryDate: "",
    paymentTerms: "Due on Receipt",
    shipmentPreference: "",
    reverseCharge: false,
    notes: "",
    termsAndConditions: "",
    discountType: "percent",
    discountValue: 0,
    taxType: "TDS",
    taxCategory: "none",
    tcsType: "TCS",
    tcsCategory: "none",
    tcsValue: 0,
    tdsValue: 0,
    adjustment: 0,
    adjustmentDescription: "",
  });

  const [lineItems, setLineItems] = useState<LineItem[]>([
    {
      id: "1",
      itemId: "",
      itemName: "",
      description: "",
      account: "",
      quantity: 1,
      rate: 0,
      tax: "none",
      taxAmount: 0,
      amount: 0,
    },
  ]);

  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isCustomerPopoverOpen, setIsCustomerPopoverOpen] = useState(false);
  const [vendorDropdownOpen, setVendorDropdownOpen] = useState(false);

  const urlParams = new URLSearchParams(window.location.search);
  const vendorIdFromUrl = urlParams.get("vendorId");

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (vendorIdFromUrl && vendors.length > 0 && !formData.vendorId) {
      const vendor = vendors.find((v) => v.id === vendorIdFromUrl);
      if (vendor) {
        handleVendorChange(vendor.id);
      }
    }
  }, [vendorIdFromUrl, vendors]);

  useEffect(() => {
    const fetchOrgData = async () => {
      try {
        const res = await fetch("/api/organizations");
        if (res.ok) {
          const data = await res.json();
          const org = data.data?.[0]; // Get the first/active organization
          if (org) {
            setFormData(prev => ({
              ...prev,
              organizationDetails: {
                name: org.name || prev.organizationDetails.name,
                address: `${org.street1 || ""}${org.street2 ? "\n" + org.street2 : ""}\n${org.city || ""}, ${org.state || ""}\n${org.location || "India"}, ${org.postalCode || ""}`.trim() || prev.organizationDetails.address
              }
            }));
          }
        }
      } catch (err) {
        console.error("Failed to fetch organization data:", err);
      }
    };
    fetchOrgData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [vendorsRes, itemsRes, nextNumberRes, customersRes, orgRes] =
        await Promise.all([
          fetch("/api/vendors"),
          fetch("/api/items"),
          fetch("/api/purchase-orders/next-number"),
          fetch("/api/customers"),
          fetch("/api/organizations"),
        ]);

      if (vendorsRes.ok) {
        const data = await vendorsRes.json();
        setVendors(data.data || []);
      }

      if (itemsRes.ok) {
        const data = await itemsRes.json();
        setItems(data.data || []);
      }

      if (nextNumberRes.ok) {
        const data = await nextNumberRes.json();
        setPurchaseOrderNumber(data.data.purchaseOrderNumber);
      }

      if (customersRes.ok) {
        const data = await customersRes.json();
        setCustomers(data.customers || data.data || []);
      }

      if (orgRes.ok) {
        const data = await orgRes.json();
        const orgs = data.data || [];
        // Use the first organization as default if available
        if (orgs.length > 0) {
          const org = orgs[0];
          setFormData((prev) => ({
            ...prev,
            organizationDetails: {
              name: org.name || prev.organizationDetails.name,
              address: `${org.street1 || ""}${org.street2 ? "\n" + org.street2 : ""}\n${org.city || ""}, ${org.state || ""}\n${org.location || "India"}, ${org.postalCode || ""}`.trim() || prev.organizationDetails.address
            },
          }));
        }
      }
    } catch (error) {
      console.error("Failed to fetch initial data:", error);
    }
  };

  const handleVendorChange = (vendorId: string) => {
    const vendor = vendors.find((v) => v.id === vendorId);
    if (vendor) {
      setSelectedVendor(vendor);
      setFormData({
        ...formData,
        vendorId: vendor.id,
        vendorName:
          vendor.displayName ||
          `${vendor.firstName} ${vendor.lastName}`.trim() ||
          vendor.companyName ||
          "",
        gstTreatment: vendor.gstTreatment || "",
        vendorBillingAddress: {
          street1: vendor.billingAddress?.street1 || "",
          street2: vendor.billingAddress?.street2 || "",
          city: vendor.billingAddress?.city || "",
          state: vendor.billingAddress?.state || "",
          pinCode: vendor.billingAddress?.pinCode || "",
          countryRegion: vendor.billingAddress?.countryRegion || "India",
        },
        sourceOfSupply: vendor.billingAddress?.state || formData.sourceOfSupply,
        vendorShippingAddress: (vendor as any).shippingAddress || {
          street1: "",
          street2: "",
          city: "",
          state: "",
          pinCode: "",
          countryRegion: "India",
        },
      });
      setVendorDropdownOpen(false);
    }
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: any) => {
    setLineItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === "quantity" || field === "rate" || field === "tax") {
            const baseAmount = updated.quantity * updated.rate;
            let taxRate = 0;
            if (updated.tax && updated.tax !== "none") {
              taxRate = parseInt(updated.tax.replace(/\D/g, "")) || 0;
            }
            updated.taxAmount = (baseAmount * taxRate) / 100;
            updated.amount = baseAmount + updated.taxAmount;
          }
          return updated;
        }
        return item;
      }),
    );
  };

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        id: String(Date.now()),
        itemId: "",
        itemName: "",
        description: "",
        account: "",
        quantity: 1,
        rate: 0,
        tax: "none",
        taxAmount: 0,
        amount: 0,
      },
    ]);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((item) => item.id !== id));
    }
  };

  const selectItem = (lineItemId: string, itemId: string) => {
    if (itemId === "__add_new_item__") {
      setLocation("/products/new?returnTo=purchase-orders/new");
      return;
    }
    const item = items.find((i) => i.id === itemId);
    if (item) {
      const purchaseRate =
        item.purchaseRate !== undefined
          ? parseFloat(String(item.purchaseRate).replace(/,/g, ""))
          : 0;
      const rate =
        item.rate !== undefined
          ? parseFloat(String(item.rate).replace(/,/g, ""))
          : 0;
      const finalRate =
        purchaseRate || item.purchasePrice || rate || item.sellingPrice || 0;
      const description = item.purchaseDescription || item.description || "";

      let taxValue = "none";
      if (item.intraStateTax) {
        const taxMatch = item.intraStateTax.match(/(gst|igst)(\d+)/i);
        if (taxMatch) taxValue = `gst_${taxMatch[2]}`;
      }

      setLineItems((prev) =>
        prev.map((lineItem) => {
          if (lineItem.id === lineItemId) {
            const baseAmount = lineItem.quantity * finalRate;
            let taxRate = 0;
            if (taxValue !== "none") {
              taxRate = parseInt(taxValue.replace(/\D/g, "")) || 0;
            }
            const taxAmount = (baseAmount * taxRate) / 100;
            return {
              ...lineItem,
              itemId: item.id,
              itemName: item.name,
              description: description,
              account: item.purchaseAccount || lineItem.account || "",
              rate: finalRate,
              tax: taxValue,
              taxAmount: taxAmount,
              amount: baseAmount + taxAmount,
            };
          }
          return lineItem;
        }),
      );
    }
  };

  const calculateSubTotal = () =>
    lineItems.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.rate) || 0), 0);

  const calculateTaxTotal = () =>
    lineItems.reduce((sum, item) => sum + (Number(item.taxAmount) || 0), 0);

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
    const isIntraState = formData.sourceOfSupply === formData.destinationOfSupply;
    const splits: { [key: string]: number } = {};

    lineItems.forEach(item => {
      if (item.tax && item.tax !== "none") {
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

  const handleSubmit = async (saveAsDraft: boolean = false) => {
    if (!formData.vendorId) {
      toast({ title: "Please select a vendor", variant: "destructive" });
      return;
    }
    const validItems = lineItems.filter(
      (item) => item.itemName && item.quantity > 0,
    );
    if (validItems.length === 0) {
      toast({ title: "Please add at least one item", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          purchaseOrderNumber,
          items: validItems,
          subTotal: calculateSubTotal(),
          discountAmount: calculateDiscount(),
          taxAmount: calculateTaxTotal(),
          tcsAmount: calculateTCS(),
          tdsAmount: calculateTDS(),
          total: calculateTotal(),
          balanceDue: calculateBalanceDue(),
          status: saveAsDraft ? "DRAFT" : "ISSUED",
        }),
      });

      if (response.ok) {
        toast({
          title: saveAsDraft
            ? "Draft saved successfully"
            : "Purchase order created successfully",
        });
        setLocation("/purchase-orders");
      } else {
        toast({
          title: "Failed to create purchase order",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Failed to create purchase order",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredVendors = vendors.filter((v) =>
    v.displayName?.toLowerCase().includes(vendorSearchTerm.toLowerCase()),
  );


  return (
    <div className="flex-1 flex flex-col bg-slate-50 h-screen">
      <div className="flex-1 overflow-y-auto invisible-scrollbar">
        <div className="max-w-6xl mx-auto p-6 pb-24">
          <div className="flex items-center gap-3 mb-6">
            <FileText className="h-6 w-6 text-slate-600" />
            <h1 className="text-2xl font-semibold text-slate-900">
              New Purchase Order
            </h1>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 space-y-8">
            {/* Vendor Selection */}
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-2">
                <Label className="text-black">
                  Vendor Name <span className="text-red-500">*</span>
                </Label>
                <div className="flex gap-2">
                  <Select
                    onValueChange={handleVendorChange}
                    value={formData.vendorId}
                  >
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
                      {filteredVendors.map((vendor) => (
                        <SelectItem key={vendor.id} value={vendor.id}>
                          {vendor.displayName}
                        </SelectItem>
                      ))}
                      <div className="border-t mt-1 pt-1">
                        <SelectItem
                          value="__add_new_vendor__"
                          onSelect={() => setLocation("/vendors/new")}
                        >
                          <div className="flex items-center gap-2 text-sidebar">
                            <Plus className="h-4 w-4" /> Add New Vendor
                          </div>
                        </SelectItem>
                      </div>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setLocation("/vendors/new")}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Delivery Address Section */}
            <div className="space-y-4">
              <Label className="text-black">
                Delivery Address <span className="text-red-500">*</span>
              </Label>
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <RadioGroup
                    value={formData.deliveryAddressType}
                    onValueChange={(v) =>
                      setFormData({ ...formData, deliveryAddressType: v as any })
                    }
                    className="flex space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="organization" id="addr-org" />
                      <Label htmlFor="addr-org" className="font-normal">
                        Organization
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="customer" id="addr-cust" />
                      <Label htmlFor="addr-cust" className="font-normal">
                        Customer
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              {formData.deliveryAddressType === "organization" ? (
                <div className="border rounded-md p-4 bg-slate-50/50 space-y-4 max-w-xl">
                  <div className="space-y-2">
                    <Label className="text-xs text-slate-500 uppercase font-semibold">
                      Organization Name
                    </Label>
                    <Input
                      value={formData.organizationDetails.name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          organizationDetails: {
                            ...formData.organizationDetails,
                            name: e.target.value,
                          },
                        })
                      }
                      className="bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-slate-500 uppercase font-semibold">
                      Organization Address
                    </Label>
                    <Textarea
                      value={formData.organizationDetails.address}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          organizationDetails: {
                            ...formData.organizationDetails,
                            address: e.target.value,
                          },
                        })
                      }
                      className="bg-white min-h-[100px] resize-none"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4 max-w-xl">
                  <Popover
                    open={isCustomerPopoverOpen}
                    onOpenChange={setIsCustomerPopoverOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={isCustomerPopoverOpen}
                        className="w-full justify-between bg-white"
                      >
                        {formData.selectedCustomer
                          ? formData.selectedCustomer.displayName
                          : "Select a Customer"}
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0" align="start">
                      <Command>
                        <CommandInput
                          placeholder="Search customers..."
                          value={formData.customerSearchQuery}
                          onValueChange={(v) =>
                            setFormData({ ...formData, customerSearchQuery: v })
                          }
                        />
                        <CommandEmpty>
                          <div className="p-4 text-center space-y-4">
                            <p className="text-sm text-slate-500">
                              No customers found.
                            </p>
                            <Button
                              variant="default"
                              className="w-full py-6 text-base"
                              onClick={() => setLocation("/customers/new")}
                            >
                              <Plus className="mr-2 h-5 w-5" /> Create Customer
                            </Button>
                          </div>
                        </CommandEmpty>
                        <CommandGroup>
                          {customers
                            .filter((c) =>
                              c.displayName
                                .toLowerCase()
                                .includes(
                                  formData.customerSearchQuery.toLowerCase(),
                                ),
                            )
                            .map((customer) => (
                              <CommandItem
                                key={customer.id}
                                value={customer.displayName}
                                onSelect={() => {
                                  setFormData({
                                    ...formData,
                                    selectedCustomer: customer,
                                  });
                                  setIsCustomerPopoverOpen(false);
                                }}
                              >
                                {customer.displayName}
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-2">
                <Label className="text-black">
                  Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Expected Delivery Date</Label>
                <Input
                  type="date"
                  value={formData.deliveryDate}
                  onChange={(e) =>
                    setFormData({ ...formData, deliveryDate: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-2">
                <Label>Payment Terms</Label>
                <Select
                  value={formData.paymentTerms}
                  onValueChange={(v) =>
                    setFormData({ ...formData, paymentTerms: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_TERMS.map((term) => (
                      <SelectItem key={term} value={term}>
                        {term}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Shipment Preference</Label>
                <Select
                  value={formData.shipmentPreference}
                  onValueChange={(v) =>
                    setFormData({ ...formData, shipmentPreference: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select preference" />
                  </SelectTrigger>
                  <SelectContent>
                    {SHIPMENT_PREFERENCES.map((pref) => (
                      <SelectItem key={pref} value={pref}>
                        {pref}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input
                  placeholder="Let your vendor know what this purchase order is for"
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData({ ...formData, subject: e.target.value })
                  }
                />
              </div>
              <div className="flex items-center space-x-2 pt-8">
                <Checkbox
                  id="reverseCharge"
                  checked={formData.reverseCharge}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, reverseCharge: !!checked })
                  }
                />
                <Label htmlFor="reverseCharge">
                  This transaction is applicable for reverse charge
                </Label>
              </div>
            </div>

            {/* Items Table */}
            <div className="border rounded-lg overflow-hidden border-slate-200">
              <Table>
                <TableHeader className="bg-sidebar/5">
                  <TableRow>
                    <TableHead className="w-[30%]">Item Details</TableHead>
                    <TableHead className="w-[15%]">Account</TableHead>
                    <TableHead className="w-[10%] text-right">Quantity</TableHead>
                    <TableHead className="w-[15%] text-right">Rate</TableHead>
                    <TableHead className="w-[15%] text-right">Tax</TableHead>
                    <TableHead className="w-[15%] text-right">Amount</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lineItems.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Select
                          onValueChange={(val) => selectItem(item.id, val)}
                          value={item.itemId}
                        >
                          <SelectTrigger className="border-0 shadow-none focus:ring-0 bg-transparent px-0">
                            <SelectValue placeholder="Select or type to add item" />
                          </SelectTrigger>
                          <SelectContent>
                            {items.map((i) => (
                              <SelectItem key={i.id} value={i.id}>
                                {i.name}
                              </SelectItem>
                            ))}
                            <Separator className="my-1" />
                            <SelectItem value="__add_new_item__" className="text-blue-600 font-medium font-display">
                              <div className="flex items-center gap-2">
                                <Plus className="h-4 w-4" />
                                Add New Item
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <Textarea
                          placeholder="Description"
                          className="mt-2 text-xs h-16 resize-none"
                          value={item.description}
                          onChange={(e) =>
                            updateLineItem(item.id, "description", e.target.value)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <AccountSelectDropdown
                          value={item.account}
                          onValueChange={(v) =>
                            updateLineItem(item.id, "account", v)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          className="text-right"
                          value={item.quantity}
                          onChange={(e) =>
                            updateLineItem(
                              item.id,
                              "quantity",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          className="text-right"
                          value={item.rate}
                          onChange={(e) =>
                            updateLineItem(
                              item.id,
                              "rate",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={item.tax}
                          onValueChange={(v) => updateLineItem(item.id, "tax", v)}
                        >
                          <SelectTrigger className="border-0 shadow-none focus:ring-0 bg-transparent px-0 text-right">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TAX_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ₹
                        {item.amount.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeLineItem(item.id)}
                          className="text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="p-4 bg-slate-50/50 border-t border-slate-200">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addLineItem}
                  className="text-sidebar border-sidebar/20 hover:bg-sidebar/5"
                >
                  <Plus className="h-4 w-4 mr-2" /> Add another line
                </Button>
              </div>
            </div>

            {/* Totals Section */}
            <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-100">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    placeholder="Notes to vendor..."
                    className="h-24"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Terms & Conditions</Label>
                  <Textarea
                    placeholder="Terms and conditions..."
                    className="h-24"
                    value={formData.termsAndConditions}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        termsAndConditions: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-4 bg-slate-50/50 p-6 rounded-lg border border-slate-100">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Sub Total</span>
                  <span className="font-medium">
                    ₹
                    {calculateSubTotal().toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-sm text-slate-600 shrink-0">
                    Discount
                  </span>
                  <div className="flex-1 flex gap-2">
                    <Input
                      type="number"
                      className="h-8"
                      value={formData.discountValue}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          discountValue: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                    <Select
                      value={formData.discountType}
                      onValueChange={(v) =>
                        setFormData({ ...formData, discountType: v })
                      }
                    >
                      <SelectTrigger className="h-8 w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percent">%</SelectItem>
                        <SelectItem value="amount">₹</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <span className="text-sm font-medium w-24 text-right">
                    -₹
                    {calculateDiscount().toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Tax Total</span>
                  <span className="font-medium">
                    ₹
                    {calculateTaxTotal().toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>

                {/* GST Splits */}
                <div className="space-y-1 pl-4 border-l-2 border-slate-100">
                  {Object.entries(getGSTSplits()).map(([label, amount]) => (
                    <div key={label} className="flex justify-between text-xs text-slate-500">
                      <span>{label}</span>
                      <span>
                        ₹{amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-sm text-slate-600 shrink-0">
                    Adjustment
                  </span>
                  <Input
                    type="number"
                    className="h-8 flex-1"
                    value={formData.adjustment}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        adjustment: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                  <span className="text-sm font-medium w-24 text-right">
                    ₹
                    {formData.adjustment.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
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
                          <SelectContent>
                            <SelectItem value="TCS">TCS</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          className="h-8 flex-1"
                          value={formData.tcsValue}
                          onChange={(e) => setFormData({ ...formData, tcsValue: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-medium w-24 text-right pt-6">
                      ₹{(Number(formData.tcsValue) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <span className="text-lg font-semibold text-slate-900">
                      Total (₹)
                    </span>
                    <span className="text-lg font-bold text-slate-900">
                      ₹
                      {calculateTotal().toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 pt-2 border-t border-dashed border-slate-200">
                    <div className="flex-1">
                      <Label className="text-xs text-slate-500 uppercase font-semibold">TDS (Tax Deducted at Source)</Label>
                      <div className="flex gap-2">
                        <Select value={formData.taxType} onValueChange={(v) => setFormData({ ...formData, taxType: v })}>
                          <SelectTrigger className="h-8 w-24"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="TDS">TDS</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          className="h-8 flex-1"
                          value={formData.tdsValue}
                          onChange={(e) => setFormData({ ...formData, tdsValue: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-medium w-24 text-right pt-6 text-red-600">
                      -₹{(Number(formData.tdsValue) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-2 bg-sidebar/5 p-2 rounded">
                    <span className="text-base font-semibold text-sidebar">
                      Balance Due (₹)
                    </span>
                    <span className="text-base font-bold text-sidebar">
                      ₹
                      {calculateBalanceDue().toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex justify-start gap-4 pt-8 border-t border-slate-100">
              <Button
                onClick={() => handleSubmit(false)}
                className="bg-sidebar hover:bg-sidebar/90 text-white min-w-[120px] font-display"
                disabled={loading}
              >
                Save as Issued
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSubmit(true)}
                disabled={loading}
                className="font-display"
              >
                Save as Draft
              </Button>
              <Button
                variant="ghost"
                onClick={() => setLocation("/purchase-orders")}
                className="text-slate-600 hover:text-slate-900 font-display"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
