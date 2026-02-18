
import { useState, useEffect } from "react";
import { X, Edit, MoreHorizontal, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Item {
  id: string;
  name: string;
  purchaseDescription: string;
  purchaseRate: string;
  description: string;
  rate: string;
  hsnSac: string;
  usageUnit: string;
  type?: string;
  createdSource?: string;
  taxPreference?: string;
  intraStateTax?: string;
  interStateTax?: string;
  purchaseAccount?: string;
  salesAccount?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  preferredVendor?: string;
}

interface Transaction {
  id: string;
  date: string;
  quoteNumber: string;
  customerName: string;
  quantitySold: number;
  price: number;
  total: number;
  status: string;
  type: string;
}

interface HistoryEntry {
  id: string;
  date: string;
  details: string;
}

interface ItemDetailPanelProps {
  item: Item;
  onClose: () => void;
  onEdit?: () => void;
  onClone?: (item: Item) => void;
  onToggleActive?: (item: Item) => void;
  onDelete?: (item: Item) => void;
}



const getHistoryEntries = (item: Item): HistoryEntry[] => {
  return [
    {
      id: "1",
      date: item.createdAt
        ? new Date(item.createdAt).toLocaleString('en-IN', {
          month: '2-digit',
          day: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        })
        : new Date().toLocaleString('en-IN', {
          month: '2-digit',
          day: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }),
      details: "created by - Rohan Bhosale"
    }
  ];
};

export default function ItemDetailPanel({ item, onClose, onEdit, onClone, onToggleActive, onDelete }: ItemDetailPanelProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [filterBy, setFilterBy] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [transactionsData, setTransactionsData] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchTransactions = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/items/${item.id}/transactions`, {
          headers: {
            'x-organization-id': localStorage.getItem("organizationId") || "1"
          }
        });
        if (response.ok) {
          const result = await response.json();
          setTransactionsData(result.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch transactions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (item.id) {
      fetchTransactions();
    }
  }, [item.id]);

  const transactions = transactionsData.filter(t => {
    const typeMatch = filterBy === "all" || t.type === filterBy;
    const statusMatch = statusFilter === "all" || t.status.toLowerCase() === statusFilter.toLowerCase();
    return typeMatch && statusMatch;
  });
  const historyEntries = getHistoryEntries(item);

  const handleClone = () => {
    if (onClone) {
      onClone(item);
    }
  };

  const handleToggleActive = () => {
    if (onToggleActive) {
      onToggleActive(item);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(item);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white border-l border-slate-200 shadow-xl">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
        <h2 className="text-xl font-bold text-sidebar font-display">{item.name}</h2>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100" onClick={onEdit}>
            <Edit className="h-4 w-4 text-slate-500" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 gap-1 text-slate-500 hover:bg-slate-100">
                More <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleClone} data-testid="dropdown-clone-item">Clone Item</DropdownMenuItem>
              <DropdownMenuItem onClick={handleToggleActive} data-testid="dropdown-toggle-active">
                {item.isActive !== false ? "Mark as Inactive" : "Mark as Active"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-red-600" data-testid="dropdown-delete-item">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100" onClick={onClose}>
            <X className="h-4 w-4 text-slate-500" />
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <TabsList className="w-full justify-start rounded-none border-b border-slate-100 bg-white h-auto p-0 gap-8 flex-shrink-0 px-6">
          <TabsTrigger
            value="overview"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none shadow-none px-0 py-3 bg-transparent hover:bg-transparent transition-all font-display font-bold text-xs uppercase tracking-wider text-slate-400"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="transactions"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none shadow-none px-0 py-3 bg-transparent hover:bg-transparent transition-all font-display font-bold text-xs uppercase tracking-wider text-slate-400"
          >
            Transactions
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none shadow-none px-0 py-3 bg-transparent hover:bg-transparent transition-all font-display font-bold text-xs uppercase tracking-wider text-slate-400"
          >
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="flex-1 overflow-y-auto scrollbar-hide p-6 mt-0">
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-[160px_1fr] gap-y-3 text-sm">
                <span className="text-slate-500">Item Type</span>
                <span className="text-slate-900">Sales and Purchase Items</span>

                <span className="text-slate-500">HSN Code</span>
                <span className="text-slate-900 font-display">{item.hsnSac || "-"}</span>

                <span className="text-slate-500">Unit</span>
                <span className="text-slate-900">{item.usageUnit || "kg"}</span>

                <span className="text-slate-500">Created Source</span>
                <span className="text-slate-900">{item.createdSource || "User"}</span>

                <span className="text-slate-500">Tax Preference</span>
                <span className="text-slate-900">{item.taxPreference || "Tax Exempt"}</span>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-6">
              <h3 className="text-base font-semibold text-sidebar mb-4 font-display">Purchase Information</h3>
              <div className="grid grid-cols-[160px_1fr] gap-y-3 text-sm">
                <span className="text-slate-500">Cost Price</span>
                <span className="text-slate-900 font-medium font-display">₹{item.purchaseRate || "0.00"}</span>

                <span className="text-slate-500">Purchase Account</span>
                <span className="text-slate-900">{item.purchaseAccount || "Cost of Goods Sold"}</span>

                {/* <span className="text-slate-500">Preferred Vendor</span> */}
                {/* <span className="text-sidebar hover:text-sidebar/80 transition-colors cursor-pointer font-semibold">{item.preferredVendor || "SUCCESSIVE TECHNOLOGIES PVT. LTD."}</span> */}
              </div>
            </div>

            <div className="border-t border-slate-200 pt-6">
              <h3 className="text-base font-semibold text-sidebar mb-4 font-display">Sales Information</h3>
              <div className="grid grid-cols-[160px_1fr] gap-y-3 text-sm">
                <span className="text-slate-500">Selling Price</span>
                <span className="text-slate-900 font-medium font-display">₹{item.rate || "0.00"}</span>

                <span className="text-slate-500">Sales Account</span>
                <span className="text-slate-900">{item.salesAccount || "Sales"}</span>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-6">
              <h3 className="text-base font-semibold text-sidebar mb-4 font-display">Reporting Tags</h3>
              <p className="text-sm text-slate-500">No reporting tag has been associated with this item.</p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="flex-1 overflow-y-auto scrollbar-hide mt-0">
          <div className="p-4 border-b border-slate-200 flex items-center gap-4 px-6">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500 font-medium">Filter By:</span>
              <Select value={filterBy} onValueChange={setFilterBy}>
                <SelectTrigger className="w-[120px] h-8 text-sidebar font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="quotes">Quotes</SelectItem>
                  <SelectItem value="invoices">Invoices</SelectItem>
                  <SelectItem value="orders">Orders</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500 font-medium">Status:</span>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[100px] h-8 text-sidebar font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 border-b border-slate-200">
                <TableHead className="text-[10px] font-bold text-slate-500 h-9 font-display pl-6 uppercase tracking-wider">DATE</TableHead>
                <TableHead className="text-[10px] font-bold text-slate-500 h-9 font-display uppercase tracking-wider">QUOTE NUMBER</TableHead>
                <TableHead className="text-[10px] font-bold text-slate-500 h-9 font-display uppercase tracking-wider">CUSTOMER NAME</TableHead>
                <TableHead className="text-[10px] font-bold text-slate-500 h-9 font-display uppercase tracking-wider">QTY</TableHead>
                <TableHead className="text-[10px] font-bold text-slate-500 h-9 font-display text-right uppercase tracking-wider">PRICE</TableHead>
                <TableHead className="text-[10px] font-bold text-slate-500 h-9 font-display text-right pr-6 uppercase tracking-wider">TOTAL</TableHead>
                <TableHead className="text-[10px] font-bold text-slate-500 h-9 font-display uppercase tracking-wider">STATUS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-slate-500 py-8 pl-6">
                    Loading transactions...
                  </TableCell>
                </TableRow>
              ) : transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-slate-500 py-8 pl-6">
                    No transactions found
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((transaction) => (
                  <TableRow key={transaction.id} className="hover:bg-accent/40 transition-colors">
                    <TableCell className="text-sm pl-6 font-display">{transaction.date}</TableCell>
                    <TableCell className="text-sm text-sidebar font-semibold hover:underline cursor-pointer font-display">{transaction.quoteNumber}</TableCell>
                    <TableCell className="text-sm">{transaction.customerName}</TableCell>
                    <TableCell className="text-sm font-display">{transaction.quantitySold.toFixed(2)}</TableCell>
                    <TableCell className="text-sm text-right font-display whitespace-nowrap">₹{transaction.price.toFixed(2)}</TableCell>
                    <TableCell className="text-sm text-right pr-6 font-display whitespace-nowrap">₹{transaction.total.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="text-sidebar border-sidebar/20 bg-sidebar/5 font-semibold"
                      >
                        {transaction.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="history" className="flex-1 overflow-y-auto scrollbar-hide mt-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 border-b border-slate-200">
                <TableHead className="text-[10px] font-bold text-slate-500 h-9 font-display pl-6 uppercase tracking-wider w-[200px]">DATE</TableHead>
                <TableHead className="text-[10px] font-bold text-slate-500 h-9 font-display uppercase tracking-wider">DETAILS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {historyEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-slate-500 py-8 pl-6">
                    No history found
                  </TableCell>
                </TableRow>
              ) : (
                historyEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-sm pl-6 font-display">{entry.date}</TableCell>
                    <TableCell className="text-sm">{entry.details}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>
    </div>
  );
}