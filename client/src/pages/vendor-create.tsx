import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { Plus, Trash2, HelpCircle, Upload, Link as LinkIcon, Search, Check, X, Paperclip, ChevronDown, Menu } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { AccountSelectDropdown, normalizeAccountValue, getAccountLabel } from "@/components/AccountSelectDropdown";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

const SALUTATIONS = ["Mr.", "Mrs.", "Ms.", "Miss", "Dr."];

const GST_TREATMENTS = [
  { value: "registered-regular", label: "Registered Business - Regular" },
  { value: "registered-composition", label: "Registered Business - Composition" },
  { value: "unregistered", label: "Unregistered Business" },
  { value: "consumer", label: "Consumer" },
  { value: "overseas", label: "Overseas" },
  { value: "sez", label: "Special Economic Zone" },
  { value: "deemed-export", label: "Deemed Export" },
];

const INDIAN_STATES = [
  "[AN] - Andaman and Nicobar Islands",
  "[AP] - Andhra Pradesh",
  "[AR] - Arunachal Pradesh",
  "[AS] - Assam",
  "[BR] - Bihar",
  "[CG] - Chhattisgarh",
  "[CH] - Chandigarh",
  "[DD] - Daman and Diu",
  "[DL] - Delhi",
  "[GA] - Goa",
  "[GJ] - Gujarat",
  "[HP] - Himachal Pradesh",
  "[HR] - Haryana",
  "[JH] - Jharkhand",
  "[JK] - Jammu and Kashmir",
  "[KA] - Karnataka",
  "[KL] - Kerala",
  "[LA] - Ladakh",
  "[LD] - Lakshadweep",
  "[MH] - Maharashtra",
  "[ML] - Meghalaya",
  "[MN] - Manipur",
  "[MP] - Madhya Pradesh",
  "[MZ] - Mizoram",
  "[NL] - Nagaland",
  "[OR] - Odisha",
  "[PB] - Punjab",
  "[PY] - Puducherry",
  "[RJ] - Rajasthan",
  "[SK] - Sikkim",
  "[TN] - Tamil Nadu",
  "[TS] - Telangana",
  "[TR] - Tripura",
  "[UK] - Uttarakhand",
  "[UP] - Uttar Pradesh",
  "[WB] - West Bengal",
];

const PAYMENT_TERMS = [
  "Due on Receipt",
  "Net 15",
  "Net 30",
  "Net 45",
  "Net 60",
  "Due end of the month",
  "Due end of next month",
];

const CURRENCIES = [
  { value: "INR", label: "INR - Indian Rupee" },
  { value: "USD", label: "USD - US Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - British Pound" },
];

const MSME_REGISTRATION_TYPES = [
  { value: "micro", label: "Micro" },
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
];

const TDS_OPTIONS = [
  { value: "none", label: "None", rate: "" },
  { value: "commission-brokerage-2", label: "Commission or Brokerage", rate: "2%" },
  { value: "commission-brokerage-reduced", label: "Commission or Brokerage (Reduced)", rate: "3.75%" },
  { value: "dividend-10", label: "Dividend", rate: "10%" },
  { value: "dividend-reduced", label: "Dividend (Reduced)", rate: "7.5%" },
  { value: "interest-other-10", label: "Other Interest than Securities", rate: "10%" },
  { value: "interest-other-reduced", label: "Other Interest than Securities (Reduced)", rate: "7.5%" },
  { value: "contractors-others-2", label: "Payment of Contractors for Others", rate: "2%" },
  { value: "contractors-others-reduced", label: "Payment of Contractors for Others (Reduced)", rate: "1.5%" },
  { value: "contractors-huf-1", label: "Payment of Contractors HUF/Indiv", rate: "1%" },
  { value: "contractors-huf-reduced", label: "Payment of Contractors HUF/Indiv (Reduced)", rate: "0.75%" },
  { value: "professional-fees-10", label: "Professional Fees", rate: "10%" },
  { value: "professional-fees-reduced", label: "Professional Fees (Reduced)", rate: "7.5%" },
  { value: "rent-land-furniture-10", label: "Rent on Land or Furniture etc", rate: "10%" },
  { value: "rent-land-furniture-reduced", label: "Rent on Land or Furniture etc (Reduced)", rate: "7.5%" },
  { value: "technical-fees-2", label: "Technical Fees", rate: "2%" },
];

const ACCOUNTS = [
  "Cost Of Goods Sold",
  "Cost of Goods Sold",
  "Job Costing",
  "Labor",
  "Materials",
  "Subcontractor",
  "Expense",
  "Advertising And Marketing",
  "Automobile Expense",
  "Bad Debt",
  "Bank Fees and Charges",
  "Consultant Expense",
  "Contract Assets",
  "Credit Card Charges",
  "Depreciation And Amortisation",
  "Depreciation Expense",
  "IT and Internet Expenses",
  "Janitorial Expense",
  "Lodging",
  "Meals and Entertainment",
  "Merchandise",
  "Office Supplies",
  "Other Expenses",
  "Postage",
  "Printing and Stationery",
  "Purchase Discounts",
  "Raw Materials And Consumables",
  "Rent Expense",
  "Repairs and Maintenance",
  "Salaries and Employee Wages",
  "Telephone Expense",
  "Transportation Expense",
  "Travel Expense",
  "Non Current Liability",
  "Construction Loans",
  "Mortgages",
  "Other Current Liability",
  "Employee Reimbursements",
  "GST Payable",
  "Output CGST",
  "Output IGST",
  "Output SGST",
  "Tax Payable",
  "TDS Payable",
  "Fixed Asset",
  "Furniture and Equipment",
  "Other Current Asset",
  "Advance Tax",
  "Employee Advance",
  "Input Tax Credits",
  "Input CGST",
  "Input IGST",
  "Input SGST",
  "Prepaid Expenses",
  "TDS Receivable",
];

interface ContactPerson {
  id: string;
  salutation: string;
  firstName: string;
  lastName: string;
  email: string;
  workPhone: string;
  mobile: string;
}

export default function VendorCreate() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("other-details");
  const [saving, setSaving] = useState(false);
  const [tdsOpen, setTdsOpen] = useState(false);
  const [accountsOpen, setAccountsOpen] = useState(false);
  const [stateOpen, setStateOpen] = useState(false);
  const [showCreateAccountDialog, setShowCreateAccountDialog] = useState(false);
  const [newAccountName, setNewAccountName] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [showAttachmentsDialog, setShowAttachmentsDialog] = useState(false);
  const [newAttachments, setNewAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    salutation: "",
    firstName: "",
    lastName: "",
    companyName: "",
    displayName: "",
    email: "",
    workPhone: "",
    mobile: "",
    gstTreatment: "",
    sourceOfSupply: "",
    pan: "",
    expenseAccount: "",
    msmeRegistered: false,
    msmeRegistrationType: "",
    msmeRegistrationNumber: "",
    currency: "INR",
    openingBalance: "",
    paymentTerms: "Due on Receipt",
    tds: "",
    billingAddress: {
      attention: "",
      countryRegion: "",
      street1: "",
      street2: "",
      city: "",
      state: "",
      pinCode: "",
      phone: "",
      faxNumber: "",
    },
    shippingAddress: {
      attention: "",
      countryRegion: "",
      street1: "",
      street2: "",
      city: "",
      state: "",
      pinCode: "",
      phone: "",
      faxNumber: "",
    },
    bankDetails: {
      accountHolderName: "",
      bankName: "",
      accountNumber: "",
      ifscCode: "",
      swiftCode: "",
      branchName: "",
    },
    isCrm: false,
    isPortalEnabled: false,
    remarks: "",
  });

  const [contactPersons, setContactPersons] = useState<ContactPerson[]>([]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddressChange = (type: 'billingAddress' | 'shippingAddress', field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [type]: { ...prev[type], [field]: value }
    }));
  };

  const handleBankDetailsChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      bankDetails: { ...prev.bankDetails, [field]: value }
    }));
  };

  const copyBillingToShipping = () => {
    setFormData(prev => ({
      ...prev,
      shippingAddress: { ...prev.billingAddress }
    }));
  };

  const addContactPerson = () => {
    setContactPersons(prev => [...prev, {
      id: Date.now().toString(),
      salutation: "",
      firstName: "",
      lastName: "",
      email: "",
      workPhone: "",
      mobile: "",
    }]);
  };

  const updateContactPerson = (id: string, field: string, value: string) => {
    setContactPersons(prev => prev.map(cp =>
      cp.id === id ? { ...cp, [field]: value } : cp
    ));
  };

  const removeContactPerson = (id: string) => {
    setContactPersons(prev => prev.filter(cp => cp.id !== id));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      const totalFiles = uploadedFiles.length + newFiles.length;

      if (totalFiles > 10) {
        toast({ title: "Maximum 10 files allowed", variant: "destructive" });
        return;
      }

      const validFiles = newFiles.filter(file => {
        if (file.size > 10 * 1024 * 1024) {
          toast({ title: `${file.name} exceeds 10MB limit`, variant: "destructive" });
          return false;
        }
        return true;
      });

      setUploadedFiles(prev => [...prev, ...validFiles]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleAttachmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      if (newAttachments.length + newFiles.length > 10) {
        toast({ title: "Maximum 10 files allowed", variant: "destructive" });
        return;
      }
      const validFiles = newFiles.filter(file => {
        if (file.size > 10 * 1024 * 1024) {
          toast({ title: `${file.name} exceeds 10MB limit`, variant: "destructive" });
          return false;
        }
        return true;
      });
      setNewAttachments(prev => [...prev, ...validFiles]);
      if (attachmentInputRef.current) attachmentInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setNewAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreateAccount = () => {
    if (!newAccountName.trim()) {
      toast({ title: "Account name is required", variant: "destructive" });
      return;
    }
    handleInputChange('expenseAccount', newAccountName);
    setShowCreateAccountDialog(false);
    setNewAccountName("");
    toast({ title: "Account created and selected" });
  };

  const handleSave = async () => {
    if (!formData.displayName) {
      toast({ title: "Display Name is required", variant: "destructive" });
      return;
    }

    if (!formData.gstTreatment) {
      toast({ title: "GST Treatment is required", variant: "destructive" });
      return;
    }

    if (!formData.sourceOfSupply) {
      toast({ title: "Source of Supply is required", variant: "destructive" });
      return;
    }

    if (formData.msmeRegistered) {
      if (!formData.msmeRegistrationType) {
        toast({ title: "MSME/Udyam Registration Type is required", variant: "destructive" });
        return;
      }
      if (!formData.msmeRegistrationNumber) {
        toast({ title: "MSME/Udyam Registration Number is required", variant: "destructive" });
        return;
      }
      if (!/^UDYAM-[A-Z]{2}-\d{2}-\d{7}$/.test(formData.msmeRegistrationNumber)) {
        toast({ title: "Invalid MSME/Udyam Registration Number format", variant: "destructive" });
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        contactPersons,
        openingBalance: formData.openingBalance ? parseFloat(formData.openingBalance) : 0,
      };

      const response = await fetch('/api/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast({ title: "Vendor created successfully" });
        setLocation('/vendors');
      } else {
        const error = await response.json();
        toast({ title: error.message || "Failed to create vendor", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Failed to create vendor", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 h-screen">
      <div className="border-b border-slate-200 px-6 py-4">
        <h1 className="text-xl font-bold text-slate-900 font-display">New Vendor</h1>
      </div>

      <div className="flex-1 overflow-y-auto invisible-scrollbar">
        <div className="max-w-4xl mx-auto p-6 space-y-6 pb-24">
          <div className="bg-sidebar/5 border border-sidebar/10 rounded-md px-4 py-3 flex items-center gap-2">
            <LinkIcon className="h-4 w-4 text-sidebar" />
            <span className="text-sm text-sidebar">
              Prefill Vendor details from the GST portal using the Vendor's GSTIN.{" "}
              <a href="#" className="text-sidebar font-semibold hover:underline">Prefill</a>
            </span>
          </div>

          <div className="grid grid-cols-[200px_1fr] gap-6 items-start">
            <Label className="text-sm font-medium text-slate-700 pt-2 flex items-center gap-1">
              Primary Contact
              <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
            </Label>
            <div className="flex gap-3">
              <Select value={formData.salutation} onValueChange={(v) => handleInputChange('salutation', v)}>
                <SelectTrigger className="w-32" data-testid="select-salutation">
                  <SelectValue placeholder="Salutation" />
                </SelectTrigger>
                <SelectContent>
                  {SALUTATIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input
                placeholder="First Name"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                className="flex-1"
                data-testid="input-first-name"
              />
              <Input
                placeholder="Last Name"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                className="flex-1"
                data-testid="input-last-name"
              />
            </div>

            <Label className="text-sm font-medium text-slate-700 pt-2">Company Name</Label>
            <Input
              value={formData.companyName}
              onChange={(e) => handleInputChange('companyName', e.target.value)}
              data-testid="input-company-name"
            />

            <Label className="text-sm font-medium text-slate-700 pt-2 flex items-center gap-1">
              Display Name
              <span className="text-xs text-red-600">*</span>
              <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
            </Label>
            <Select value={formData.displayName} onValueChange={(v) => handleInputChange('displayName', v)}>
              <SelectTrigger data-testid="select-display-name">
                <SelectValue placeholder="Select or type to add" />
              </SelectTrigger>
              <SelectContent>
                {formData.companyName && (
                  <SelectItem value={formData.companyName}>{formData.companyName}</SelectItem>
                )}
                {formData.firstName && formData.lastName && (
                  <SelectItem value={`${formData.firstName} ${formData.lastName}`}>
                    {formData.firstName} {formData.lastName}
                  </SelectItem>
                )}
                {formData.firstName && (
                  <SelectItem value={formData.firstName}>{formData.firstName}</SelectItem>
                )}
              </SelectContent>
            </Select>

            <Label className="text-sm font-medium text-slate-700 pt-2 flex items-center gap-1">
              Email Address
              <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
            </Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              data-testid="input-email"
            />

            <Label className="text-sm font-medium text-slate-700 pt-2 flex items-center gap-1">
              Phone
              <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
            </Label>
            <div className="flex gap-3">
              <Input
                placeholder="Work Phone"
                value={formData.workPhone}
                onChange={(e) => handleInputChange('workPhone', e.target.value)}
                className="flex-1"
                data-testid="input-work-phone"
              />
              <Input
                placeholder="Mobile"
                value={formData.mobile}
                onChange={(e) => handleInputChange('mobile', e.target.value)}
                className="flex-1"
                data-testid="input-mobile"
              />
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
            <TabsList className="h-auto w-full justify-start rounded-none border-b bg-transparent p-0 gap-6">
              <TabsTrigger
                value="other-details"
                className="rounded-none border-b-2 border-transparent px-2 py-3 data-[state=active]:border-sidebar data-[state=active]:text-sidebar data-[state=active]:bg-transparent data-[state=active]:shadow-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent hover:bg-transparent transition-none font-display font-medium"
              >
                Other Details
              </TabsTrigger>
              <TabsTrigger
                value="address"
                className="rounded-none border-b-2 border-transparent px-2 py-3 data-[state=active]:border-sidebar data-[state=active]:text-sidebar data-[state=active]:bg-transparent data-[state=active]:shadow-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent hover:bg-transparent transition-none font-display font-medium"
              >
                Address
              </TabsTrigger>
              <TabsTrigger
                value="contact-persons"
                className="rounded-none border-b-2 border-transparent px-2 py-3 data-[state=active]:border-sidebar data-[state=active]:text-sidebar data-[state=active]:bg-transparent data-[state=active]:shadow-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent hover:bg-transparent transition-none font-display font-medium"
              >
                Contact Persons
              </TabsTrigger>
              <TabsTrigger
                value="bank-details"
                className="rounded-none border-b-2 border-transparent px-2 py-3 data-[state=active]:border-sidebar data-[state=active]:text-sidebar data-[state=active]:bg-transparent data-[state=active]:shadow-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent hover:bg-transparent transition-none font-display font-medium"
              >
                Bank Details
              </TabsTrigger>
              <TabsTrigger
                value="custom-fields"
                className="rounded-none border-b-2 border-transparent px-2 py-3 data-[state=active]:border-sidebar data-[state=active]:text-sidebar data-[state=active]:bg-transparent data-[state=active]:shadow-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent hover:bg-transparent transition-none font-display font-medium"
              >
                Custom Fields
              </TabsTrigger>
              <TabsTrigger
                value="reporting-tags"
                className="rounded-none border-b-2 border-transparent px-2 py-3 data-[state=active]:border-sidebar data-[state=active]:text-sidebar data-[state=active]:bg-transparent data-[state=active]:shadow-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent hover:bg-transparent transition-none font-display font-medium"
              >
                Reporting Tags
              </TabsTrigger>
              <TabsTrigger
                value="remarks"
                className="rounded-none border-b-2 border-transparent px-2 py-3 data-[state=active]:border-sidebar data-[state=active]:text-sidebar data-[state=active]:bg-transparent data-[state=active]:shadow-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent hover:bg-transparent transition-none font-display font-medium"
              >
                Remarks
              </TabsTrigger>
            </TabsList>

            <TabsContent value="other-details" className="mt-6">
              <div className="grid grid-cols-[200px_1fr] gap-6 items-start">
                <Label className="text-sm font-medium text-slate-700 pt-2">
                  Expense Account
                  <span className="text-red-600">*</span>
                </Label>
                <AccountSelectDropdown
                  value={normalizeAccountValue(formData.expenseAccount)}
                  onValueChange={(value) => handleInputChange('expenseAccount', getAccountLabel(value))}
                  placeholder="Search and select account..."
                  testId="select-expense-account"
                />

                <Label className="text-sm font-medium text-slate-700 pt-2">
                  GST Treatment
                  <span className="text-red-600">*</span>
                </Label>
                <Select value={formData.gstTreatment} onValueChange={(v) => handleInputChange('gstTreatment', v)}>
                  <SelectTrigger data-testid="select-gst-treatment">
                    <SelectValue placeholder="Select a GST treatment" />
                  </SelectTrigger>
                  <SelectContent>
                    {GST_TREATMENTS.map(g => (
                      <SelectItem key={g.value} value={g.label}>{g.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Label className="text-sm font-medium text-slate-700 pt-2">
                  Source of Supply
                  <span className="text-red-600">*</span>
                </Label>
                <Popover open={stateOpen} onOpenChange={setStateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={stateOpen}
                      className="w-full justify-between font-normal"
                      data-testid="select-source-of-supply"
                    >
                      {formData.sourceOfSupply || "Select State"}
                      <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0" align="start">
                    <Command shouldFilter={true}>
                      <CommandInput placeholder="Search states..." />
                      <CommandList>
                        <CommandEmpty>No state found.</CommandEmpty>
                        <CommandGroup>
                          {INDIAN_STATES.map((state) => (
                            <CommandItem
                              key={state}
                              value={state}
                              onSelect={() => {
                                handleInputChange('sourceOfSupply', state);
                                setStateOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.sourceOfSupply === state ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {state}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                <Label className="text-sm font-medium text-slate-700 pt-2 flex items-center gap-1">
                  PAN
                  <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
                </Label>
                <Input
                  value={formData.pan}
                  onChange={(e) => handleInputChange('pan', e.target.value.toUpperCase())}
                  maxLength={10}
                  data-testid="input-pan"
                />

                <Label className="text-sm font-medium text-slate-700 pt-2 flex items-center gap-1">
                  MSME Registered?
                  <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
                </Label>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={formData.msmeRegistered}
                    onCheckedChange={(v) => {
                      handleInputChange('msmeRegistered', v);
                      if (!v) {
                        handleInputChange('msmeRegistrationType', '');
                        handleInputChange('msmeRegistrationNumber', '');
                      }
                    }}
                    data-testid="checkbox-msme"
                  />
                  <span className="text-sm text-slate-600">This vendor is MSME registered</span>
                </div>

                <Label className="text-sm font-medium text-slate-700 pt-2">CRM Vendor</Label>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={formData.isCrm}
                    onCheckedChange={(v) => handleInputChange('isCrm', v)}
                  />
                  <span className="text-sm text-slate-600">Mark as CRM Vendor</span>
                </div>

                <Label className="text-sm font-medium text-slate-700 pt-2">Vendor Portal</Label>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={formData.isPortalEnabled}
                    onCheckedChange={(v) => handleInputChange('isPortalEnabled', v)}
                  />
                  <span className="text-sm text-slate-600">Enable Vendor Portal access</span>
                </div>

                {formData.msmeRegistered && (
                  <>
                    <Label className="text-sm font-medium text-slate-700 pt-2 flex items-center gap-1">
                      MSME/Udyam Registration Type
                      <span className="text-xs text-red-600">*</span>
                      <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
                    </Label>
                    <Select
                      value={formData.msmeRegistrationType}
                      onValueChange={(v) => handleInputChange('msmeRegistrationType', v)}
                    >
                      <SelectTrigger data-testid="select-msme-type">
                        <SelectValue placeholder="Select the Registration Type..." />
                      </SelectTrigger>
                      <SelectContent>
                        {MSME_REGISTRATION_TYPES.map(t => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Label className="text-sm font-medium text-slate-700 pt-2 flex items-center gap-1">
                      MSME/Udyam Registration Number
                      <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-xs text-red-600">*</span>
                    </Label>
                    <div>
                      <Input
                        value={formData.msmeRegistrationNumber}
                        onChange={(e) => handleInputChange('msmeRegistrationNumber', e.target.value.toUpperCase())}
                        placeholder="Enter the Registration Number"
                        data-testid="input-msme-number"
                      />
                      {formData.msmeRegistrationNumber && !/^UDYAM-[A-Z]{2}-\d{2}-\d{7}$/.test(formData.msmeRegistrationNumber) && (
                        <p className="text-sm text-red-500 mt-1 flex items-start gap-1">
                          <span className="text-red-500">⚠</span>
                          Enter a valid MSME/Udyam Registration Number. Ensure that the number is in the format UDYAM-XX-00-0000000.
                        </p>
                      )}
                    </div>
                  </>
                )}

                <Label className="text-sm font-medium text-slate-700 pt-2">Currency</Label>
                <Select value={formData.currency} onValueChange={(v) => handleInputChange('currency', v)}>
                  <SelectTrigger data-testid="select-currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Label className="text-sm font-medium text-slate-700 pt-2">Opening Balance</Label>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">INR</span>
                  <Input
                    type="number"
                    value={formData.openingBalance}
                    onChange={(e) => handleInputChange('openingBalance', e.target.value)}
                    className="flex-1"
                    data-testid="input-opening-balance"
                  />
                </div>

                <Label className="text-sm font-medium text-slate-700 pt-2">Payment Terms</Label>
                <Select value={formData.paymentTerms} onValueChange={(v) => handleInputChange('paymentTerms', v)}>
                  <SelectTrigger data-testid="select-payment-terms">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_TERMS.map(p => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Label className="text-sm font-medium text-slate-700 pt-2">TDS</Label>
                <Popover open={tdsOpen} onOpenChange={setTdsOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={tdsOpen}
                      className="w-full justify-between font-normal"
                      data-testid="select-tds"
                    >
                      {formData.tds
                        ? TDS_OPTIONS.find((t) => t.value === formData.tds)?.label +
                        (TDS_OPTIONS.find((t) => t.value === formData.tds)?.rate
                          ? ` - ${TDS_OPTIONS.find((t) => t.value === formData.tds)?.rate}`
                          : '')
                        : "Select a Tax"}
                      <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search TDS type..." />
                      <CommandList>
                        <CommandEmpty>No TDS type found.</CommandEmpty>
                        <CommandGroup>
                          {TDS_OPTIONS.map((tds) => (
                            <CommandItem
                              key={tds.value}
                              value={tds.label}
                              onSelect={() => {
                                handleInputChange('tds', tds.value);
                                setTdsOpen(false);
                              }}
                              className="flex justify-between"
                            >
                              <div className="flex items-center gap-2">
                                <Check
                                  className={`h-4 w-4 ${formData.tds === tds.value ? "opacity-100" : "opacity-0"
                                    }`}
                                />
                                <span>{tds.label}</span>
                              </div>
                              {tds.rate && (
                                <span className="text-slate-500">{tds.rate}</span>
                              )}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                <Label className="text-sm font-medium text-slate-700 pt-2">Documents</Label>
                <div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => fileInputRef.current?.click()}
                      data-testid="button-upload-file"
                      type="button"
                    >
                      <Upload className="h-4 w-4" />
                      Upload File
                    </Button>
                    {uploadedFiles.length > 0 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowAttachmentsDialog(true)}
                        data-testid="button-view-attachments"
                        type="button"
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Paperclip className="h-5 w-5" />
                      </Button>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    hidden
                    onChange={handleFileUpload}
                    accept="*/*"
                  />
                  <p className="text-xs text-slate-500 mt-1">You can upload a maximum of 10 files, 10MB each</p>

                  {uploadedFiles.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm font-medium text-slate-700">Uploaded Files ({uploadedFiles.length}/10)</p>
                      <div className="space-y-2">
                        {uploadedFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between bg-slate-50 p-3 rounded-md border border-slate-200">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-slate-900 truncate">{file.name}</p>
                              <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(2)} KB</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-400 hover:text-red-600 flex-shrink-0"
                              onClick={() => removeFile(index)}
                              data-testid={`button-remove-file-${index}`}
                              type="button"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <a href="#" className="text-blue-600 hover:underline text-sm">Add more details</a>
              </div>
            </TabsContent>

            <TabsContent value="address" className="mt-6">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h3 className="font-semibold text-slate-900 mb-4">Billing Address</h3>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm text-slate-600">Attention</Label>
                      <Input
                        value={formData.billingAddress.attention}
                        onChange={(e) => handleAddressChange('billingAddress', 'attention', e.target.value)}
                        data-testid="input-billing-attention"
                      />
                    </div>
                    <div>
                      <Label className="text-sm text-slate-600">Country/Region</Label>
                      <Select
                        value={formData.billingAddress.countryRegion}
                        onValueChange={(v) => handleAddressChange('billingAddress', 'countryRegion', v)}
                      >
                        <SelectTrigger data-testid="select-billing-country">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="India">India</SelectItem>
                          <SelectItem value="United States">United States</SelectItem>
                          <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm text-slate-600">Address</Label>
                      <Textarea
                        placeholder="Street 1"
                        value={formData.billingAddress.street1}
                        onChange={(e) => handleAddressChange('billingAddress', 'street1', e.target.value)}
                        className="mb-2"
                        data-testid="input-billing-street1"
                      />
                      <Textarea
                        placeholder="Street 2"
                        value={formData.billingAddress.street2}
                        onChange={(e) => handleAddressChange('billingAddress', 'street2', e.target.value)}
                        data-testid="input-billing-street2"
                      />
                    </div>
                    <div>
                      <Label className="text-sm text-slate-600">City</Label>
                      <Input
                        value={formData.billingAddress.city}
                        onChange={(e) => handleAddressChange('billingAddress', 'city', e.target.value)}
                        data-testid="input-billing-city"
                      />
                    </div>
                    <div>
                      <Label className="text-sm text-slate-600">State</Label>
                      <Select
                        value={formData.billingAddress.state}
                        onValueChange={(v) => handleAddressChange('billingAddress', 'state', v)}
                      >
                        <SelectTrigger data-testid="select-billing-state">
                          <SelectValue placeholder="Select or type to add" />
                        </SelectTrigger>
                        <SelectContent>
                          {INDIAN_STATES.map(s => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm text-slate-600">Pin Code</Label>
                      <Input
                        value={formData.billingAddress.pinCode}
                        onChange={(e) => handleAddressChange('billingAddress', 'pinCode', e.target.value)}
                        data-testid="input-billing-pincode"
                      />
                    </div>
                    <div>
                      <Label className="text-sm text-slate-600">Phone</Label>
                      <Input
                        value={formData.billingAddress.phone}
                        onChange={(e) => handleAddressChange('billingAddress', 'phone', e.target.value)}
                        data-testid="input-billing-phone"
                      />
                    </div>
                    <div>
                      <Label className="text-sm text-slate-600">Fax Number</Label>
                      <Input
                        value={formData.billingAddress.faxNumber}
                        onChange={(e) => handleAddressChange('billingAddress', 'faxNumber', e.target.value)}
                        data-testid="input-billing-fax"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-900">Shipping Address</h3>
                    <button
                      type="button"
                      onClick={copyBillingToShipping}
                      className="text-sm text-blue-600 hover:underline"
                      data-testid="button-copy-billing"
                    >
                      Copy billing address
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm text-slate-600">Attention</Label>
                      <Input
                        value={formData.shippingAddress.attention}
                        onChange={(e) => handleAddressChange('shippingAddress', 'attention', e.target.value)}
                        data-testid="input-shipping-attention"
                      />
                    </div>
                    <div>
                      <Label className="text-sm text-slate-600">Country/Region</Label>
                      <Select
                        value={formData.shippingAddress.countryRegion}
                        onValueChange={(v) => handleAddressChange('shippingAddress', 'countryRegion', v)}
                      >
                        <SelectTrigger data-testid="select-shipping-country">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="India">India</SelectItem>
                          <SelectItem value="United States">United States</SelectItem>
                          <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm text-slate-600">Address</Label>
                      <Textarea
                        placeholder="Street 1"
                        value={formData.shippingAddress.street1}
                        onChange={(e) => handleAddressChange('shippingAddress', 'street1', e.target.value)}
                        className="mb-2"
                        data-testid="input-shipping-street1"
                      />
                      <Textarea
                        placeholder="Street 2"
                        value={formData.shippingAddress.street2}
                        onChange={(e) => handleAddressChange('shippingAddress', 'street2', e.target.value)}
                        data-testid="input-shipping-street2"
                      />
                    </div>
                    <div>
                      <Label className="text-sm text-slate-600">City</Label>
                      <Input
                        value={formData.shippingAddress.city}
                        onChange={(e) => handleAddressChange('shippingAddress', 'city', e.target.value)}
                        data-testid="input-shipping-city"
                      />
                    </div>
                    <div>
                      <Label className="text-sm text-slate-600">State</Label>
                      <Select
                        value={formData.shippingAddress.state}
                        onValueChange={(v) => handleAddressChange('shippingAddress', 'state', v)}
                      >
                        <SelectTrigger data-testid="select-shipping-state">
                          <SelectValue placeholder="Select or type to add" />
                        </SelectTrigger>
                        <SelectContent>
                          {INDIAN_STATES.map(s => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm text-slate-600">Pin Code</Label>
                      <Input
                        value={formData.shippingAddress.pinCode}
                        onChange={(e) => handleAddressChange('shippingAddress', 'pinCode', e.target.value)}
                        data-testid="input-shipping-pincode"
                      />
                    </div>
                    <div>
                      <Label className="text-sm text-slate-600">Phone</Label>
                      <Input
                        value={formData.shippingAddress.phone}
                        onChange={(e) => handleAddressChange('shippingAddress', 'phone', e.target.value)}
                        data-testid="input-shipping-phone"
                      />
                    </div>
                    <div>
                      <Label className="text-sm text-slate-600">Fax Number</Label>
                      <Input
                        value={formData.shippingAddress.faxNumber}
                        onChange={(e) => handleAddressChange('shippingAddress', 'faxNumber', e.target.value)}
                        data-testid="input-shipping-fax"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 bg-amber-50 border border-amber-200 rounded-md p-4">
                <p className="text-sm text-amber-800">
                  <strong>Note:</strong>
                </p>
                <ul className="text-sm text-amber-700 list-disc ml-4 mt-1">
                  <li>Add and manage additional addresses from this Customers and Vendors details section.</li>
                  <li>You can customise how customers' addresses are displayed in transaction PDFs. To do this, go to Settings {'>'} Preferences {'>'} Customers and Vendors, and navigate to the Address Format sections.</li>
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="contact-persons" className="mt-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Salutation</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">First Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Last Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Email Address</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Work Phone</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Mobile</th>
                      <th className="px-4 py-3 w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {contactPersons.map((cp, index) => (
                      <tr key={cp.id}>
                        <td className="px-4 py-2">
                          <Select
                            value={cp.salutation}
                            onValueChange={(v) => updateContactPerson(cp.id, 'salutation', v)}
                          >
                            <SelectTrigger className="w-24">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              {SALUTATIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-4 py-2">
                          <Input
                            value={cp.firstName}
                            onChange={(e) => updateContactPerson(cp.id, 'firstName', e.target.value)}
                            data-testid={`input-contact-firstname-${index}`}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <Input
                            value={cp.lastName}
                            onChange={(e) => updateContactPerson(cp.id, 'lastName', e.target.value)}
                            data-testid={`input-contact-lastname-${index}`}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <Input
                            type="email"
                            value={cp.email}
                            onChange={(e) => updateContactPerson(cp.id, 'email', e.target.value)}
                            data-testid={`input-contact-email-${index}`}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <Input
                            value={cp.workPhone}
                            onChange={(e) => updateContactPerson(cp.id, 'workPhone', e.target.value)}
                            data-testid={`input-contact-workphone-${index}`}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <Input
                            value={cp.mobile}
                            onChange={(e) => updateContactPerson(cp.id, 'mobile', e.target.value)}
                            data-testid={`input-contact-mobile-${index}`}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-red-600"
                            onClick={() => removeContactPerson(cp.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {contactPersons.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                          No contact persons added yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <Button
                variant="outline"
                className="mt-4 gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                onClick={addContactPerson}
                data-testid="button-add-contact"
              >
                <Plus className="h-4 w-4" />
                Add Contact Person
              </Button>
            </TabsContent>

            <TabsContent value="bank-details" className="mt-6">
              <div className="max-w-xl space-y-4">
                <div>
                  <Label className="text-sm text-slate-600">Account Holder Name</Label>
                  <Input
                    value={formData.bankDetails.accountHolderName}
                    onChange={(e) => handleBankDetailsChange('accountHolderName', e.target.value)}
                    data-testid="input-account-holder"
                  />
                </div>
                <div>
                  <Label className="text-sm text-slate-600">Bank Name</Label>
                  <Input
                    value={formData.bankDetails.bankName}
                    onChange={(e) => handleBankDetailsChange('bankName', e.target.value)}
                    data-testid="input-bank-name"
                  />
                </div>
                <div>
                  <Label className="text-sm text-slate-600">Account Number</Label>
                  <Input
                    value={formData.bankDetails.accountNumber}
                    onChange={(e) => handleBankDetailsChange('accountNumber', e.target.value)}
                    data-testid="input-account-number"
                  />
                </div>
                <div>
                  <Label className="text-sm text-slate-600">IFSC Code</Label>
                  <Input
                    value={formData.bankDetails.ifscCode}
                    onChange={(e) => handleBankDetailsChange('ifscCode', e.target.value.toUpperCase())}
                    data-testid="input-ifsc"
                  />
                </div>
                <div>
                  <Label className="text-sm text-slate-600">SWIFT Code</Label>
                  <Input
                    value={formData.bankDetails.swiftCode}
                    onChange={(e) => handleBankDetailsChange('swiftCode', e.target.value.toUpperCase())}
                    data-testid="input-swift"
                  />
                </div>
                <div>
                  <Label className="text-sm text-slate-600">Branch Name</Label>
                  <Input
                    value={formData.bankDetails.branchName}
                    onChange={(e) => handleBankDetailsChange('branchName', e.target.value)}
                    data-testid="input-branch"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="custom-fields" className="mt-6">
              <div className="text-center py-12 text-slate-500">
                <p className="text-lg font-medium mb-1">No custom fields configured</p>
                <p className="text-sm text-slate-400">Custom fields can be configured in Settings</p>
              </div>
            </TabsContent>

            <TabsContent value="reporting-tags" className="mt-6">
              <div className="text-center py-12 text-slate-500">
                <p className="text-lg font-medium mb-1">No reporting tags configured</p>
                <p className="text-sm text-slate-400">Reporting tags can be configured in Settings</p>
              </div>
            </TabsContent>

            <TabsContent value="remarks" className="mt-6">
              <div className="max-w-xl">
                <Label className="text-sm text-slate-600 mb-2 block">Remarks (For Internal Use)</Label>
                <Textarea
                  placeholder="Add any internal notes about this vendor..."
                  value={formData.remarks}
                  onChange={(e) => handleInputChange('remarks', e.target.value)}
                  rows={6}
                  data-testid="input-remarks"
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <div className="border-t border-slate-200 px-6 py-4 flex items-center gap-3">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-[#385a6b] text-primary-foreground"
          data-testid="button-save"
        >
          {saving ? 'Saving...' : 'Save'}
        </Button>
        <Button
          variant="outline"
          onClick={() => setLocation('/vendors')}
          data-testid="button-cancel"
        >
          Cancel
        </Button>
      </div>

      <Dialog open={showCreateAccountDialog} onOpenChange={setShowCreateAccountDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Account</DialogTitle>
            <DialogDescription>Enter the name for the new expense account</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Account Name"
              value={newAccountName}
              onChange={(e) => setNewAccountName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateAccount();
                }
              }}
              data-testid="input-new-account"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateAccountDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateAccount} className="bg-[#385a6b] text-primary-foreground">
              Save and Select
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAttachmentsDialog} onOpenChange={setShowAttachmentsDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto scrollbar-hide">
          <DialogHeader>
            <DialogTitle>Manage Documents</DialogTitle>
            <DialogDescription>Upload, view, and manage vendor documents</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Button
                variant="outline"
                className="gap-2 w-full"
                onClick={() => attachmentInputRef.current?.click()}
                type="button"
              >
                <Upload className="h-4 w-4" />
                Upload your Files
              </Button>
              <input
                ref={attachmentInputRef}
                type="file"
                multiple
                hidden
                onChange={handleAttachmentUpload}
                accept="*/*"
              />
              <p className="text-xs text-slate-500 mt-2">Maximum 10 files, 10MB each</p>
            </div>

            {(uploadedFiles.length > 0 || newAttachments.length > 0) && (
              <div className="border-t pt-4">
                <p className="text-sm font-medium text-slate-700 mb-3">
                  Uploaded Files ({(uploadedFiles.length + newAttachments.length)}/10)
                </p>
                <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-hide">
                  {uploadedFiles.map((file, index) => (
                    <div key={`uploaded-${index}`} className="flex items-center justify-between bg-slate-50 p-3 rounded-md border border-slate-200">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-900 truncate">{file.name}</p>
                        <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(2)} KB</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-red-600 flex-shrink-0"
                        onClick={() => removeFile(index)}
                        type="button"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {newAttachments.map((file, index) => (
                    <div key={`new-${index}`} className="flex items-center justify-between bg-blue-50 p-3 rounded-md border border-blue-200">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-900 truncate">{file.name}</p>
                        <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(2)} KB</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-red-600 flex-shrink-0"
                        onClick={() => removeAttachment(index)}
                        type="button"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAttachmentsDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
