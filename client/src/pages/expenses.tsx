
import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  Plus,
  Search,
  MoreHorizontal,
  Receipt,
  Upload,
  Download,
  Settings,
  RefreshCw,
  ChevronDown,
  X,
  Calendar,
  Inbox,
  FileText,
  Tag,
  Car,
  Check,
  ArrowUpDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AccountSelectDropdown, getAccountLabel } from "@/components/AccountSelectDropdown";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { usePagination } from "@/hooks/use-pagination";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import ExpenseDetailPanel from "@/modules/expenses/components/ExpenseDetailPanel";
import { exportToExcel, transformExpenseListForExcel } from "@/lib/excel-utils";
import { TablePagination } from "@/components/table-pagination";

interface Expense {
  id: string;
  expenseNumber: string;
  date: string;
  expenseAccount: string;
  amount: number;
  currency: string;
  paidThrough: string;
  expenseType: string;
  sac: string;
  vendorId: string;
  vendorName: string;
  gstTreatment: string;
  sourceOfSupply: string;
  destinationOfSupply: string;
  reverseCharge: boolean;
  tax: string;
  taxAmount: number;
  amountIs: string;
  invoiceNumber: string;
  notes: string;
  customerId: string;
  customerName: string;
  reportingTags: string[];
  isBillable: boolean;
  status: string;
  attachments: string[];
  createdAt: string;
  updatedAt: string;
}

interface MileageSettings {
  associateEmployeesToExpenses: boolean;
  defaultMileageCategory: string;
  defaultUnit: string;
  mileageRates: Array<{
    id: string;
    startDate: string;
    rate: number;
    currency: string;
  }>;
}

interface Vendor {
  id: string;
  name: string;
  displayName: string;
}

interface Customer {
  id: string;
  name: string;
  displayName: string;
}

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Puducherry", "Chandigarh",
  "Dadra and Nagar Haveli", "Daman and Diu", "Lakshadweep", "Andaman and Nicobar"
];

const EXPENSE_ACCOUNTS = [
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
  "TDS Receivable"
];

const PAID_THROUGH_ACCOUNTS = [
  "Cash",
  "Petty Cash",
  "Undeposited Funds",
  "Other Current Asset",
  "Advance Tax",
  "Employee Advance",
  "Input Tax Credits",
  "Input CGST",
  "Input IGST",
  "Input SGST",
  "Prepaid Expenses",
  "Reverse Charge Tax Input but not due",
  "TDS Receivable",
  "Fixed Asset",
  "Furniture and Equipment",
  "Other Current Liability",
  "Employee Reimbursements",
  "GST Payable",
  "Output CGST",
  "Output IGST",
  "Output SGST",
  "TDS Payable",
  "Non Current Liability",
  "Construction Loans",
  "Mortgages",
  "Equity",
  "Capital Stock",
  "Distributions",
  "Dividends Paid",
  "Drawings",
  "Investments",
  "Opening Balance Offset",
  "Owner's Equity"
];

const TAX_OPTIONS = [
  { value: "gst_5", label: "GST 5%", rate: 5 },
  { value: "gst_12", label: "GST 12%", rate: 12 },
  { value: "gst_18", label: "GST 18%", rate: 18 },
  { value: "gst_28", label: "GST 28%", rate: 28 },
  { value: "igst_5", label: "IGST 5%", rate: 5 },
  { value: "igst_12", label: "IGST 12%", rate: 12 },
  { value: "igst_18", label: "IGST 18%", rate: 18 },
  { value: "igst_28", label: "IGST 28%", rate: 28 },
  { value: "exempt", label: "Exempt", rate: 0 },
  { value: "none", label: "None", rate: 0 },
];

const GST_TREATMENTS = [
  "Registered Business - Regular",
  "Registered Business - Composition",
  "Unregistered Business",
  "Consumer",
  "Overseas",
  "Special Economic Zone",
  "Deemed Export"
];

export default function Expenses() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("all-expenses");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [currentView, setCurrentView] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.csv,.xlsx';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        toast({
          title: "Import Started",
          description: `Importing ${file.name}...`,
        });
      }
    };
    input.click();
  };

  const handleExport = () => {
    toast({
      title: "Exporting...",
      description: "Preparing Excel file for all expenses.",
    });
    const transformedData = transformExpenseListForExcel(filteredExpenses);
    exportToExcel(transformedData, 'Expenses_List', 'Expenses');
  };

  const handleResetColumnWidth = () => {
    toast({
      title: "Success",
      description: "Column widths reset to default.",
    });
  };
  const [showRecordExpense, setShowRecordExpense] = useState(false);
  const [showRecordMileage, setShowRecordMileage] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showMileageSettings, setShowMileageSettings] = useState(false);
  const [expenseTab, setExpenseTab] = useState("record-expense");
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [expenseAccountOpen, setExpenseAccountOpen] = useState(false);
  const [paidThroughOpen, setPaidThroughOpen] = useState(false);
  const [gstTreatmentOpen, setGstTreatmentOpen] = useState(false);
  const [sourceOfSupplyOpen, setSourceOfSupplyOpen] = useState(false);
  const [destinationOfSupplyOpen, setDestinationOfSupplyOpen] = useState(false);
  const [showCreateExpenseAccountDialog, setShowCreateExpenseAccountDialog] = useState(false);
  const [showCreatePaidThroughDialog, setShowCreatePaidThroughDialog] = useState(false);
  const [newExpenseAccountName, setNewExpenseAccountName] = useState("");
  const [newPaidThroughName, setNewPaidThroughName] = useState("");

  const [expenseForm, setExpenseForm] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    expenseAccount: "",
    amount: "",
    currency: "INR",
    paidThrough: "",
    expenseType: "services",
    hsn: "",
    sac: "",
    vendorId: "",
    vendorName: "",
    gstTreatment: "",
    sourceOfSupply: "",
    destinationOfSupply: "[MH] - Maharashtra",
    reverseCharge: false,
    tax: "",
    amountIs: "tax_exclusive",
    invoiceNumber: "",
    notes: "",
    customerId: "",
    customerName: "",
    reportingTags: [] as string[],
    isBillable: false,
    status: "recorded",
  });

  const [mileageForm, setMileageForm] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    employee: "",
    calculationMethod: "distance_travelled",
    distance: "",
    unit: "km",
    startOdometer: "",
    endOdometer: "",
    amount: "",
    currency: "INR",
    paidThrough: "",
    vendorId: "",
    vendorName: "",
    invoiceNumber: "",
    notes: "",
    customerId: "",
    customerName: "",
    reportingTags: [] as string[],
  });

  const [mileageSettingsForm, setMileageSettingsForm] = useState({
    associateEmployeesToExpenses: false,
    defaultMileageCategory: "Fuel/Mileage Expense",
    defaultUnit: "km",
    newRateDate: "",
    newRateValue: "",
  });

  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [mileageUploadedFiles, setMileageUploadedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isMileageDragging, setIsMileageDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mileageFileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((files: FileList | null, isMileage: boolean = false) => {
    if (!files) return;
    const validFiles: File[] = [];
    const maxSize = 10 * 1024 * 1024;

    Array.from(files).forEach(file => {
      if (file.size > maxSize) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds 10MB limit`,
          variant: "destructive"
        });
      } else {
        validFiles.push(file);
      }
    });

    if (validFiles.length > 0) {
      if (isMileage) {
        setMileageUploadedFiles(prev => [...prev, ...validFiles]);
      } else {
        setUploadedFiles(prev => [...prev, ...validFiles]);
      }
      toast({
        title: "Files uploaded",
        description: `${validFiles.length} file(s) added successfully`
      });
    }
  }, [toast]);

  const handleDragOver = useCallback((e: React.DragEvent, isMileage: boolean = false) => {
    e.preventDefault();
    e.stopPropagation();
    if (isMileage) {
      setIsMileageDragging(true);
    } else {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent, isMileage: boolean = false) => {
    e.preventDefault();
    e.stopPropagation();
    if (isMileage) {
      setIsMileageDragging(false);
    } else {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, isMileage: boolean = false) => {
    e.preventDefault();
    e.stopPropagation();
    if (isMileage) {
      setIsMileageDragging(false);
    } else {
      setIsDragging(false);
    }
    handleFileSelect(e.dataTransfer.files, isMileage);
  }, [handleFileSelect]);

  const removeFile = useCallback((index: number, isMileage: boolean = false) => {
    if (isMileage) {
      setMileageUploadedFiles(prev => prev.filter((_, i) => i !== index));
    } else {
      setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    }
  }, []);

  const { data: expensesData, isLoading } = useQuery<{ success: boolean; data: Expense[] }>({
    queryKey: ['/api/expenses'],
  });

  const { data: vendorsData } = useQuery<{ success: boolean; data: Vendor[] }>({
    queryKey: ['/api/vendors'],
  });

  const { data: customersData } = useQuery<{ success: boolean; data: Customer[] }>({
    queryKey: ['/api/customers'],
  });

  const { data: mileageSettingsData } = useQuery<{ success: boolean; data: MileageSettings }>({
    queryKey: ['/api/mileage-settings'],
  });

  // Read vendorId from URL params (when navigating from vendor page)
  const urlParams = new URLSearchParams(window.location.search);
  const vendorIdFromUrl = urlParams.get('vendorId');

  // Pre-fill vendor data when coming from vendor page
  useEffect(() => {
    if (vendorIdFromUrl && vendorsData?.data && vendorsData.data.length > 0 && !expenseForm.vendorId) {
      const vendor = vendorsData.data.find(v => v.id === vendorIdFromUrl);
      if (vendor) {
        setExpenseForm(prev => ({
          ...prev,
          vendorId: vendor.id,
          vendorName: vendor.displayName || vendor.name || ''
        }));
        // Also open the Record Expense dialog
        setShowRecordExpense(true);
        setExpenseTab("record-expense");
      }
    }
  }, [vendorIdFromUrl, vendorsData?.data]);



  const createExpenseMutation = useMutation({
    mutationFn: async (expense: any) => {
      return apiRequest('POST', '/api/expenses', expense);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
      setShowRecordExpense(false);
      resetExpenseForm();
      toast({ title: "Expense recorded successfully" });
    },
    onError: () => {
      toast({ title: "Failed to record expense", variant: "destructive" });
    },
  });

  const createMileageMutation = useMutation({
    mutationFn: async (mileage: any) => {
      return apiRequest('POST', '/api/mileage', mileage);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/mileage'] });
      setShowRecordExpense(false);
      resetMileageForm();
      toast({ title: "Mileage recorded successfully" });
    },
    onError: () => {
      toast({ title: "Failed to record mileage", variant: "destructive" });
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/expenses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
      toast({ title: "Expense deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete expense", variant: "destructive" });
    },
  });

  const updateExpenseMutation = useMutation({
    mutationFn: async ({ id, expense }: { id: string; expense: any }) => {
      return apiRequest('PUT', `/api/expenses/${id}`, expense);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
      setShowRecordExpense(false);
      setIsEditMode(false);
      setEditingExpenseId(null);
      resetExpenseForm();
      toast({ title: "Expense updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update expense", variant: "destructive" });
    },
  });

  const updateMileageSettingsMutation = useMutation({
    mutationFn: async (settings: any) => {
      return apiRequest('PUT', '/api/mileage-settings', settings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/mileage-settings'] });
      toast({ title: "Mileage settings updated" });
    },
  });

  const addMileageRateMutation = useMutation({
    mutationFn: async (rate: any) => {
      return apiRequest('POST', '/api/mileage-settings/rates', rate);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/mileage-settings'] });
      setMileageSettingsForm(prev => ({ ...prev, newRateDate: "", newRateValue: "" }));
      toast({ title: "Mileage rate added" });
    },
  });

  const handleCreateExpenseAccount = () => {
    if (!newExpenseAccountName.trim()) {
      toast({ title: "Account name is required", variant: "destructive" });
      return;
    }
    setExpenseForm(prev => ({ ...prev, expenseAccount: newExpenseAccountName }));
    setShowCreateExpenseAccountDialog(false);
    setNewExpenseAccountName("");
    toast({ title: "Expense account created and selected" });
  };

  const handleCreatePaidThrough = () => {
    if (!newPaidThroughName.trim()) {
      toast({ title: "Account name is required", variant: "destructive" });
      return;
    }
    setExpenseForm(prev => ({ ...prev, paidThrough: newPaidThroughName }));
    setShowCreatePaidThroughDialog(false);
    setNewPaidThroughName("");
    toast({ title: "Paid Through account created and selected" });
  };

  const handleCreateMileagePaidThrough = () => {
    if (!newPaidThroughName.trim()) {
      toast({ title: "Account name is required", variant: "destructive" });
      return;
    }
    setMileageForm(prev => ({ ...prev, paidThrough: newPaidThroughName }));
    setShowCreatePaidThroughDialog(false);
    setNewPaidThroughName("");
    toast({ title: "Paid Through account created and selected" });
  };

  const resetExpenseForm = () => {
    setExpenseForm({
      date: format(new Date(), 'yyyy-MM-dd'),
      expenseAccount: "",
      amount: "",
      currency: "INR",
      paidThrough: "",
      expenseType: "services",
      hsn: "",
      sac: "",
      vendorId: "",
      vendorName: "",
      gstTreatment: "",
      sourceOfSupply: "",
      destinationOfSupply: "[MH] - Maharashtra",
      reverseCharge: false,
      tax: "",
      amountIs: "tax_exclusive",
      invoiceNumber: "",
      notes: "",
      customerId: "",
      customerName: "",
      reportingTags: [],
      isBillable: false,
      status: "recorded",
    });
    setUploadedFiles([]);
  };

  const resetMileageForm = () => {
    setMileageForm({
      date: format(new Date(), 'yyyy-MM-dd'),
      employee: "",
      calculationMethod: "distance_travelled",
      distance: "",
      unit: "km",
      startOdometer: "",
      endOdometer: "",
      amount: "",
      currency: "INR",
      paidThrough: "",
      vendorId: "",
      vendorName: "",
      invoiceNumber: "",
      notes: "",
      customerId: "",
      customerName: "",
      reportingTags: [],
    });
    setMileageUploadedFiles([]);
  };

  const handleSubmitExpense = () => {
    if (!expenseForm.expenseAccount || !expenseForm.amount) {
      toast({ title: "Please fill in required fields", variant: "destructive" });
      return;
    }
    const expenseData = {
      ...expenseForm,
      amount: parseFloat(expenseForm.amount) || 0,
    };

    if (isEditMode && editingExpenseId) {
      updateExpenseMutation.mutate({ id: editingExpenseId, expense: expenseData });
    } else {
      createExpenseMutation.mutate(expenseData);
    }
  };

  const handleCancelRecord = () => {
    setShowRecordExpense(false);
    setIsEditMode(false);
    setEditingExpenseId(null);
    resetExpenseForm();
    resetMileageForm();
  };

  const handleSubmitMileage = () => {
    if (!mileageForm.amount) {
      toast({ title: "Please fill in required fields", variant: "destructive" });
      return;
    }
    createMileageMutation.mutate({
      ...mileageForm,
      distance: parseFloat(mileageForm.distance) || 0,
      amount: parseFloat(mileageForm.amount) || 0,
      startOdometer: parseFloat(mileageForm.startOdometer) || 0,
      endOdometer: parseFloat(mileageForm.endOdometer) || 0,
    });
  };

  const handleSaveAndNew = () => {
    if (expenseTab === "record-expense") {
      if (!expenseForm.expenseAccount || !expenseForm.amount) {
        toast({ title: "Please fill in required fields", variant: "destructive" });
        return;
      }
      createExpenseMutation.mutate({
        ...expenseForm,
        amount: parseFloat(expenseForm.amount) || 0,
      }, {
        onSuccess: () => {
          resetExpenseForm();
        }
      });
    } else {
      if (!mileageForm.amount) {
        toast({ title: "Please fill in required fields", variant: "destructive" });
        return;
      }
      createMileageMutation.mutate({
        ...mileageForm,
        distance: parseFloat(mileageForm.distance) || 0,
        amount: parseFloat(mileageForm.amount) || 0,
        startOdometer: parseFloat(mileageForm.startOdometer) || 0,
        endOdometer: parseFloat(mileageForm.endOdometer) || 0,
      }, {
        onSuccess: () => {
          resetMileageForm();
        }
      });
    }
  };

  const fetchExpenses = async () => {
    queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
  };
  const expenses = expensesData?.data || [];
  const vendors = vendorsData?.data || [];
  const customers = customersData?.data || [];
  const mileageSettings = mileageSettingsData?.data;

  // Deep linking for selected expense
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const expenseId = searchParams.get('id');
    if (expenseId && expenses.length > 0) {
      const expense = expenses.find(e => e.id === expenseId);
      if (expense) {
        setSelectedExpense(expense);
      }
    }
  }, [expenses]);

  const sortedExpenses = [...expenses].sort((a, b) => {
    let aVal: any = a[sortBy as keyof Expense] || "";
    let bVal: any = b[sortBy as keyof Expense] || "";

    if (sortBy === 'amount') {
      aVal = parseFloat(String(aVal)) || 0;
      bVal = parseFloat(String(bVal)) || 0;
    }

    if (sortBy === 'date' || sortBy === 'createdTime' || sortBy === 'createdAt') {
      aVal = new Date(aVal).getTime();
      bVal = new Date(bVal).getTime();
    }

    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();

    if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
    if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const filteredByView = sortedExpenses.filter(expense => {
    if (currentView === "all") return true;
    if (currentView === "unbilled") return expense.isBillable && !expense.invoiceNumber;
    if (currentView === "invoiced") return !!expense.invoiceNumber;
    if (currentView === "reimbursed") return expense.status === "reimbursed";
    if (currentView === "billable") return expense.isBillable;
    if (currentView === "non_billable") return !expense.isBillable;
    if (currentView === "with_receipts") return expense.attachments && expense.attachments.length > 0;
    if (currentView === "without_receipts") return !expense.attachments || expense.attachments.length === 0;
    return true;
  });

  const filteredExpenses = filteredByView.filter(expense =>
    expense.expenseNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    expense.vendorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    expense.expenseAccount?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const { currentPage, totalPages, totalItems, itemsPerPage, paginatedItems, goToPage } = usePagination(filteredExpenses, 10);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const handleExpenseClick = (expense: Expense) => {
    setSelectedExpense(expense);
  };

  const handleClosePanel = () => {
    setSelectedExpense(null);
  };

  const handleEditExpense = () => {
    if (selectedExpense) {
      setExpenseForm({
        date: selectedExpense.date || format(new Date(), 'yyyy-MM-dd'),
        expenseAccount: selectedExpense.expenseAccount || "",
        amount: String(selectedExpense.amount || ""),
        currency: selectedExpense.currency || "INR",
        paidThrough: selectedExpense.paidThrough || "",
        expenseType: selectedExpense.expenseType || "services",
        hsn: (selectedExpense as any).hsn || "",
        sac: selectedExpense.sac || "",
        vendorId: selectedExpense.vendorId || "",
        vendorName: selectedExpense.vendorName || "",
        gstTreatment: selectedExpense.gstTreatment || "",
        sourceOfSupply: selectedExpense.sourceOfSupply || "",
        destinationOfSupply: selectedExpense.destinationOfSupply || "[MH] - Maharashtra",
        reverseCharge: selectedExpense.reverseCharge || false,
        tax: selectedExpense.tax || "",
        amountIs: selectedExpense.amountIs || "tax_exclusive",
        invoiceNumber: selectedExpense.invoiceNumber || "",
        notes: selectedExpense.notes || "",
        customerId: selectedExpense.customerId || "",
        customerName: selectedExpense.customerName || "",
        reportingTags: selectedExpense.reportingTags || [],
        isBillable: selectedExpense.isBillable || false,
        status: selectedExpense.status || "recorded",
      });
      setIsEditMode(true);
      setEditingExpenseId(selectedExpense.id);
      setExpenseTab("record-expense");
      setShowRecordExpense(true);
    }
  };

  const handleDeleteExpense = () => {
    if (selectedExpense) {
      deleteExpenseMutation.mutate(selectedExpense.id);
      setSelectedExpense(null);
    }
  };

  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    const checkCompact = () => {
      setIsCompact(window.innerWidth < 1280);
    };

    checkCompact();
    window.addEventListener('resize', checkCompact);
    return () => window.removeEventListener('resize', checkCompact);
  }, []);

  return (
    <div className="flex h-screen animate-in fade-in duration-300 w-full overflow-hidden bg-slate-50">
      <ResizablePanelGroup key={`${selectedExpense ? "split" : "single"}-${isCompact ? "compact" : "full"}`} direction="horizontal" className="h-full w-full">
        {(!isCompact || !selectedExpense) && (
          <ResizablePanel
            defaultSize={isCompact ? 100 : (selectedExpense ? 33 : 100)}
            minSize={isCompact ? 100 : (selectedExpense ? 33 : 100)}
            maxSize={isCompact ? 100 : (selectedExpense ? 33 : 100)}
            className="flex flex-col overflow-hidden bg-white border-r border-slate-200 min-w-[25%]"
          >
            {/* Left side - Expense List */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              <div className="flex items-center justify-between gap-4 p-4 border-b border-border/60 bg-white sticky top-0 z-10 min-h-[73px] h-auto">
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="text-xl font-semibold text-slate-900 px-2 h-auto gap-2 hover:bg-slate-50">
                        {currentView === "all" ? "All Expenses" :
                          currentView === "unbilled" ? "Unbilled Expenses" :
                            currentView === "invoiced" ? "Invoiced Expenses" :
                              currentView === "reimbursed" ? "Reimbursed Expenses" :
                                currentView === "billable" ? "Billable Expenses" :
                                  currentView === "non_billable" ? "Non-Billable Expenses" :
                                    currentView === "with_receipts" ? "Expenses with Receipts" :
                                      "Expenses without Receipts"}
                        <ChevronDown className="h-5 w-5 text-blue-600" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-64 p-0">
                      <div className="py-2">
                        {[
                          { id: "all", label: "All" },
                          { id: "unbilled", label: "Unbilled" },
                          { id: "invoiced", label: "Invoiced" },
                          { id: "reimbursed", label: "Reimbursed" },
                          { id: "billable", label: "Billable" },
                          { id: "non_billable", label: "Non-Billable" },
                          { id: "with_receipts", label: "With Receipts" },
                          { id: "without_receipts", label: "Without Receipts" },
                        ].map((view) => (
                          <DropdownMenuItem
                            key={view.id}
                            onClick={() => setCurrentView(view.id)}
                            className="flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-slate-50"
                          >
                            <span className={cn(currentView === view.id && "text-blue-600 font-medium")}>{view.label}</span>
                          </DropdownMenuItem>
                        ))}
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex items-center gap-2">
                  {selectedExpense ? (
                    isSearchVisible ? (
                      <div className="relative w-full max-w-[200px] animate-in slide-in-from-right-5 fade-in-0 duration-200">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          autoFocus
                          placeholder="Search..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onBlur={() => !searchQuery && setIsSearchVisible(false)}
                          className="pl-9 h-9"
                        />
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9"
                        onClick={() => setIsSearchVisible(true)}
                      >
                        <Search className="h-4 w-4 text-slate-400" />
                      </Button>
                    )
                  ) : (
                    <div className="relative w-[240px] hidden sm:block">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="Search expenses..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-9"
                        data-testid="input-search-expenses"
                      />
                    </div>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        className={`gap-1 bg-sidebar hover:bg-sidebar/90 h-9 font-display font-bold shadow-sm ${selectedExpense ? 'w-9 px-0 justify-center' : ''}`}
                        data-testid="button-new-expense"
                        size={selectedExpense ? "icon" : "default"}
                      >
                        {selectedExpense ? (
                          <Plus className="h-4 w-4" />
                        ) : (
                          <>New <ChevronDown className="h-4 w-4" /></>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => setShowRecordExpense(true)} className="gap-2 cursor-pointer">
                        <Receipt className="h-4 w-4" />
                        Record Expense
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        setExpenseTab("record-mileage");
                        setShowRecordExpense(true);
                      }} className="gap-2 cursor-pointer">
                        <Car className="h-4 w-4" />
                        Record Mileage
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" className="h-9 w-9" data-testid="button-more-options">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 p-1">
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger className="gap-2">
                          <ArrowUpDown className="h-4 w-4" />
                          <span>Sort by</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                          <DropdownMenuSubContent className="w-48">
                            <DropdownMenuItem onClick={() => handleSort('date')} className={cn(sortBy === 'date' && "bg-blue-50 text-blue-700 font-medium")}>
                              Date {sortBy === 'date' && (sortOrder === "asc" ? "↑" : "↓")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSort('amount')} className={cn(sortBy === 'amount' && "bg-blue-50 text-blue-700 font-medium")}>
                              Amount {sortBy === 'amount' && (sortOrder === "asc" ? "↑" : "↓")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSort('expenseAccount')} className={cn(sortBy === 'expenseAccount' && "bg-blue-50 text-blue-700 font-medium")}>
                              Category {sortBy === 'expenseAccount' && (sortOrder === "asc" ? "↑" : "↓")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSort('createdAt')} className={cn(sortBy === 'createdAt' && "bg-blue-50 text-blue-700 font-medium")}>
                              Created Time {sortBy === 'createdAt' && (sortOrder === "asc" ? "↑" : "↓")}
                            </DropdownMenuItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                      </DropdownMenuSub>
                      <DropdownMenuSeparator />
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger className="gap-2">
                          <Download className="h-4 w-4" />
                          <span>Import</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                          <DropdownMenuSubContent>
                            <DropdownMenuItem onClick={handleImport}>Import Expenses</DropdownMenuItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                      </DropdownMenuSub>
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger className="gap-2">
                          <Download className="h-4 w-4 rotate-180" />
                          <span>Export</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                          <DropdownMenuSubContent>
                            <DropdownMenuItem onClick={handleExport}>Export Expenses</DropdownMenuItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                      </DropdownMenuSub>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="flex-1 overflow-hidden">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                  <TabsContent value="receipts-inbox" className="h-full m-0">
                    <ScrollArea className="h-full">
                      <div className="p-4">
                        <Card className="border-dashed">
                          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                              <Inbox className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2" data-testid="text-receipts-empty">No receipts in inbox</h3>
                            <p className="text-muted-foreground mb-4 max-w-sm">
                              Upload receipts and documents here to automatically extract expense information.
                            </p>
                            <Button className="gap-2" data-testid="button-upload-receipt">
                              <Upload className="h-4 w-4" /> Upload Receipt
                            </Button>
                          </CardContent>
                        </Card>
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="all-expenses" className="flex-1 flex flex-col min-h-0 mt-0 data-[state=inactive]:hidden">
                    <div className="flex-1 overflow-auto scrollbar-hide min-h-0">
                      <div className="p-0">
                        {isLoading ? (
                          <div className="flex items-center justify-center py-16">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sidebar"></div>
                          </div>
                        ) : expenses.length === 0 ? (
                          <div className="p-4">
                            <Card className="border-dashed">
                              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                                <div className="h-24 w-24 rounded-lg bg-slate-100 flex items-center justify-center mb-6">
                                  <Receipt className="h-12 w-12 text-slate-400" />
                                </div>
                                <h2 className="text-xl font-semibold mb-2" data-testid="text-expenses-empty-title">Time To Manage Your Expenses!</h2>
                                <p className="text-muted-foreground mb-6 max-w-md">
                                  Create and manage expenses that are part of your organization's operating costs.
                                </p>
                                <div className="flex flex-col gap-3">
                                  <Button
                                    className="gap-2 bg-sidebar hover:bg-sidebar/90 font-display font-medium shadow-sm"
                                    onClick={() => setShowRecordExpense(true)}
                                    data-testid="button-record-expense-empty"
                                  >
                                    RECORD EXPENSE
                                  </Button>
                                  <Button
                                    variant="link"
                                    className="text-sidebar font-semibold"
                                    onClick={() => setShowImportDialog(true)}
                                    data-testid="button-import-expenses"
                                  >
                                    Import Expenses
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        ) : (
                          <table className="w-full">
                            <thead className="bg-sidebar/5 sticky top-0 z-10 border-b border-slate-100">
                              <tr className="text-left text-[11px] uppercase text-sidebar/70 font-bold tracking-wider font-display">
                                {selectedExpense ? (
                                  <th className="px-4 py-3">All Expenses <ChevronDown className="inline h-3 w-3 ml-1" /></th>
                                ) : (
                                  <>
                                    <th className="p-3 w-10">
                                      <Checkbox data-testid="checkbox-select-all" />
                                    </th>
                                    <th className="p-3">Date</th>
                                    <th className="p-3">Expense Account</th>
                                    <th className="p-3">Vendor Name</th>
                                    <th className="p-3">Paid Through</th>
                                    <th className="p-3">Customer Name</th>
                                    <th className="p-3 text-right">Amount</th>
                                  </>
                                )}
                              </tr>
                            </thead>
                            <tbody>
                              {paginatedItems.map((expense) => (
                                <tr
                                  key={expense.id}
                                  className={`border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer ${selectedExpense?.id === expense.id ? 'bg-sidebar/5' : ''}`}
                                  onClick={() => handleExpenseClick(expense)}
                                  data-testid={`row-expense-${expense.id}`}
                                >
                                  {selectedExpense ? (
                                    <td className="p-3">
                                      <div className="flex items-center justify-between w-full">
                                        <div className="flex items-center gap-3">
                                          <Checkbox
                                            data-testid={`checkbox-expense-${expense.id}`}
                                            onClick={(e) => e.stopPropagation()}
                                            className="rounded-[4px] border-slate-300"
                                          />
                                          <div className="flex flex-col gap-0.5">
                                            <span className="text-[14px] font-semibold text-[#334155] leading-tight">
                                              {expense.expenseAccount}
                                            </span>
                                            <div className="flex items-center gap-1.5 text-[12px] text-slate-500 font-medium">
                                              <span>{expense.date ? format(new Date(expense.date), 'dd/MM/yyyy') : '-'}</span>
                                              <span className="text-slate-300">•</span>
                                              <span>{expense.vendorName || '-'}</span>
                                            </div>
                                          </div>
                                        </div>
                                        <span className="text-[14px] font-semibold text-[#1e293b]">
                                          {formatCurrency(expense.amount)}
                                        </span>
                                      </div>
                                    </td>
                                  ) : (
                                    <>
                                      <td className="p-3" onClick={(e) => e.stopPropagation()}>
                                        <Checkbox data-testid={`checkbox-expense-${expense.id}`} />
                                      </td>
                                      <td className="p-3 text-sm">{expense.date}</td>
                                      <td className="p-3 text-sm font-medium">{expense.expenseAccount}</td>
                                      <td className="p-3 text-sm">{expense.vendorName || '-'}</td>
                                      <td className="p-3 text-sm">{expense.paidThrough || '-'}</td>
                                      <td className="p-3 text-sm">{expense.customerName || '-'}</td>
                                      <td className="p-3 text-sm text-right font-semibold">
                                        {formatCurrency(expense.amount)}
                                      </td>
                                    </>
                                  )}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </div>
                    {filteredExpenses.length > 0 && (
                      <div className="flex-none border-t border-slate-200 bg-white">
                        <TablePagination
                          currentPage={currentPage}
                          totalPages={totalPages}
                          totalItems={totalItems}
                          itemsPerPage={itemsPerPage}
                          onPageChange={goToPage}
                        />
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </ResizablePanel>
        )}

        {selectedExpense && (
          <>
            {!isCompact && (
              <ResizableHandle withHandle className="w-[1px] bg-slate-200 hover:bg-blue-400 transition-colors" />
            )}
            <ResizablePanel defaultSize={isCompact ? 100 : 65} minSize={isCompact ? 100 : 30} className="bg-white">
              <ExpenseDetailPanel
                expense={selectedExpense}
                onClose={handleClosePanel}
                onEdit={handleEditExpense}
                onDelete={handleDeleteExpense}
                onFileSelect={(file) => {
                  toast({
                    title: "Receipt Attached",
                    description: `Successfully attached ${file.name} to expense ${selectedExpense.expenseNumber}`,
                  });
                  // Here you would typically call a mutation to upload the file
                }}
              />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>


      <Dialog open={showRecordExpense} onOpenChange={(open) => {
        setShowRecordExpense(open);
        if (!open) {
          setIsEditMode(false);
          setEditingExpenseId(null);
          resetExpenseForm();
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-hide">
          <DialogHeader>
            <div className="flex items-center justify-between">
              {isEditMode ? (
                <DialogTitle data-testid="dialog-title-edit-expense">Edit Expense</DialogTitle>
              ) : (
                <Tabs value={expenseTab} onValueChange={setExpenseTab}>
                  <TabsList className="bg-transparent border-b w-full justify-start rounded-none h-auto p-0 gap-6">
                    <TabsTrigger
                      value="record-expense"
                      data-testid="tab-record-expense"
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-sidebar data-[state=active]:text-sidebar data-[state=active]:bg-transparent data-[state=active]:shadow-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-2 py-3 bg-transparent hover:bg-transparent transition-none font-display font-medium"
                    >
                      Record Expense
                    </TabsTrigger>
                    <TabsTrigger
                      value="record-mileage"
                      data-testid="tab-record-mileage"
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-sidebar data-[state=active]:text-sidebar data-[state=active]:bg-transparent data-[state=active]:shadow-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-2 py-3 bg-transparent hover:bg-transparent transition-none font-display font-medium"
                    >
                      Record Mileage
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              )}
            </div>
          </DialogHeader>

          {expenseTab === "record-expense" ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-black font-medium">
                      Date
                      <span className="text-red-500 ml-0.5">*</span>
                    </Label>
                    <Input
                      type="date"
                      value={expenseForm.date}
                      onChange={(e) => setExpenseForm(prev => ({ ...prev, date: e.target.value }))}
                      className="h-10 border-slate-300 hover:border-sidebar/60 focus:border-sidebar transition-colors"
                      data-testid="input-expense-date"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-black font-medium">
                      Expense Account
                      <span className="text-red-500 ml-0.5">*</span>
                    </Label>
                    <AccountSelectDropdown
                      value={expenseForm.expenseAccount}
                      onValueChange={(value) => setExpenseForm(prev => ({ ...prev, expenseAccount: value }))}
                      placeholder="Select expense account"
                      triggerClassName="h-10 px-3 border-slate-300 hover:border-sidebar/60 hover:bg-slate-50 transition-colors"
                      testId="select-expense-account"
                    />
                    <button className="text-sidebar hover:text-sidebar/80 text-sm font-medium transition-colors" data-testid="button-itemize">Itemize</button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-black font-medium">
                      Amount
                      <span className="text-red-600">*</span>
                    </Label>
                    <div className="flex gap-2">
                      <Select
                        value={expenseForm.currency}
                        onValueChange={(value) => setExpenseForm(prev => ({ ...prev, currency: value }))}
                      >
                        <SelectTrigger className="w-20" data-testid="select-currency">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="INR">INR</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={expenseForm.amount}
                        onChange={(e) => setExpenseForm(prev => ({ ...prev, amount: e.target.value }))}
                        onWheel={(e) => (e.target as HTMLInputElement).blur()}
                        data-testid="input-expense-amount"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-black font-medium">
                      Paid Through
                      <span className="text-red-600">*</span>
                    </Label>
                    <Popover open={paidThroughOpen} onOpenChange={setPaidThroughOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={paidThroughOpen}
                          className={`w-full justify-between font-normal h-10 px-3 border-slate-300 hover:border-sidebar/60 hover:bg-slate-50 transition-colors ${expenseForm.paidThrough ? 'text-slate-900' : 'text-slate-500'}`}
                          data-testid="select-paid-through"
                        >
                          <span className="truncate">{expenseForm.paidThrough || "Select paid through account"}</span>
                          <ChevronDown className={`ml-2 h-4 w-4 shrink-0 text-slate-400 transition-transform ${paidThroughOpen ? 'rotate-180' : ''}`} />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0 shadow-lg border-slate-200" align="start">
                        <Command className="rounded-lg">
                          <div className="flex items-center border-b px-3 py-2 bg-slate-50">
                            <Search className="mr-2 h-4 w-4 shrink-0 text-slate-400" />
                            <CommandInput placeholder="Search accounts..." className="h-9 border-0 focus:ring-0 bg-transparent" />
                          </div>
                          <CommandList className="max-h-[280px] overflow-hidden">
                            <CommandEmpty className="py-6 text-center text-sm text-slate-500">No account found.</CommandEmpty>
                            <ScrollArea className="h-[230px]" onWheel={(e) => e.stopPropagation()}>
                              <CommandGroup>
                                {PAID_THROUGH_ACCOUNTS.map((account) => (
                                  <CommandItem
                                    key={account}
                                    value={account}
                                    onSelect={() => {
                                      setExpenseForm(prev => ({ ...prev, paidThrough: account }));
                                      setPaidThroughOpen(false);
                                    }}
                                    className="cursor-pointer hover:bg-blue-50 px-3 py-2.5"
                                  >
                                    <Check
                                      className={`mr-2 h-4 w-4 text-blue-600 ${expenseForm.paidThrough === account ? "opacity-100" : "opacity-0"}`}
                                    />
                                    <span className="text-slate-700">{account}</span>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </ScrollArea>
                            <div className="border-t px-3 py-2 bg-slate-50">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start gap-2 text-sidebar hover:text-sidebar/80 hover:bg-sidebar/5"
                                onClick={() => {
                                  setShowCreatePaidThroughDialog(true);
                                  setPaidThroughOpen(false);
                                }}
                                type="button"
                              >
                                <Plus className="h-4 w-4" />
                                Create New Account
                              </Button>
                            </div>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-black font-medium">
                    Expense Type
                    <span className="text-red-500 ml-0.5">*</span>
                  </Label>
                  <RadioGroup
                    value={expenseForm.expenseType}
                    onValueChange={(value) => setExpenseForm(prev => ({ ...prev, expenseType: value }))}
                    className="flex gap-4"
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="goods" id="goods" data-testid="radio-goods" />
                      <Label htmlFor="goods">Goods</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="services" id="services" data-testid="radio-services" />
                      <Label htmlFor="services">Services</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {expenseForm.expenseType === "goods" && (
                    <div className="space-y-2">
                      <Label>HSN Code</Label>
                      <Input
                        value={expenseForm.hsn}
                        onChange={(e) => setExpenseForm(prev => ({ ...prev, hsn: e.target.value }))}
                        data-testid="input-hsn"
                      />
                    </div>
                  )}
                  {expenseForm.expenseType === "services" && (
                    <div className="space-y-2">
                      <Label>SAC Code</Label>
                      <Input
                        value={expenseForm.sac}
                        onChange={(e) => setExpenseForm(prev => ({ ...prev, sac: e.target.value }))}
                        data-testid="input-sac"
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label className="text-black font-medium">Vendor</Label>
                    <Select
                      value={expenseForm.vendorId}
                      onValueChange={(value) => {
                        const vendor = vendors.find(v => v.id === value);
                        setExpenseForm(prev => ({
                          ...prev,
                          vendorId: value,
                          vendorName: vendor?.displayName || vendor?.name || ''
                        }));
                      }}
                    >
                      <SelectTrigger className="w-full h-10 border-slate-300 hover:border-sidebar/60 hover:bg-slate-50 transition-colors" data-testid="select-vendor">
                        <SelectValue placeholder="Select a vendor" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[280px]">
                        {vendors.map(vendor => (
                          <SelectItem key={vendor.id} value={vendor.id} className="cursor-pointer">
                            {vendor.displayName || vendor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-black font-medium">
                      GST Treatment
                      <span className="text-red-500 ml-0.5">*</span>
                    </Label>
                    <Popover open={gstTreatmentOpen} onOpenChange={setGstTreatmentOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={gstTreatmentOpen}
                          className={`w-full justify-between font-normal h-10 px-3 border-slate-300 hover:border-sidebar/60 hover:bg-slate-50 transition-colors ${expenseForm.gstTreatment ? 'text-slate-900' : 'text-slate-500'}`}
                          data-testid="select-gst-treatment"
                        >
                          <span className="truncate">{expenseForm.gstTreatment || "Select GST treatment"}</span>
                          <ChevronDown className={`ml-2 h-4 w-4 shrink-0 text-slate-400 transition-transform ${gstTreatmentOpen ? 'rotate-180' : ''}`} />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0 shadow-lg border-slate-200" align="start">
                        <Command className="rounded-lg">
                          <div className="flex items-center border-b px-3 py-2 bg-slate-50">
                            <Search className="mr-2 h-4 w-4 shrink-0 text-slate-400" />
                            <CommandInput placeholder="Search treatments..." className="h-9 border-0 focus:ring-0 bg-transparent" />
                          </div>
                          <CommandList className="max-h-[280px] overflow-y-auto scrollbar-hide overscroll-contain" style={{ scrollBehavior: 'auto' }} onWheel={(e) => e.stopPropagation()}>
                            <CommandEmpty className="py-6 text-center text-sm text-slate-500">No treatment found.</CommandEmpty>
                            <CommandGroup>
                              {GST_TREATMENTS.map((treatment) => (
                                <CommandItem
                                  key={treatment}
                                  value={treatment}
                                  onSelect={() => {
                                    setExpenseForm(prev => ({ ...prev, gstTreatment: treatment }));
                                    setGstTreatmentOpen(false);
                                  }}
                                  className="cursor-pointer hover:bg-sidebar/5 px-3 py-2.5"
                                >
                                  <Check
                                    className={`mr-2 h-4 w-4 text-sidebar ${expenseForm.gstTreatment === treatment ? "opacity-100" : "opacity-0"}`}
                                  />
                                  <span className="text-slate-700">{treatment}</span>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-black font-medium">
                      Source of Supply
                      <span className="text-red-500 ml-0.5">*</span>
                    </Label>
                    <Popover open={sourceOfSupplyOpen} onOpenChange={setSourceOfSupplyOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={sourceOfSupplyOpen}
                          className={`w-full justify-between font-normal h-10 px-3 border-slate-300 hover:border-sidebar/60 hover:bg-slate-50 transition-colors ${expenseForm.sourceOfSupply ? 'text-slate-900' : 'text-slate-500'}`}
                          data-testid="select-source-supply"
                        >
                          <span className="truncate">{expenseForm.sourceOfSupply || "Select source state"}</span>
                          <ChevronDown className={`ml-2 h-4 w-4 shrink-0 text-slate-400 transition-transform ${sourceOfSupplyOpen ? 'rotate-180' : ''}`} />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0 shadow-lg border-slate-200" align="start">
                        <Command className="rounded-lg">
                          <div className="flex items-center border-b px-3 py-2 bg-slate-50">
                            <Search className="mr-2 h-4 w-4 shrink-0 text-slate-400" />
                            <CommandInput placeholder="Search states..." className="h-9 border-0 focus:ring-0 bg-transparent" />
                          </div>
                          <CommandList className="max-h-[280px] overflow-y-auto scrollbar-hide overscroll-contain" style={{ scrollBehavior: 'auto' }} onWheel={(e) => e.stopPropagation()}>
                            <CommandEmpty className="py-6 text-center text-sm text-slate-500">No state found.</CommandEmpty>
                            <CommandGroup>
                              {INDIAN_STATES.map((state) => (
                                <CommandItem
                                  key={state}
                                  value={state}
                                  onSelect={() => {
                                    setExpenseForm(prev => ({ ...prev, sourceOfSupply: state }));
                                    setSourceOfSupplyOpen(false);
                                  }}
                                  className="cursor-pointer hover:bg-sidebar/5 px-3 py-2.5"
                                >
                                  <Check
                                    className={`mr-2 h-4 w-4 text-sidebar ${expenseForm.sourceOfSupply === state ? "opacity-100" : "opacity-0"}`}
                                  />
                                  <span className="text-slate-700">{state}</span>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-black font-medium">
                      Destination of Supply
                      <span className="text-red-500 ml-0.5">*</span>
                    </Label>
                    <Popover open={destinationOfSupplyOpen} onOpenChange={setDestinationOfSupplyOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={destinationOfSupplyOpen}
                          className={`w-full justify-between font-normal h-10 px-3 border-slate-300 hover:border-sidebar/60 hover:bg-slate-50 transition-colors ${expenseForm.destinationOfSupply ? 'text-slate-900' : 'text-slate-500'}`}
                          data-testid="select-destination-supply"
                        >
                          <span className="truncate">{expenseForm.destinationOfSupply || "Select destination state"}</span>
                          <ChevronDown className={`ml-2 h-4 w-4 shrink-0 text-slate-400 transition-transform ${destinationOfSupplyOpen ? 'rotate-180' : ''}`} />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0 shadow-lg border-slate-200" align="start">
                        <Command className="rounded-lg">
                          <div className="flex items-center border-b px-3 py-2 bg-slate-50">
                            <Search className="mr-2 h-4 w-4 shrink-0 text-slate-400" />
                            <CommandInput placeholder="Search states..." className="h-9 border-0 focus:ring-0 bg-transparent" />
                          </div>
                          <CommandList className="max-h-[280px] overflow-y-auto scrollbar-hide overscroll-contain" style={{ scrollBehavior: 'auto' }} onWheel={(e) => e.stopPropagation()}>
                            <CommandEmpty className="py-6 text-center text-sm text-slate-500">No state found.</CommandEmpty>
                            <CommandGroup>
                              {INDIAN_STATES.map((state) => (
                                <CommandItem
                                  key={state}
                                  value={`[${state.substring(0, 2).toUpperCase()}] - ${state}`}
                                  onSelect={() => {
                                    setExpenseForm(prev => ({ ...prev, destinationOfSupply: `[${state.substring(0, 2).toUpperCase()}] - ${state}` }));
                                    setDestinationOfSupplyOpen(false);
                                  }}
                                  className="cursor-pointer hover:bg-sidebar/5 px-3 py-2.5"
                                >
                                  <Check
                                    className={`mr-2 h-4 w-4 text-sidebar ${expenseForm.destinationOfSupply === `[${state.substring(0, 2).toUpperCase()}] - ${state}` ? "opacity-100" : "opacity-0"}`}
                                  />
                                  <span className="text-slate-700">[{state.substring(0, 2).toUpperCase()}] - {state}</span>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label>Reverse Charge</Label>
                    <div className="flex items-center gap-2 h-10">
                      <Checkbox
                        checked={expenseForm.reverseCharge}
                        onCheckedChange={(checked) => setExpenseForm(prev => ({
                          ...prev,
                          reverseCharge: checked as boolean
                        }))}
                        data-testid="checkbox-reverse-charge"
                      />
                      <span className="text-sm text-muted-foreground">
                        This transaction is applicable for reverse charge
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tax</Label>
                    <Select
                      value={expenseForm.tax}
                      onValueChange={(value) => setExpenseForm(prev => ({ ...prev, tax: value }))}
                    >
                      <SelectTrigger data-testid="select-tax">
                        <SelectValue placeholder="Select a Tax" />
                      </SelectTrigger>
                      <SelectContent>
                        {TAX_OPTIONS.map(tax => (
                          <SelectItem key={tax.value} value={tax.value}>{tax.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {expenseForm.reverseCharge && (
                    <div className="space-y-2">
                      <Label className="text-black font-medium">Amount Is</Label>
                      <RadioGroup
                        value={expenseForm.amountIs}
                        onValueChange={(value) => setExpenseForm(prev => ({ ...prev, amountIs: value }))}
                        className="flex gap-4"
                      >
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="tax_inclusive" id="tax_inclusive" data-testid="radio-tax-inclusive" />
                          <Label htmlFor="tax_inclusive">Tax Inclusive</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="tax_exclusive" id="tax_exclusive" data-testid="radio-tax-exclusive" />
                          <Label htmlFor="tax_exclusive">Tax Exclusive</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-black font-medium">Invoice#
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={expenseForm.invoiceNumber}
                      onChange={(e) => setExpenseForm(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                      data-testid="input-invoice-number"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    placeholder="Max. 500 characters"
                    value={expenseForm.notes}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, notes: e.target.value }))}
                    maxLength={500}
                    data-testid="textarea-notes"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-black font-medium">Customer Name</Label>
                    <Select
                      value={expenseForm.customerId}
                      onValueChange={(value) => {
                        const customer = customers.find(c => c.id === value);
                        setExpenseForm(prev => ({
                          ...prev,
                          customerId: value,
                          customerName: customer?.displayName || customer?.name || ''
                        }));
                      }}
                    >
                      <SelectTrigger className="w-full h-10 border-slate-300 hover:border-sidebar/60 hover:bg-slate-50 transition-colors" data-testid="select-customer">
                        <SelectValue placeholder="Select or add a customer" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[280px]">
                        {customers.map(customer => (
                          <SelectItem key={customer.id} value={customer.id} className="cursor-pointer">
                            {customer.displayName || customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2 pt-8">
                    <Checkbox
                      id="isBillable"
                      checked={expenseForm.isBillable}
                      onCheckedChange={(checked) => setExpenseForm(prev => ({ ...prev, isBillable: !!checked }))}
                    />
                    <Label htmlFor="isBillable" className="cursor-pointer font-medium">Billable</Label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-black font-medium text-sm">Status</Label>
                    <Select
                      value={expenseForm.status}
                      onValueChange={(value) => setExpenseForm(prev => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger className="h-10 border-slate-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="recorded">Recorded</SelectItem>
                        <SelectItem value="reimbursed">Reimbursed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Reporting Tags</Label>
                    <button className="text-sidebar text-sm flex items-center gap-1" data-testid="button-associate-tags">
                      <Tag className="h-4 w-4" /> Associate Tags
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={(e) => handleFileSelect(e.target.files, false)}
                  data-testid="input-file-upload"
                />
                <div
                  className={cn(
                    "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                    isDragging ? "border-sidebar bg-sidebar/5" : "border-slate-300 hover:border-sidebar/50"
                  )}
                  onDragOver={(e) => handleDragOver(e, false)}
                  onDragLeave={(e) => handleDragLeave(e, false)}
                  onDrop={(e) => handleDrop(e, false)}
                  onClick={() => fileInputRef.current?.click()}
                  data-testid="dropzone-expense"
                >
                  <div className="h-16 w-16 mx-auto mb-4 bg-slate-100 rounded-lg flex items-center justify-center">
                    <Upload className="h-8 w-8 text-slate-400" />
                  </div>
                  <p className="font-medium mb-1">Drag or Drop your Receipts</p>
                  <p className="text-xs text-muted-foreground mb-4">Maximum file size allowed is 10MB</p>
                  <Button
                    variant="outline"
                    className="gap-2"
                    data-testid="button-upload-files"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                  >
                    <Upload className="h-4 w-4" /> Upload your Files
                  </Button>
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-black font-medium">Uploaded Files ({uploadedFiles.length})</Label>
                    <div className="space-y-2">
                      {uploadedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border"
                          data-testid={`file-item-${index}`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="h-4 w-4 text-slate-500 flex-shrink-0" />
                            <span className="text-sm truncate">{file.name}</span>
                            <span className="text-xs text-muted-foreground flex-shrink-0">
                              ({(file.size / 1024).toFixed(1)} KB)
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 flex-shrink-0"
                            onClick={() => removeFile(index, false)}
                            data-testid={`button-remove-file-${index}`}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-black font-medium">Date
                      <span className="text-red-500 ml-0.5">*</span>
                    </Label>
                    <Input
                      type="date"
                      value={mileageForm.date}
                      onChange={(e) => setMileageForm(prev => ({ ...prev, date: e.target.value }))}
                      data-testid="input-mileage-date"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-black font-medium">Employee</Label>
                    <Input
                      value={mileageForm.employee}
                      onChange={(e) => setMileageForm(prev => ({ ...prev, employee: e.target.value }))}
                      data-testid="input-employee"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-indigo-600">Calculate mileage using*</Label>
                  <RadioGroup
                    value={mileageForm.calculationMethod}
                    onValueChange={(value) => setMileageForm(prev => ({ ...prev, calculationMethod: value }))}
                    className="flex gap-4"
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="distance_travelled" id="distance_travelled" data-testid="radio-distance" />
                      <Label htmlFor="distance_travelled">Distance travelled</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="odometer_reading" id="odometer_reading" data-testid="radio-odometer" />
                      <Label htmlFor="odometer_reading">Odometer reading</Label>
                    </div>
                  </RadioGroup>
                </div>

                {mileageForm.calculationMethod === "distance_travelled" ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-black font-medium">Distance
                        <span className="text-red-500 ml-0.5">*</span>
                      </Label>
                      <Input
                        type="number"
                        value={mileageForm.distance}
                        onChange={(e) => setMileageForm(prev => ({ ...prev, distance: e.target.value }))}
                        onWheel={(e) => (e.target as HTMLInputElement).blur()}
                        data-testid="input-distance"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-black font-medium">Unit</Label>
                      <RadioGroup
                        value={mileageForm.unit}
                        onValueChange={(value) => setMileageForm(prev => ({ ...prev, unit: value }))}
                        className="flex gap-4 h-10 items-center"
                      >
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="km" id="km" data-testid="radio-km" />
                          <Label htmlFor="km">Km</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="mile" id="mile" data-testid="radio-mile" />
                          <Label htmlFor="mile">Mile</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-black font-medium">Start Odometer <span className="text-red-500">*</span></Label>
                      <Input
                        type="number"
                        value={mileageForm.startOdometer}
                        onChange={(e) => setMileageForm(prev => ({ ...prev, startOdometer: e.target.value }))}
                        onWheel={(e) => (e.target as HTMLInputElement).blur()}
                        data-testid="input-start-odometer"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-black font-medium">End Odometer <span className="text-red-500">*</span></Label>
                      <Input
                        type="number"
                        value={mileageForm.endOdometer}
                        onChange={(e) => setMileageForm(prev => ({ ...prev, endOdometer: e.target.value }))}
                        onWheel={(e) => (e.target as HTMLInputElement).blur()}
                        data-testid="input-end-odometer"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-black font-medium">
                      Amount
                      <span className="text-red-600">*</span>
                    </Label>
                    <div className="flex gap-2">
                      <Select
                        value={mileageForm.currency}
                        onValueChange={(value) => setMileageForm(prev => ({ ...prev, currency: value }))}
                      >
                        <SelectTrigger className="w-20" data-testid="select-mileage-currency">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="INR">INR</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={mileageForm.amount}
                        onChange={(e) => setMileageForm(prev => ({ ...prev, amount: e.target.value }))}
                        onWheel={(e) => (e.target as HTMLInputElement).blur()}
                        data-testid="input-mileage-amount"
                      />
                    </div>
                    <button
                      className="text-sidebar text-sm flex items-center gap-1"
                      onClick={() => setShowMileageSettings(true)}
                      data-testid="button-add-mileage-rate"
                    >
                      <Plus className="h-3 w-3" /> Add Mileage Rate
                    </button>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-black font-medium">
                      Paid Through
                      <span className="text-red-600">*</span>
                    </Label>
                    <Popover open={paidThroughOpen} onOpenChange={setPaidThroughOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={paidThroughOpen}
                          className="w-full justify-between font-normal"
                          data-testid="select-mileage-paid-through"
                        >
                          {mileageForm.paidThrough || "Search and select account..."}
                          <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search accounts..." />
                          <CommandList className="max-h-[280px] overflow-hidden">
                            <CommandEmpty className="py-6 text-center text-sm text-slate-500">No account found.</CommandEmpty>
                            <ScrollArea className="h-[230px]" onWheel={(e) => e.stopPropagation()}>
                              <CommandGroup>
                                {PAID_THROUGH_ACCOUNTS.map((account) => (
                                  <CommandItem
                                    key={account}
                                    value={account}
                                    onSelect={() => {
                                      setMileageForm(prev => ({ ...prev, paidThrough: account }));
                                      setPaidThroughOpen(false);
                                    }}
                                    className="cursor-pointer hover:bg-blue-50 px-3 py-2.5"
                                  >
                                    <Check
                                      className={`mr-2 h-4 w-4 ${mileageForm.paidThrough === account ? "opacity-100" : "opacity-0"
                                        }`}
                                    />
                                    <span className="text-slate-700">{account}</span>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </ScrollArea>
                            <div className="border-t px-2 py-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full justify-start gap-2"
                                onClick={() => {
                                  setShowCreatePaidThroughDialog(true);
                                  setPaidThroughOpen(false);
                                }}
                                type="button"
                              >
                                <Plus className="h-4 w-4" />
                                Create New Account
                              </Button>
                            </div>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-black font-medium">Vendor</Label>
                    <Select
                      value={mileageForm.vendorId}
                      onValueChange={(value) => {
                        const vendor = vendors.find(v => v.id === value);
                        setMileageForm(prev => ({
                          ...prev,
                          vendorId: value,
                          vendorName: vendor?.displayName || vendor?.name || ''
                        }));
                      }}
                    >
                      <SelectTrigger data-testid="select-mileage-vendor">
                        <SelectValue placeholder="Select a vendor" />
                      </SelectTrigger>
                      <SelectContent>
                        {vendors.map(vendor => (
                          <SelectItem key={vendor.id} value={vendor.id}>
                            {vendor.displayName || vendor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-black font-medium">Invoice#</Label>
                    <Input
                      value={mileageForm.invoiceNumber}
                      onChange={(e) => setMileageForm(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                      data-testid="input-mileage-invoice"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    placeholder="Max. 500 characters"
                    value={mileageForm.notes}
                    onChange={(e) => setMileageForm(prev => ({ ...prev, notes: e.target.value }))}
                    maxLength={500}
                    data-testid="textarea-mileage-notes"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-black font-medium">Customer Name</Label>
                  <div className="flex gap-2">
                    <Select
                      value={mileageForm.customerId}
                      onValueChange={(value) => {
                        const customer = customers.find(c => c.id === value);
                        setMileageForm(prev => ({
                          ...prev,
                          customerId: value,
                          customerName: customer?.displayName || customer?.name || ''
                        }));
                      }}
                    >
                      <SelectTrigger className="flex-1" data-testid="select-mileage-customer">
                        <SelectValue placeholder="Select or add a customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map(customer => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.displayName || customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon" data-testid="button-add-mileage-customer">
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-black font-medium">Reporting Tags</Label>
                  <button className="text-sidebar text-sm flex items-center gap-1" data-testid="button-mileage-associate-tags">
                    <Tag className="h-4 w-4" /> Associate Tags
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <input
                  type="file"
                  ref={mileageFileInputRef}
                  className="hidden"
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={(e) => handleFileSelect(e.target.files, true)}
                  data-testid="input-mileage-file-upload"
                />
                <div
                  className={cn(
                    "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                    isMileageDragging ? "border-sidebar bg-sidebar/5" : "border-slate-300 hover:border-sidebar/50"
                  )}
                  onDragOver={(e) => handleDragOver(e, true)}
                  onDragLeave={(e) => handleDragLeave(e, true)}
                  onDrop={(e) => handleDrop(e, true)}
                  onClick={() => mileageFileInputRef.current?.click()}
                  data-testid="dropzone-mileage"
                >
                  <div className="h-16 w-16 mx-auto mb-4 bg-slate-100 rounded-lg flex items-center justify-center">
                    <Upload className="h-8 w-8 text-slate-400" />
                  </div>
                  <p className="font-medium mb-1">Drag or Drop your Receipts</p>
                  <p className="text-xs text-muted-foreground mb-4">Maximum file size allowed is 10MB</p>
                  <Button
                    variant="outline"
                    className="gap-2"
                    data-testid="button-upload-mileage-files"
                    onClick={(e) => {
                      e.stopPropagation();
                      mileageFileInputRef.current?.click();
                    }}
                  >
                    <Upload className="h-4 w-4" /> Upload your Files
                  </Button>
                </div>

                {mileageUploadedFiles.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-black font-medium">Uploaded Files ({mileageUploadedFiles.length})</Label>
                    <div className="space-y-2">
                      {mileageUploadedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border"
                          data-testid={`mileage-file-item-${index}`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="h-4 w-4 text-slate-500 flex-shrink-0" />
                            <span className="text-sm truncate">{file.name}</span>
                            <span className="text-xs text-muted-foreground flex-shrink-0">
                              ({(file.size / 1024).toFixed(1)} KB)
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 flex-shrink-0"
                            onClick={() => removeFile(index, true)}
                            data-testid={`button-remove-mileage-file-${index}`}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 pt-4 border-t">
            <Button
              className="bg-sidebar hover:bg-sidebar/90 font-display"
              onClick={expenseTab === "record-expense" ? handleSubmitExpense : handleSubmitMileage}
              disabled={createExpenseMutation.isPending || createMileageMutation.isPending || updateExpenseMutation.isPending}
              data-testid="button-save-expense"
            >
              {isEditMode ? "Save Changes (Alt+S)" : "Save (Alt+S)"}
            </Button>
            {!isEditMode && (
              <Button
                variant="outline"
                onClick={handleSaveAndNew}
                disabled={createExpenseMutation.isPending || createMileageMutation.isPending}
                data-testid="button-save-and-new"
              >
                Save and New (Alt+N)
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={() => setShowRecordExpense(false)}
              data-testid="button-cancel-expense"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showMileageSettings} onOpenChange={setShowMileageSettings}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle data-testid="dialog-title-mileage-settings">Set your mileage preferences</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={mileageSettingsForm.associateEmployeesToExpenses}
                onCheckedChange={(checked) => setMileageSettingsForm(prev => ({
                  ...prev,
                  associateEmployeesToExpenses: checked as boolean
                }))}
                data-testid="checkbox-associate-employees"
              />
              <Label className="text-black font-medium">Associate employees to expenses</Label>
            </div>

            <div className="space-y-4 border-t pt-4">
              <h4 className="font-medium">Mileage Preference</h4>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-black font-medium">Default Mileage Category</Label>
                  <Select
                    value={mileageSettingsForm.defaultMileageCategory}
                    onValueChange={(value) => setMileageSettingsForm(prev => ({
                      ...prev,
                      defaultMileageCategory: value
                    }))}
                  >
                    <SelectTrigger data-testid="select-default-mileage-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPENSE_ACCOUNTS.map(account => (
                        <SelectItem key={account} value={account}>{account}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-black font-medium">Default Unit</Label>
                  <RadioGroup
                    value={mileageSettingsForm.defaultUnit}
                    onValueChange={(value) => setMileageSettingsForm(prev => ({
                      ...prev,
                      defaultUnit: value
                    }))}
                    className="flex gap-4"
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="km" id="default_km" data-testid="radio-default-km" />
                      <Label htmlFor="default_km">Km</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="mile" id="default_mile" data-testid="radio-default-mile" />
                      <Label htmlFor="default_mile">Mile</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </div>

            <div className="space-y-4 border-t pt-4">
              <h4 className="font-medium">MILEAGE RATES</h4>
              <p className="text-sm text-muted-foreground">
                Any mileage expense recorded on or after the start date will have the corresponding mileage rate.
                You can create a default rate (created without specifying a date), which will be applicable for
                mileage expenses recorded before the initial start date.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-black font-medium">START DATE</Label>
                  <Input
                    type="date"
                    placeholder="dd/MM/yyyy"
                    value={mileageSettingsForm.newRateDate}
                    onChange={(e) => setMileageSettingsForm(prev => ({
                      ...prev,
                      newRateDate: e.target.value
                    }))}
                    data-testid="input-rate-start-date"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-black font-medium">MILEAGE RATE</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={mileageSettingsForm.newRateValue}
                      onChange={(e) => setMileageSettingsForm(prev => ({
                        ...prev,
                        newRateValue: e.target.value
                      }))}
                      onWheel={(e) => (e.target as HTMLInputElement).blur()}
                      data-testid="input-mileage-rate-value"
                    />
                    <span className="flex items-center text-sm text-muted-foreground">INR</span>
                  </div>
                </div>
              </div>

              <button
                className="text-sidebar text-sm flex items-center gap-1"
                onClick={() => {
                  if (mileageSettingsForm.newRateValue) {
                    addMileageRateMutation.mutate({
                      startDate: mileageSettingsForm.newRateDate,
                      rate: parseFloat(mileageSettingsForm.newRateValue),
                      currency: 'INR'
                    });
                  }
                }}
                data-testid="button-add-rate"
              >
                <Plus className="h-3 w-3" /> Add Mileage Rate
              </button>

              {mileageSettings?.mileageRates && mileageSettings.mileageRates.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold">Date</th>
                        <th className="px-4 py-3 text-left font-semibold">Expense Account</th>
                        <th className="px-4 py-3 text-left font-semibold text-xs text-slate-500 uppercase">Reference#</th>
                        <th className="px-4 py-3 text-left font-semibold">Vendor Name</th>
                        <th className="px-4 py-3 text-left font-semibold">Status</th>
                        <th className="px-4 py-3 text-right font-semibold">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mileageSettings.mileageRates.map((rate) => (
                        <tr key={rate.id}>
                          <td className="px-3 py-2 text-sm">{rate.startDate || 'Default'}</td>
                          <td className="px-3 py-2 text-sm">{rate.rate} {rate.currency}</td>
                          <td className="px-3 py-2 text-right">
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <X className="h-3 w-3" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-4 border-t">
            <Button
              className="bg-sidebar hover:bg-sidebar/90 font-display"
              onClick={() => {
                updateMileageSettingsMutation.mutate({
                  associateEmployeesToExpenses: mileageSettingsForm.associateEmployeesToExpenses,
                  defaultMileageCategory: mileageSettingsForm.defaultMileageCategory,
                  defaultUnit: mileageSettingsForm.defaultUnit,
                });
                setShowMileageSettings(false);
              }}
              data-testid="button-save-mileage-settings"
            >
              Save
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowMileageSettings(false)}
              data-testid="button-cancel-mileage-settings"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCreateExpenseAccountDialog} onOpenChange={setShowCreateExpenseAccountDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Expense Account</DialogTitle>
            <DialogDescription>Enter the name for the new expense account</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Account Name"
              value={newExpenseAccountName}
              onChange={(e) => setNewExpenseAccountName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateExpenseAccount();
                }
              }}
              data-testid="input-new-expense-account"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateExpenseAccountDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateExpenseAccount} className="bg-sidebar hover:bg-sidebar/90 font-display">
              Save and Select
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCreatePaidThroughDialog} onOpenChange={setShowCreatePaidThroughDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Account</DialogTitle>
            <DialogDescription>Enter the name for the new paid through account</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Account Name"
              value={newPaidThroughName}
              onChange={(e) => setNewPaidThroughName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  expenseTab === 'record-mileage' ? handleCreateMileagePaidThrough() : handleCreatePaidThrough();
                }
              }}
              data-testid="input-new-paid-through"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreatePaidThroughDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              expenseTab === 'record-mileage' ? handleCreateMileagePaidThrough() : handleCreatePaidThrough();
            }} className="bg-sidebar hover:bg-sidebar/90 font-display">
              Save and Select
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-center text-xl" data-testid="dialog-title-import">Expenses - Select File</DialogTitle>
          </DialogHeader>

          <div className="flex items-center justify-center gap-8 py-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-sidebar flex items-center justify-center text-white text-sm">1</div>
              <span className="font-medium">Configure</span>
            </div>
            <div className="h-px w-12 bg-slate-200"></div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-sm">2</div>
              <span>Map Fields</span>
            </div>
            <div className="h-px w-12 bg-slate-200"></div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-sm">3</div>
              <span>Preview</span>
            </div>
          </div>

          <div className="border-2 border-dashed rounded-lg p-12 text-center">
            <div className="h-12 w-12 mx-auto mb-4 flex items-center justify-center">
              <Download className="h-8 w-8 text-slate-400" />
            </div>
            <p className="font-medium mb-4">Drag and drop file to import</p>
            <Button className="bg-sidebar hover:bg-sidebar/90 font-display" data-testid="button-choose-file">
              Choose File
            </Button>
            <p className="text-xs text-muted-foreground mt-4">
              Maximum File Size: 25 MB - File Format: CSV or TSV or XLS
            </p>
          </div>

          <p className="text-sm text-center text-muted-foreground">
            Download a <a href="#" className="text-sidebar">sample csv file</a> or <a href="#" className="text-sidebar">sample xls file</a> and compare it to your import file to ensure you have the file perfect for the import.
          </p>

          <div className="space-y-2">
            <Label>Character Encoding</Label>
            <Select defaultValue="utf-8">
              <SelectTrigger data-testid="select-encoding">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="utf-8">UTF-8 (Unicode)</SelectItem>
                <SelectItem value="ascii">ASCII</SelectItem>
                <SelectItem value="iso-8859-1">ISO-8859-1</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h4 className="font-medium text-amber-800 mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4" /> Page Tips
            </h4>
            <ul className="text-sm text-amber-700 space-y-1 list-disc pl-5">
              <li>Import data with the details of GST Treatment by referring these <a href="#" className="text-sidebar">accepted formats</a>.</li>
              <li>You can download the <a href="#" className="text-sidebar">sample xls file</a> to get detailed information about the data fields used while importing.</li>
              <li>If you have files in other formats, you can convert it to an accepted file format using any online/offline converter.</li>
              <li>You can configure your import settings and save them for future too!</li>
            </ul>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="ghost"
              onClick={() => setShowImportDialog(false)}
              data-testid="button-cancel-import"
            >
              Cancel
            </Button>
            <Button
              className="bg-sidebar hover:bg-sidebar/90 font-display"
              data-testid="button-next-import"
            >
              Next         </Button>      </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}