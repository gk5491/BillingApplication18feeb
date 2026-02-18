import { useRef } from "react";
import { X, Edit, Printer, MoreHorizontal, MessageSquare, Upload, Paperclip, Trash2, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { robustIframePrint } from "@/lib/robust-print";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
}

interface ExpenseDetailPanelProps {
  expense: Expense;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onFileSelect?: (file: File) => void;
}

export default function ExpenseDetailPanel({ expense, onClose, onEdit, onDelete, onFileSelect }: ExpenseDetailPanelProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const handlePrint = async () => {
    toast({ title: "Preparing print...", description: "Please wait while we prepare the document." });

    try {
      await robustIframePrint("expense-print-content");
    } catch (error) {
      console.error("Print error:", error);
      toast({ title: "Error", description: "Failed to open print dialog.", variant: "destructive" });
    }
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (onFileSelect) {
        onFileSelect(file);
      }
      toast({
        title: "File uploaded",
        description: `${file.name} has been attached to this expense.`,
      });
      // Reset the input so the same file can be selected again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
        accept="image/*,.pdf,.doc,.docx"
      />
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold text-slate-900">Expense Details</h2>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:bg-slate-100">
            <MessageSquare className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-slate-500 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-1 px-4 py-2 border-b bg-slate-50/30">
        <Button variant="ghost" size="sm" onClick={onEdit} className="h-8 text-[13px] text-slate-600 font-medium gap-1.5 hover:bg-slate-100 px-2">
          <Edit className="h-3.5 w-3.5" /> Edit
        </Button>
        <Button variant="ghost" size="sm" onClick={handlePrint} className="h-8 text-[13px] text-slate-600 font-medium gap-1.5 hover:bg-slate-100 px-2">
          <Printer className="h-3.5 w-3.5" /> Print
        </Button>
        <Separator orientation="vertical" className="h-4 mx-1 bg-slate-200" />
        <Button variant="ghost" size="sm" onClick={handleFileClick} className="h-8 text-slate-600 hover:bg-slate-100 px-2">
          <Paperclip className="h-3.5 w-3.5" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:bg-slate-100">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              <Trash2 className="h-4 w-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ScrollArea className="flex-1">
        <div id="expense-print-content" className="p-8 space-y-10">
          {/* Main Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div>
                <p className="text-[13px] text-slate-500 mb-1.5">Expense Amount</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-semibold text-red-500">{formatCurrency(expense.amount)}</span>
                  <span className="text-sm text-slate-500">on {expense.date ? format(new Date(expense.date), 'dd/MM/yyyy') : 'N/A'}</span>
                </div>
                <p className="text-[11px] font-bold text-slate-400 mt-1.5 tracking-wide uppercase">{expense.isBillable ? 'BILLABLE' : 'NON-BILLABLE'}</p>
              </div>

              <div>
                <Badge variant="secondary" className={cn(
                  "border-0 rounded px-2 py-0.5 text-[12px] font-medium",
                  expense.status === 'reimbursed' ? "bg-green-50 text-green-600 hover:bg-green-50" : "bg-blue-50 text-blue-600 hover:bg-blue-50"
                )}>
                  {expense.status === 'reimbursed' ? 'Reimbursed' : (expense.expenseAccount || 'Expense')}
                </Badge>
              </div>

              <div className="space-y-5 pt-2">
                <div>
                  <p className="text-[13px] text-slate-500 mb-1">Paid Through</p>
                  <p className="text-[14px] font-medium text-slate-900">{expense.paidThrough}</p>
                </div>
                <div>
                  <p className="text-[13px] text-slate-500 mb-1">Paid To</p>
                  <p className="text-[14px] font-medium text-blue-600 hover:underline cursor-pointer">{expense.vendorName}</p>
                </div>
                <div>
                  <p className="text-[13px] text-slate-500 mb-1">GST Treatment</p>
                  <p className="text-[14px] font-medium text-slate-900">{expense.gstTreatment}</p>
                </div>
                <div>
                  <p className="text-[13px] text-slate-500 mb-1">SAC</p>
                  <p className="text-[14px] font-medium text-slate-900">{expense.sac || '123'}</p>
                </div>
                <div>
                  <p className="text-[13px] text-slate-500 mb-1">Source of Supply</p>
                  <p className="text-[14px] font-medium text-slate-900">{expense.sourceOfSupply || 'Maharashtra'}</p>
                </div>
                <div>
                  <p className="text-[13px] text-slate-500 mb-1">Destination of Supply</p>
                  <p className="text-[14px] font-medium text-slate-900">{expense.destinationOfSupply || 'Maharashtra'}</p>
                </div>
              </div>
            </div>

            {/* Receipt Upload Area */}
            <div className="flex flex-col items-center justify-center border border-dashed border-slate-300 rounded-lg p-10 bg-white">
              <div className="w-10 h-10 bg-blue-700 rounded-md flex items-center justify-center mb-4">
                <Upload className="h-5 w-5 text-white" />
              </div>
              <p className="text-[14px] font-semibold text-slate-800 mb-1">Drag or Drop your Receipts</p>
              <p className="text-[11px] text-slate-400 mb-6 font-medium">Maximum file size allowed is 10MB</p>
              <Button variant="outline" size="sm" onClick={handleFileClick} className="bg-slate-50/80 hover:bg-slate-100 text-slate-700 gap-2 border-slate-200 text-[13px] h-9 px-4">
                <Upload className="h-3.5 w-3.5" /> Upload your Files
              </Button>
            </div>
          </div>

          {/* Journal Section */}
          <div className="space-y-6 pt-6">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
              <h3 className="text-[14px] font-bold text-slate-900">Journal</h3>
            </div>
            <div className="flex items-center gap-1.5">
              <p className="text-[11px] text-slate-500">Amount is displayed in your base currency</p>
              <Badge className="bg-green-600 hover:bg-green-600 text-white border-0 h-4 px-1 rounded-sm text-[9px] font-bold">INR</Badge>
            </div>

            <div className="space-y-4">
              <h4 className="text-[13px] font-bold text-slate-900 uppercase tracking-tight">Expense</h4>
              <div className="overflow-hidden">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-100">
                      <th className="text-left py-2 font-semibold uppercase text-[11px] tracking-wider">Account</th>
                      <th className="text-right py-2 font-semibold uppercase text-[11px] tracking-wider w-32">Debit</th>
                      <th className="text-right py-2 font-semibold uppercase text-[11px] tracking-wider w-32">Credit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    <tr>
                      <td className="py-3 text-slate-800 font-medium">{expense.paidThrough}</td>
                      <td className="py-3 text-right text-slate-600">0.00</td>
                      <td className="py-3 text-right text-slate-600">{expense.amount.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="py-3 text-slate-800 font-medium">{expense.expenseAccount}</td>
                      <td className="py-3 text-right text-slate-600">{expense.amount.toFixed(2)}</td>
                      <td className="py-3 text-right text-slate-600">0.00</td>
                    </tr>
                  </tbody>
                  <tfoot className="">
                    <tr className="font-bold">
                      <td className="py-3"></td>
                      <td className="py-3 text-right border-t border-slate-900">{expense.amount.toFixed(2)}</td>
                      <td className="py-3 text-right border-t border-slate-900">{expense.amount.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
