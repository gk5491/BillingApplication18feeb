import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { X, Check, ChevronsUpDown, Search, HelpCircle, Settings, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface Unit {
  id: string;
  name: string;
  uqc: string;
}

interface TaxRate {
  id: string;
  name: string;
  rate: number;
  label: string;
}

const itemSchema = z.object({
  type: z.enum(["goods", "service"]),
  name: z.string().min(1, "Item Name is required"),
  unit: z.string().optional(),
  hsnSac: z.string().optional(),
  taxPreference: z.string().default("taxable"),
  exemptionReason: z.string().optional(),
  sellable: z.boolean().default(true),
  sellingPrice: z.string().optional(),
  salesAccount: z.string().default("sales"),
  salesDescription: z.string().optional(),
  purchasable: z.boolean().default(true),
  costPrice: z.string().optional(),
  purchaseAccount: z.string().default("cost_of_goods"),
  purchaseDescription: z.string().optional(),
  preferredVendor: z.string().optional(),
  intraStateTaxRate: z.string().default("gst18"),
  interStateTaxRate: z.string().default("igst18"),
});

type ItemFormValues = z.infer<typeof itemSchema>;

const taxPreferences = [
  { label: "Taxable", value: "taxable" },
  { label: "Non-Taxable", value: "non_taxable" },
  { label: "Out of Scope", value: "out_of_scope" },
  { label: "Non-GST Supply", value: "non_gst" },
];

const ACCOUNT_HIERARCHY = [
  {
    category: "Other Current Asset",
    accounts: [
      { label: "Advance Tax", value: "advance_tax" },
      { label: "Employee Advance", value: "employee_advance" },
      {
        label: "Input Tax Credits", value: "input_tax_credits", children: [
          { label: "Input CGST", value: "input_cgst" },
          { label: "Input IGST", value: "input_igst" },
          { label: "Input SGST", value: "input_sgst" },
        ]
      },
      { label: "Prepaid Expenses", value: "prepaid_expenses" },
      { label: "Reverse Charge Tax Input but not due", value: "reverse_charge_input" },
      { label: "TDS Receivable", value: "tds_receivable" },
    ]
  },
  {
    category: "Fixed Asset",
    accounts: [
      { label: "Furniture and Equipment", value: "furniture_equipment" },
    ]
  },
  {
    category: "Other Current Liability",
    accounts: [
      { label: "Employee Reimbursements", value: "employee_reimbursements" },
      {
        label: "GST Payable", value: "gst_payable", children: [
          { label: "Output CGST", value: "output_cgst" },
          { label: "Output IGST", value: "output_igst" },
          { label: "Output SGST", value: "output_sgst" },
        ]
      },
      { label: "Opening Balance Adjustments", value: "opening_balance_adjustments" },
      { label: "Tax Payable", value: "tax_payable" },
      { label: "TDS Payable", value: "tds_payable" },
      { label: "Unearned Revenue", value: "unearned_revenue" },
    ]
  },
  {
    category: "Income",
    accounts: [
      { label: "Discount", value: "discount" },
      { label: "General Income", value: "general_income" },
      { label: "Interest Income", value: "interest_income" },
      { label: "Late Fee Income", value: "late_fee_income" },
      { label: "Other Charges", value: "other_charges" },
      { label: "Sales", value: "sales" },
      { label: "Shipping Charge", value: "shipping_charge" },
    ]
  },
  {
    category: "Cost of Goods Sold",
    accounts: [
      { label: "Cost of Goods Sold", value: "cost_of_goods" },
      { label: "Job Costing", value: "job_costing" },
      { label: "Materials", value: "materials" },
      { label: "Subcontractor", value: "subcontractor" },
    ]
  },
  {
    category: "Expense",
    accounts: [
      { label: "Advertising And Marketing", value: "advertising_marketing" },
      { label: "Automobile Expense", value: "automobile_expense" },
      { label: "Bank Fees and Charges", value: "bank_fees" },
      { label: "Consultant Expense", value: "consultant_expense" },
      { label: "Office Supplies", value: "office_supplies" },
      { label: "Rent Expense", value: "rent_expense" },
      { label: "Travel Expense", value: "travel_expense" },
    ]
  }
];

const flattenAccounts = () => {
  const flat: { label: string; value: string; category: string; indent: number }[] = [];
  ACCOUNT_HIERARCHY.forEach(cat => {
    cat.accounts.forEach(acc => {
      flat.push({ label: acc.label, value: acc.value, category: cat.category, indent: 0 });
      if ('children' in acc && acc.children) {
        acc.children.forEach((child: any) => {
          flat.push({ label: child.label, value: child.value, category: cat.category, indent: 1 });
        });
      }
    });
  });
  return flat;
};

const ALL_ACCOUNTS = flattenAccounts();

export default function ProductEdit() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/items/:id/edit");
  const { toast } = useToast();
  const [unitOpen, setUnitOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [salesAccountOpen, setSalesAccountOpen] = useState(false);
  const [purchaseAccountOpen, setPurchaseAccountOpen] = useState(false);
  const [intraStateTaxOpen, setIntraStateTaxOpen] = useState(false);
  const [interStateTaxOpen, setInterStateTaxOpen] = useState(false);
  const [vendors, setVendors] = useState<{ label: string; value: string }[]>([]);
  const [vendorsLoading, setVendorsLoading] = useState(true);

  const { data: unitsData } = useQuery<{ success: boolean; data: Unit[] }>({
    queryKey: ['/api/units'],
  });
  const units = unitsData?.data || [];

  const { data: taxRatesData } = useQuery<{ success: boolean; data: TaxRate[] }>({
    queryKey: ['/api/taxRates'],
  });
  const taxRates = taxRatesData?.data || [];

  const gstRates = taxRates.filter(t => t.name.startsWith('GST') || t.name === 'Exempt');
  const igstRates = taxRates.filter(t => t.name.startsWith('IGST') || t.name === 'Exempt');

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const response = await fetch('/api/vendors');
        if (response.ok) {
          const result = await response.json();
          const vendorOptions = result.data.map((vendor: any) => ({
            label: vendor.displayName || vendor.companyName || `${vendor.firstName} ${vendor.lastName}`.trim(),
            value: vendor.id,
          }));
          setVendors(vendorOptions);
        }
      } catch (error) {
        console.error('Failed to fetch vendors:', error);
      } finally {
        setVendorsLoading(false);
      }
    };

    fetchVendors();
  }, []);

  const form = useForm<ItemFormValues>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      type: "goods",
      name: "",
      taxPreference: "taxable",
      sellable: true,
      purchasable: true,
      salesAccount: "sales",
      purchaseAccount: "cost_of_goods",
      intraStateTaxRate: "GST18",
      interStateTaxRate: "IGST18",
    },
  });

  useEffect(() => {
    if (params?.id && !vendorsLoading) {
      fetchItem(params.id);
    }
  }, [params?.id, vendorsLoading]);

  const fetchItem = async (id: string) => {
    try {
      const response = await fetch(`/api/items/${id}`);
      if (response.ok) {
        const item = await response.json();
        form.reset({
          type: item.type || "goods",
          name: item.name || "",
          unit: item.usageUnit || "",
          hsnSac: item.hsnSac || "",
          taxPreference: item.taxPreference || "taxable",
          exemptionReason: item.exemptionReason || "",
          sellable: true,
          sellingPrice: item.rate?.replace("₹", "") || "",
          salesAccount: item.salesAccount || "sales",
          salesDescription: item.description || "",
          purchasable: true,
          costPrice: item.purchaseRate?.replace("₹", "") || "",
          purchaseAccount: item.purchaseAccount || "cost_of_goods",
          purchaseDescription: item.purchaseDescription || "",
          preferredVendor: item.preferredVendor || "",
          intraStateTaxRate: item.intraStateTax || "GST18",
          interStateTaxRate: item.interStateTax || "IGST18",
        });
      } else {
        toast({
          title: "Error",
          description: "Item not found",
          variant: "destructive",
        });
        setLocation("/items");
      }
    } catch (error) {
      console.error("Failed to fetch item:", error);
      setLocation("/items");
    } finally {
      setLoading(false);
    }
  };

  const itemType = form.watch("type");
  const taxPreference = form.watch("taxPreference");
  const sellable = form.watch("sellable");
  const purchasable = form.watch("purchasable");

  const onSubmit = async (data: ItemFormValues) => {
    if (!params?.id) return;

    try {
      const itemData = {
        name: data.name,
        type: data.type,
        hsnSac: data.hsnSac || "",
        usageUnit: data.unit || "",
        rate: data.sellingPrice || "0.00",
        purchaseRate: data.costPrice || "0.00",
        description: data.salesDescription || "",
        purchaseDescription: data.purchaseDescription || "",
        taxPreference: data.taxPreference,
        exemptionReason: data.exemptionReason || "",
        intraStateTax: data.intraStateTaxRate,
        interStateTax: data.interStateTaxRate,
        salesAccount: data.salesAccount,
        purchaseAccount: data.purchaseAccount,
        preferredVendor: data.preferredVendor || "",
      };

      const response = await fetch(`/api/items/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData),
      });

      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ['/api/items'] });
        toast({
          title: "Item Updated",
          description: "The item has been successfully updated.",
        });
        setLocation("/items");
      } else {
        throw new Error("Failed to update item");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update item. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getAccountLabel = (value: string) => {
    const acc = ALL_ACCOUNTS.find(a => a.value === value);
    return acc?.label || value;
  };

  const getTaxRateLabel = (value: string) => {
    const tax = taxRates.find(t => t.name === value);
    return tax?.label || value;
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white h-full">
        <div className="p-8">
          <p className="text-slate-600">Loading item...</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex-1 flex flex-col bg-slate-50 h-screen animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between p-4 bg-white border-b border-slate-200 shadow-sm z-10 flex-shrink-0">
          <h1 className="text-xl font-semibold text-slate-900">Edit Item</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/items")}
            className="h-8 w-8 hover:bg-slate-100 rounded-full"
            data-testid="button-close-edit"
          >
            <X className="h-5 w-5 text-slate-500" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto invisible-scrollbar">
          <div className="max-w-4xl mx-auto p-8 pb-24">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* Basic Information Card */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Basic Information</h2>
                  </div>
                  <div className="p-6 space-y-6">
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-8">
                          <div className="text-slate-600 min-w-[120px] flex items-center gap-1 text-sm font-medium">
                            Type
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Select whether this is a physical product (Goods) or a service</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              value={field.value}
                              className="flex gap-8"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="goods" id="goods-edit" className="border-sidebar text-sidebar" data-testid="radio-goods-edit" />
                                <Label htmlFor="goods-edit" className="font-medium text-slate-700 cursor-pointer">Goods</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="service" id="service-edit" className="border-sidebar text-sidebar" data-testid="radio-service-edit" />
                                <Label htmlFor="service-edit" className="font-medium text-slate-700 cursor-pointer">Service</Label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem className="grid grid-cols-[140px_1fr] items-center gap-4">
                          <FormLabel className="text-slate-700 font-medium">
                            Item Name<span className="text-red-500 ml-0.5">*</span>
                          </FormLabel>
                          <div className="space-y-1">
                            <FormControl>
                              <Input {...field} placeholder="Enter item name" className="bg-white border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" data-testid="input-item-name-edit" />
                            </FormControl>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-8">
                      <FormField
                        control={form.control}
                        name="unit"
                        render={({ field }) => (
                          <FormItem className="grid grid-cols-[140px_1fr] items-center gap-4">
                            <div className="text-slate-700 text-sm font-medium flex items-center gap-1">
                              Unit
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Select the unit of measurement</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            <Popover open={unitOpen} onOpenChange={setUnitOpen}>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    className={cn(
                                      "w-full justify-between font-normal bg-white border-slate-200 hover:bg-slate-50",
                                      !field.value && "text-slate-400"
                                    )}
                                    data-testid="select-unit-edit"
                                  >
                                    {field.value || "Select unit..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 text-slate-400" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-[300px] p-0 shadow-lg border-slate-200" align="start">
                                <Command>
                                  <CommandInput placeholder="Search units..." className="h-9" />
                                  <CommandList className="max-h-[240px] overflow-y-auto">
                                    <CommandEmpty>No unit found.</CommandEmpty>
                                    <CommandGroup>
                                      {units.map((unit) => (
                                        <CommandItem
                                          value={`${unit.name} (${unit.uqc})`}
                                          key={unit.id}
                                          onSelect={() => {
                                            form.setValue("unit", unit.name);
                                            setUnitOpen(false);
                                          }}
                                          className="cursor-pointer hover:bg-slate-50"
                                        >
                                          <Check className={cn("mr-2 h-4 w-4 text-blue-600", unit.name === field.value ? "opacity-100" : "opacity-0")} />
                                          <span className="flex-1 font-medium">{unit.name}</span>
                                          <span className="text-xs text-slate-400">{unit.uqc}</span>
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                    <CommandSeparator />
                                    <CommandGroup>
                                      <CommandItem className="text-blue-600 cursor-pointer hover:bg-blue-50" onSelect={() => setUnitOpen(false)}>
                                        <Settings className="mr-2 h-4 w-4" />
                                        Configure Units
                                      </CommandItem>
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="hsnSac"
                        render={({ field }) => (
                          <FormItem className="grid grid-cols-[140px_1fr] items-center gap-4">
                            <FormLabel className="text-slate-700 font-medium">
                              {itemType === "goods" ? "HSN Code" : "SAC"}
                            </FormLabel>
                            <div className="relative">
                              <FormControl>
                                <Input {...field} placeholder="Enter code" className="bg-white border-slate-200 pr-10 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" data-testid="input-hsn-sac-edit" />
                              </FormControl>
                              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 hover:text-blue-500 cursor-pointer transition-colors" />
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>

                {/* Tax Information Card */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Tax Information</h2>
                  </div>
                  <div className="p-6 space-y-8">
                    <FormField
                      control={form.control}
                      name="taxPreference"
                      render={({ field }) => (
                        <FormItem className="grid grid-cols-[140px_1fr] items-center gap-4">
                          <FormLabel className="text-slate-700 font-medium">
                            Tax Preference<span className="text-red-500 ml-0.5">*</span>
                          </FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-white border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" data-testid="select-tax-preference-edit">
                                <SelectValue placeholder="Select tax preference" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {taxPreferences.map((pref) => (
                                <SelectItem key={pref.value} value={pref.value} className="cursor-pointer">
                                  {pref.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />

                    {taxPreference === "taxable" && (
                      <div className="grid grid-cols-2 gap-8 pt-4 border-t border-slate-100">
                        <FormField
                          control={form.control}
                          name="intraStateTaxRate"
                          render={({ field }) => (
                            <FormItem className="space-y-2">
                              <FormLabel className="text-slate-700 font-medium">Intra State Tax</FormLabel>
                              <Popover open={intraStateTaxOpen} onOpenChange={setIntraStateTaxOpen}>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      className={cn("w-full justify-between font-normal bg-white border-slate-200 hover:bg-slate-50 h-10")}
                                    >
                                      {field.value ? getTaxRateLabel(field.value) : "Select rate"}
                                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 text-slate-400" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-[300px] p-0 shadow-lg border-slate-200">
                                  <Command>
                                    <CommandInput placeholder="Search tax rates..." className="h-9" />
                                    <CommandList className="max-h-[240px] overflow-y-auto">
                                      <CommandEmpty>No tax rate found.</CommandEmpty>
                                      <CommandGroup>
                                        {gstRates.map((tax) => (
                                          <CommandItem
                                            key={tax.id}
                                            onSelect={() => {
                                              form.setValue("intraStateTaxRate", tax.name);
                                              setIntraStateTaxOpen(false);
                                            }}
                                            className="cursor-pointer hover:bg-slate-50"
                                          >
                                            <Check className={cn("mr-2 h-4 w-4 text-blue-600", tax.name === field.value ? "opacity-100" : "opacity-0")} />
                                            {tax.label}
                                          </CommandItem>
                                        ))}
                                      </CommandGroup>
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="interStateTaxRate"
                          render={({ field }) => (
                            <FormItem className="space-y-2">
                              <FormLabel className="text-slate-700 font-medium">Inter State Tax</FormLabel>
                              <Popover open={interStateTaxOpen} onOpenChange={setInterStateTaxOpen}>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      className={cn("w-full justify-between font-normal bg-white border-slate-200 hover:bg-slate-50 h-10")}
                                    >
                                      {field.value ? getTaxRateLabel(field.value) : "Select rate"}
                                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 text-slate-400" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-[300px] p-0 shadow-lg border-slate-200">
                                  <Command>
                                    <CommandInput placeholder="Search tax rates..." className="h-9" />
                                    <CommandList className="max-h-[240px] overflow-y-auto">
                                      <CommandEmpty>No tax rate found.</CommandEmpty>
                                      <CommandGroup>
                                        {igstRates.map((tax) => (
                                          <CommandItem
                                            key={tax.id}
                                            onSelect={() => {
                                              form.setValue("interStateTaxRate", tax.name);
                                              setInterStateTaxOpen(false);
                                            }}
                                            className="cursor-pointer hover:bg-slate-50"
                                          >
                                            <Check className={cn("mr-2 h-4 w-4 text-blue-600", tax.name === field.value ? "opacity-100" : "opacity-0")} />
                                            {tax.label}
                                          </CommandItem>
                                        ))}
                                      </CommandGroup>
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Transaction Information Grid */}
                <div className="grid grid-cols-2 gap-8">
                  {/* Sales Information */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-fit">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id="sellable-edit"
                          checked={sellable}
                          onCheckedChange={(checked) => form.setValue("sellable", checked as boolean)}
                          className="border-slate-300 data-[state=checked]:bg-sidebar data-[state=checked]:border-sidebar"
                        />
                        <Label htmlFor="sellable-edit" className="text-sm font-semibold text-slate-900 uppercase tracking-wider cursor-pointer">Sales Information</Label>
                      </div>
                    </div>
                    <div className={cn("p-6 space-y-6 transition-opacity duration-200", !sellable && "opacity-50 pointer-events-none")}>
                      <FormField
                        control={form.control}
                        name="sellingPrice"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="text-slate-700 font-medium">Selling Price<span className="text-red-500 ml-0.5">*</span></FormLabel>
                            <div className="flex">
                              <div className="flex items-center px-3 bg-slate-50 border border-r-0 border-slate-200 rounded-l-md text-slate-500 text-sm font-medium">INR</div>
                              <FormControl>
                                <Input {...field} placeholder="0.00" className="rounded-l-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 border-slate-200 transition-all" data-testid="input-selling-price-edit" />
                              </FormControl>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="salesAccount"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="text-slate-700 font-medium">Account<span className="text-red-500 ml-0.5">*</span></FormLabel>
                            <Popover open={salesAccountOpen} onOpenChange={setSalesAccountOpen}>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={cn("w-full justify-between font-normal bg-white border-slate-200 hover:bg-slate-50 h-10")}
                                    data-testid="select-sales-account-edit"
                                  >
                                    {field.value ? getAccountLabel(field.value) : "Select account"}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 text-slate-400" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-[350px] p-0 shadow-lg border-slate-200" align="start">
                                <Command>
                                  <CommandInput placeholder="Search accounts..." className="h-9" />
                                  <CommandList className="max-h-[300px] overflow-y-auto">
                                    <CommandEmpty>No account found.</CommandEmpty>
                                    {ACCOUNT_HIERARCHY.map((cat) => (
                                      <CommandGroup key={cat.category} heading={<span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">{cat.category}</span>}>
                                        {cat.accounts.map((acc) => (
                                          <div key={acc.value}>
                                            <CommandItem
                                              onSelect={() => {
                                                form.setValue("salesAccount", acc.value);
                                                setSalesAccountOpen(false);
                                              }}
                                              className="cursor-pointer hover:bg-slate-50"
                                            >
                                              <Check className={cn("mr-2 h-4 w-4 text-blue-600", acc.value === field.value ? "opacity-100" : "opacity-0")} />
                                              {acc.label}
                                            </CommandItem>
                                            {acc.children?.map((child) => (
                                              <CommandItem
                                                key={child.value}
                                                onSelect={() => {
                                                  form.setValue("salesAccount", child.value);
                                                  setSalesAccountOpen(false);
                                                }}
                                                className="pl-8 cursor-pointer hover:bg-slate-50"
                                              >
                                                <Check className={cn("mr-2 h-4 w-4 text-blue-600", child.value === field.value ? "opacity-100" : "opacity-0")} />
                                                {child.label}
                                              </CommandItem>
                                            ))}
                                          </div>
                                        ))}
                                      </CommandGroup>
                                    ))}
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="salesDescription"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="text-slate-700 font-medium">Description</FormLabel>
                            <FormControl>
                              <Textarea {...field} placeholder="Internal notes or description for customers" className="min-h-[100px] bg-white border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Purchase Information */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-fit">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id="purchasable-edit"
                          checked={purchasable}
                          onCheckedChange={(checked) => form.setValue("purchasable", checked as boolean)}
                          className="border-slate-300 data-[state=checked]:bg-sidebar data-[state=checked]:border-sidebar"
                        />
                        <Label htmlFor="purchasable-edit" className="text-sm font-semibold text-slate-900 uppercase tracking-wider cursor-pointer">Purchase Information</Label>
                      </div>
                    </div>
                    <div className={cn("p-6 space-y-6 transition-opacity duration-200", !purchasable && "opacity-50 pointer-events-none")}>
                      <FormField
                        control={form.control}
                        name="costPrice"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="text-slate-700 font-medium">Cost Price<span className="text-red-500 ml-0.5">*</span></FormLabel>
                            <div className="flex">
                              <div className="flex items-center px-3 bg-slate-50 border border-r-0 border-slate-200 rounded-l-md text-slate-500 text-sm font-medium">INR</div>
                              <FormControl>
                                <Input {...field} placeholder="0.00" className="rounded-l-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 border-slate-200 transition-all" data-testid="input-cost-price-edit" />
                              </FormControl>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="purchaseAccount"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="text-slate-700 font-medium">Account<span className="text-red-500 ml-0.5">*</span></FormLabel>
                            <Popover open={purchaseAccountOpen} onOpenChange={setPurchaseAccountOpen}>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={cn("w-full justify-between font-normal bg-white border-slate-200 hover:bg-slate-50 h-10")}
                                    data-testid="select-purchase-account-edit"
                                  >
                                    {field.value ? getAccountLabel(field.value) : "Select account"}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 text-slate-400" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-[350px] p-0 shadow-lg border-slate-200" align="start">
                                <Command>
                                  <CommandInput placeholder="Search accounts..." className="h-9" />
                                  <CommandList className="max-h-[300px] overflow-y-auto">
                                    <CommandEmpty>No account found.</CommandEmpty>
                                    {ACCOUNT_HIERARCHY.map((cat) => (
                                      <CommandGroup key={cat.category} heading={<span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">{cat.category}</span>}>
                                        {cat.accounts.map((acc) => (
                                          <div key={acc.value}>
                                            <CommandItem
                                              onSelect={() => {
                                                form.setValue("purchaseAccount", acc.value);
                                                setPurchaseAccountOpen(false);
                                              }}
                                              className="cursor-pointer hover:bg-slate-50"
                                            >
                                              <Check className={cn("mr-2 h-4 w-4 text-blue-600", acc.value === field.value ? "opacity-100" : "opacity-0")} />
                                              {acc.label}
                                            </CommandItem>
                                            {acc.children?.map((child) => (
                                              <CommandItem
                                                key={child.value}
                                                onSelect={() => {
                                                  form.setValue("purchaseAccount", child.value);
                                                  setPurchaseAccountOpen(false);
                                                }}
                                                className="pl-8 cursor-pointer hover:bg-slate-50"
                                              >
                                                <Check className={cn("mr-2 h-4 w-4 text-blue-600", child.value === field.value ? "opacity-100" : "opacity-0")} />
                                                {child.label}
                                              </CommandItem>
                                            ))}
                                          </div>
                                        ))}
                                      </CommandGroup>
                                    ))}
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="purchaseDescription"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="text-slate-700 font-medium">Description</FormLabel>
                            <FormControl>
                              <Textarea {...field} placeholder="Description for purchase orders and bills" className="min-h-[100px] bg-white border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none" />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      {/* <FormField
                        control={form.control}
                        name="preferredVendor"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="text-slate-700 font-medium">Preferred Vendor<span className="text-red-500 ml-0.5">*</span></FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-white border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" data-testid="select-preferred-vendor-edit">
                                  <SelectValue placeholder={vendorsLoading ? "Loading vendors..." : "Select a vendor"} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="max-h-[300px]">
                                {vendors.length === 0 ? (
                                  <div className="p-4 text-center text-sm text-slate-500">No vendors found</div>
                                ) : (
                                  vendors.map((vendor) => (
                                    <SelectItem key={vendor.value} value={vendor.value} className="cursor-pointer">
                                      {vendor.label}
                                    </SelectItem>
                                  ))
                                )}
                                <div className="border-t border-slate-200 mt-1 pt-1">
                                  <div
                                    className="flex items-center gap-2 px-2 py-1.5 text-sm text-blue-600 hover:bg-blue-50 cursor-pointer rounded-sm"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setLocation('/vendors/new');
                                    }}
                                  >
                                    <Plus className="h-4 w-4" />
                                    Add new Vendor
                                  </div>
                                </div>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      /> */}
                    </div>
                  </div>
                </div>
              </form>
            </Form>
          </div>
        </div>

        <div className="p-4 bg-white border-t border-slate-200 flex justify-end gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
          <Button
            variant="outline"
            onClick={() => setLocation("/items")}
            className="px-6 border-slate-200 hover:bg-slate-50 font-medium"
            disabled={form.formState.isSubmitting}
            data-testid="button-cancel-edit"
          >
            Cancel
          </Button>
          <Button
            onClick={form.handleSubmit(onSubmit)}
            className="px-8 bg-sidebar hover:bg-sidebar/90 text-white font-semibold shadow-sm hover:shadow-md transition-all h-9"
            disabled={form.formState.isSubmitting}
            data-testid="button-save-item-edit"
          >
            {form.formState.isSubmitting ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
}
