import { useState, useEffect, useRef } from "react";
import { useLocation, useParams } from "wouter";
import { ArrowLeft, Plus, X, Upload, FileText, Trash2, Info, Check, ChevronsUpDown, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const GST_TREATMENTS = [
  {
    value: "registered_regular",
    label: "Registered Business – Regular",
    description: "Regular business registered under GST"
  },
  {
    value: "registered_composition",
    label: "Registered Business – Composition",
    description: "Registered under GST Composition Scheme"
  },
  {
    value: "unregistered_business",
    label: "Unregistered Business",
    description: "Business not registered under GST"
  },
  {
    value: "consumer",
    label: "Consumer",
    description: "A normal consumer"
  },
  {
    value: "overseas",
    label: "Overseas",
    description: "International import/export parties"
  },
  {
    value: "sez_unit",
    label: "Special Economic Zone (SEZ Unit)",
    description: "Business operating inside SEZ"
  },
  {
    value: "deemed_export",
    label: "Deemed Export",
    description: "Sales to EOU or EPCG license holders"
  },
  {
    value: "tax_deductor",
    label: "Tax Deductor",
    description: "Govt agencies deducting TDS under GST"
  },
  {
    value: "sez_developer",
    label: "SEZ Developer",
    description: "Owner/Developer of SEZ unit"
  },
  {
    value: "isd",
    label: "Input Service Distributor (ISD)",
    description: "Head office distributing GST credits internally"
  }
];

const INDIAN_STATES = [
  { code: "01", name: "Jammu and Kashmir" },
  { code: "02", name: "Himachal Pradesh" },
  { code: "03", name: "Punjab" },
  { code: "04", name: "Chandigarh" },
  { code: "05", name: "Uttarakhand" },
  { code: "06", name: "Haryana" },
  { code: "07", name: "Delhi" },
  { code: "08", name: "Rajasthan" },
  { code: "09", name: "Uttar Pradesh" },
  { code: "10", name: "Bihar" },
  { code: "11", name: "Sikkim" },
  { code: "12", name: "Arunachal Pradesh" },
  { code: "13", name: "Nagaland" },
  { code: "14", name: "Manipur" },
  { code: "15", name: "Mizoram" },
  { code: "16", name: "Tripura" },
  { code: "17", name: "Meghalaya" },
  { code: "18", name: "Assam" },
  { code: "19", name: "West Bengal" },
  { code: "20", name: "Jharkhand" },
  { code: "21", name: "Odisha" },
  { code: "22", name: "Chhattisgarh" },
  { code: "23", name: "Madhya Pradesh" },
  { code: "24", name: "Gujarat" },
  { code: "25", name: "Daman and Diu (Old)" },
  { code: "26", name: "Dadra and Nagar Haveli and Daman and Diu" },
  { code: "27", name: "Maharashtra" },
  { code: "28", name: "Andhra Pradesh (Old)" },
  { code: "29", name: "Karnataka" },
  { code: "30", name: "Goa" },
  { code: "31", name: "Lakshadweep" },
  { code: "32", name: "Kerala" },
  { code: "33", name: "Tamil Nadu" },
  { code: "34", name: "Puducherry" },
  { code: "35", name: "Andaman and Nicobar Islands" },
  { code: "36", name: "Telangana" },
  { code: "37", name: "Andhra Pradesh" },
  { code: "38", name: "Ladakh" },
  { code: "97", name: "Other Territory" },
];

const EXEMPTION_REASONS = [
  "Exempt supply under GST",
  "Export without payment of tax",
  "SEZ supply",
  "Deemed export",
  "Zero-rated supply",
  "Supply to EOU/STP/EHTP",
  "Government entity",
  "Charitable organization",
  "Educational institution",
  "Healthcare services",
];

const PAYMENT_TERMS_OPTIONS = [
  { value: "due_on_receipt", label: "Due on Receipt" },
  { value: "net_15", label: "Net 15" },
  { value: "net_30", label: "Net 30" },
  { value: "net_45", label: "Net 45" },
  { value: "net_60", label: "Net 60" },
  { value: "due_end_of_month", label: "Due end of the month" },
  { value: "due_end_of_next_month", label: "Due end of next month" }
];

const CURRENCIES = [
  { value: "INR", label: "INR - Indian Rupee" },
  { value: "USD", label: "USD - US Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - British Pound" },
  { value: "AED", label: "AED - UAE Dirham" }
];

function validateGSTIN(gstin: string): { valid: boolean; message?: string } {
  if (!gstin) return { valid: true };

  if (gstin.length !== 15) {
    return { valid: false, message: "GSTIN must be 15 characters" };
  }

  const gstinPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (!gstinPattern.test(gstin)) {
    return { valid: false, message: "Invalid GSTIN format" };
  }

  return { valid: true };
}

function validatePAN(pan: string): { valid: boolean; message?: string } {
  if (!pan) return { valid: true };

  if (pan.length !== 10) {
    return { valid: false, message: "PAN must be 10 characters" };
  }

  const panPattern = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  if (!panPattern.test(pan)) {
    return { valid: false, message: "Invalid PAN format (e.g., ABCDE1234F)" };
  }

  return { valid: true };
}

interface Customer {
  id: string;
  displayName: string;
  salutation?: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  email?: string;
  workPhone?: string;
  mobile?: string;
  language?: string;
  gstTreatment?: string;
  placeOfSupply?: string;
  gstin?: string;
  pan?: string;
  taxPreference?: string;
  exemptionReason?: string;
  currency?: string;
  openingBalance?: string;
  paymentTerms?: string;
  enablePortal?: boolean;
  customerType?: string;
  remarks?: string;
  tags?: string[];
  billingAddress?: {
    street: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
    attention?: string;
    phone?: string;
    fax?: string;
  };
  shippingAddress?: {
    street: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
    attention?: string;
    phone?: string;
    fax?: string;
  };
  contactPersons?: Array<{
    salutation: string;
    firstName: string;
    lastName: string;
    email: string;
    workPhone: string;
    mobile: string;
  }>;
}

export default function CustomerEdit() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<Customer | null>(null);

  // Dropdown state management
  const [gstTreatmentOpen, setGstTreatmentOpen] = useState(false);
  const [gstTreatmentSearch, setGstTreatmentSearch] = useState("");
  const [placeOfSupplyOpen, setPlaceOfSupplyOpen] = useState(false);
  const [placeOfSupplySearch, setPlaceOfSupplySearch] = useState("");
  const [exemptionOpen, setExemptionOpen] = useState(false);
  const [exemptionSearch, setExemptionSearch] = useState("");
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [currencySearch, setCurrencySearch] = useState("");
  const [paymentTermsOpen, setPaymentTermsOpen] = useState(false);

  interface AttachedFile {
    id: string;
    name: string;
    size: number;
    type: string;
    data?: string;
  }

  const [documents, setDocuments] = useState<AttachedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const maxSize = 10 * 1024 * 1024;
    const maxFiles = 10;

    if (documents.length + files.length > maxFiles) {
      toast({
        title: "Too many files",
        description: `You can only upload up to ${maxFiles} files.`,
        variant: "destructive",
      });
      return;
    }

    Array.from(files).forEach((file) => {
      if (file.size > maxSize) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds 10MB limit.`,
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const newFile: AttachedFile = {
          id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          size: file.size,
          type: file.type,
          data: e.target?.result as string,
        };
        setDocuments((prev) => [...prev, newFile]);
      };
      reader.readAsDataURL(file);
    });

    if (event.target) {
      event.target.value = "";
    }
  };

  const removeFile = (fileId: string) => {
    setDocuments((prev) => prev.filter((f) => f.id !== fileId));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const [formData, setFormData] = useState({
    customerType: "business" as "business" | "individual",
    salutation: "",
    firstName: "",
    lastName: "",
    displayName: "",
    companyName: "",
    email: "",
    workPhone: "",
    mobile: "",
    language: "English",
    gstTreatment: "",
    placeOfSupply: "",
    gstin: "",
    pan: "",
    taxPreference: "taxable" as "taxable" | "tax_exempt",
    exemptionReason: "",
    currency: "INR",
    openingBalance: "",
    paymentTerms: "",
    enablePortal: false,
    remarks: "",
    tags: [] as string[],
    billingStreet: "",
    billingCity: "",
    billingState: "",
    billingCountry: "India",
    billingPincode: "",
    billingAttention: "",
    billingPhone: "",
    billingFax: "",
    shippingStreet: "",
    shippingCity: "",
    shippingState: "",
    shippingCountry: "India",
    shippingPincode: "",
    shippingAttention: "",
    shippingPhone: "",
    shippingFax: "",
  });

  const [contactPersons, setContactPersons] = useState<Array<{
    salutation: string;
    firstName: string;
    lastName: string;
    email: string;
    workPhone: string;
    mobile: string;
  }>>([]);

  useEffect(() => {
    const fetchCustomer = async () => {
      if (!params.id) return;
      try {
        const response = await fetch(`/api/customers/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          const found = data.data;
          if (found) {
            setCustomer(found);
            setFormData({
              customerType: found.customerType || "business",
              salutation: found.salutation || "",
              firstName: found.firstName || "",
              lastName: found.lastName || "",
              displayName: found.displayName || found.name || "",
              companyName: found.companyName || "",
              email: found.email || "",
              workPhone: found.workPhone || found.phone || "",
              mobile: found.mobile || "",
              language: found.language || "English",
              gstTreatment: found.gstTreatment || "",
              placeOfSupply: found.placeOfSupply || "",
              gstin: found.gstin || "",
              pan: found.pan || "",
              taxPreference: found.taxPreference || "taxable",
              exemptionReason: found.exemptionReason || "",
              currency: found.currency || "INR",
              openingBalance: found.openingBalance || "",
              paymentTerms: found.paymentTerms || "",
              enablePortal: found.enablePortal || false,
              remarks: found.remarks || "",
              tags: found.tags || [],
              billingStreet: found.billingAddress?.street || "",
              billingCity: found.billingAddress?.city || "",
              billingState: found.billingAddress?.state || "",
              billingCountry: found.billingAddress?.country || "India",
              billingPincode: found.billingAddress?.pincode || "",
              billingAttention: found.billingAddress?.attention || "",
              billingPhone: found.billingAddress?.phone || "",
              billingFax: found.billingAddress?.fax || "",
              shippingStreet: found.shippingAddress?.street || "",
              shippingCity: found.shippingAddress?.city || "",
              shippingState: found.shippingAddress?.state || "",
              shippingCountry: found.shippingAddress?.country || "India",
              shippingPincode: found.shippingAddress?.pincode || "",
              shippingAttention: found.shippingAddress?.attention || "",
              shippingPhone: found.shippingAddress?.phone || "",
              shippingFax: found.shippingAddress?.fax || "",
            });
            if (found.contactPersons) {
              setContactPersons(found.contactPersons);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch customer:', error);
        toast({
          title: "Error",
          description: "Failed to load customer data.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchCustomer();
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!params.id) return;

    setIsSubmitting(true);

    try {
      const updateData = {
        name: formData.displayName,
        displayName: formData.displayName,
        salutation: formData.salutation,
        firstName: formData.firstName,
        lastName: formData.lastName,
        companyName: formData.companyName,
        email: formData.email,
        phone: formData.workPhone,
        workPhone: formData.workPhone,
        mobile: formData.mobile,
        language: formData.language,
        gstTreatment: (formData.taxPreference === "taxable" || formData.taxPreference === "tax_exempt") ? formData.gstTreatment : "",
        placeOfSupply: formData.placeOfSupply,
        gstin: formData.taxPreference === "taxable" ? formData.gstin : "",
        pan: formData.pan,
        taxPreference: formData.taxPreference,
        exemptionReason: formData.taxPreference === "tax_exempt" ? formData.exemptionReason : "",
        currency: formData.currency,
        openingBalance: formData.openingBalance,
        paymentTerms: formData.paymentTerms,
        enablePortal: formData.enablePortal,
        remarks: formData.remarks,
        tags: formData.tags,
        customerType: formData.customerType,
        billingAddress: {
          street: formData.billingStreet,
          city: formData.billingCity,
          state: formData.billingState,
          country: formData.billingCountry,
          pincode: formData.billingPincode,
          attention: formData.billingAttention,
          phone: formData.billingPhone,
          fax: formData.billingFax,
        },
        shippingAddress: {
          street: formData.shippingStreet,
          city: formData.shippingCity,
          state: formData.shippingState,
          country: formData.shippingCountry,
          pincode: formData.shippingPincode,
          attention: formData.shippingAttention,
          phone: formData.shippingPhone,
          fax: formData.shippingFax,
        },
        contactPersons: contactPersons,
      };

      const response = await fetch(`/api/customers/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        toast({
          title: "Customer Updated",
          description: "The customer has been successfully updated.",
        });
        setLocation("/customers");
      } else {
        throw new Error('Failed to update customer');
      }
    } catch (error) {
      console.error('Failed to update customer:', error);
      toast({
        title: "Error",
        description: "Failed to update customer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-12 text-center">
        <p className="text-slate-500">Loading customer...</p>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="max-w-5xl mx-auto py-12 text-center">
        <p className="text-slate-500">Customer not found</p>
        <Button variant="link" onClick={() => setLocation("/customers")}>
          Back to Customers
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-50 animate-in slide-in-from-right duration-300">
      <div className="flex items-center justify-between p-4 bg-white border-b border-slate-200">
        <h1 className="text-xl font-bold font-display text-slate-900">Edit Customer</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/customers")}
          className="h-8 w-8 hover:bg-slate-100 rounded-full"
          data-testid="button-close-form"
        >
          <X className="h-5 w-5 text-slate-500" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto invisible-scrollbar">
        <div className="max-w-5xl mx-auto p-8 pb-24">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Basic Information</h2>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-12">
                  <div className="md:col-span-12 space-y-6">
                    <div className="space-y-3">
                      <Label>Customer Type</Label>
                      <RadioGroup
                        value={formData.customerType}
                        onValueChange={(val) => setFormData({ ...formData, customerType: val as "business" | "individual" })}
                        className="flex flex-row space-x-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="business" id="business" />
                          <Label htmlFor="business" className="font-normal">Business</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="individual" id="individual" />
                          <Label htmlFor="individual" className="font-normal">Individual</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-1">
                          <Label className="block text-sm font-medium">Primary Contact</Label>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="space-y-2">
                            <Select
                              value={formData.salutation}
                              onValueChange={(val) => setFormData({ ...formData, salutation: val })}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Salutation" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="mr">Mr.</SelectItem>
                                <SelectItem value="mrs">Mrs.</SelectItem>
                                <SelectItem value="ms">Ms.</SelectItem>
                                <SelectItem value="dr">Dr.</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Input
                              placeholder="First Name"
                              value={formData.firstName}
                              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Input
                              placeholder="Last Name"
                              value={formData.lastName}
                              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="companyName">Company Name</Label>
                        <Input
                          id="companyName"
                          value={formData.companyName}
                          onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                          data-testid="input-company-name"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="displayName">Display Name *</Label>
                        <Input
                          id="displayName"
                          value={formData.displayName}
                          onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                          required
                          data-testid="input-display-name"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="language">Language</Label>
                        <Select
                          value={formData.language}
                          onValueChange={(val) => setFormData({ ...formData, language: val })}
                        >
                          <SelectTrigger id="language">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="English">English</SelectItem>
                            <SelectItem value="Hindi">Hindi</SelectItem>
                            <SelectItem value="Spanish">Spanish</SelectItem>
                            <SelectItem value="French">French</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        data-testid="input-email"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="workPhone">Work Phone</Label>
                        <Input
                          id="workPhone"
                          value={formData.workPhone}
                          onChange={(e) => setFormData({ ...formData, workPhone: e.target.value })}
                          data-testid="input-work-phone"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="mobile">Mobile</Label>
                        <Input
                          id="mobile"
                          value={formData.mobile}
                          onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                          data-testid="input-mobile"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mt-8">
              <Tabs defaultValue="tax" className="w-full">
                <div className="border-b border-slate-100 bg-slate-50/50 px-6">
                  <TabsList className="w-full justify-start h-auto bg-transparent p-0 rounded-none gap-8">
                    <TabsTrigger
                      value="tax"
                      className="rounded-none border-b-2 border-transparent px-2 py-3 data-[state=active]:border-sidebar data-[state=active]:text-sidebar data-[state=active]:bg-transparent data-[state=active]:shadow-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent hover:bg-transparent transition-none font-bold font-display text-sm text-slate-500"
                    >
                      Tax Details
                    </TabsTrigger>
                    <TabsTrigger
                      value="address"
                      className="rounded-none border-b-2 border-transparent px-2 py-3 data-[state=active]:border-sidebar data-[state=active]:text-sidebar data-[state=active]:bg-transparent data-[state=active]:shadow-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent hover:bg-transparent transition-none font-bold font-display text-sm text-slate-500"
                    >
                      Address
                    </TabsTrigger>
                    <TabsTrigger
                      value="contact"
                      className="rounded-none border-b-2 border-transparent px-2 py-3 data-[state=active]:border-sidebar data-[state=active]:text-sidebar data-[state=active]:bg-transparent data-[state=active]:shadow-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent hover:bg-transparent transition-none font-bold font-display text-sm text-slate-500"
                    >
                      Contact Persons
                    </TabsTrigger>
                    <TabsTrigger
                      value="documents"
                      className="rounded-none border-b-2 border-transparent px-2 py-3 data-[state=active]:border-sidebar data-[state=active]:text-sidebar data-[state=active]:bg-transparent data-[state=active]:shadow-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent hover:bg-transparent transition-none font-bold font-display text-sm text-slate-500"
                    >
                      Documents
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="p-6">
                  <TabsContent value="tax" className="space-y-6 max-w-4xl mt-0">
                    <div className="space-y-3">
                      <Label>Tax Preference *</Label>
                      <RadioGroup
                        value={formData.taxPreference}
                        onValueChange={(val) => {
                          const newData = { ...formData, taxPreference: val as "taxable" | "tax_exempt" };
                          if (val === "tax_exempt") {
                            newData.gstTreatment = "";
                            newData.gstin = "";
                          } else {
                            newData.exemptionReason = "";
                          }
                          setFormData(newData);
                        }}
                        className="flex flex-row space-x-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="taxable" id="taxable" data-testid="radio-taxable" className="border-sidebar text-sidebar" />
                          <Label htmlFor="taxable" className="font-medium font-display">Taxable</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="tax_exempt" id="tax_exempt" data-testid="radio-tax-exempt" className="border-sidebar text-sidebar" />
                          <Label htmlFor="tax_exempt" className="font-medium font-display">Tax Exempt</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                      {(formData.taxPreference === "taxable" || formData.taxPreference === "tax_exempt") && (
                        <div className="flex flex-col space-y-2">
                          <Label>GST Treatment<span className="text-red-500 ml-0.5">*</span></Label>
                          <Popover open={gstTreatmentOpen} onOpenChange={setGstTreatmentOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={gstTreatmentOpen}
                                className={cn(
                                  "justify-between",
                                  !formData.gstTreatment && "text-muted-foreground"
                                )}
                                data-testid="button-gst-treatment"
                              >
                                {formData.gstTreatment ?
                                  GST_TREATMENTS.find(g => g.value === formData.gstTreatment)?.label || formData.gstTreatment :
                                  "Select a GST treatment"
                                }
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[400px] p-0">
                              <Command>
                                <CommandInput
                                  placeholder="Search GST treatment..."
                                  value={gstTreatmentSearch}
                                  onValueChange={setGstTreatmentSearch}
                                  data-testid="input-gst-treatment-search"
                                />
                                <CommandList className="max-h-[300px]">
                                  <CommandEmpty>No GST treatment found</CommandEmpty>
                                  <CommandGroup>
                                    {GST_TREATMENTS
                                      .filter(treatment =>
                                        treatment.label.toLowerCase().includes(gstTreatmentSearch.toLowerCase()) ||
                                        treatment.description.toLowerCase().includes(gstTreatmentSearch.toLowerCase())
                                      )
                                      .map((treatment) => (
                                        <CommandItem
                                          key={treatment.value}
                                          value={treatment.label}
                                          onSelect={() => {
                                            setFormData({ ...formData, gstTreatment: treatment.value });
                                            setGstTreatmentSearch("");
                                            setGstTreatmentOpen(false);
                                          }}
                                          className="flex flex-col items-start p-3 cursor-pointer"
                                          data-testid={`option-gst-treatment-${treatment.value}`}
                                        >
                                          <div className="flex items-center w-full">
                                            <Check
                                              className={cn(
                                                "mr-2 h-4 w-4",
                                                formData.gstTreatment === treatment.value ? "opacity-100" : "opacity-0"
                                              )}
                                            />
                                            <div className="flex-1">
                                              <div className="font-medium">{treatment.label}</div>
                                              <div className="text-sm text-slate-500 mt-0.5">{treatment.description}</div>
                                            </div>
                                          </div>
                                        </CommandItem>
                                      ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          {formData.gstTreatment && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {GST_TREATMENTS.find(g => g.value === formData.gstTreatment)?.description}
                            </p>
                          )}
                        </div>
                      )}

                      {formData.taxPreference === "tax_exempt" && (
                        <div className="flex flex-col space-y-2">
                          <div className="flex items-center gap-1">
                            <Label>Exemption Reason<span className="text-red-500 ml-0.5">*</span></Label>
                            <Info className="h-3.5 w-3.5 text-slate-400" />
                          </div>
                          <Popover open={exemptionOpen} onOpenChange={setExemptionOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={exemptionOpen}
                                className={cn(
                                  "justify-between",
                                  !formData.exemptionReason && "text-muted-foreground"
                                )}
                                data-testid="button-exemption-reason"
                              >
                                {formData.exemptionReason || "Select or type to add"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[350px] p-0">
                              <Command>
                                <CommandInput
                                  placeholder="Search or type..."
                                  value={exemptionSearch}
                                  onValueChange={setExemptionSearch}
                                  data-testid="input-exemption-search"
                                />
                                <CommandList className="max-h-[200px]">
                                  <CommandEmpty>
                                    {exemptionSearch ? (
                                      <div
                                        className="py-2 px-3 cursor-pointer hover:bg-accent rounded-sm"
                                        onClick={() => {
                                          setFormData({ ...formData, exemptionReason: exemptionSearch.trim() });
                                          setExemptionOpen(false);
                                          setExemptionSearch("");
                                        }}
                                      >
                                        Use "{exemptionSearch.trim()}"
                                      </div>
                                    ) : (
                                      "No exemption reasons found"
                                    )}
                                  </CommandEmpty>
                                  <CommandGroup>
                                    {EXEMPTION_REASONS
                                      .filter(reason => reason.toLowerCase().includes(exemptionSearch.toLowerCase()))
                                      .map((reason) => (
                                        <CommandItem
                                          key={reason}
                                          value={reason}
                                          onSelect={() => {
                                            setFormData({ ...formData, exemptionReason: reason });
                                            setExemptionSearch("");
                                            setExemptionOpen(false);
                                          }}
                                          data-testid={`option-exemption-${reason.replace(/\s+/g, '-').toLowerCase()}`}
                                        >
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              formData.exemptionReason === reason ? "opacity-100" : "opacity-0"
                                            )}
                                          />
                                          {reason}
                                        </CommandItem>
                                      ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>
                      )}

                      <div className="flex flex-col space-y-2">
                        <Label>Place of Supply<span className="text-red-500 ml-0.5">*</span></Label>
                        <Popover open={placeOfSupplyOpen} onOpenChange={setPlaceOfSupplyOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={placeOfSupplyOpen}
                              className={cn(
                                "justify-between",
                                !formData.placeOfSupply && "text-muted-foreground"
                              )}
                              data-testid="button-place-of-supply"
                            >
                              {formData.placeOfSupply
                                ? INDIAN_STATES.find(s => s.code === formData.placeOfSupply)?.name || formData.placeOfSupply
                                : "Please select a place of supply"
                              }
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[350px] p-0">
                            <Command>
                              <CommandInput
                                placeholder="Search state..."
                                value={placeOfSupplySearch}
                                onValueChange={setPlaceOfSupplySearch}
                                data-testid="input-place-of-supply-search"
                              />
                              <CommandList className="max-h-[300px]">
                                <CommandEmpty>No state found</CommandEmpty>
                                <CommandGroup>
                                  {INDIAN_STATES
                                    .filter(state =>
                                      state.name.toLowerCase().includes(placeOfSupplySearch.toLowerCase()) ||
                                      state.code.toLowerCase().includes(placeOfSupplySearch.toLowerCase())
                                    )
                                    .map((state) => (
                                      <CommandItem
                                        key={state.code}
                                        value={`${state.code} ${state.name}`}
                                        onSelect={() => {
                                          setFormData({ ...formData, placeOfSupply: state.code });
                                          setPlaceOfSupplySearch("");
                                          setPlaceOfSupplyOpen(false);
                                        }}
                                        data-testid={`option-state-${state.code}`}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            formData.placeOfSupply === state.code ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                        {state.name}
                                      </CommandItem>
                                    ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:col-span-2">
                        <div className="space-y-2">
                          <div className="flex items-center gap-1">
                            <Label htmlFor="pan">PAN</Label>
                            <Info className="h-3.5 w-3.5 text-slate-400" />
                          </div>
                          <Input
                            id="pan"
                            value={formData.pan}
                            onChange={(e) => {
                              const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                              setFormData({ ...formData, pan: value.substring(0, 10) });
                            }}
                            maxLength={10}
                            placeholder="e.g., ABCDE1234F"
                            data-testid="input-pan"
                          />
                          {formData.pan && !validatePAN(formData.pan).valid && (
                            <p className="text-red-500 text-sm mt-1">{validatePAN(formData.pan).message}</p>
                          )}
                        </div>

                        {formData.taxPreference === "taxable" && (
                          <div className="space-y-2">
                            <Label htmlFor="gstin">GSTIN</Label>
                            <Input
                              id="gstin"
                              value={formData.gstin}
                              onChange={(e) => {
                                const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                                setFormData({ ...formData, gstin: value.substring(0, 15) });
                              }}
                              maxLength={15}
                              placeholder="e.g., 27AAGCA4900Q1ZE"
                              data-testid="input-gstin"
                            />
                            {formData.gstin && !validateGSTIN(formData.gstin).valid && (
                              <p className="text-red-500 text-sm mt-1">{validateGSTIN(formData.gstin).message}</p>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col space-y-2">
                        <Label>Currency</Label>
                        <Popover open={currencyOpen} onOpenChange={setCurrencyOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={currencyOpen}
                              className={cn(
                                "justify-between",
                                !formData.currency && "text-muted-foreground"
                              )}
                              data-testid="button-currency"
                            >
                              {formData.currency ?
                                CURRENCIES.find(c => c.value === formData.currency)?.label || formData.currency :
                                "INR - Indian Rupee"
                              }
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[300px] p-0">
                            <Command>
                              <CommandInput
                                placeholder="Search currency..."
                                value={currencySearch}
                                onValueChange={setCurrencySearch}
                                data-testid="input-currency-search"
                              />
                              <CommandList className="max-h-[200px]">
                                <CommandEmpty>No currency found</CommandEmpty>
                                <CommandGroup>
                                  {CURRENCIES
                                    .filter(currency => currency.label.toLowerCase().includes(currencySearch.toLowerCase()))
                                    .map((currency) => (
                                      <CommandItem
                                        key={currency.value}
                                        value={currency.label}
                                        onSelect={() => {
                                          setFormData({ ...formData, currency: currency.value });
                                          setCurrencySearch("");
                                          setCurrencyOpen(false);
                                        }}
                                        data-testid={`option-currency-${currency.value}`}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            formData.currency === currency.value ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                        {currency.label}
                                      </CommandItem>
                                    ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="flex flex-col space-y-2">
                        <Label>Payment Terms</Label>
                        <Popover open={paymentTermsOpen} onOpenChange={setPaymentTermsOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={paymentTermsOpen}
                              className={cn(
                                "justify-between",
                                !formData.paymentTerms && "text-muted-foreground"
                              )}
                              data-testid="button-payment-terms"
                            >
                              {formData.paymentTerms ?
                                PAYMENT_TERMS_OPTIONS.find(p => p.value === formData.paymentTerms)?.label || formData.paymentTerms :
                                "Due on Receipt"
                              }
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[280px] p-0">
                            <Command>
                              <CommandList>
                                <CommandGroup>
                                  {PAYMENT_TERMS_OPTIONS.map((term) => (
                                    <CommandItem
                                      key={term.value}
                                      value={term.label}
                                      onSelect={() => {
                                        setFormData({ ...formData, paymentTerms: term.value });
                                        setPaymentTermsOpen(false);
                                      }}
                                      data-testid={`option-payment-terms-${term.value}`}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          formData.paymentTerms === term.value ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      {term.label}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="flex flex-col space-y-2">
                        <Label htmlFor="openingBalance">Opening Balance</Label>
                        <div className="flex items-center">
                          <span className="bg-slate-100 border border-r-0 border-slate-300 rounded-l-md px-3 py-2 text-sm text-slate-500">INR</span>
                          <Input
                            id="openingBalance"
                            placeholder="0.00"
                            value={formData.openingBalance}
                            onChange={(e) => setFormData({ ...formData, openingBalance: e.target.value })}
                            className="rounded-l-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* <div className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-4 border border-slate-100 bg-slate-50/50">
                      <Checkbox
                        checked={formData.enablePortal}
                        onCheckedChange={(val) => setFormData({ ...formData, enablePortal: !!val })}
                      />
                       <div className="space-y-1 leading-none">
                        <Label className="cursor-pointer">
                          Allow portal access for this customer
                        </Label>
                        <p className="text-sm text-slate-500">
                          Customer will be able to view invoices and make payments online.
                        </p>
                      </div> 
                    </div> */}

                    <div className="flex flex-col space-y-2 pt-4">
                      <Label htmlFor="remarks">Remarks</Label>
                      <Textarea
                        id="remarks"
                        placeholder="Add any additional notes or remarks about this customer..."
                        value={formData.remarks}
                        onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                        rows={4}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="address" className="space-y-6 max-w-4xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <h3 className="font-medium text-slate-900">Billing Address</h3>
                        <div className="space-y-2">
                          <Label htmlFor="billingStreet">Street</Label>
                          <Textarea
                            id="billingStreet"
                            value={formData.billingStreet}
                            onChange={(e) => setFormData({ ...formData, billingStreet: e.target.value })}
                            data-testid="input-billing-street"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="billingCity">City</Label>
                            <Input
                              id="billingCity"
                              value={formData.billingCity}
                              onChange={(e) => setFormData({ ...formData, billingCity: e.target.value })}
                              data-testid="input-billing-city"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="billingState">State</Label>
                            <Input
                              id="billingState"
                              value={formData.billingState}
                              onChange={(e) => setFormData({ ...formData, billingState: e.target.value })}
                              data-testid="input-billing-state"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="billingPincode">Pincode</Label>
                            <Input
                              id="billingPincode"
                              value={formData.billingPincode}
                              onChange={(e) => setFormData({ ...formData, billingPincode: e.target.value })}
                              data-testid="input-billing-pincode"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="billingCountry">Country</Label>
                            <Input
                              id="billingCountry"
                              value={formData.billingCountry}
                              onChange={(e) => setFormData({ ...formData, billingCountry: e.target.value })}
                              data-testid="input-billing-country"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-slate-900">Shipping Address</h3>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setFormData({
                                ...formData,
                                shippingStreet: formData.billingStreet,
                                shippingCity: formData.billingCity,
                                shippingState: formData.billingState,
                                shippingCountry: formData.billingCountry,
                                shippingPincode: formData.billingPincode,
                              });
                              toast({
                                description: "Billing address copied to shipping address.",
                              });
                            }}
                            className="inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover-elevate active-elevate-2 border border-transparent min-h-8 rounded-md px-3 hover:text-sidebar/80 h-7 text-xs font-medium text-[#60b1f7]"
                            data-testid="button-copy-billing-address"
                          >
                            Copy billing address
                          </Button>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="shippingStreet">Street</Label>
                          <Textarea
                            id="shippingStreet"
                            value={formData.shippingStreet}
                            onChange={(e) => setFormData({ ...formData, shippingStreet: e.target.value })}
                            data-testid="input-shipping-street"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="shippingCity">City</Label>
                            <Input
                              id="shippingCity"
                              value={formData.shippingCity}
                              onChange={(e) => setFormData({ ...formData, shippingCity: e.target.value })}
                              data-testid="input-shipping-city"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="shippingState">State</Label>
                            <Input
                              id="shippingState"
                              value={formData.shippingState}
                              onChange={(e) => setFormData({ ...formData, shippingState: e.target.value })}
                              data-testid="input-shipping-state"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="shippingPincode">Pincode</Label>
                            <Input
                              id="shippingPincode"
                              value={formData.shippingPincode}
                              onChange={(e) => setFormData({ ...formData, shippingPincode: e.target.value })}
                              data-testid="input-shipping-pincode"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="shippingCountry">Country</Label>
                            <Input
                              id="shippingCountry"
                              value={formData.shippingCountry}
                              onChange={(e) => setFormData({ ...formData, shippingCountry: e.target.value })}
                              data-testid="input-shipping-country"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="contact">
                    <Card>
                      <CardContent className="p-0">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Salutation</TableHead>
                              <TableHead>First Name</TableHead>
                              <TableHead>Last Name</TableHead>
                              <TableHead>Email Address</TableHead>
                              <TableHead>Work Phone</TableHead>
                              <TableHead>Mobile</TableHead>
                              <TableHead className="w-10"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {contactPersons.map((person, index) => (
                              <TableRow key={index}>
                                <TableCell>
                                  <Input
                                    value={person.salutation}
                                    onChange={(e) => {
                                      const updated = [...contactPersons];
                                      updated[index].salutation = e.target.value;
                                      setContactPersons(updated);
                                    }}
                                    className="h-8"
                                    placeholder="Mr."
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    value={person.firstName}
                                    onChange={(e) => {
                                      const updated = [...contactPersons];
                                      updated[index].firstName = e.target.value;
                                      setContactPersons(updated);
                                    }}
                                    className="h-8"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    value={person.lastName}
                                    onChange={(e) => {
                                      const updated = [...contactPersons];
                                      updated[index].lastName = e.target.value;
                                      setContactPersons(updated);
                                    }}
                                    className="h-8"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    value={person.email}
                                    onChange={(e) => {
                                      const updated = [...contactPersons];
                                      updated[index].email = e.target.value;
                                      setContactPersons(updated);
                                    }}
                                    className="h-8"
                                    type="email"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    value={person.workPhone}
                                    onChange={(e) => {
                                      const updated = [...contactPersons];
                                      updated[index].workPhone = e.target.value;
                                      setContactPersons(updated);
                                    }}
                                    className="h-8"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    value={person.mobile}
                                    onChange={(e) => {
                                      const updated = [...contactPersons];
                                      updated[index].mobile = e.target.value;
                                      setContactPersons(updated);
                                    }}
                                    className="h-8"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    type="button"
                                    onClick={() => {
                                      const updated = contactPersons.filter((_, i) => i !== index);
                                      setContactPersons(updated);
                                    }}
                                  >
                                    <X className="h-4 w-4 text-slate-400 hover:text-red-500" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                            {contactPersons.length === 0 && (
                              <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                                  No contact persons added.
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-4"
                      onClick={() => {
                        setContactPersons([
                          ...contactPersons,
                          { salutation: "", firstName: "", lastName: "", email: "", workPhone: "", mobile: "" }
                        ]);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" /> Add Contact Person
                    </Button>
                  </TabsContent>

                  <TabsContent value="documents" className="space-y-6 max-w-4xl">
                    <div>
                      <Label className="mb-2 block">Documents</Label>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        multiple
                        className="hidden"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif"
                        data-testid="input-file-upload"
                      />
                      <div
                        className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center hover:bg-slate-50 transition-colors cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                        data-testid="button-upload-area"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <div className="bg-sidebar/5 p-3 rounded-full border border-sidebar/20">
                            <Upload className="h-5 w-5 text-sidebar" />
                          </div>
                          <div className="text-sm text-slate-600 font-display">
                            <span className="text-sidebar font-bold">Upload files</span> or drag and drop
                          </div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-display">Up to 10 files (max 10MB each)</p>
                        </div>
                      </div>

                      {documents.length > 0 && (
                        <div className="mt-4 space-y-2" data-testid="list-uploaded-files">
                          {documents.map((file) => (
                            <div
                              key={file.id}
                              className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
                              data-testid={`file-item-${file.id}`}
                            >
                              <div className="flex items-center gap-3">
                                <FileText className="h-5 w-5 text-slate-400" />
                                <div>
                                  <p className="text-sm font-medium text-slate-700" data-testid={`text-filename-${file.id}`}>{file.name}</p>
                                  <p className="text-xs text-slate-400">{formatFileSize(file.size)}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                {file.data && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => window.open(file.data, '_blank')}
                                    data-testid={`button-view-file-${file.id}`}
                                  >
                                    View
                                  </Button>
                                )}
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeFile(file.id)}
                                  data-testid={`button-remove-file-${file.id}`}
                                >
                                  <Trash2 className="h-4 w-4 text-slate-400" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </div>

            <div className="flex items-center gap-4 pt-6 border-t border-slate-200">
              <Button type="submit" disabled={isSubmitting} className="bg-sidebar hover:bg-sidebar/90 text-white font-bold font-display px-8 shadow-sm" data-testid="button-save-customer">
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setLocation("/customers")} data-testid="button-cancel">
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div >
    </div >
  );
}
