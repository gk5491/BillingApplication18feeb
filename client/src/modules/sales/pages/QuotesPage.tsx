import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  Plus,
  MoreHorizontal,
  ChevronDown,
  Search,
  Filter,
  ArrowUpDown,
  ChevronRight,
  Download,
  Upload,
  Settings,
  Columns,
  RefreshCw,
  RotateCcw,
  FileText,
  Ban
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { usePagination } from "@/hooks/use-pagination";
import { TablePagination } from "@/components/table-pagination";
import QuoteDetailPanel from "../components/QuoteDetailPanel";

import { useToast } from "@/hooks/use-toast";

interface QuoteListItem {
  id: string;
  date: string;
  quoteNumber: string;
  referenceNumber: string;
  customerName: string;
  status: string;
  convertedTo?: string;
  total: number;
}

interface QuoteDetail {
  id: string;
  quoteNumber: string;
  referenceNumber: string;
  date: string;
  expiryDate: string;
  customerId: string;
  customerName: string;
  billingAddress: {
    street: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
  };
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
  };
  salesperson: string;
  projectName: string;
  subject: string;
  placeOfSupply: string;
  pdfTemplate: string;
  items: any[];
  subTotal: number;
  shippingCharges: number;
  cgst: number;
  sgst: number;
  igst: number;
  adjustment: number;
  total: number;
  customerNotes: string;
  termsAndConditions: string;
  status: string;
  emailRecipients: string[];
  createdAt: string;
  activityLogs: any[];
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'approved':
    case 'accepted':
      return 'bg-green-50 text-green-700 border-green-200 font-display font-bold text-[10px] uppercase tracking-wider';
    case 'sent':
      return 'bg-sidebar/5 text-sidebar border-sidebar/20 font-display font-bold text-[10px] uppercase tracking-wider';
    case 'draft':
      return 'bg-slate-50 text-slate-600 border-slate-200 font-display font-bold text-[10px] uppercase tracking-wider';
    case 'scrapped':
    case 'declined':
    case 'expired':
      return 'bg-red-50 text-red-700 border-red-200 font-display font-bold text-[10px] uppercase tracking-wider';
    case 'converted':
      return 'bg-purple-50 text-purple-700 border-purple-200 font-display font-bold text-[10px] uppercase tracking-wider';
    default:
      return 'bg-slate-50 text-slate-600 border-slate-200 font-display font-bold text-[10px] uppercase tracking-wider';
  }
};

const getStatusDisplayText = (status: string, convertedTo?: string) => {
  const lowerStatus = status.toLowerCase();
  if (lowerStatus === 'converted') {
    if (convertedTo === 'invoice') {
      return 'Converted To Invoice';
    } else if (convertedTo === 'sales-order') {
      return 'Converted To Sales Order';
    }
    return 'Converted';
  }
  if (lowerStatus === 'sent') {
    return 'Quotation Sent';
  }
  if (lowerStatus === 'draft') {
    return 'Draft';
  }
  if (lowerStatus === 'approved' || lowerStatus === 'accepted') {
    return 'Approved';
  }
  if (lowerStatus === 'scrapped' || lowerStatus === 'declined' || lowerStatus === 'expired') {
    return 'Scrapped';
  }
  return status.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatCurrency = (amount: number) => {
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export default function QuotesPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [quotes, setQuotes] = useState<QuoteListItem[]>([]);
  const [selectedQuotes, setSelectedQuotes] = useState<string[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<QuoteDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const sortQuotes = (quoteList: QuoteListItem[]) => {
    return [...quoteList].sort((a, b) => {
      let aValue: any = a[sortBy as keyof QuoteListItem] || "";
      let bValue: any = b[sortBy as keyof QuoteListItem] || "";

      if (sortBy === "created_at" || sortBy === "last_modified") {
        aValue = a.id; // Using ID as proxy
        bValue = b.id;
      }

      if (typeof aValue === "string") aValue = aValue.toLowerCase();
      if (typeof bValue === "string") bValue = bValue.toLowerCase();

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  };

  const fieldMapping: Record<string, string> = {
    "Created Time": "created_at",
    "Last Modified Time": "last_modified",
    "Date": "date",
    "Quote Number": "quoteNumber",
    "Customer Name": "customerName",
    "Amount": "total"
  };

  const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
    if (format === 'pdf') {
      toast({ title: "Generating PDF...", description: "Please wait while we prepare your document." });

      try {
        const { generatePDFFromElement } = await import("@/lib/pdf-utils");

        // Determine the target element and filename
        let elementId = "quotes-table-container";
        let fileName = `quotes_export_${new Date().getTime()}.pdf`;

        if (selectedQuote) {
          elementId = "quote-pdf-content";
          fileName = `Quote-${selectedQuote.quoteNumber}.pdf`;
        } else if (selectedQuotes.length > 0) {
          // If quotes are selected but no individual panel is open, we'll still export the table
          // but maybe we should filter it or show a message.
          // For now, we'll just export the table as is, which is what the user likely expects if they hit export.
        }

        // Ensure the element exists
        const element = document.getElementById(elementId);
        if (element) {
          await generatePDFFromElement(elementId, fileName);
          toast({ title: "Success", description: "PDF downloaded successfully." });
        } else {
          // Fallback to simple CSV-like PDF if element not found
          const exportData = selectedQuotes.length > 0 ? quotes.filter(q => selectedQuotes.includes(q.id)) : quotes;
          const content = "Date,Number,Customer,Status,Amount\n" + exportData.map(q => `${q.date},${q.quoteNumber},${q.customerName},${q.status},${q.total}`).join("\n");
          const blob = new Blob([content], { type: 'application/pdf' });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName;
          link.click();
          window.URL.revokeObjectURL(url);
        }
      } catch (error) {
        console.error("PDF Export Error:", error);
        toast({ title: "Export Failed", description: "There was an error generating the PDF.", variant: "destructive" });
      }
      return;
    }

    toast({ title: `Exporting as ${format.toUpperCase()}...`, description: "Preparing your document for download." });

    // In a real application, this would call a backend API to generate the file
    // For now, we'll simulate the download by creating a dummy file
    const fileName = `quotes_export_${new Date().getTime()}.${format === 'excel' ? 'xlsx' : format}`;
    const exportData = selectedQuotes.length > 0 ? quotes.filter(q => selectedQuotes.includes(q.id)) : quotes;
    const content = "Date,Number,Customer,Status,Amount\n" + exportData.map(q => `${q.date},${q.quoteNumber},${q.customerName},${q.status},${q.total}`).join("\n");
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    // Create a hidden input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.xlsx,.xls'; // Common spreadsheet formats
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        toast({
          title: "File Selected",
          description: `Importing ${file.name}... This feature will be fully implemented soon.`,
        });
      }
    };
    input.click();
  };

  const handlePreferences = () => {
    toast({ title: "Preferences", description: "This feature will be fully implemented soon." });
  };

  const handleManageCustomFields = () => {
    toast({ title: "Manage Custom Fields", description: "This feature will be fully implemented soon." });
  };

  const handleResetColumnWidth = () => {
    toast({ title: "Reset Column Width", description: "Columns have been reset to default widths." });
  };

  useEffect(() => {
    fetchQuotes();
    const checkCompact = () => {
      setIsCompact(window.innerWidth < 1280);
    };
    checkCompact();
    window.addEventListener('resize', checkCompact);
    return () => window.removeEventListener('resize', checkCompact);
  }, []);

  const fetchQuotes = async () => {
    try {
      const response = await fetch('/api/quotes');
      if (response.ok) {
        const data = await response.json();
        setQuotes(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuoteDetail = async (id: string) => {
    try {
      const response = await fetch(`/api/quotes/${id}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedQuote(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch quote detail:', error);
    }
  };

  const handleQuoteClick = (quote: QuoteListItem) => {
    fetchQuoteDetail(quote.id);
  };

  const handleClosePanel = () => {
    setSelectedQuote(null);
  };

  const handleEditQuote = () => {
    if (selectedQuote) {
      setLocation(`/quotes/${selectedQuote.id}/edit`);
    }
  };

  const handleDeleteQuote = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!window.confirm('Are you sure you want to delete this quote? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/quotes/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Close detail panel if the deleted quote was selected
        if (selectedQuote?.id === id) {
          setSelectedQuote(null);
        }
        // Refresh the quotes list
        fetchQuotes();
      } else {
        alert('Failed to delete quote. Please try again.');
      }
    } catch (error) {
      console.error('Failed to delete quote:', error);
      alert('Failed to delete quote. Please try again.');
    }
  };

  const toggleSelectQuote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedQuotes.includes(id)) {
      setSelectedQuotes(selectedQuotes.filter(i => i !== id));
    } else {
      setSelectedQuotes([...selectedQuotes, id]);
    }
  };

  const applyFilter = (quoteList: QuoteListItem[]) => {
    if (activeFilter === "All") return quoteList;
    return quoteList.filter(quote => {
      const status = quote.status.toLowerCase();
      switch (activeFilter) {
        case "Draft":
          return status === "draft";
        case "Approved":
          return status === "approved" || status === "accepted";
        case "Sent":
          return status === "sent";
        case "Scrapped":
          return status === "scrapped" || status === "declined" || status === "expired";
        case "Invoiced":
          return status === "invoiced" || status === "converted";
        default:
          return true;
      }
    });
  };

  const filteredQuotes = sortQuotes(applyFilter(quotes).filter(quote =>
    quote.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quote.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quote.referenceNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  ));

  const { currentPage, totalPages, totalItems, itemsPerPage, paginatedItems, goToPage } = usePagination(filteredQuotes, 10);

  return (
    <div className="flex h-screen animate-in fade-in duration-300 w-full overflow-hidden bg-slate-50">
      <ResizablePanelGroup key={`${selectedQuote ? "split" : "single"}-${isCompact ? "compact" : "full"}`} direction="horizontal" className="h-full w-full">
        {(!isCompact || !selectedQuote) && (
          <ResizablePanel
            defaultSize={isCompact ? 100 : (selectedQuote ? 29 : 100)}
            minSize={isCompact ? 100 : (selectedQuote ? 29 : 100)}
            maxSize={isCompact ? 100 : (selectedQuote ? 29 : 100)}
            className="flex flex-col overflow-hidden bg-white min-w-[25%]"
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white sticky top-0 z-10 min-h-[73px] h-auto">
              <div className="flex items-center gap-4 flex-1">
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-2 text-xl font-bold text-sidebar hover:text-sidebar/80 transition-colors text-left whitespace-normal font-display">
                        <span className="line-clamp-2">{activeFilter === "All" ? "All Quotes" : `${activeFilter} Quotes`}</span>
                        <ChevronDown className="h-4 w-4 text-sidebar/60 shrink-0" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                      {["All", "Draft", "Approved", "Sent", "Invoiced", "Scrapped"].map(filter => (
                        <DropdownMenuItem key={filter} onClick={() => setActiveFilter(filter)}>
                          {filter}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <span className="text-sm font-bold text-slate-400 font-display">({quotes.length})</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {selectedQuote ? (
                  isSearchVisible ? (
                    <div className="relative w-full max-w-[200px] animate-in slide-in-from-right-5 fade-in-0 duration-200">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        autoFocus
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onBlur={() => !searchTerm && setIsSearchVisible(false)}
                        className="pl-9 h-9"
                      />
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 px-0"
                      onClick={() => setIsSearchVisible(true)}
                    >
                      <Search className="h-4 w-4 text-slate-400" />
                    </Button>
                  )
                ) : (
                  <div className="relative w-[240px] hidden sm:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search quotes..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 h-9 border-slate-200 focus-visible:ring-sidebar/20 focus-visible:border-sidebar/50 font-display text-sm"
                    />
                  </div>
                )}

                <Button
                  onClick={() => setLocation("/quotes/new")}
                  className={`bg-sidebar hover:bg-sidebar/90 text-white h-9 gap-1.5 font-bold font-display shadow-sm hover:shadow-md transition-all ${selectedQuote ? 'w-9 px-0' : ''}`}
                  size={selectedQuote ? "icon" : "default"}
                >
                  <Plus className={`h-4 w-4 ${selectedQuote ? '' : ''}`} />
                  {!selectedQuote && "New"}
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="h-9 w-9">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger className="flex items-center gap-2 py-2 cursor-pointer hover:bg-slate-50 data-[state=open]:bg-slate-50">
                        <ArrowUpDown className="h-4 w-4 text-slate-500" />
                        <span className="flex-1 font-bold text-slate-700">Sort by</span>
                        <div className="flex items-center gap-0.5">
                          <ChevronRight className="h-4 w-4 text-slate-400" />
                          <ChevronRight className="h-4 w-4 text-slate-400 -ml-2.5" />
                        </div>
                      </DropdownMenuSubTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuSubContent className="w-48 p-0 border border-slate-200 shadow-lg">
                          {Object.keys(fieldMapping).map((label) => (
                            <DropdownMenuItem
                              key={label}
                              onClick={() => handleSort(fieldMapping[label])}
                              className={`flex items-center justify-between px-3 py-2 cursor-pointer ${sortBy === fieldMapping[label] ? 'bg-slate-100 text-slate-900 focus:bg-slate-100 focus:text-slate-900' : 'hover:bg-slate-50'}`}
                            >
                              <span className="font-bold text-slate-700">{label}</span>
                              {sortBy === fieldMapping[label] && (
                                <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${sortOrder === 'asc' ? 'rotate-180' : ''}`} />
                              )}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuSubContent>
                      </DropdownMenuPortal>
                    </DropdownMenuSub>

                    <DropdownMenuItem onClick={handleImport} className="flex items-center gap-2 py-2 cursor-pointer">
                      <Download className="h-4 w-4 text-slate-500" />
                      <span className="font-bold text-slate-700">Import Quotes</span>
                    </DropdownMenuItem>

                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger className="flex items-center gap-2 py-2 cursor-pointer hover:bg-slate-50 data-[state=open]:bg-slate-50">
                        <Upload className="h-4 w-4 text-slate-500" />
                        <span className="flex-1 font-bold text-slate-700">Export</span>
                        <div className="flex items-center gap-0.5">
                          <ChevronRight className="h-4 w-4 text-slate-400" />
                          <ChevronRight className="h-4 w-4 text-slate-400 -ml-2.5" />
                        </div>
                      </DropdownMenuSubTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuSubContent className="w-44 p-0 border border-slate-200 shadow-lg">
                          <DropdownMenuItem onClick={() => handleExport('pdf')} className="font-bold text-slate-700 py-2 cursor-pointer hover:bg-slate-50 flex justify-between items-center w-full">
                            <span>Export as PDF</span>
                            <ChevronRight className="h-4 w-4 text-slate-400" />
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleExport('excel')} className="font-bold text-slate-700 py-2 cursor-pointer hover:bg-slate-50 flex justify-between items-center w-full">
                            <span>Export as Excel</span>
                            <ChevronRight className="h-4 w-4 text-slate-400" />
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleExport('csv')} className="font-bold text-slate-700 py-2 cursor-pointer hover:bg-slate-50 flex justify-between items-center w-full">
                            <span>Export as CSV</span>
                            <ChevronRight className="h-4 w-4 text-slate-400" />
                          </DropdownMenuItem>
                        </DropdownMenuSubContent>
                      </DropdownMenuPortal>
                    </DropdownMenuSub>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem onClick={fetchQuotes} className="flex items-center gap-2 py-2 cursor-pointer">
                      <RefreshCw className="h-4 w-4 text-slate-500" />
                      <span className="font-bold text-slate-700">Refresh List</span>
                    </DropdownMenuItem>

                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="flex-1 overflow-auto scrollbar-hide" id="quotes-table-container">
              {loading ? (
                <div className="p-8 text-center text-slate-500">Loading quotes...</div>
              ) : filteredQuotes.length === 0 ? (
                <div className="p-8 text-center text-slate-500">No quotes found.</div>
              ) : selectedQuote ? (
                <div className="divide-y divide-slate-100">
                  {paginatedItems.map((quote) => (
                    <div
                      key={quote.id}
                      className={`p-4 hover:bg-slate-50 cursor-pointer transition-all border-l-2 ${selectedQuote.id === quote.id ? 'bg-sidebar/5 border-l-sidebar shadow-sm' : 'border-l-transparent'}`}
                      onClick={() => handleQuoteClick(quote)}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <div className={`font-bold font-display ${selectedQuote.id === quote.id ? 'text-sidebar' : 'text-slate-900'}`}>{quote.customerName}</div>
                        <div className="text-sm font-bold text-sidebar font-display">{formatCurrency(quote.total)}</div>
                      </div>
                      <div className="flex justify-between items-center text-xs text-slate-500 font-display">
                        <div className="font-medium">{quote.quoteNumber}</div>
                        <div className={`${getStatusColor(quote.status)} text-[9px] uppercase tracking-wider`}>
                          {getStatusDisplayText(quote.status, quote.convertedTo)}
                        </div>
                      </div>
                      <div className="text-[10px] font-bold text-slate-400 mt-1.5 uppercase tracking-widest font-display">{formatDate(quote.date)}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-sidebar-accent/5 sticky top-0 z-10">
                    <tr className="border-b border-slate-200">
                      <th className="px-4 py-3 text-left w-10">
                        <Checkbox
                          checked={selectedQuotes.length === filteredQuotes.length && filteredQuotes.length > 0}
                          onCheckedChange={(checked) => {
                            if (checked) setSelectedQuotes(filteredQuotes.map(q => q.id));
                            else setSelectedQuotes([]);
                          }}
                          className="data-[state=checked]:bg-sidebar data-[state=checked]:border-sidebar border-slate-300"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-[11px] font-bold text-sidebar/70 uppercase tracking-widest font-display">Date</th>
                      <th className="px-4 py-3 text-left text-[11px] font-bold text-sidebar/70 uppercase tracking-widest font-display">Number</th>
                      <th className="px-4 py-3 text-left text-[11px] font-bold text-sidebar/70 uppercase tracking-widest font-display">Customer</th>
                      <th className="px-4 py-3 text-left text-[11px] font-bold text-sidebar/70 uppercase tracking-widest font-display">Status</th>
                      <th className="px-4 py-3 text-right text-[11px] font-bold text-sidebar/70 uppercase tracking-widest font-display">Amount</th>
                      <th className="px-4 py-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedItems.map((quote) => (
                      <tr key={quote.id} className="group hover:bg-slate-50 cursor-pointer transition-colors" onClick={() => handleQuoteClick(quote)}>
                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedQuotes.includes(quote.id)}
                            onCheckedChange={() => toggleSelectQuote(quote.id, { stopPropagation: () => { } } as React.MouseEvent)}
                            className="data-[state=checked]:bg-sidebar data-[state=checked]:border-sidebar border-slate-300"
                          />
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600 font-display">{formatDate(quote.date)}</td>
                        <td className="px-4 py-3 text-sm font-bold text-sidebar font-display group-hover:underline">{quote.quoteNumber}</td>
                        <td className="px-4 py-3 text-sm font-bold text-slate-900 font-display">{quote.customerName}</td>
                        <td className="px-4 py-3">
                          <span className={`${getStatusColor(quote.status)} text-[10px] uppercase tracking-wider`}>
                            {getStatusDisplayText(quote.status, quote.convertedTo)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-bold text-sidebar font-display">{formatCurrency(quote.total)}</td>
                        <td className="px-4 py-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setLocation(`/quotes/${quote.id}/edit`); }}>Edit</DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setLocation(`/quotes/create?cloneFrom=${quote.id}`); }}>Clone</DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  try {
                                    const response = await fetch(`/api/flow/quotes/${quote.id}/scrap`, { method: 'POST' });
                                    if (response.ok) {
                                      toast({ title: "Quote Scrapped" });
                                      fetchQuotes();
                                    }
                                  } catch (err) {
                                    toast({ title: "Failed to scrap quote", variant: "destructive" });
                                  }
                                }}
                              >
                                <Ban className="h-4 w-4 mr-2 opacity-70" /> Scrap
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => handleDeleteQuote(quote.id, e)} className="text-red-600">Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {filteredQuotes.length > 0 && (
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
          </ResizablePanel>
        )}

        {selectedQuote && (
          <>
            {!isCompact && (
              <ResizableHandle withHandle className="w-1 bg-slate-200 hover:bg-blue-400 hover:w-1.5 transition-all cursor-col-resize" />
            )}
            <ResizablePanel defaultSize={isCompact ? 100 : 71} minSize={isCompact ? 100 : 30} className="bg-slate-50">
              <div className="h-full overflow-hidden">
                <QuoteDetailPanel
                  quote={selectedQuote}
                  onClose={handleClosePanel}
                  onEdit={handleEditQuote}
                  onRefresh={() => {
                    fetchQuotes();
                    setSelectedQuote(null);
                  }}
                />
              </div>
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  );
}
