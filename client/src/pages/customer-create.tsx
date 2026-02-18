import { useState, useRef, useMemo, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { ArrowLeft, Upload, X, Info, Plus, MoreHorizontal, FileText, Trash2, Check, ChevronsUpDown, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAppStore } from "@/lib/store";
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

const SALUTATIONS: Record<string, string> = {
  mr: "Mr.",
  mrs: "Mrs.",
  ms: "Ms.",
  dr: "Dr.",
};

const customerSchema = z.object({
  customerType: z.enum(["business", "individual"]),
  salutation: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  companyName: z.string().optional(),
  displayName: z.string().min(1, "Display Name is required"),
  email: z.string().email("Invalid email address").or(z.literal("")),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  workPhone: z.string().optional(),
  mobile: z.string().optional(),
  language: z.string().default("English"),

  gstTreatment: z.string().optional(),
  placeOfSupply: z.string().min(1, "Place of Supply is required"),
  gstin: z.string().optional(),
  pan: z.string().optional(),
  taxPreference: z.enum(["taxable", "tax_exempt"]),
  exemptionReason: z.string().optional(),
  currency: z.string().default("INR"),
  openingBalance: z.string().optional(),
  paymentTerms: z.string().optional(),
  enablePortal: z.boolean().default(false),

  billingAddress: z.object({
    attention: z.string().optional(),
    country: z.string().optional(),
    street1: z.string().optional(),
    street2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional(),
    phone: z.string().optional(),
    fax: z.string().optional(),
  }),
  shippingAddress: z.object({
    attention: z.string().optional(),
    country: z.string().optional(),
    street1: z.string().optional(),
    street2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional(),
    phone: z.string().optional(),
    fax: z.string().optional(),
  }),

  contactPersons: z.array(z.object({
    salutation: z.string().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    email: z.string().email("Invalid email").or(z.literal("")),
    workPhone: z.string().optional(),
    mobile: z.string().optional(),
  })),

  remarks: z.string().optional(),
  tags: z.array(z.string()).optional(),
}).refine((data) => {
  if (data.taxPreference === "taxable" && !data.gstTreatment) {
    return false;
  }
  return true;
}, {
  message: "GST Treatment is required for taxable customers",
  path: ["gstTreatment"],
}).refine((data) => {
  if (data.taxPreference === "tax_exempt" && !data.exemptionReason) {
    return false;
  }
  return true;
}, {
  message: "Exemption Reason is required for tax exempt customers",
  path: ["exemptionReason"],
}).refine((data) => {
  if (data.taxPreference === "taxable" && data.gstin) {
    if (data.gstin.length !== 15) {
      return false;
    }
    const gstinPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstinPattern.test(data.gstin)) {
      return false;
    }
  }
  return true;
}, {
  message: "Invalid GSTIN format. Must be 15 characters (e.g., 27AAGCA4900Q1ZE)",
  path: ["gstin"],
});

type CustomerFormValues = z.infer<typeof customerSchema>;

const defaultValues: CustomerFormValues = {
  customerType: "business",
  displayName: "",
  email: "",
  language: "English",
  gstTreatment: "",
  placeOfSupply: "",
  gstin: "",
  taxPreference: "taxable",
  exemptionReason: "",
  currency: "INR",
  paymentTerms: "due_on_receipt",
  enablePortal: false,
  billingAddress: { street1: "", street2: "", city: "", state: "", country: "", pincode: "" },
  shippingAddress: { street1: "", street2: "", city: "", state: "", country: "", pincode: "" },
  contactPersons: [],
  tags: [],
};

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

function getStateCodeFromGSTIN(gstin: string): string | null {
  if (!gstin || gstin.length < 2) return null;
  return gstin.substring(0, 2);
}

export default function CustomerCreate() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const returnTo = searchParams.get("returnTo");
  const { toast } = useToast();
  const { addCustomer, setPendingCustomerId } = useAppStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [displayNameOpen, setDisplayNameOpen] = useState(false);
  const [displayNameSearch, setDisplayNameSearch] = useState("");
  const [stateOpen, setStateOpen] = useState(false);
  const [stateSearch, setStateSearch] = useState("");
  const [exemptionOpen, setExemptionOpen] = useState(false);
  const [exemptionSearch, setExemptionSearch] = useState("");
  const [gstinWarning, setGstinWarning] = useState<string | null>(null);
  const [gstTreatmentOpen, setGstTreatmentOpen] = useState(false);
  const [gstTreatmentSearch, setGstTreatmentSearch] = useState("");
  const [placeOfSupplyOpen, setPlaceOfSupplyOpen] = useState(false);
  const [placeOfSupplySearch, setPlaceOfSupplySearch] = useState("");
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

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues,
  });

  const { fields: contactFields, append: appendContact, remove: removeContact } = useFieldArray({
    control: form.control,
    name: "contactPersons",
  });

  const watchSalutation = form.watch("salutation");
  const watchFirstName = form.watch("firstName");
  const watchLastName = form.watch("lastName");
  const watchCompanyName = form.watch("companyName");
  const watchTaxPreference = form.watch("taxPreference");


  const watchPlaceOfSupply = form.watch("placeOfSupply");
  const watchGstin = form.watch("gstin");

  const displayNameOptions = useMemo(() => {
    const options: string[] = [];
    const salutationLabel = watchSalutation ? SALUTATIONS[watchSalutation] : "";
    const firstName = watchFirstName?.trim() || "";
    const lastName = watchLastName?.trim() || "";
    const companyName = watchCompanyName?.trim() || "";

    if (salutationLabel && firstName && lastName) {
      options.push(`${salutationLabel} ${firstName} ${lastName}`);
    }
    if (firstName && lastName) {
      options.push(`${firstName} ${lastName}`);
    }
    if (lastName && firstName) {
      options.push(`${lastName}, ${firstName}`);
    }
    if (companyName) {
      options.push(companyName);
    }
    if (firstName && !lastName) {
      if (salutationLabel) {
        options.push(`${salutationLabel} ${firstName}`);
      }
      options.push(firstName);
    }
    if (lastName && !firstName) {
      if (salutationLabel) {
        options.push(`${salutationLabel} ${lastName}`);
      }
      options.push(lastName);
    }

    return Array.from(new Set(options));
  }, [watchSalutation, watchFirstName, watchLastName, watchCompanyName]);

  useEffect(() => {
    if (watchTaxPreference === "tax_exempt") {
      form.setValue("gstTreatment", "");
      form.setValue("gstin", "");
      setGstinWarning(null);
    } else {
      form.setValue("exemptionReason", "");
    }
  }, [watchTaxPreference, form]);

  useEffect(() => {
    if (watchGstin && watchPlaceOfSupply) {
      const gstinStateCode = getStateCodeFromGSTIN(watchGstin);
      if (gstinStateCode && gstinStateCode !== watchPlaceOfSupply) {
        const gstinState = INDIAN_STATES.find(s => s.code === gstinStateCode);
        const selectedState = INDIAN_STATES.find(s => s.code === watchPlaceOfSupply);
        setGstinWarning(
          `GSTIN state code (${gstinStateCode} - ${gstinState?.name || "Unknown"}) does not match Place of Supply (${selectedState?.name || watchPlaceOfSupply})`
        );
      } else {
        setGstinWarning(null);
      }
    } else {
      setGstinWarning(null);
    }
  }, [watchGstin, watchPlaceOfSupply]);

  const filteredStates = useMemo(() => {
    if (!stateSearch) return INDIAN_STATES;
    const searchLower = stateSearch.toLowerCase();
    return INDIAN_STATES.filter(
      state =>
        state.name.toLowerCase().includes(searchLower) ||
        state.code.includes(searchLower)
    );
  }, [stateSearch]);

  const filteredExemptionReasons = useMemo(() => {
    if (!exemptionSearch) return EXEMPTION_REASONS;
    const searchLower = exemptionSearch.toLowerCase();
    return EXEMPTION_REASONS.filter(reason =>
      reason.toLowerCase().includes(searchLower)
    );
  }, [exemptionSearch]);

  const onSubmit = async (data: CustomerFormValues) => {
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 500));

    const gstTreatmentLabels: Record<string, string> = {
      "registered_regular": "Registered Business - Regular",
      "registered_composition": "Registered Business - Composition",
      "unregistered": "Unregistered Business",
      "consumer": "Consumer",
      "overseas": "Overseas",
    };

    const selectedState = INDIAN_STATES.find(s => s.code === data.placeOfSupply);

    const billingAddress = {
      street: [data.billingAddress.street1, data.billingAddress.street2].filter(Boolean).join(", ") || "",
      city: data.billingAddress.city || "",
      state: data.billingAddress.state || "",
      country: data.billingAddress.country || "India",
      pincode: data.billingAddress.pincode || "",
    };

    const shippingAddress = {
      street: [data.shippingAddress.street1, data.shippingAddress.street2].filter(Boolean).join(", ") || "",
      city: data.shippingAddress.city || "",
      state: data.shippingAddress.state || "",
      country: data.shippingAddress.country || "India",
      pincode: data.shippingAddress.pincode || "",
    };

    const customerPayload = {
      name: data.displayName,
      displayName: data.displayName,
      salutation: data.salutation || "",
      firstName: data.firstName || "",
      lastName: data.lastName || "",
      companyName: data.companyName || data.displayName,
      email: data.email || "",
      password: data.password || "", // Include temporary password
      phone: data.workPhone || "",
      workPhone: data.workPhone || "",
      mobile: data.mobile || "",
      language: data.language || "English",
      gstTreatment: data.taxPreference === "taxable"
        ? (gstTreatmentLabels[data.gstTreatment || ""] || data.gstTreatment || "")
        : "",
      gstin: data.taxPreference === "taxable" ? (data.gstin || "") : "",
      receivables: "0.00",
      avatar: data.displayName.slice(0, 2).toUpperCase(),
      pan: data.pan || "",
      customerType: data.customerType,
      status: "active" as const,
      billingAddress,
      shippingAddress,
      currency: data.currency || "INR",
      openingBalance: data.openingBalance || "",
      paymentTerms: data.paymentTerms || "Due on Receipt",
      placeOfSupply: selectedState ? `${selectedState.code} - ${selectedState.name}` : data.placeOfSupply,
      taxPreference: data.taxPreference,
      exemptionReason: data.taxPreference === "tax_exempt" ? (data.exemptionReason || "") : "",
      portalStatus: (data.enablePortal ? "enabled" : "disabled") as "enabled" | "disabled",
      remarks: data.remarks || "",
      tags: data.tags || [],
      contactPersons: data.contactPersons || [],
    };

    try {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(customerPayload),
      });

      if (!response.ok) {
        throw new Error("Failed to create customer");
      }

      const result = await response.json();
      const newCustomer = result.data;

      addCustomer(customerPayload);

      toast({
        title: "Customer Created",
        description: "The customer has been successfully added.",
      });
      setIsSubmitting(false);

      if (returnTo === "invoice") {
        setPendingCustomerId(newCustomer.id);
        setLocation("/invoices/create");
      } else {
        setLocation("/customers");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create customer. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  const handlePrefill = () => {
    toast({
      title: "Fetching GST Details...",
      description: "Connecting to GST portal (Simulation)",
    });
    setTimeout(() => {
      form.setValue("companyName", "Tech Solutions Pvt Ltd");
      form.setValue("displayName", "Tech Solutions");
      form.setValue("gstTreatment", "registered_regular");
      form.setValue("placeOfSupply", "29");
      form.setValue("gstin", "29AAGCA4900Q1ZE");
      toast({
        title: "Details Prefilled",
        description: "Customer details have been populated from GSTIN.",
      });
    }, 1500);
  };

  const copyBillingToShipping = () => {
    const billing = form.getValues("billingAddress");
    form.setValue("shippingAddress", billing);
    toast({
      description: "Billing address copied to shipping address.",
    });
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 h-screen animate-in slide-in-from-right duration-300">
      <div className="flex items-center justify-between p-4 bg-white border-b border-slate-200 shadow-sm z-10 flex-shrink-0">
        <h1 className="text-xl font-bold font-display text-slate-900">New Customer</h1>
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

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                  <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Basic Information</h2>
                </div>
                <div className="p-6 space-y-6">
                  <div className="bg-sidebar/5 border border-sidebar/20 px-4 py-3 rounded-md flex items-center gap-2 text-sm text-sidebar mb-6">
                    <Info className="h-4 w-4" />
                    <span className="font-display font-medium">Prefill Customer details from the GST portal using the Customer's GSTIN.</span>
                    <button type="button" onClick={handlePrefill} className="font-bold hover:underline ml-1 font-display" data-testid="button-prefill-gst">Prefill {">"}</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-12">
                    <div className="md:col-span-12 space-y-6">
                      <FormField
                        control={form.control}
                        name="customerType"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel>Customer Type</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="flex flex-row space-x-4"
                              >
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <FormControl>
                                    <RadioGroupItem value="business" data-testid="radio-customer-business" className="border-sidebar text-sidebar" />
                                  </FormControl>
                                  <FormLabel className="font-medium font-display">Business</FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <FormControl>
                                    <RadioGroupItem value="individual" data-testid="radio-customer-individual" className="border-sidebar text-sidebar" />
                                  </FormControl>
                                  <FormLabel className="font-medium font-display">Individual</FormLabel>
                                </FormItem>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="space-y-4">
                        <div className="space-y-3">
                          <div className="flex items-center gap-1">
                            <Label className="block text-sm font-medium">Primary Contact</Label>
                            <Info className="h-3.5 w-3.5 text-slate-400" />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <FormField
                              control={form.control}
                              name="salutation"
                              render={({ field }) => (
                                <FormItem>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger className="w-full" data-testid="select-salutation">
                                        <SelectValue placeholder="Salutation" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="z-[100]">
                                      <SelectItem value="mr">Mr.</SelectItem>
                                      <SelectItem value="mrs">Mrs.</SelectItem>
                                      <SelectItem value="ms">Ms.</SelectItem>
                                      <SelectItem value="dr">Dr.</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="firstName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input placeholder="First Name" {...field} className="w-full" data-testid="input-first-name" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="lastName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input placeholder="Last Name" {...field} className="w-full" data-testid="input-last-name" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>

                        <FormField
                          control={form.control}
                          name="companyName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Company Name</FormLabel>
                              <FormControl>
                                <Input placeholder="" {...field} data-testid="input-company-name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="displayName"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <div className="flex items-center gap-1">
                                <FormLabel className="text-black after:content-['*'] after:ml-0.5 after:text-red-500">
                                  Display Name
                                </FormLabel>
                                <Info className="h-3.5 w-3.5 text-slate-400" />
                              </div>

                              <Popover open={displayNameOpen} onOpenChange={setDisplayNameOpen}>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      role="combobox"
                                      aria-expanded={displayNameOpen}
                                      className={cn(
                                        "w-full justify-between font-normal",
                                        !field.value && "text-muted-foreground"
                                      )}
                                      data-testid="combobox-display-name"
                                    >
                                      {field.value || "Select or type to add"}
                                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                  <Command>
                                    <CommandInput
                                      placeholder="Select or type to add..."
                                      value={displayNameSearch}
                                      onValueChange={(value) => {
                                        setDisplayNameSearch(value);
                                        field.onChange(value);
                                      }}
                                      data-testid="input-display-name-search"
                                    />
                                    <CommandList>
                                      <CommandEmpty>
                                        {displayNameSearch ? (
                                          <div
                                            className="py-2 px-3 cursor-pointer hover:bg-accent rounded-sm"
                                            onClick={() => {
                                              field.onChange(displayNameSearch.trim());
                                              setDisplayNameOpen(false);
                                            }}
                                          >
                                            Use "{displayNameSearch.trim()}"
                                          </div>
                                        ) : (
                                          "Type a name or enter contact details above"
                                        )}
                                      </CommandEmpty>
                                      {displayNameOptions.length > 0 && (
                                        <CommandGroup heading="Suggested Names">
                                          {displayNameOptions.map((option) => (
                                            <CommandItem
                                              key={option}
                                              value={option}
                                              onSelect={() => {
                                                field.onChange(option);
                                                setDisplayNameSearch("");
                                                setDisplayNameOpen(false);
                                              }}
                                              data-testid={`option-display-name-${option.replace(/\s+/g, '-').toLowerCase()}`}
                                            >
                                              <Check
                                                className={cn(
                                                  "mr-2 h-4 w-4",
                                                  field.value === option ? "opacity-100" : "opacity-0"
                                                )}
                                              />
                                              {option}
                                            </CommandItem>
                                          ))}
                                        </CommandGroup>
                                      )}
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <div className="flex items-center gap-1">
                                <FormLabel>Email Address</FormLabel>
                                <Info className="h-3.5 w-3.5 text-slate-400" />
                              </div>
                              <FormControl>
                                <div className="relative">
                                  <Input placeholder="" {...field} className="pl-9" data-testid="input-email" />
                                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-slate-400">@</span>
                                  </div>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="workPhone"
                            render={({ field }) => (
                              <FormItem>
                                <div className="flex items-center gap-1">
                                  <FormLabel>Phone</FormLabel>
                                  <Info className="h-3.5 w-3.5 text-slate-400" />
                                </div>
                                <FormControl>
                                  <Input placeholder="" {...field} className="w-full" data-testid="input-work-phone" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="mobile"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Mobile</FormLabel>
                                <FormControl>
                                  <Input placeholder="" {...field} className="w-full" data-testid="input-mobile" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-700 font-bold font-display">Temporary Password</FormLabel>
                            <FormControl>
                              <Input 
                                type="password"
                                placeholder="Enter temporary password" 
                                {...field} 
                                className="bg-white border-slate-200 focus:border-blue-400 h-10 font-display"
                              />
                            </FormControl>
                            <FormDescription>The customer will be prompted to change this on first login.</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mt-8">
                <Tabs defaultValue="other_details" className="w-full">
                  <div className="border-b border-slate-100 bg-slate-50/50 px-6">
                    <TabsList className="w-full justify-start h-auto bg-transparent p-0 rounded-none gap-6">
                      <TabsTrigger
                        value="other_details"
                        className="rounded-none border-b-2 border-transparent px-2 py-3 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent hover:bg-transparent transition-none font-medium text-sm text-slate-500"
                      >
                        Other Details
                      </TabsTrigger>
                      <TabsTrigger
                        value="address"
                        className="rounded-none border-b-2 border-transparent px-2 py-3 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent hover:bg-transparent transition-none font-medium text-sm text-slate-500"
                      >
                        Address
                      </TabsTrigger>
                      <TabsTrigger
                        value="contact_persons"
                        className="rounded-none border-b-2 border-transparent px-2 py-3 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent hover:bg-transparent transition-none font-medium text-sm text-slate-500"
                      >
                        Contact Persons
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <div className="p-6">
                    <TabsContent value="other_details" className="space-y-6 max-w-4xl">
                      <FormField
                        control={form.control}
                        name="taxPreference"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel>Tax Preference<span className="text-red-500 ml-0.5">*</span></FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                value={field.value}
                                className="flex flex-row space-x-4"
                              >
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <FormControl>
                                    <RadioGroupItem value="taxable" data-testid="radio-taxable" />
                                  </FormControl>
                                  <FormLabel className="font-normal">Taxable</FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <FormControl>
                                    <RadioGroupItem value="tax_exempt" data-testid="radio-tax-exempt" />
                                  </FormControl>
                                  <FormLabel className="font-normal">Tax Exempt</FormLabel>
                                </FormItem>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                        {watchTaxPreference === "taxable" && (
                          <FormField
                            control={form.control}
                            name="gstTreatment"
                            render={({ field }) => {
                              const selectedGstTreatment = GST_TREATMENTS.find(g => g.value === field.value);
                              const filteredGstTreatments = GST_TREATMENTS.filter(treatment =>
                                treatment.label.toLowerCase().includes(gstTreatmentSearch.toLowerCase()) ||
                                treatment.description.toLowerCase().includes(gstTreatmentSearch.toLowerCase())
                              );

                              return (
                                <FormItem className="flex flex-col">
                                  <FormLabel>GST Treatment<span className="text-red-500 ml-0.5">*</span></FormLabel>
                                  <Popover open={gstTreatmentOpen} onOpenChange={setGstTreatmentOpen}>
                                    <PopoverTrigger asChild>
                                      <FormControl>
                                        <Button
                                          variant="outline"
                                          role="combobox"
                                          aria-expanded={gstTreatmentOpen}
                                          className={cn(
                                            "justify-between",
                                            !field.value && "text-muted-foreground"
                                          )}
                                          data-testid="button-gst-treatment"
                                        >
                                          {selectedGstTreatment ? selectedGstTreatment.label : "Select a GST treatment"}
                                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                      </FormControl>
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
                                            {filteredGstTreatments.map((treatment) => (
                                              <CommandItem
                                                key={treatment.value}
                                                value={treatment.label}
                                                onSelect={() => {
                                                  field.onChange(treatment.value);
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
                                                      field.value === treatment.value ? "opacity-100" : "opacity-0"
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
                                  {field.value && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {selectedGstTreatment?.description}
                                    </p>
                                  )}
                                  <FormMessage />
                                </FormItem>
                              );
                            }}
                          />
                        )}

                        {watchTaxPreference === "tax_exempt" && (
                          <FormField
                            control={form.control}
                            name="exemptionReason"
                            render={({ field }) => (
                              <FormItem className="flex flex-col">
                                <div className="flex items-center gap-1">
                                  <FormLabel>Exemption Reason<span className="text-red-500 ml-0.5">*</span></FormLabel>
                                  <Info className="h-3.5 w-3.5 text-slate-400" />
                                </div>
                                <Popover open={exemptionOpen} onOpenChange={setExemptionOpen}>
                                  <PopoverTrigger asChild>
                                    <FormControl>
                                      <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={exemptionOpen}
                                        className={cn(
                                          "w-full justify-between font-normal",
                                          !field.value && "text-muted-foreground"
                                        )}
                                        data-testid="combobox-exemption-reason"
                                      >
                                        {field.value || "Select or type to add"}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                      </Button>
                                    </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                    <Command>
                                      <CommandInput
                                        placeholder="Search or type..."
                                        value={exemptionSearch}
                                        onValueChange={(value) => {
                                          setExemptionSearch(value);
                                        }}
                                        data-testid="input-exemption-search"
                                      />
                                      <CommandList>
                                        <CommandEmpty>
                                          {exemptionSearch ? (
                                            <div
                                              className="py-2 px-3 cursor-pointer hover:bg-accent rounded-sm"
                                              onClick={() => {
                                                field.onChange(exemptionSearch.trim());
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
                                          {filteredExemptionReasons.map((reason) => (
                                            <CommandItem
                                              key={reason}
                                              value={reason}
                                              onSelect={() => {
                                                field.onChange(reason);
                                                setExemptionSearch("");
                                                setExemptionOpen(false);
                                              }}
                                              data-testid={`option-exemption-${reason.replace(/\s+/g, '-').toLowerCase()}`}
                                            >
                                              <Check
                                                className={cn(
                                                  "mr-2 h-4 w-4",
                                                  field.value === reason ? "opacity-100" : "opacity-0"
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
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}

                        <FormField
                          control={form.control}
                          name="placeOfSupply"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Place of Supply<span className="text-red-500 ml-0.5">*</span></FormLabel>
                              <Popover open={stateOpen} onOpenChange={setStateOpen}>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      role="combobox"
                                      aria-expanded={stateOpen}
                                      className={cn(
                                        "w-full justify-between font-normal",
                                        !field.value && "text-muted-foreground"
                                      )}
                                      data-testid="combobox-place-of-supply"
                                    >
                                      {field.value
                                        ? INDIAN_STATES.find(s => s.code === field.value)?.name || field.value
                                        : "Select State"}
                                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                  <Command>
                                    <CommandInput
                                      placeholder="Search state..."
                                      value={stateSearch}
                                      onValueChange={setStateSearch}
                                      data-testid="input-state-search"
                                    />
                                    <CommandList className="max-h-[300px]">
                                      <CommandEmpty>No state found</CommandEmpty>
                                      <CommandGroup>
                                        {filteredStates.map((state) => (
                                          <CommandItem
                                            key={state.code}
                                            value={`${state.code} ${state.name}`}
                                            onSelect={() => {
                                              field.onChange(state.code);
                                              setStateSearch("");
                                              setStateOpen(false);
                                            }}
                                            data-testid={`option-state-${state.code}`}
                                          >
                                            <Check
                                              className={cn(
                                                "mr-2 h-4 w-4",
                                                field.value === state.code ? "opacity-100" : "opacity-0"
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
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* PAN */}
                          <FormField
                            control={form.control}
                            name="pan"
                            render={({ field }) => (
                              <FormItem>
                                <div className="flex items-center gap-1">
                                  <FormLabel>PAN</FormLabel>
                                  <Info className="h-3.5 w-3.5 text-slate-400" />
                                </div>
                                <FormControl>
                                  <Input
                                    placeholder="e.g., ABCDE1234F"
                                    {...field}
                                    onChange={(e) => {
                                      const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                                      field.onChange(value.substring(0, 10));
                                    }}
                                    maxLength={10}
                                    data-testid="input-pan"
                                  />
                                </FormControl>
                                {field.value && !validatePAN(field.value).valid && (
                                  <p className="text-red-500 text-sm mt-1">{validatePAN(field.value).message}</p>
                                )}
                              </FormItem>
                            )}
                          />

                          {/* GSTIN */}
                          <FormField
                            control={form.control}
                            name="gstin"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-black">
                                  GSTIN
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="e.g., 09ABCDE1234F2Z5"
                                    {...field}
                                    onChange={(e) => {
                                      const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                                      field.onChange(value.substring(0, 15));
                                    }}
                                    maxLength={15}
                                    data-testid="input-gstin"
                                  />
                                </FormControl>
                                {field.value && !validateGSTIN(field.value).valid && (
                                  <p className="text-red-500 text-sm mt-1">{validateGSTIN(field.value).message}</p>
                                )}
                                {gstinWarning && (
                                  <div className="flex items-center gap-1 text-amber-600 text-sm mt-1">
                                    <AlertTriangle className="h-3.5 w-3.5" />
                                    <span>{gstinWarning}</span>
                                  </div>
                                )}
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      {/* Currency and Payment Terms */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="currency"
                          render={({ field }) => {
                            const selectedCurrency = CURRENCIES.find(c => c.value === field.value);
                            const filteredCurrencies = CURRENCIES.filter(currency =>
                              currency.label.toLowerCase().includes(currencySearch.toLowerCase())
                            );

                            return (
                              <FormItem className="flex flex-col">
                                <FormLabel>Currency</FormLabel>
                                <Popover open={currencyOpen} onOpenChange={setCurrencyOpen}>
                                  <PopoverTrigger asChild>
                                    <FormControl>
                                      <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={currencyOpen}
                                        className={cn(
                                          "justify-between",
                                          !field.value && "text-muted-foreground"
                                        )}
                                        data-testid="button-currency"
                                      >
                                        {selectedCurrency ? selectedCurrency.label : "INR - Indian Rupee"}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                      </Button>
                                    </FormControl>
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
                                          {filteredCurrencies.map((currency) => (
                                            <CommandItem
                                              key={currency.value}
                                              value={currency.label}
                                              onSelect={() => {
                                                field.onChange(currency.value);
                                                setCurrencySearch("");
                                                setCurrencyOpen(false);
                                              }}
                                              data-testid={`option-currency-${currency.value}`}
                                            >
                                              <Check
                                                className={cn(
                                                  "mr-2 h-4 w-4",
                                                  field.value === currency.value ? "opacity-100" : "opacity-0"
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
                                <FormMessage />
                              </FormItem>
                            );
                          }}
                        />

                        <FormField
                          control={form.control}
                          name="openingBalance"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Opening Balance</FormLabel>
                              <FormControl>
                                <div className="flex items-center">
                                  <span className="bg-slate-100 border border-r-0 border-slate-300 rounded-l-md px-3 py-2 text-sm text-slate-500">INR</span>
                                  <Input placeholder="0.00" {...field} className="rounded-l-none" data-testid="input-opening-balance" />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="paymentTerms"
                          render={({ field }) => {
                            const selectedPaymentTerm = PAYMENT_TERMS_OPTIONS.find(p => p.value === field.value);

                            return (
                              <FormItem className="flex flex-col">
                                <FormLabel>Payment Terms</FormLabel>
                                <Popover open={paymentTermsOpen} onOpenChange={setPaymentTermsOpen}>
                                  <PopoverTrigger asChild>
                                    <FormControl>
                                      <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={paymentTermsOpen}
                                        className={cn(
                                          "justify-between",
                                          !field.value && "text-muted-foreground"
                                        )}
                                        data-testid="button-payment-terms"
                                      >
                                        {selectedPaymentTerm ? selectedPaymentTerm.label : "Due on Receipt"}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                      </Button>
                                    </FormControl>
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
                                                field.onChange(term.value);
                                                setPaymentTermsOpen(false);
                                              }}
                                              data-testid={`option-payment-terms-${term.value}`}
                                            >
                                              <Check
                                                className={cn(
                                                  "mr-2 h-4 w-4",
                                                  field.value === term.value ? "opacity-100" : "opacity-0"
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
                                <FormMessage />
                              </FormItem>
                            );
                          }}
                        />
                      </div>

                      {/* <FormField
                        control={form.control}
                        name="enablePortal"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-4 border border-slate-100 bg-slate-50/50">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="checkbox-enable-portal"
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>
                                Allow portal access for this customer
                              </FormLabel>
                              <FormDescription>
                                Customer will be able to view invoices and make payments online.
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      /> */}

                      <div className="pt-4">
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
                            <div className="bg-blue-50 p-3 rounded-full">
                              <Upload className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="text-sm text-slate-600">
                              <span className="text-blue-600 font-medium">Upload files</span> or drag and drop
                            </div>
                            <p className="text-xs text-slate-400">Up to 10 files (max 10MB each)</p>
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

                    <TabsContent value="address" className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <h3 className="font-semibold text-sm uppercase tracking-wider text-slate-500 mb-4">Billing Address</h3>

                          <FormField
                            control={form.control}
                            name="billingAddress.attention"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Attention</FormLabel>
                                <FormControl>
                                  <Input {...field} data-testid="input-billing-attention" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="billingAddress.country"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Country / Region</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-billing-country">
                                      <SelectValue placeholder="Select Country" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="India">India</SelectItem>
                                    <SelectItem value="USA">USA</SelectItem>
                                    <SelectItem value="UK">UK</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="space-y-2">
                            <FormField
                              control={form.control}
                              name="billingAddress.street1"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Address</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Street 1" {...field} data-testid="input-billing-street1" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="billingAddress.street2"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input placeholder="Street 2" {...field} data-testid="input-billing-street2" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="billingAddress.city"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>City</FormLabel>
                                  <FormControl>
                                    <Input {...field} data-testid="input-billing-city" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="billingAddress.state"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>State</FormLabel>
                                  <FormControl>
                                    <Input {...field} data-testid="input-billing-state" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="billingAddress.pincode"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Pin Code</FormLabel>
                                  <FormControl>
                                    <Input {...field} data-testid="input-billing-pincode" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="billingAddress.phone"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Phone</FormLabel>
                                  <FormControl>
                                    <Input {...field} data-testid="input-billing-phone" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <FormField
                            control={form.control}
                            name="billingAddress.fax"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Fax</FormLabel>
                                <FormControl>
                                  <Input {...field} data-testid="input-billing-fax" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-sm uppercase tracking-wider text-slate-500">Shipping Address</h3>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={copyBillingToShipping}
                              className="inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover-elevate active-elevate-2 border border-transparent min-h-8 rounded-md px-3 hover:text-sidebar/80 h-7 text-xs font-medium text-[#60b1f7]"
                              data-testid="button-copy-billing-address"
                            >
                              Copy billing address
                            </Button>
                          </div>

                          <FormField
                            control={form.control}
                            name="shippingAddress.attention"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Attention</FormLabel>
                                <FormControl>
                                  <Input {...field} data-testid="input-shipping-attention" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="shippingAddress.country"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Country / Region</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-shipping-country">
                                      <SelectValue placeholder="Select Country" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="India">India</SelectItem>
                                    <SelectItem value="USA">USA</SelectItem>
                                    <SelectItem value="UK">UK</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="space-y-2">
                            <FormField
                              control={form.control}
                              name="shippingAddress.street1"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Address</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Street 1" {...field} data-testid="input-shipping-street1" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="shippingAddress.street2"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input placeholder="Street 2" {...field} data-testid="input-shipping-street2" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="shippingAddress.city"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>City</FormLabel>
                                  <FormControl>
                                    <Input {...field} data-testid="input-shipping-city" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="shippingAddress.state"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>State</FormLabel>
                                  <FormControl>
                                    <Input {...field} data-testid="input-shipping-state" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="shippingAddress.pincode"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Pin Code</FormLabel>
                                  <FormControl>
                                    <Input {...field} data-testid="input-shipping-pincode" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="shippingAddress.phone"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Phone</FormLabel>
                                  <FormControl>
                                    <Input {...field} data-testid="input-shipping-phone" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <FormField
                            control={form.control}
                            name="shippingAddress.fax"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Fax</FormLabel>
                                <FormControl>
                                  <Input {...field} data-testid="input-shipping-fax" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="contact_persons" className="space-y-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-sm uppercase tracking-wider text-slate-500">Contact Persons</h3>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => appendContact({ salutation: "", firstName: "", lastName: "", email: "", workPhone: "", mobile: "" })}
                          data-testid="button-add-contact"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Contact Person
                        </Button>
                      </div>

                      {contactFields.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                          <p>No contact persons added yet.</p>
                          <p className="text-sm mt-1">Click "Add Contact Person" to add one.</p>
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Salutation</TableHead>
                              <TableHead>First Name</TableHead>
                              <TableHead>Last Name</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Work Phone</TableHead>
                              <TableHead>Mobile</TableHead>
                              <TableHead></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {contactFields.map((field, index) => (
                              <TableRow key={field.id} data-testid={`row-contact-${index}`}>
                                <TableCell>
                                  <FormField
                                    control={form.control}
                                    name={`contactPersons.${index}.salutation`}
                                    render={({ field }) => (
                                      <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger className="w-24" data-testid={`select-contact-salutation-${index}`}>
                                          <SelectValue placeholder="--" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="mr">Mr.</SelectItem>
                                          <SelectItem value="mrs">Mrs.</SelectItem>
                                          <SelectItem value="ms">Ms.</SelectItem>
                                          <SelectItem value="dr">Dr.</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    )}
                                  />
                                </TableCell>
                                <TableCell>
                                  <FormField
                                    control={form.control}
                                    name={`contactPersons.${index}.firstName`}
                                    render={({ field }) => (
                                      <Input {...field} className="w-full" data-testid={`input-contact-firstname-${index}`} />
                                    )}
                                  />
                                </TableCell>
                                <TableCell>
                                  <FormField
                                    control={form.control}
                                    name={`contactPersons.${index}.lastName`}
                                    render={({ field }) => (
                                      <Input {...field} className="w-full" data-testid={`input-contact-lastname-${index}`} />
                                    )}
                                  />
                                </TableCell>
                                <TableCell>
                                  <FormField
                                    control={form.control}
                                    name={`contactPersons.${index}.email`}
                                    render={({ field }) => (
                                      <Input {...field} type="email" className="w-full" data-testid={`input-contact-email-${index}`} />
                                    )}
                                  />
                                </TableCell>
                                <TableCell>
                                  <FormField
                                    control={form.control}
                                    name={`contactPersons.${index}.workPhone`}
                                    render={({ field }) => (
                                      <Input {...field} className="w-full" data-testid={`input-contact-workphone-${index}`} />
                                    )}
                                  />
                                </TableCell>
                                <TableCell>
                                  <FormField
                                    control={form.control}
                                    name={`contactPersons.${index}.mobile`}
                                    render={({ field }) => (
                                      <Input {...field} className="w-full" data-testid={`input-contact-mobile-${index}`} />
                                    )}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeContact(index)}
                                    data-testid={`button-remove-contact-${index}`}
                                  >
                                    <Trash2 className="h-4 w-4 text-slate-400" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </TabsContent>
                  </div>
                </Tabs>
              </div>

              <div className="flex items-center gap-3 pt-6 border-t">
                <Button type="submit" disabled={isSubmitting} className="bg-sidebar hover:bg-sidebar/90 text-white font-bold font-display px-8 shadow-sm" data-testid="button-save-customer">
                  {isSubmitting ? "Saving..." : "Save"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setLocation("/customers")} data-testid="button-cancel">
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </div >
      </div >
    </div >
  );
}
