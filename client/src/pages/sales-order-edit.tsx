import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { Plus, X, Search, Upload, Pencil, ArrowLeft, Loader2, Settings, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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

interface SalesOrderItem {
  id: string;
  itemId: string;
  name: string;
  description: string;
  hsnSac: string;
  quantity: number;
  unit: string;
  rate: number;
  discount: number;
  discountType: string;
  tax: string;
  amount: number;
  ordered?: number;
  invoicedQty?: number;
  invoiceStatus?: string;
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

const getTaxValueFromName = (taxName: string | undefined, rate: number): string => {
  if (taxName && taxOptions.find(t => t.value === taxName)) {
    return taxName;
  }
  const rateMap: Record<number, string> = {
    0: "none",
    5: "GST5",
    12: "GST12",
    18: "GST18",
    28: "GST28",
  };
  return rateMap[rate] || "none";
};

const paymentTermsOptions = [
  { value: "due_on_receipt", label: "Due on Receipt" },
  { value: "net_15", label: "Net 15" },
  { value: "net_30", label: "Net 30" },
  { value: "net_45", label: "Net 45" },
  { value: "net_60", label: "Net 60" },
];

const deliveryMethodOptions = [
  { value: "standard", label: "Standard Delivery" },
  { value: "express", label: "Express Delivery" },
  { value: "pickup", label: "Customer Pickup" },
];

const getPaymentTermsValue = (label: string): string => {
  const option = paymentTermsOptions.find(p => p.label === label);
  return option?.value || "due_on_receipt";
};

const getDeliveryMethodValue = (label: string): string => {
  const option = deliveryMethodOptions.find(d => d.label === label);
  return option?.value || "standard";
};

export default function SalesOrderEditPage() {
  const [, params] = useRoute("/sales-orders/:id/edit");
  const orderId = params?.id;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [originalOrder, setOriginalOrder] = useState<any>({});
  const [showManageSalespersons, setShowManageSalespersons] = useState(false);
  const [salespersons, setSalespersons] = useState<{ id: string; name: string }[]>([]);

  const [formData, setFormData] = useState({
    customerId: "",
    customerName: "",
    salesOrderNumber: "",
    referenceNumber: "",
    orderDate: new Date().toISOString().split('T')[0],
    expectedShipmentDate: "",
    paymentTerms: "due_on_receipt",
    deliveryMethod: "standard",
    salesperson: "",
    placeOfSupply: "",
    customerNotes: "",
    termsAndConditions: "",
    shippingCharges: 0,
    adjustment: 0,
    adjustmentDescription: "",
    orderStatus: "Draft",
  });

  const [orderItems, setOrderItems] = useState<SalesOrderItem[]>([
    {
      id: "1",
      itemId: "",
      name: "",
      description: "",
      hsnSac: "",
      quantity: 1,
      unit: "pcs",
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
    if (orderId) {
      fetchOrderData();
    }
  }, [orderId]);

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

  const fetchOrderData = async () => {
    if (!orderId) {
      setInitialLoading(false);
      toast({ title: "Invalid order ID", variant: "destructive" });
      setLocation('/sales-orders');
      return;
    }
    try {
      const response = await fetch(`/api/sales-orders/${orderId}`);
      if (response.ok) {
        const data = await response.json();
        const order = data.data;

        setOriginalOrder(order);

        setFormData({
          customerId: order.customerId || "",
          customerName: order.customerName || "",
          salesOrderNumber: order.salesOrderNumber || "",
          referenceNumber: order.referenceNumber || "",
          orderDate: order.date || new Date().toISOString().split('T')[0],
          expectedShipmentDate: order.expectedShipmentDate || "",
          paymentTerms: getPaymentTermsValue(order.paymentTerms),
          deliveryMethod: getDeliveryMethodValue(order.deliveryMethod),
          salesperson: order.salesperson || "",
          placeOfSupply: order.placeOfSupply?.toLowerCase() || "",
          customerNotes: order.customerNotes || "",
          termsAndConditions: order.termsAndConditions || "",
          shippingCharges: order.shippingCharges || 0,
          adjustment: order.adjustment || 0,
          adjustmentDescription: "",
          orderStatus: order.orderStatus || "Draft",
        });

        if (order.items && order.items.length > 0) {
          setOrderItems(order.items.map((item: any) => ({
            id: item.id || String(Date.now()),
            itemId: item.itemId || "",
            name: item.name || "",
            description: item.description || "",
            hsnSac: item.hsnSac || "",
            quantity: item.quantity || 1,
            unit: item.unit || "pcs",
            rate: item.rate || 0,
            discount: item.discount || 0,
            discountType: item.discountType || "percentage",
            tax: getTaxValueFromName(item.taxName, item.tax || 0),
            amount: item.amount || 0,
            ordered: item.ordered,
            invoicedQty: item.invoicedQty,
            invoiceStatus: item.invoiceStatus,
          })));
        }
      } else {
        toast({ title: "Failed to load order", variant: "destructive" });
        setLocation('/sales-orders');
      }
    } catch (error) {
      console.error('Failed to fetch order:', error);
      toast({ title: "Error loading order", variant: "destructive" });
      setLocation('/sales-orders');
    } finally {
      setInitialLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const customerName = customer.name || "";
    return customerName.toLowerCase().includes(customerSearchTerm.toLowerCase());
  });

  const handleCustomerChange = (customerId: string) => {
    if (customerId === "__add_new_customer__") {
      setLocation("/customers/new");
      return;
    }

    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setFormData(prev => ({
        ...prev,
        customerId,
        customerName: customer.name
      }));
    }
  };

  const handleItemChange = (index: number, itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (item) {
      const updatedItems = [...orderItems];
      const rate = parseFloat(item.rate.replace(/[₹,]/g, '')) || 0;
      updatedItems[index] = {
        ...updatedItems[index],
        itemId,
        name: item.name,
        description: item.description || '',
        hsnSac: item.hsnSac || '',
        rate,
        amount: rate * updatedItems[index].quantity
      };
      setOrderItems(updatedItems);
    }
  };

  const updateOrderItem = (index: number, field: string, value: any) => {
    const updatedItems = [...orderItems];
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
    setOrderItems(updatedItems);
  };

  const addNewRow = () => {
    setOrderItems([
      ...orderItems,
      {
        id: String(Date.now()),
        itemId: "",
        name: "",
        description: "",
        hsnSac: "",
        quantity: 1,
        unit: "pcs",
        rate: 0,
        discount: 0,
        discountType: "percentage",
        tax: "none",
        amount: 0,
      }
    ]);
  };

  const removeRow = (index: number) => {
    if (orderItems.length > 1) {
      setOrderItems(orderItems.filter((_, i) => i !== index));
    }
  };

  const calculateSubTotal = () => {
    return orderItems.reduce((sum, item) => sum + item.amount, 0);
  };

  const calculateTax = () => {
    return orderItems.reduce((sum, item) => {
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
    if (!originalOrder?.id) {
      toast({ title: "Please wait for order data to load", variant: "destructive" });
      return;
    }

    if (!formData.customerId) {
      toast({ title: "Please select a customer", variant: "destructive" });
      return;
    }

    const validItems = orderItems.filter(item => item.itemId);
    if (validItems.length === 0) {
      toast({ title: "Please add at least one item", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const subTotal = calculateSubTotal();
      const taxAmount = calculateTax();

      const customer = customers.find(c => c.id === formData.customerId);
      const customerState = customer?.billingAddress?.state?.toLowerCase() || '';
      const supplyState = formData.placeOfSupply?.toLowerCase() || '';
      const isInterState = customerState && supplyState && customerState !== supplyState;

      const defaultAddress = { street: "", city: "", state: "", country: "", pincode: "" };
      const orderData = {
        ...originalOrder,
        salesOrderNumber: formData.salesOrderNumber,
        customerId: formData.customerId,
        customerName: formData.customerName,
        referenceNumber: formData.referenceNumber,
        date: formData.orderDate,
        expectedShipmentDate: formData.expectedShipmentDate,
        paymentTerms: paymentTermsOptions.find(p => p.value === formData.paymentTerms)?.label || "Due on Receipt",
        deliveryMethod: deliveryMethodOptions.find(d => d.value === formData.deliveryMethod)?.label || "Standard Delivery",
        salesperson: formData.salesperson,
        placeOfSupply: formData.placeOfSupply,
        billingAddress: customer?.billingAddress || originalOrder?.billingAddress || defaultAddress,
        shippingAddress: customer?.shippingAddress || originalOrder?.shippingAddress || defaultAddress,
        items: validItems.map(item => {
          const originalItem = originalOrder?.items?.find((oi: any) => oi.id === item.id) || {};
          return {
            ...originalItem,
            id: item.id,
            itemId: item.itemId,
            name: item.name,
            description: item.description,
            hsnSac: item.hsnSac,
            quantity: item.quantity,
            unit: item.unit,
            rate: item.rate,
            discount: item.discount,
            discountType: item.discountType,
            tax: getTaxRate(item.tax),
            taxName: item.tax,
            amount: item.amount,
            ordered: item.ordered ?? originalItem?.ordered ?? item.quantity,
            invoicedQty: item.invoicedQty ?? originalItem?.invoicedQty ?? 0,
            invoiceStatus: item.invoiceStatus ?? originalItem?.invoiceStatus ?? "Not Invoiced"
          };
        }),
        subTotal,
        shippingCharges: formData.shippingCharges,
        cgst: isInterState ? 0 : taxAmount / 2,
        sgst: isInterState ? 0 : taxAmount / 2,
        igst: isInterState ? taxAmount : 0,
        adjustment: formData.adjustment,
        total: calculateTotal(),
        customerNotes: formData.customerNotes,
        termsAndConditions: formData.termsAndConditions,
        orderStatus: status === 'draft' ? 'Draft' : (originalOrder?.orderStatus === 'Draft' ? 'Confirmed' : originalOrder?.orderStatus || 'Confirmed'),
      };

      const response = await fetch(`/api/sales-orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      if (response.ok) {
        toast({ title: `Sales order updated successfully` });
        setLocation('/sales-orders');
      } else {
        toast({ title: "Failed to update sales order", variant: "destructive" });
      }
    } catch (error) {
      console.error('Error updating sales order:', error);
      toast({ title: "Error updating sales order", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-50 h-screen animate-in slide-in-from-right duration-300">
      <div className="flex items-center justify-between p-4 bg-sidebar-accent/5 border-b border-sidebar/10 shadow-sm z-10 flex-shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation('/sales-orders')} className="rounded-full hover:bg-sidebar/10 text-sidebar/70" data-testid="button-back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold font-display text-sidebar tracking-tight">Edit Sales Order</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto invisible-scrollbar">
        <div className="max-w-6xl mx-auto p-8 pb-32">
          <div className="space-y-8">
            {/* Sales Order Details Card */}
            <Card className="overflow-hidden border-slate-200 shadow-sm">
              <CardContent className="p-0">
                <div className="p-6 border-b border-sidebar/10 bg-sidebar-accent/5">
                  <h2 className="text-[10px] font-bold text-sidebar uppercase tracking-[0.2em] font-display">Sales Order Details</h2>
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
                          <div className="p-2">
                            <div className="flex items-center gap-2 mb-2">
                              <Search className="h-4 w-4 text-gray-400" />
                              <Input
                                placeholder="Search customers..."
                                className="h-8"
                                value={customerSearchTerm}
                                onChange={(e) => setCustomerSearchTerm(e.target.value)}
                              />
                            </div>
                          </div>
                          {filteredCustomers.map(customer => (
                            <SelectItem key={customer.id} value={customer.id} data-testid={`option-customer-${customer.id}`}>
                              {customer.name}
                            </SelectItem>
                          ))}
                          <div className="border-t mt-1 pt-1">
                            <SelectItem value="__add_new_customer__">
                              <div className="flex items-center gap-2 text-blue-600">
                                <Plus className="h-4 w-4" />
                                Add New Customer
                              </div>
                            </SelectItem>
                          </div>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-medium after:content-['*'] after:ml-0.5 after:text-red-500">Sales Order#</Label>
                      <Input
                        value={formData.salesOrderNumber}
                        onChange={(e) => setFormData(prev => ({ ...prev, salesOrderNumber: e.target.value }))}
                        className="font-mono bg-slate-50"
                        data-testid="input-order-number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-medium">Reference#</Label>
                      <Input
                        value={formData.referenceNumber}
                        onChange={(e) => setFormData(prev => ({ ...prev, referenceNumber: e.target.value }))}
                        className="bg-white"
                        data-testid="input-reference-number"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-medium after:content-['*'] after:ml-0.5 after:text-red-500">Sales Order Date</Label>
                      <Input
                        type="date"
                        value={formData.orderDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, orderDate: e.target.value }))}
                        className="bg-white"
                        data-testid="input-order-date"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-medium">Expected Shipment Date</Label>
                      <Input
                        type="date"
                        value={formData.expectedShipmentDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, expectedShipmentDate: e.target.value }))}
                        className="bg-white"
                        data-testid="input-shipment-date"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-medium">Payment Terms</Label>
                      <Select value={formData.paymentTerms} onValueChange={(v) => setFormData(prev => ({ ...prev, paymentTerms: v }))}>
                        <SelectTrigger className="bg-white" data-testid="select-payment-terms">
                          <SelectValue placeholder="Select payment terms" />
                        </SelectTrigger>
                        <SelectContent>
                          {paymentTermsOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-medium">Delivery Method</Label>
                      <Select value={formData.deliveryMethod} onValueChange={(v) => setFormData(prev => ({ ...prev, deliveryMethod: v }))}>
                        <SelectTrigger className="bg-white" data-testid="select-delivery-method">
                          <SelectValue placeholder="Select delivery method" />
                        </SelectTrigger>
                        <SelectContent>
                          {deliveryMethodOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-medium">Place of Supply</Label>
                      <Select value={formData.placeOfSupply} onValueChange={(v) => setFormData(prev => ({ ...prev, placeOfSupply: v }))}>
                        <SelectTrigger className="bg-white" data-testid="select-place-of-supply">
                          <SelectValue placeholder="Select place of supply" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="maharashtra">Maharashtra</SelectItem>
                          <SelectItem value="gujarat">Gujarat</SelectItem>
                          <SelectItem value="karnataka">Karnataka</SelectItem>
                          <SelectItem value="delhi">Delhi</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Items Card */}
            <Card className="overflow-hidden border-slate-200 shadow-sm">
              <CardContent className="p-0">
                <div className="p-6 border-b border-sidebar/10 bg-sidebar-accent/5 flex justify-between items-center">
                  <h2 className="text-[10px] font-bold text-sidebar uppercase tracking-[0.2em] font-display">Items</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-sidebar-accent/5 border-b border-sidebar/10">
                        <th className="px-6 py-3 text-left text-[10px] font-bold text-sidebar uppercase tracking-wider font-display w-8">#</th>
                        <th className="px-6 py-3 text-left text-[10px] font-bold text-sidebar uppercase tracking-wider font-display">Item Details</th>
                        <th className="px-6 py-3 text-center text-[10px] font-bold text-sidebar uppercase tracking-wider font-display w-32">Quantity</th>
                        <th className="px-6 py-3 text-right text-[10px] font-bold text-sidebar uppercase tracking-wider font-display w-36">Rate (₹)</th>
                        <th className="px-6 py-3 text-center text-[10px] font-bold text-sidebar uppercase tracking-wider font-display w-36">Discount</th>
                        <th className="px-6 py-3 text-left text-[10px] font-bold text-sidebar uppercase tracking-wider font-display w-40">Tax</th>
                        <th className="px-6 py-3 text-right text-[10px] font-bold text-sidebar uppercase tracking-wider font-display w-32">Amount</th>
                        <th className="px-6 py-3 w-16 text-right"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {orderItems.map((item, index) => (
                        <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors" data-testid={`row-item-${index}`}>
                          <td className="px-6 py-4 text-xs text-slate-400 font-mono">{index + 1}</td>
                          <td className="px-6 py-4">
                            <Select value={item.itemId} onValueChange={(v) => handleItemChange(index, v)}>
                              <SelectTrigger className="border-0 bg-transparent hover:bg-white focus:bg-white shadow-none hover:shadow-sm transition-all h-auto py-2" data-testid={`select-item-${index}`}>
                                <SelectValue placeholder="Select an item" />
                              </SelectTrigger>
                              <SelectContent>
                                {items.map(i => (
                                  <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-6 py-4">
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateOrderItem(index, 'quantity', parseFloat(e.target.value) || 1)}
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
                              onChange={(e) => updateOrderItem(index, 'rate', parseFloat(e.target.value) || 0)}
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
                                onChange={(e) => updateOrderItem(index, 'discount', parseFloat(e.target.value) || 0)}
                                className="w-20 text-center h-9"
                                data-testid={`input-discount-${index}`}
                              />
                              <Select
                                value={item.discountType}
                                onValueChange={(v) => updateOrderItem(index, 'discountType', v)}
                              >
                                <SelectTrigger className="w-16 h-9 px-2" data-testid={`select-discount-type-${index}`}>
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
                            <Select value={item.tax} onValueChange={(v) => updateOrderItem(index, 'tax', v)}>
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
                            {formatCurrency(item.amount)}
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
                <div className="p-4 border-t border-sidebar/10 bg-sidebar-accent/5">
                  <Button variant="ghost" size="sm" className="text-sidebar hover:bg-sidebar/5 h-8 px-3 font-bold font-display gap-1.5" onClick={addNewRow} data-testid="button-add-row">
                    <Plus className="h-4 w-4 text-sidebar/70" />
                    <span className="text-sidebar">Add Another Line</span>
                  </Button>
                  <Button variant="link" className="text-sidebar hover:text-sidebar/80 h-auto p-0 font-bold font-display ml-6 text-xs uppercase" data-testid="button-add-bulk">
                    <Plus className="h-3.5 w-3.5 mr-1.5 text-sidebar/70" />
                    Add Items in Bulk
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Terms & Attributes Card */}
            <Card className="overflow-hidden border-slate-200 shadow-sm">
              <CardContent className="p-0">
                <div className="p-6 border-b border-sidebar/10 bg-sidebar-accent/5">
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
                        <p className="text-xs text-slate-500">Will be displayed on the sales order</p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-700 font-medium">Terms & Conditions</Label>
                        <Textarea
                          value={formData.termsAndConditions}
                          onChange={(e) => setFormData(prev => ({ ...prev, termsAndConditions: e.target.value }))}
                          placeholder=""
                          className="min-h-[100px] resize-y"
                          data-testid="textarea-terms"
                        />
                      </div>
                    </div>

                    {/* Right Column (Totals) */}
                    <div className="bg-sidebar-accent/5 rounded-lg p-6 space-y-4 border border-sidebar/10 shadow-sm">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500 font-medium">Sub Total</span>
                        <span className="text-slate-700 font-bold font-display" data-testid="text-subtotal">{formatCurrency(calculateSubTotal())}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500 font-medium font-display">Shipping Charges</span>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.shippingCharges}
                          onChange={(e) => setFormData(prev => ({ ...prev, shippingCharges: parseFloat(e.target.value) || 0 }))}
                          className="w-32 text-right h-8 bg-white border-sidebar/10 font-bold font-display"
                          data-testid="input-shipping"
                        />
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500 font-medium font-display">Adjustment</span>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.adjustment}
                          onChange={(e) => setFormData(prev => ({ ...prev, adjustment: parseFloat(e.target.value) || 0 }))}
                          className="w-32 text-right h-8 bg-white border-sidebar/10 font-bold font-display"
                          data-testid="input-adjustment"
                        />
                      </div>
                      <div className="pt-4 mt-4 border-t border-sidebar/10">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-sidebar uppercase tracking-wider font-display">Total ( ₹ )</span>
                          <span className="text-2xl text-sidebar font-bold font-display tracking-tight" data-testid="text-total">{formatCurrency(calculateTotal())}</span>
                        </div>
                      </div>
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
                onClick={() => setLocation('/sales-orders')}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                className="h-9 px-6 font-bold font-display text-sidebar border-sidebar/20 hover:bg-sidebar/5"
                onClick={() => handleSubmit('draft')}
                disabled={loading}
                data-testid="button-save-draft"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save as Draft
              </Button>
              <Button
                className="h-9 bg-sidebar hover:bg-sidebar/90 text-white font-bold font-display px-8 shadow-sm hover:shadow-md transition-all"
                onClick={() => handleSubmit('confirmed')}
                disabled={loading}
                data-testid="button-save-confirm"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save and Confirm
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
