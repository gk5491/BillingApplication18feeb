import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
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

export default function PaymentsMadeEdit() {
  const [, setLocation] = useLocation();
  const { id } = useParams<{ id: string }>();
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

  const { data: existingPaymentData, isLoading: paymentLoading } = useQuery<{
    success: boolean;
    data: any;
  }>({
    queryKey: [`/api/payments-made/${id}`],
    enabled: !!id,
  });

  const { data: billsData, isLoading: billsLoading } = useQuery<{
    success: boolean;
    data: Bill[];
  }>({
    queryKey: ["/api/bills", formData.vendorId],
    enabled: !!formData.vendorId && activeTab === "bill_payment",
    staleTime: 0,
    queryFn: async () => {
      const response = await fetch(`/api/bills?vendorId=${encodeURIComponent(formData.vendorId)}`);
      if (!response.ok) throw new Error('Failed to fetch bills');
      return response.json();
    }
  });

  useEffect(() => {
    if (existingPaymentData?.data) {
      const payment = existingPaymentData.data;
      const paymentType = payment.paymentType || "bill_payment";

      // Set form data and activeTab together to ensure bills query triggers
      setFormData({
        vendorId: payment.vendorId || "",
        vendorName: payment.vendorName || "",
        gstTreatment: payment.gstTreatment || "",
        sourceOfSupply: payment.sourceOfSupply || "",
        destinationOfSupply: payment.destinationOfSupply || "",
        paymentNumber: payment.paymentNumber || "",
        descriptionOfSupply: payment.descriptionOfSupply || "",
        paymentAmount: payment.paymentAmount?.toString() || "",
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
      setAttachments(payment.attachments || []);

      // Set active tab first so bills query will be enabled
      setActiveTab(paymentType);

      if (payment.billPayments) {
        const bills: any = {};
        if (Array.isArray(payment.billPayments)) {
          payment.billPayments.forEach((bp: any) => {
            bills[bp.billId] = { payment: bp.paymentAmount, paymentMadeOn: payment.paymentDate };
          });
        } else {
          Object.keys(payment.billPayments).forEach(key => {
            bills[key] = payment.billPayments[key];
          });
        }
        setSelectedBills(bills);
      }
    }
  }, [existingPaymentData]);

  const vendors = vendorsData?.data || [];
  const vendorBills = (billsData?.data || []).map((b) => ({
    ...b,
    amountDue: b.balanceDue !== undefined ? b.balanceDue : (b.total || 0),
    date: b.billDate || b.date,
  }));

  const autoAllocatePayment = (totalAmount: number) => {
    if (vendorBills.length === 0) return;
    if (totalAmount <= 0) {
      setSelectedBills({});
      return;
    }
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
      }
    }
    setSelectedBills(newSelectedBills);
  };

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
    return { amountPaid, usedForPayments: totalPaid, amountInExcess: amountPaid - totalPaid };
  };

  const totals = calculateTotals();

  const handleSubmit = async (status: "DRAFT" | "PAID") => {
    if (!formData.vendorId) {
      toast({ title: "Please select a vendor", variant: "destructive" });
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
      const response = await fetch(`/api/payments-made/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        toast({ title: "Payment updated successfully" });
        setLocation("/payments-made");
      } else {
        const error = await response.json();
        toast({ title: error.message || "Failed to update payment", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Failed to update payment", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (paymentLoading) return <div className="p-8">Loading payment details...</div>;

  return (
    <div className="flex-1 flex flex-col bg-slate-50 h-screen">
      <div className="border-b border-slate-200 bg-white px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/payments-made")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Edit Payment Made</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto invisible-scrollbar">
        <div className="max-w-4xl mx-auto p-6 pb-24">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="h-auto p-0 bg-transparent gap-6 mb-6">
              <TabsTrigger
                value="bill_payment"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-sidebar data-[state=active]:text-sidebar data-[state=active]:bg-transparent data-[state=active]:shadow-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-2 py-3 bg-transparent hover:bg-transparent transition-none"
              >
                Bill Payment
              </TabsTrigger>
              <TabsTrigger
                value="vendor_advance"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-sidebar data-[state=active]:text-sidebar data-[state=active]:bg-transparent data-[state=active]:shadow-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-2 py-3 bg-transparent hover:bg-transparent transition-none"
              >
                Vendor Advance
              </TabsTrigger>
            </TabsList>

            <TabsContent value="bill_payment" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Vendor Name*</Label>
                  <Select value={formData.vendorId} onValueChange={handleVendorChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a Vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      {vendors.map((v) => (
                        <SelectItem key={v.id} value={v.id}>{v.displayName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Payment #*</Label>
                  <Input value={formData.paymentNumber} onChange={(e) => setFormData(p => ({ ...p, paymentNumber: e.target.value }))} />
                </div>

                <div className="space-y-2">
                  <Label>Payment Made*</Label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 border border-r-0 rounded-l-md bg-slate-50 text-sm text-slate-500">INR</span>
                    <Input type="number" className="rounded-l-none" value={formData.paymentAmount} onChange={(e) => handlePaymentAmountChange(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Payment Date*</Label>
                  <Input type="date" value={formData.paymentDate} onChange={(e) => setFormData(p => ({ ...p, paymentDate: e.target.value }))} />
                </div>

                <div className="space-y-2">
                  <Label>Payment Mode</Label>
                  <Select value={formData.paymentMode} onValueChange={(v) => setFormData(p => ({ ...p, paymentMode: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PAYMENT_MODES.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Paid Through*</Label>
                  <Select value={formData.paidThrough} onValueChange={(v) => setFormData(p => ({ ...p, paidThrough: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PAID_THROUGH_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.vendorId && (
                <Card className="mt-6">
                  <CardContent className="p-4">
                    <h3 className="font-medium mb-4">Unpaid Bills</h3>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-sidebar/5 border-b">
                          <tr>
                            <th className="px-4 py-2 text-left">Bill Number</th>
                            <th className="px-4 py-2 text-left">Bill Date</th>
                            <th className="px-4 py-2 text-right">Bill Amount</th>
                            <th className="px-4 py-2 text-right">Balance Due</th>
                            <th className="px-4 py-2 text-right">Payment</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {vendorBills.length === 0 ? (
                            <tr><td colSpan={5} className="p-4 text-center text-slate-500">No unpaid bills found</td></tr>
                          ) : (
                            vendorBills.map(bill => (
                              <tr key={bill.id}>
                                <td className="px-4 py-2">{bill.billNumber}</td>
                                <td className="px-4 py-2">{bill.date}</td>
                                <td className="px-4 py-2 text-right">₹{bill.total}</td>
                                <td className="px-4 py-2 text-right text-red-600">₹{bill.amountDue}</td>
                                <td className="px-4 py-2 text-right">
                                  <Input
                                    type="number"
                                    className="w-32 ml-auto h-8"
                                    value={selectedBills[bill.id]?.payment || ""}
                                    onChange={(e) => handleBillPaymentChange(bill.id, parseFloat(e.target.value) || 0)}
                                  />
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-end gap-3 pt-6">
                <Button variant="outline" onClick={() => setLocation("/payments-made")}>Cancel</Button>
                <Button onClick={() => handleSubmit("PAID")} disabled={saving} className="bg-sidebar hover:bg-sidebar/90 font-display">{saving ? "Updating..." : "Update Payment"}</Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
