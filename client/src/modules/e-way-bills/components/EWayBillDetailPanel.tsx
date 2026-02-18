import { X, FileText, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface EWayBillDetail {
  id: string;
  ewayBillNumber: string;
  documentType: string;
  transactionSubType: string;
  customerName: string;
  customerGstin: string;
  customerId: string;
  documentNumber: string;
  date: string;
  expiryDate: string;
  transactionType: string;
  dispatchFrom: {
    street: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
  };
  billFrom: {
    street: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
  };
  billTo: {
    street: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
  };
  shipTo: {
    street: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
  };
  placeOfDelivery: string;
  transporter: string;
  distance: number;
  modeOfTransportation: string;
  vehicleType: string;
  vehicleNo: string;
  transporterDocNo: string;
  transporterDocDate: string;
  items: any[];
  total: number;
  status: string;
  createdAt: string;
}

interface EWayBillDetailPanelProps {
  bill: EWayBillDetail;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const formatCurrency = (amount: any) => {
  if (!amount || isNaN(Number(amount))) return '₹0.00';
  return `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (dateString: string) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatAddress = (address: any): string[] => {
  if (!address) return ['-'];
  if (typeof address === 'string') return [address];
  if (typeof address !== 'object') return ['-'];
  const parts = [
    address.street ? String(address.street) : '',
    address.city ? String(address.city) : '',
    address.state ? String(address.state) : '',
    address.country ? String(address.country) : '',
    address.pincode ? String(address.pincode) : ''
  ].filter(Boolean);
  return parts.length > 0 ? parts : ['-'];
};

const getStatusColor = (status: string) => {
  switch (status?.toUpperCase()) {
    case 'GENERATED':
      return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
    case 'NOT_GENERATED':
      return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800';
    case 'CANCELLED':
      return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
    case 'EXPIRED':
      return 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
    default:
      return 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
  }
};

export default function EWayBillDetailPanel({ bill, onClose, onEdit, onDelete }: EWayBillDetailPanelProps) {
  return (
    <div className="flex-1 flex flex-col bg-background h-full">
      <div className="p-4 border-b flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold" data-testid="text-view-title">
            {bill.ewayBillNumber || 'Draft'}
          </h2>
          <Badge className={cn("text-[10px] uppercase font-bold", getStatusColor(bill.status))}>
            {bill.status.replace('_', ' ')}
          </Badge>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} data-testid="button-close-view">
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex items-center gap-2 px-4 py-2 border-b overflow-x-auto flex-wrap shrink-0 bg-slate-50/30">
        <Button variant="ghost" size="sm" className="h-8 text-[13px] text-slate-600 font-medium gap-1.5 hover:bg-slate-100 px-2" onClick={onEdit} data-testid="button-edit-eway-bill">
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-[13px] text-destructive font-medium gap-1.5 hover:bg-slate-100 px-2"
          onClick={onDelete}
          data-testid="button-delete-eway-bill"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </Button>
      </div>

      <ScrollArea className="flex-1 p-6">
        <div className="max-w-4xl space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg border p-6 space-y-4 shadow-sm">
            <h3 className="font-semibold text-lg text-slate-900 border-b pb-2">E-Way Bill Information</h3>

            <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
              <div>
                <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">E-Way Bill Number</span>
                <p className="font-semibold text-slate-900">{bill.ewayBillNumber || '—'}</p>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Document Type</span>
                <p className="font-medium capitalize text-slate-700">{bill.documentType.replace('_', ' ')}</p>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Transaction Sub Type</span>
                <p className="font-medium capitalize text-slate-700">{bill.transactionSubType.replace('_', ' ')}</p>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Date</span>
                <p className="font-medium text-slate-700">{formatDate(bill.date)}</p>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Expiry Date</span>
                <p className="font-medium text-slate-700">{formatDate(bill.expiryDate)}</p>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Transaction Type</span>
                <p className="font-medium capitalize text-slate-700">{bill.transactionType.replace('_', ' ')}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg border p-6 space-y-4 shadow-sm">
            <h3 className="font-semibold text-lg text-slate-900 border-b pb-2">Customer Information</h3>

            <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
              <div>
                <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Customer Name</span>
                <p className="font-semibold text-blue-600">{bill.customerName}</p>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Customer GSTIN</span>
                <p className="font-medium text-slate-700">{bill.customerGstin || '-'}</p>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Document Number</span>
                <p className="font-medium text-slate-700">{bill.documentNumber || '-'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg border p-6 space-y-4 shadow-sm">
            <h3 className="font-semibold text-lg text-slate-900 border-b pb-2">Address Details</h3>

            <div className="grid grid-cols-2 gap-8">
              <div>
                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">DISPATCH FROM</h4>
                <div className="text-sm text-slate-700 space-y-0.5 leading-relaxed">
                  {formatAddress(bill.dispatchFrom).map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">BILL FROM</h4>
                <div className="text-sm text-slate-700 space-y-0.5 leading-relaxed">
                  {formatAddress(bill.billFrom).map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">BILL TO</h4>
                <div className="text-sm text-slate-700 space-y-0.5 leading-relaxed">
                  {formatAddress(bill.billTo).map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">SHIP TO</h4>
                <div className="text-sm text-slate-700 space-y-0.5 leading-relaxed">
                  {formatAddress(bill.shipTo).map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg border p-6 space-y-4 shadow-sm">
            <h3 className="font-semibold text-lg text-slate-900 border-b pb-2">Transportation Details</h3>

            <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
              <div>
                <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Place of Delivery</span>
                <p className="font-medium text-slate-700">{bill.placeOfDelivery || '-'}</p>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Transporter</span>
                <p className="font-medium capitalize text-slate-700">{bill.transporter?.replace('_', ' ') || '-'}</p>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Distance</span>
                <p className="font-medium text-slate-700">{bill.distance || 0} km</p>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Mode of Transportation</span>
                <p className="font-medium capitalize text-slate-700">{bill.modeOfTransportation?.replace('_', ' ') || '-'}</p>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Vehicle Type</span>
                <p className="font-medium capitalize text-slate-700">{bill.vehicleType?.replace('_', ' ') || '-'}</p>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Vehicle Number</span>
                <p className="font-medium text-slate-700">{bill.vehicleNo || '-'}</p>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Transporter Doc No</span>
                <p className="font-medium text-slate-700">{bill.transporterDocNo || '-'}</p>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Transporter Doc Date</span>
                <p className="font-medium text-slate-700">{bill.transporterDocDate ? formatDate(bill.transporterDocDate) : '-'}</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 p-6 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-blue-900 uppercase tracking-wider mb-1">Total Bill Amount</h3>
              <p className="text-3xl font-bold text-blue-600">{formatCurrency(bill.total)}</p>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
