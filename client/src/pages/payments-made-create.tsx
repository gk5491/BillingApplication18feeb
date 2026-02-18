import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  RefreshCw,
  Upload,
  X,
  AlertTriangle,
  Settings,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const INDIAN_STATES = [
  { code: "AN", name: "Andaman and Nicobar Islands" },
  { code: "AP", name: "Andhra Pradesh" },
  { code: "AR", name: "Arunachal Pradesh" },
  { code: "AS", name: "Assam" },
  { code: "BR", name: "Bihar" },
  { code: "CH", name: "Chandigarh" },
  { code: "CT", name: "Chhattisgarh" },
  { code: "DN", name: "Dadra and Nagar Haveli and Daman and Diu" },
  { code: "DL", name: "Delhi" },
  { code: "GA", name: "Goa" },
  { code: "GJ", name: "Gujarat" },
  { code: "HR", name: "Haryana" },
  { code: "HP", name: "Himachal Pradesh" },
  { code: "JK", name: "Jammu and Kashmir" },
  { code: "JH", name: "Jharkhand" },
  { code: "KA", name: "Karnataka" },
  { code: "KL", name: "Kerala" },
  { code: "LA", name: "Ladakh" },
  { code: "LD", name: "Lakshadweep" },
  { code: "MP", name: "Madhya Pradesh" },
  { code: "MH", name: "Maharashtra" },
  { code: "MN", name: "Manipur" },
  { code: "ML", name: "Meghalaya" },
  { code: "MZ", name: "Mizoram" },
  { code: "NL", name: "Nagaland" },
  { code: "OR", name: "Odisha" },
  { code: "PY", name: "Puducherry" },
  { code: "PB", name: "Punjab" },
  { code: "RJ", name: "Rajasthan" },
  { code: "SK", name: "Sikkim" },
  { code: "TN", name: "Tamil Nadu" },
  { code: "TG", name: "Telangana" },
  { code: "TR", name: "Tripura" },
  { code: "UP", name: "Uttar Pradesh" },
  { code: "UK", name: "Uttarakhand" },
  { code: "WB", name: "West Bengal" },
];

const TDS_OPTIONS = [
  { value: "commission_brokerage_2", label: "Commission or Brokerage [2%]" },
  { value: "professional_fees_10", label: "Professional Fees [10%]" },
  { value: "rent_10", label: "Rent [10%]" },
  { value: "contractor_1", label: "Payment to Contractor [1%]" },
  { value: "contractor_2", label: "Payment to Contractor [2%]" },
  { value: "interest_10", label: "Interest [10%]" },
];

const PAYMENT_MODES = [
  { value: "cash", label: "Cash" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "cheque", label: "Cheque" },
  { value: "credit_card", label: "Credit Card" },
  { value: "upi", label: "UPI" },
  { value: "neft", label: "NEFT" },
  { value: "rtgs", label: "RTGS" },
  { value: "imps", label: "IMPS" },
];

const PAID_THROUGH_OPTIONS = [
  { value: "petty_cash", label: "Petty Cash" },
  { value: "undeposited_funds", label: "Undeposited Funds" },
  { value: "bank_account", label: "Bank Account" },
  { value: "cash_on_hand", label: "Cash On Hand" },
];

const DEPOSIT_TO_OPTIONS = [
  { value: "prepaid_expenses", label: "Prepaid Expenses" },
  { value: "advance_to_vendor", label: "Advance to Vendor" },
  { value: "other", label: "Other Current Asset" },
];

interface Vendor {
  id: string;
  displayName: string;
  companyName?: string;
  gstTreatment?: string;
  sourceOfSupply?: string;
}

interface Bill {
  id: string;
  billNumber: string;
  billDate?: string;
  date?: string;
  orderNumber?: string;
  purchaseOrderNumber?: string;
  total: number;
  amountDue?: number;
  balanceDue?: number;
  amountPaid?: number;
  status: string;
  vendorId?: string;
}

export default function PaymentsMadeCreate() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const queryClient = useQueryClient();
  const paymentId = params.id;
  const isEditMode = !!paymentId;
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("bill_payment");
  const [saving, setSaving] = useState(false);
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
      const response = await fetch('/api/payments-made/upload', {
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

  const [formData, setFormData] = useState({
    vendorId: "",
    vendorName: "",
    gstTreatment: "",
    sourceOfSupply: "",
    destinationOfSupply: "",
    paymentNumber: "",
    descriptionOfSupply: "",
    paymentAmount: "",
    reverseCharge: false,
    tds: "",
    paymentDate: new Date().toISOString().split("T")[0],
    paymentMode: "cash",
    paidThrough: "petty_cash",
    depositTo: "prepaid_expenses",
    reference: "",
    notes: "",
    attachments: [] as File[],
  });

  const [selectedBills, setSelectedBills] = useState<{
    [key: string]: { payment: number; paymentMadeOn: string };
  }>({});

  const { data: vendorsData, isLoading: vendorsLoading } = useQuery<{
    success: boolean;
    data: Vendor[];
  }>({
    queryKey: ["/api/vendors"],
  });

  const { data: existingPaymentData } = useQuery<{
    success: boolean;
    data: any;
  }>({
    queryKey: [`/api/payments-made/${paymentId}`],
    enabled: isEditMode,
  });

  const { data: billsData, isLoading: billsLoading } = useQuery<{
    success: boolean;
    data: Bill[];
  }>({
    queryKey: ["/api/bills", formData.vendorId],
    enabled: !!formData.vendorId && activeTab === "bill_payment",
    // Always fetch fresh bills data to get updated balanceDue after payments
    staleTime: 0,
    refetchOnMount: 'always',
    queryFn: async () => {
      const response = await fetch(`/api/bills?vendorId=${encodeURIComponent(formData.vendorId)}`);
      if (!response.ok) throw new Error('Failed to fetch bills');
      return response.json();
    }
  });

  const { data: nextNumberData } = useQuery<{
    success: boolean;
    data: { nextNumber: string };
  }>({
    queryKey: ["/api/payments-made/next-number"],
  });

  // Read vendorId from URL params (when navigating from vendor page)
  const urlParams = new URLSearchParams(window.location.search);
  const vendorIdFromUrl = urlParams.get('vendorId');

  // Pre-fill vendor data when coming from vendor page
  useEffect(() => {
    if (vendorIdFromUrl && vendorsData?.data && vendorsData.data.length > 0 && !formData.vendorId) {
      const vendor = vendorsData.data.find(v => v.id === vendorIdFromUrl);
      if (vendor) {
        setFormData(prev => ({
          ...prev,
          vendorId: vendor.id,
          vendorName: vendor.displayName || vendor.companyName || '',
          gstTreatment: vendor.gstTreatment || '',
          sourceOfSupply: vendor.sourceOfSupply || ''
        }));
      }
    }
  }, [vendorIdFromUrl, vendorsData?.data]);

  // Populate form with existing payment data in edit mode
  useEffect(() => {
    if (isEditMode && existingPaymentData?.data) {
      const payment = existingPaymentData.data;
      setFormData({
        vendorId: payment.vendorId || "",
        vendorName: payment.vendorName || "",
        gstTreatment: payment.gstTreatment || "",
        sourceOfSupply: payment.sourceOfSupply || "",
        destinationOfSupply: payment.destinationOfSupply || "",
        paymentNumber: payment.paymentNumber || "",
        descriptionOfSupply: payment.descriptionOfSupply || "",
        paymentAmount: payment.amount?.toString() || "",
        reverseCharge: payment.reverseCharge || false,
        tds: payment.tds || "",
        paymentDate: payment.paymentDate || new Date().toISOString().split("T")[0],
        paymentMode: payment.paymentMode || "cash",
        paidThrough: payment.paidThrough || "petty_cash",
        depositTo: payment.depositTo || "prepaid_expenses",
        reference: payment.reference || "",
        notes: payment.notes || "",
        attachments: [],
      });
      if (payment.type === "bill_payment") {
        setActiveTab("bill_payment");
      } else {
        setActiveTab("direct_expense");
      }
    }
  }, [isEditMode, existingPaymentData]);

  useEffect(() => {
    if (nextNumberData?.data?.nextNumber) {
      setFormData((prev) => ({
        ...prev,
        paymentNumber: nextNumberData.data.nextNumber,
      }));
    }
  }, [nextNumberData]);

  // Re-apply auto-allocation when bills are loaded
  useEffect(() => {
    const amount = parseFloat(formData.paymentAmount) || 0;
    if (vendorBills.length > 0 && amount > 0 && activeTab === "bill_payment") {
      autoAllocatePayment(amount);
    }
  }, [billsData]);

  const vendors = vendorsData?.data || [];

  // Bills are already filtered by backend for unpaid status and vendor
  const vendorBills = (billsData?.data || []).map((b) => ({
    ...b,
    // Normalize amountDue from balanceDue
    amountDue: b.balanceDue !== undefined ? b.balanceDue : (b.total || 0),
    // Ensure we have billDate for sorting
    date: b.billDate || b.date,
  }));

  // Auto-allocation function for payment amount
  const autoAllocatePayment = (totalAmount: number) => {
    if (vendorBills.length === 0) return;

    if (totalAmount <= 0) {
      setSelectedBills({});
      return;
    }

    // Sort bills by date (oldest first)
    const sortedBills = [...vendorBills].sort((a, b) => {
      const dateA = new Date(a.date || new Date()).getTime();
      const dateB = new Date(b.date || new Date()).getTime();
      return dateA - dateB;
    });

    let remainingAmount = totalAmount;
    const newSelectedBills: { [key: string]: { payment: number; paymentMadeOn: string } } = {};

    for (const bill of sortedBills) {
      if (remainingAmount <= 0) break;

      // Only allocate to bills with remaining balance (amountDue > 0)
      // Skip bills that are already fully paid (amountDue = 0)
      if (bill.amountDue > 0) {
        const paymentAmount = Math.min(remainingAmount, bill.amountDue);
        newSelectedBills[bill.id] = {
          payment: paymentAmount,
          paymentMadeOn: new Date().toISOString().split("T")[0]
        };
        remainingAmount -= paymentAmount;
        console.log(`Allocated ${paymentAmount} to bill ${bill.billNumber}, remaining: ${remainingAmount}`);
      }
    }

    setSelectedBills(newSelectedBills);
  };

  // Handle payment amount change with auto-allocation
  const handlePaymentAmountChange = (amount: string) => {
    setFormData((prev) => ({ ...prev, paymentAmount: amount }));
    const numAmount = parseFloat(amount) || 0;
    if (numAmount > 0 && activeTab === "bill_payment") {
      autoAllocatePayment(numAmount);
    }
  };

  const handleVendorChange = (vendorId: string) => {
    const vendor = vendors.find((v) => v.id === vendorId);
    if (vendor) {
      setFormData((prev) => ({
        ...prev,
        vendorId: vendor.id,
        vendorName: vendor.displayName,
        gstTreatment: vendor.gstTreatment || "Unregistered Business",
        sourceOfSupply: vendor.sourceOfSupply || "",
        destinationOfSupply: vendor.sourceOfSupply || "",
      }));
      setSelectedBills({});
      // Re-apply auto-allocation if payment amount exists
      const amount = parseFloat(formData.paymentAmount) || 0;
      if (amount > 0) {
        setTimeout(() => autoAllocatePayment(amount), 100);
      }
    }
  };

  const handleBillPaymentChange = (billId: string, payment: number) => {
    setSelectedBills((prev) => ({
      ...prev,
      [billId]: {
        payment,
        paymentMadeOn: new Date().toISOString().split("T")[0],
      },
    }));
  };

  const calculateTotals = () => {
    const totalPaid = Object.values(selectedBills).reduce(
      (sum, b) => sum + (b.payment || 0),
      0,
    );
    const amountPaid = parseFloat(formData.paymentAmount) || 0;
    const usedForPayments = totalPaid;
    const amountRefunded = 0;
    const amountInExcess = amountPaid - usedForPayments;

    return { amountPaid, usedForPayments, amountRefunded, amountInExcess };
  };

  const totals = calculateTotals();

  const handleSubmit = async (status: "DRAFT" | "PAID") => {
    if (!formData.vendorId) {
      toast({ title: "Please select a vendor", variant: "destructive" });
      return;
    }

    if (!formData.paymentAmount || parseFloat(formData.paymentAmount) <= 0) {
      toast({
        title: "Please enter a valid payment amount",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        paymentAmount: parseFloat(formData.paymentAmount),
        billPayments: activeTab === "bill_payment" ? selectedBills : {},
        paymentType: activeTab,
        status,
        attachments,
      };

      const url = isEditMode ? `/api/payments-made/${paymentId}` : "/api/payments-made";
      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast({
          title: `Payment ${isEditMode ? 'updated' : status === "DRAFT" ? "saved as draft" : "recorded"} successfully`,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/payments-made"] });
        setLocation("/payments-made");
      } else {
        const error = await response.json();
        toast({
          title: error.message || "Failed to save payment",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({ title: "Failed to save payment", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const clearAppliedAmount = () => {
    setSelectedBills({});
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 h-screen">
      <div className="border-b border-slate-200 bg-white px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/payments-made")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">{isEditMode ? 'Edit Payment Made' : 'New Payment Made'}</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto invisible-scrollbar">
        <div className="max-w-4xl mx-auto p-6 pb-24">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="h-auto p-0 bg-transparent gap-6 mb-6">
              <TabsTrigger
                value="bill_payment"
                data-testid="tab-bill-payment"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-sidebar data-[state=active]:text-sidebar data-[state=active]:bg-transparent data-[state=active]:shadow-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-2 py-3 bg-transparent hover:bg-transparent transition-none"
              >
                Bill Payment
              </TabsTrigger>
              <TabsTrigger
                value="vendor_advance"
                data-testid="tab-vendor-advance"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-sidebar data-[state=active]:text-sidebar data-[state=active]:bg-transparent data-[state=active]:shadow-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-2 py-3 bg-transparent hover:bg-transparent transition-none"
              >
                Vendor Advance
              </TabsTrigger>
            </TabsList>

            <TabsContent value="bill_payment" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <Label className="text-black">Vendor Name
                    <span className="text-red-600">*</span>
                  </Label>
                  <Select
                    value={formData.vendorId}
                    onValueChange={handleVendorChange}
                  >
                    <SelectTrigger data-testid="select-vendor">
                      <SelectValue placeholder="Select a Vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      {vendorsLoading ? (
                        <SelectItem value="_loading" disabled>
                          Loading...
                        </SelectItem>
                      ) : vendors.length === 0 ? (
                        <SelectItem value="_empty" disabled>
                          No vendors found
                        </SelectItem>
                      ) : (
                        vendors.map((vendor) => (
                          <SelectItem key={vendor.id} value={vendor.id}>
                            {vendor.displayName}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {formData.gstTreatment && (
                    <p className="text-sm text-slate-500 mt-1">
                      GST Treatment: {formData.gstTreatment}{" "}
                      <Settings className="h-3 w-3 inline ml-1 cursor-pointer" />
                    </p>
                  )}
                </div>

                {formData.vendorId && (
                  <div className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-sidebar text-white hover:bg-sidebar/90 font-display"
                      onClick={() =>
                        setLocation(`/vendors/${formData.vendorId}/edit`)
                      }
                      data-testid="button-vendor-details"
                    >
                      {formData.vendorName}'s Details &gt;
                    </Button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-black">Payment #
                  </Label>
                  <div className="relative">
                    <Input
                      value={formData.paymentNumber}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          paymentNumber: e.target.value,
                        }))
                      }
                      data-testid="input-payment-number"
                    />
                    <RefreshCw className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 cursor-pointer" />
                  </div>
                </div>

                <div>
                  <Label className="text-black">Payment Made
                    <span className="text-red-600">*</span>
                  </Label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 border border-r-0 rounded-l-md bg-slate-50 text-sm text-slate-500">
                      INR
                    </span>
                    <Input
                      type="number"
                      step="0.01"
                      className="rounded-l-none"
                      value={formData.paymentAmount}
                      onChange={(e) => handlePaymentAmountChange(e.target.value)}
                      placeholder="Enter amount to auto-allocate to bills"
                      data-testid="input-payment-amount"
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Enter amount to automatically allocate across unpaid bills (oldest first)
                  </p>
                </div>
              </div>

              {/* <Card className="bg-amber-50 border-amber-200">
              <CardContent className="flex items-center gap-3 py-3">
                <span className="text-amber-600 text-lg">💡</span>
                <p className="text-sm text-slate-700">
                  Initiate payments for your bills directly from Zoho Books by
                  integrating with one of our partner banks.{" "}
                  <span className="text-blue-600 cursor-pointer">
                    Set Up Now
                  </span>
                </p>
                <X className="h-4 w-4 text-red-500 cursor-pointer ml-auto" />
              </CardContent>
            </Card>
 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-black">Payment Date
                    <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={formData.paymentDate}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        paymentDate: e.target.value,
                      }))
                    }
                    data-testid="input-payment-date"
                  />
                </div>

                <div>
                  <Label>Payment Mode</Label>
                  <Select
                    value={formData.paymentMode}
                    onValueChange={(v) =>
                      setFormData((prev) => ({ ...prev, paymentMode: v }))
                    }
                  >
                    <SelectTrigger data-testid="select-payment-mode">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_MODES.map((mode) => (
                        <SelectItem key={mode.value} value={mode.value}>
                          {mode.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-black">Paid Through
                    <span className="text-red-600">*</span>
                  </Label>
                  <Select
                    value={formData.paidThrough}
                    onValueChange={(v) =>
                      setFormData((prev) => ({ ...prev, paidThrough: v }))
                    }
                  >
                    <SelectTrigger data-testid="select-paid-through">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAID_THROUGH_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Reference#</Label>
                  <Input
                    value={formData.reference}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        reference: e.target.value,
                      }))
                    }
                    data-testid="input-reference"
                  />
                </div>
              </div>

              {formData.vendorId && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-slate-700">
                      Bills for {formData.vendorName}
                    </h3>
                    <button
                      className="text-sm text-sidebar cursor-pointer"
                      onClick={clearAppliedAmount}
                    >
                      Clear Applied Amount
                    </button>
                  </div>

                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-sidebar/5 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium text-slate-600">
                            Date
                          </th>
                          <th className="px-4 py-3 text-left font-medium text-slate-600">
                            Bill#
                          </th>
                          <th className="px-4 py-3 text-left font-medium text-slate-600">
                            PO#
                          </th>
                          <th className="px-4 py-3 text-right font-medium text-slate-600">
                            Bill Amount
                          </th>
                          <th className="px-4 py-3 text-right font-medium text-slate-600">
                            Amount Due
                          </th>
                          <th className="px-4 py-3 text-center font-medium text-slate-600">
                            Payment Made on
                          </th>
                          <th className="px-4 py-3 text-right font-medium text-slate-600">
                            Payment
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {billsLoading ? (
                          <tr>
                            <td
                              colSpan={7}
                              className="px-4 py-8 text-center text-slate-500"
                            >
                              Loading bills...
                            </td>
                          </tr>
                        ) : vendorBills.length === 0 ? (
                          <tr>
                            <td
                              colSpan={7}
                              className="px-4 py-8 text-center text-slate-500"
                            >
                              There are no unpaid bills for this vendor.
                            </td>
                          </tr>
                        ) : (
                          vendorBills.map((bill) => (
                            <tr
                              key={bill.id}
                              className="border-b last:border-b-0"
                            >
                              <td className="px-4 py-3">{bill.date}</td>
                              <td className="px-4 py-3 text-sidebar">
                                {bill.billNumber}
                              </td>
                              <td className="px-4 py-3">
                                {bill.purchaseOrderNumber || "-"}
                              </td>
                              <td className="px-4 py-3 text-right">
                                {bill.total.toFixed(2)}
                              </td>
                              <td className="px-4 py-3 text-right">
                                {bill.amountDue.toFixed(2)}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <Input
                                  type="date"
                                  className="h-8 w-32 mx-auto"
                                  value={
                                    selectedBills[bill.id]?.paymentMadeOn || ""
                                  }
                                  onChange={(e) =>
                                    setSelectedBills((prev) => ({
                                      ...prev,
                                      [bill.id]: {
                                        ...prev[bill.id],
                                        paymentMadeOn: e.target.value,
                                      },
                                    }))
                                  }
                                />
                              </td>
                              <td className="px-4 py-3 text-right">
                                <Input
                                  type="number"
                                  step="0.01"
                                  className="h-8 w-24 ml-auto text-right"
                                  placeholder="0.00"
                                  value={selectedBills[bill.id]?.payment || ""}
                                  onChange={(e) =>
                                    handleBillPaymentChange(
                                      bill.id,
                                      parseFloat(e.target.value) || 0,
                                    )
                                  }
                                />
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end mt-4">
                    <div className="text-right space-y-1">
                      <p className="text-sm">
                        <span className="text-slate-500">Total:</span>{" "}
                        <span className="font-medium">
                          {Object.values(selectedBills)
                            .reduce((sum, b) => sum + (b.payment || 0), 0)
                            .toFixed(2)}
                        </span>
                      </p>
                    </div>
                  </div>

                  <Card className="bg-amber-50 border-amber-200 mt-4">
                    <CardContent className="py-4">
                      <div className="space-y-2 text-sm text-right">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Amount Paid:</span>
                          <span>{totals.amountPaid.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">
                            Amount used for Payments:
                          </span>
                          <span>{totals.usedForPayments.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Amount Refunded:</span>
                          <span>{totals.amountRefunded.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-amber-600 flex items-center gap-1">
                            <AlertTriangle className="h-4 w-4" />
                            Amount in Excess:
                          </span>
                          <span className="text-amber-600">
                            ₹ {totals.amountInExcess.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              <div className="mt-6">
                <Label>Notes (Internal use. Not visible to vendor)</Label>
                <Textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  className="resize-none"
                  data-testid="input-notes"
                />
              </div>

              <div className="mt-6">
                <Label>Attachments</Label>
                <div className="mt-1 border-2 border-dashed border-slate-200 rounded-lg p-4 text-center bg-white relative">
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={uploading}
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  />
                  <Button variant="outline" size="sm" className="gap-2" disabled={uploading}>
                    <Upload className="h-4 w-4" />
                    {uploading ? "Uploading..." : "Upload File"}
                  </Button>
                  <p className="text-xs text-slate-500 mt-2">
                    You can upload a maximum of 5 files, 10MB each
                  </p>
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

              <div className="mt-4 text-sm text-slate-500">
                <strong>Additional Fields:</strong> Start adding custom fields for
                your payments made by going to{" "}
                <span className="text-sidebar">Settings</span> ➔{" "}
                <span className="text-sidebar">Purchases</span> ➔{" "}
                <span className="text-sidebar">Payments Made</span>.
              </div>
            </TabsContent>

            <TabsContent value="vendor_advance" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-black">Vendor Name
                    <span className="text-red-600">*</span>
                  </Label>
                  <Select
                    value={formData.vendorId}
                    onValueChange={handleVendorChange}
                  >
                    <SelectTrigger data-testid="select-vendor-advance">
                      <SelectValue placeholder="Select a Vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      {vendorsLoading ? (
                        <SelectItem value="_loading" disabled>
                          Loading...
                        </SelectItem>
                      ) : vendors.length === 0 ? (
                        <SelectItem value="_empty" disabled>
                          No vendors found
                        </SelectItem>
                      ) : (
                        vendors.map((vendor) => (
                          <SelectItem key={vendor.id} value={vendor.id}>
                            {vendor.displayName}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {formData.gstTreatment && (
                    <p className="text-sm text-slate-500 mt-1">
                      GST Treatment: {formData.gstTreatment}{" "}
                      <Settings className="h-3 w-3 inline ml-1 cursor-pointer" />
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-black">Source of Supply
                    <span className="text-red-600">*</span>
                  </Label>
                  <Select
                    value={formData.sourceOfSupply}
                    onValueChange={(v) =>
                      setFormData((prev) => ({ ...prev, sourceOfSupply: v }))
                    }
                  >
                    <SelectTrigger data-testid="select-source-supply">
                      <SelectValue placeholder="Select State" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDIAN_STATES.map((state) => (
                        <SelectItem
                          key={state.code}
                          value={`[${state.code}] - ${state.name}`}
                        >
                          [{state.code}] - {state.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-black">Destination of Supply
                    <span className="text-red-600">*</span>
                  </Label>
                  <Select
                    value={formData.destinationOfSupply}
                    onValueChange={(v) =>
                      setFormData((prev) => ({ ...prev, destinationOfSupply: v }))
                    }
                  >
                    <SelectTrigger data-testid="select-destination-supply">
                      <SelectValue placeholder="Select State" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDIAN_STATES.map((state) => (
                        <SelectItem
                          key={state.code}
                          value={`[${state.code}] - ${state.name}`}
                        >
                          [{state.code}] - {state.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-black">Payment #
                    <span className="text-red-600">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      value={formData.paymentNumber}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          paymentNumber: e.target.value,
                        }))
                      }
                      data-testid="input-payment-number-advance"
                    />
                    <RefreshCw className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 cursor-pointer" />
                  </div>
                </div>

                <div>
                  <Label>Description of Supply</Label>
                  <Textarea
                    rows={2}
                    placeholder="Will be displayed on the Payment Voucher"
                    value={formData.descriptionOfSupply}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        descriptionOfSupply: e.target.value,
                      }))
                    }
                    className="resize-none"
                    data-testid="input-description-supply"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-black">Payment Made
                    <span className="text-red-600">*</span>
                  </Label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 border border-r-0 rounded-l-md bg-slate-50 text-sm text-slate-500">
                      INR
                    </span>
                    <Input
                      type="number"
                      step="0.01"
                      className="rounded-l-none"
                      value={formData.paymentAmount}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          paymentAmount: e.target.value,
                        }))
                      }
                      placeholder="Enter advance amount"
                      data-testid="input-payment-amount-advance"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Label>Reverse Charge</Label>
                <Checkbox
                  checked={formData.reverseCharge}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, reverseCharge: !!checked }))
                  }
                  data-testid="checkbox-reverse-charge"
                />
                <span className="text-sm text-slate-600">
                  This transaction is applicable for reverse charge
                </span>
              </div>

              <div>
                <Label>TDS</Label>
                <Select
                  value={formData.tds}
                  onValueChange={(v) =>
                    setFormData((prev) => ({ ...prev, tds: v }))
                  }
                >
                  <SelectTrigger data-testid="select-tds">
                    <SelectValue placeholder="Select TDS" />
                  </SelectTrigger>
                  <SelectContent>
                    {TDS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-black">Payment Date
                    <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={formData.paymentDate}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        paymentDate: e.target.value,
                      }))
                    }
                    data-testid="input-payment-date-advance"
                  />
                </div>

                <div>
                  <Label>Payment Mode</Label>
                  <Select
                    value={formData.paymentMode}
                    onValueChange={(v) =>
                      setFormData((prev) => ({ ...prev, paymentMode: v }))
                    }
                  >
                    <SelectTrigger data-testid="select-payment-mode-advance">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_MODES.map((mode) => (
                        <SelectItem key={mode.value} value={mode.value}>
                          {mode.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-black">Paid Through
                    <span className="text-red-600">*</span>
                  </Label>
                  <Select
                    value={formData.paidThrough}
                    onValueChange={(v) =>
                      setFormData((prev) => ({ ...prev, paidThrough: v }))
                    }
                  >
                    <SelectTrigger data-testid="select-paid-through-advance">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAID_THROUGH_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Deposit To</Label>
                  <Select
                    value={formData.depositTo}
                    onValueChange={(v) =>
                      setFormData((prev) => ({ ...prev, depositTo: v }))
                    }
                  >
                    <SelectTrigger data-testid="select-deposit-to">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPOSIT_TO_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Reference#</Label>
                  <Input
                    value={formData.reference}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        reference: e.target.value,
                      }))
                    }
                    data-testid="input-reference-advance"
                  />
                </div>
              </div>

              <div className="mt-6">
                <Label>Notes (Internal use. Not visible to vendor)</Label>
                <Textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  className="resize-none"
                  data-testid="input-notes-advance"
                />
              </div>

              <div className="mt-6">
                <Label>Attachments</Label>
                <div className="mt-1 border-2 border-dashed border-slate-200 rounded-lg p-4 text-center bg-white relative">
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={uploading}
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  />
                  <Button variant="outline" size="sm" className="gap-2" disabled={uploading}>
                    <Upload className="h-4 w-4" />
                    {uploading ? "Uploading..." : "Upload File"}
                  </Button>
                  <p className="text-xs text-slate-500 mt-2">
                    You can upload a maximum of 5 files, 10MB each
                  </p>
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

              <div className="mt-4 text-sm text-slate-500">
                <strong>Additional Fields:</strong> Start adding custom fields for
                your payments made by going to{" "}
                <span className="text-sidebar">Settings</span> ➔{" "}
                <span className="text-sidebar">Purchases</span> ➔{" "}
                <span className="text-sidebar">Payments Made</span>.
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="border-t border-slate-200 bg-white px-6 py-4 sticky bottom-0">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => handleSubmit("DRAFT")}
              disabled={saving}
              data-testid="button-save-draft"
              className="font-display"
            >
              {saving ? "Saving..." : "Save as Draft"}
            </Button>
            <Button
              className="bg-sidebar hover:bg-sidebar/90 font-display"
              onClick={() => handleSubmit("PAID")}
              disabled={saving}
              data-testid="button-save-paid"
            >
              {saving ? "Saving..." : "Save as Paid"}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setLocation("/payments-made")}
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
