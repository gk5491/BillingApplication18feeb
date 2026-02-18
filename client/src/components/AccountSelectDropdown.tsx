import { useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { cn } from "@/lib/utils";

// Hierarchical account structure
export const ACCOUNT_HIERARCHY = [
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
            { label: "Non Current Liability", value: "non_current_liability" },
            { label: "Construction Loans", value: "construction_loans" },
            { label: "Mortgages", value: "mortgages" },
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
            { label: "Bad Debt", value: "bad_debt" },
            { label: "Bank Fees and Charges", value: "bank_fees" },
            { label: "Consultant Expense", value: "consultant_expense" },
            { label: "Contract Assets", value: "contract_assets" },
            { label: "Credit Card Charges", value: "credit_card_charges" },
            { label: "Depreciation And Amortisation", value: "depreciation_amortisation" },
            { label: "Depreciation Expense", value: "depreciation_expense" },
            { label: "Expense", value: "expense" },
            { label: "IT and Internet Expenses", value: "it_internet_expense" },
            { label: "Janitorial Expense", value: "janitorial_expense" },
            { label: "Lodging", value: "lodging" },
            { label: "Meals and Entertainment", value: "meals_entertainment" },
            { label: "Merchandise", value: "merchandise" },
            { label: "Office Supplies", value: "office_supplies" },
            { label: "Other Expenses", value: "other_expenses" },
            { label: "Postage", value: "postage" },
            { label: "Printing and Stationery", value: "printing_stationery" },
            { label: "Purchase Discounts", value: "purchase_discounts" },
            { label: "Raw Materials And Consumables", value: "raw_materials" },
            { label: "Rent Expense", value: "rent_expense" },
            { label: "Repairs and Maintenance", value: "repairs_maintenance" },
            { label: "Salaries and Employee Wages", value: "salaries_wages" },
            { label: "Telephone Expense", value: "telephone_expense" },
            { label: "Transportation Expense", value: "transportation_expense" },
            { label: "Travel Expense", value: "travel_expense" },
        ]
    }
];

// Flatten accounts for search
interface FlatAccount {
    label: string;
    value: string;
    category: string;
    indent: number;
}

const flattenAccounts = (): FlatAccount[] => {
    const flat: FlatAccount[] = [];
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

export const ALL_ACCOUNTS = flattenAccounts();

// Helper function to get account label from value
export const getAccountLabel = (value: string): string => {
    const acc = ALL_ACCOUNTS.find(a => a.value === value);
    return acc?.label || value;
};

// Helper function to normalize account value from various formats
export const normalizeAccountValue = (account: string): string => {
    if (!account) return "";

    // First check if it's already a valid value
    const directMatch = ALL_ACCOUNTS.find(a => a.value === account);
    if (directMatch) return account;

    // Try to match by label (case-insensitive)
    const labelMatch = ALL_ACCOUNTS.find(
        a => a.label.toLowerCase() === account.toLowerCase()
    );
    if (labelMatch) return labelMatch.value;

    // Try normalized string matching
    const normalized = account.toLowerCase().replace(/\s+/g, '_');
    const normalizedMatch = ALL_ACCOUNTS.find(a => a.value === normalized);
    if (normalizedMatch) return normalizedMatch.value;

    // Default mappings for legacy data
    const legacyMap: Record<string, string> = {
        'cost_of_goods_sold': 'cost_of_goods',
        'cost of goods sold': 'cost_of_goods',
        'inventory': 'materials',
        'purchase_returns': 'cost_of_goods',
        'other_expense': 'office_supplies',
    };

    return legacyMap[normalized] || legacyMap[account.toLowerCase()] || "";
};

interface AccountSelectDropdownProps {
    value: string;
    onValueChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    triggerClassName?: string;
    disabled?: boolean;
    testId?: string;
}

export function AccountSelectDropdown({
    value,
    onValueChange,
    placeholder = "Select an account",
    className,
    triggerClassName,
    disabled = false,
    testId,
}: AccountSelectDropdownProps) {
    const [open, setOpen] = useState(false);

    const selectedLabel = value ? getAccountLabel(value) : "";

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className={cn(
                        "w-full justify-between font-normal",
                        !value && "text-muted-foreground",
                        triggerClassName
                    )}
                    data-testid={testId}
                >
                    <span className="truncate">{selectedLabel || placeholder}</span>
                    <ChevronDown className={cn("ml-2 h-4 w-4 shrink-0 opacity-50 transition-transform", open && "rotate-180")} />
                </Button>
            </PopoverTrigger>
            <PopoverContent className={cn("w-[350px] p-0", className)} align="start">
                <Command shouldFilter={true}>
                    <div className="flex items-center border-b px-3 py-2 bg-slate-50">
                        <Search className="mr-2 h-4 w-4 shrink-0 text-slate-400" />
                        <CommandInput placeholder="Search accounts..." className="h-9 border-0 focus:ring-0 bg-transparent" />
                    </div>
                    <CommandList className="max-h-[300px] overflow-hidden">
                        <CommandEmpty>No account found.</CommandEmpty>
                        <ScrollArea className="h-[300px]" onWheel={(e) => e.stopPropagation()}>
                            <div className="overflow-x-hidden">
                                {ACCOUNT_HIERARCHY.map((category) => (
                                    <CommandGroup key={category.category} heading={category.category}>
                                        {category.accounts.map((acc) => (
                                            <div key={acc.value}>
                                                <CommandItem
                                                    value={`${acc.label} ${category.category}`}
                                                    onSelect={() => {
                                                        onValueChange(acc.value);
                                                        setOpen(false);
                                                    }}
                                                    className="cursor-pointer"
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            acc.value === value ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    {acc.label}
                                                </CommandItem>
                                                {'children' in acc && acc.children && acc.children.map((child: any) => (
                                                    <CommandItem
                                                        key={child.value}
                                                        value={`${child.label} ${acc.label} ${category.category}`}
                                                        onSelect={() => {
                                                            onValueChange(child.value);
                                                            setOpen(false);
                                                        }}
                                                        className="cursor-pointer pl-8"
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                child.value === value ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        <span className="text-slate-400 mr-1">•</span>
                                                        {child.label}
                                                    </CommandItem>
                                                ))}
                                            </div>
                                        ))}
                                    </CommandGroup>
                                ))}
                            </div>
                        </ScrollArea>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

export default AccountSelectDropdown;
