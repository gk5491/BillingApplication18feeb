import { useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, MoreHorizontal, ChevronDown, ArrowUpDown, Import, Download, Settings, RefreshCw, RotateCcw, FileText, CheckSquare, History, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { usePagination } from "@/hooks/use-pagination";
import { TablePagination } from "@/components/table-pagination";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";

interface Item {
  id: string;
  name: string;
  type: string;
  hsnSac: string;
  usageUnit: string;
  rate: string;
  purchaseRate: string;
  description: string;
  purchaseDescription: string;
  taxPreference: string;
  intraStateTax: string;
  interStateTax: string;
  salesAccount: string;
  purchaseAccount: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

type FilterStatus = 'all' | 'active' | 'inactive';

const filterOptions: { label: string; value: FilterStatus }[] = [
  { label: "All Items", value: "all" },
  { label: "Active Items", value: "active" },
  { label: "Inactive Items", value: "inactive" },
];

export default function Products() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [showItemDetail, setShowItemDetail] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch items from API with status filter
  const { data: itemsData, isLoading, refetch } = useQuery<{ success: boolean; data: Item[] }>({
    queryKey: ['/api/items', filterStatus],
    queryFn: async () => {
      const response = await fetch(`/api/items?status=${filterStatus}`);
      return response.json();
    }
  });

  const items = itemsData?.data || [];

  const filteredItems = items.filter((item: Item) => {
    const matchesFilter = filterStatus === 'all' ||
      (filterStatus === 'active' && item.isActive) ||
      (filterStatus === 'inactive' && !item.isActive);

    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  // Clone item mutation
  const cloneItemMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('POST', `/api/items/${id}/clone`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/items'] });
      toast({ title: "Item cloned successfully" });
    },
    onError: () => {
      toast({ title: "Failed to clone item", variant: "destructive" });
    },
  });

  // Delete item mutation
  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/items/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/items'] });
      toast({ title: "Item deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete item", variant: "destructive" });
    },
  });

  // Toggle item status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return apiRequest('PATCH', `/api/items/${id}/status`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/items'] });
      toast({ title: "Item status updated" });
    },
    onError: () => {
      toast({ title: "Failed to update item status", variant: "destructive" });
    },
  });

  const { currentPage, totalPages, totalItems, itemsPerPage, paginatedItems, goToPage } = usePagination(filteredItems, 10);

  const toggleSelectAll = () => {
    if (selectedItems.length === items.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(items.map(item => item.id));
    }
  };

  const toggleSelectItem = (id: string) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(i => i !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  const handleItemClick = (item: Item) => {
    setSelectedItem(item);
    setShowItemDetail(true);
  };

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '₹0.00';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(num);
  };

  const getCurrentFilterLabel = () => {
    const option = filterOptions.find(o => o.value === filterStatus);
    return option?.label || "All Items";
  };

  return (
    <div className="flex h-screen animate-in fade-in duration-300 w-full overflow-hidden bg-slate-50">
      <ResizablePanelGroup key={selectedItem ? "split" : "single"} direction="horizontal" className="h-full w-full">
        <ResizablePanel
          defaultSize={selectedItem ? 33 : 100}
          minSize={selectedItem ? 33 : 100}
          maxSize={selectedItem ? 33 : 100}
          className="flex flex-col overflow-hidden bg-white min-w-[25%]"
        >
          <div className="flex flex-col h-full overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white sticky top-0 z-10 min-h-[73px] h-auto">
              <div className="flex items-center gap-4 flex-1 overflow-hidden">
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide flex-1">
                  <DropdownMenu open={filterOpen} onOpenChange={setFilterOpen}>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="gap-2 p-0 hover:bg-transparent transition-all text-left whitespace-normal h-auto" data-testid="dropdown-items-filter">
                        <span className={cn(
                          "font-bold text-[#002e46] transition-all line-clamp-2 font-display",
                          selectedItem ? "text-lg lg:text-xl" : "text-xl"
                        )}>
                          {getCurrentFilterLabel()}
                        </span>
                        <ChevronDown className="h-4 w-4 text-slate-500 shrink-0" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                      {filterOptions.map((option) => (
                        <DropdownMenuItem
                          key={option.value}
                          onClick={() => {
                            setFilterStatus(option.value);
                            setFilterOpen(false);
                          }}
                          className={filterStatus === option.value ? "bg-blue-50 text-blue-600 font-medium" : ""}
                          data-testid={`filter-option-${option.value}`}
                        >
                          {option.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  {!selectedItem && <span className="text-sm text-slate-400 shrink-0">({items.length})</span>}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {selectedItem ? (
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
                      data-testid="button-search-compact"
                      onClick={() => setIsSearchVisible(true)}
                    >
                      <Search className="h-4 w-4 text-slate-500" />
                    </Button>
                  )
                ) : (
                  <div className="relative w-[240px] hidden sm:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 h-9"
                      data-testid="input-search-items"
                    />
                  </div>
                )}

                <Button
                  onClick={() => setLocation("/products/new")}
                  className={cn(
                    "bg-[#002e46] hover:bg-[#002e46]/90 text-white gap-1.5 h-9 font-semibold font-display shadow-sm transition-all",
                    selectedItem && "w-9 px-0"
                  )}
                  size={selectedItem ? "icon" : "default"}
                  data-testid="button-new-item"
                >
                  <Plus className="h-4 w-4" />
                  {!selectedItem && <span>New</span>}
                </Button>
                {!selectedItem && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" className="h-9 w-9" data-testid="button-more-options">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          <ArrowUpDown className="mr-2 h-4 w-4" />
                          Sort by
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                          <DropdownMenuItem>Name</DropdownMenuItem>
                          <DropdownMenuItem>Purchase Rate</DropdownMenuItem>
                          <DropdownMenuItem>Rate</DropdownMenuItem>
                          <DropdownMenuItem>HSN/SAC</DropdownMenuItem>
                          <DropdownMenuItem>Last Modified Time</DropdownMenuItem>
                          <DropdownMenuItem>Created Time</DropdownMenuItem>
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                      <DropdownMenuItem>
                        <Import className="mr-2 h-4 w-4" />
                        Import Items
                      </DropdownMenuItem>
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          <Download className="mr-2 h-4 w-4" />
                          Export
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                          <DropdownMenuItem>Export as CSV</DropdownMenuItem>
                          <DropdownMenuItem>Export as Excel</DropdownMenuItem>
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => refetch()}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Refresh List
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Settings className="mr-2 h-4 w-4" />
                        Preferences
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Reset Column Width
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <FileText className="mr-2 h-4 w-4" />
                        Update New GST Rates
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <CheckSquare className="mr-2 h-4 w-4" />
                        Validate HSN/SAC
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <History className="mr-2 h-4 w-4" />
                        HSN/SAC Update History
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>

            {/* Mobile Search Bar - Hidden when item selected to maintain consistency */}
            {!selectedItem && (
              <div className="px-4 py-3 flex items-center gap-2 border-b border-slate-200 bg-white sm:hidden">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 h-9"
                    data-testid="input-search-mobile"
                  />
                </div>
              </div>
            )}

            <div className="flex-1 flex flex-col min-h-0">
              <div className={`flex-1 overflow-auto scrollbar-hide ${selectedItem ? '' : 'p-4 space-y-4'}`}>

                {selectedItem ? (
                  /* List View when item selected */
                  isLoading ? (
                    <div className="p-4 space-y-3">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-16 w-full rounded-lg" />
                      ))}
                    </div>
                  ) : items.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">No items found</div>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredItems.map((item) => (
                        <div
                          key={item.id}
                          className={`p-4 hover:bg-slate-50 cursor-pointer transition-colors ${selectedItem?.id === item.id ? 'bg-blue-50 border-l-2 border-l-[#002e46]' : ''}`}
                          onClick={() => handleItemClick(item)}
                        >
                          <div className="flex-1 min-w-0">
                            <div className={`font-semibold font-display ${selectedItem?.id === item.id ? 'text-[#002e46]' : 'text-slate-900'}`}>
                              {item.name}
                            </div>
                            <div className="text-sm text-slate-500 truncate font-display">{item.description || item.purchaseDescription || '-'}</div>
                            <div className="text-xs text-[#002e46]/60 mt-1 font-display font-medium">{formatCurrency(item.rate)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  /* Table View when no item selected */
                  <div className="border border-slate-200 rounded-lg bg-white overflow-hidden">
                    {isLoading ? (
                      <div className="p-4 space-y-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div key={i} className="flex gap-4">
                            <Skeleton className="h-4 w-4" />
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-4 w-48" />
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-4 w-48" />
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-16" />
                          </div>
                        ))}
                      </div>
                    ) : items.length === 0 ? (
                      <div className="p-12 text-center">
                        <div className="text-slate-400 text-lg mb-2">No items found</div>
                        <p className="text-slate-500 text-sm">
                          {filterStatus === 'active'
                            ? "No active items found. Try viewing all items."
                            : filterStatus === 'inactive'
                              ? "No inactive items found. Try viewing all items."
                              : "Create your first item to get started."}
                        </p>
                        <Button
                          onClick={() => setLocation("/products/new")}
                          className="mt-4 bg-[#002e46] hover:bg-[#002e46]/90 text-white font-display"
                          data-testid="button-create-first-item"
                        >
                          <Plus className="h-4 w-4 mr-2" /> Create Item
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                              <TableHead className="w-12">
                                <Checkbox
                                  checked={selectedItems.length === items.length && items.length > 0}
                                  onCheckedChange={toggleSelectAll}
                                  data-testid="checkbox-select-all"
                                  className="data-[state=checked]:bg-[#002e46] data-[state=checked]:border-[#002e46]"
                                />
                              </TableHead>
                              <TableHead className="font-bold text-[#002e46]/70 font-display text-[11px] uppercase tracking-wider">
                                <div className="flex items-center gap-1">
                                  NAME
                                  <ArrowUpDown className="h-3 w-3" />
                                </div>
                              </TableHead>
                              <TableHead className="font-bold text-[#002e46]/70 font-display text-[11px] uppercase tracking-wider">PURCHASE DESCRIPTION</TableHead>
                              <TableHead className="font-bold text-[#002e46]/70 font-display text-[11px] uppercase tracking-wider">PURCHASE RATE</TableHead>
                              <TableHead className="font-bold text-[#002e46]/70 font-display text-[11px] uppercase tracking-wider">DESCRIPTION</TableHead>
                              <TableHead className="font-bold text-[#002e46]/70 font-display text-[11px] uppercase tracking-wider">RATE</TableHead>
                              <TableHead className="font-bold text-[#002e46]/70 font-display text-[11px] uppercase tracking-wider">HSN/SAC</TableHead>
                              <TableHead className="font-bold text-[#002e46]/70 font-display text-[11px] uppercase tracking-wider">USAGE UNIT</TableHead>
                              <TableHead className="w-10"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {paginatedItems.map((item) => (
                              <TableRow
                                key={item.id}
                                className={`hover:bg-slate-50/50 cursor-pointer ${!item.isActive ? 'opacity-50' : ''}`}
                                onClick={() => handleItemClick(item)}
                                data-testid={`row-item-${item.id}`}
                              >
                                <TableCell onClick={(e) => e.stopPropagation()}>
                                  <Checkbox
                                    checked={selectedItems.includes(item.id)}
                                    onCheckedChange={() => toggleSelectItem(item.id)}
                                    data-testid={`checkbox-item-${item.id}`}
                                    className="data-[state=checked]:bg-[#002e46] data-[state=checked]:border-[#002e46]"
                                  />
                                </TableCell>
                                <TableCell className="font-semibold text-[#002e46] hover:text-[#002e46]/80 font-display">
                                  {item.name}
                                  {!item.isActive && <span className="ml-2 text-xs text-slate-500">(Inactive)</span>}
                                </TableCell>
                                <TableCell className="text-slate-600 font-display">{item.purchaseDescription || '-'}</TableCell>
                                <TableCell className="text-slate-600 font-display">{formatCurrency(item.purchaseRate)}</TableCell>
                                <TableCell className="text-slate-600 font-display">{item.description || '-'}</TableCell>
                                <TableCell className="text-slate-600 font-display">{formatCurrency(item.rate)}</TableCell>
                                <TableCell className="text-slate-600 font-display">{item.hsnSac || '-'}</TableCell>
                                <TableCell className="text-slate-600 font-display">{item.usageUnit || '-'}</TableCell>
                                <TableCell onClick={(e) => e.stopPropagation()}>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`button-item-menu-${item.id}`}>
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => setLocation(`/products/${item.id}/edit`)}>
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => cloneItemMutation.mutate(item.id)}>
                                        Clone Item
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => toggleStatusMutation.mutate({ id: item.id, isActive: !item.isActive })}>
                                        {item.isActive ? 'Mark as Inactive' : 'Mark as Active'}
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        className="text-red-600"
                                        onClick={() => deleteItemMutation.mutate(item.id)}
                                      >
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </>
                    )}
                  </div>
                )}
              </div>
              {!selectedItem && items.length > 0 && (
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

            </div>
          </div>
        </ResizablePanel>

        {selectedItem && showItemDetail && (
          <>
            <ResizableHandle withHandle className="w-1 bg-slate-200 hover:bg-blue-400 hover:w-1.5 transition-all cursor-col-resize" />
            <ResizablePanel defaultSize={65} minSize={30} className="bg-white">
              {/* Item Detail Panel */}
              <div className="h-full flex flex-col overflow-hidden bg-white">
                <div className="sticky top-0 bg-white border-b border-slate-200 p-4 z-10">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold" data-testid="item-detail-name">{selectedItem.name}</h2>
                    <div className="flex items-center gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="gap-1" data-testid="button-item-detail-more">
                            More <ChevronDown className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => cloneItemMutation.mutate(selectedItem.id)}>
                            Clone Item
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleStatusMutation.mutate({ id: selectedItem.id, isActive: !selectedItem.isActive })}>
                            {selectedItem.isActive ? 'Mark as Inactive' : 'Mark as Active'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => {
                              deleteItemMutation.mutate(selectedItem.id);
                              setShowItemDetail(false);
                              setSelectedItem(null);
                            }}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setShowItemDetail(false);
                          setSelectedItem(null);
                        }}
                        data-testid="button-close-detail"
                      >
                        <span className="sr-only">Close</span>
                        ×
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-auto scrollbar-hide p-4 space-y-6">
                  {/* Overview Tab */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-slate-500">Item Type</p>
                        <p className="font-medium capitalize" data-testid="item-detail-type">{selectedItem.type === 'goods' ? 'Sales and Purchase Items' : 'Service'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">HSN Code</p>
                        <p className="font-medium" data-testid="item-detail-hsn">{selectedItem.hsnSac || '-'}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-slate-500">Created Source</p>
                        <p className="font-medium">User</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Tax Preference</p>
                        <p className="font-medium capitalize" data-testid="item-detail-tax-pref">{selectedItem.taxPreference || 'taxable'}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-slate-500">Intra State Tax Rate</p>
                        <p className="font-medium" data-testid="item-detail-intra-tax">{selectedItem.intraStateTax || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Inter State Tax Rate</p>
                        <p className="font-medium" data-testid="item-detail-inter-tax">{selectedItem.interStateTax || '-'}</p>
                      </div>
                    </div>

                    <div className="border-t pt-4 mt-4">
                      <h3 className="font-medium mb-3">Purchase Information</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-slate-500">Cost Price</p>
                          <p className="font-medium" data-testid="item-detail-cost-price">{formatCurrency(selectedItem.purchaseRate)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">Purchase Account</p>
                          <p className="font-medium" data-testid="item-detail-purchase-account">{selectedItem.purchaseAccount || '-'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h3 className="font-medium mb-3">Sales Information</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-slate-500">Selling Price</p>
                          <p className="font-medium" data-testid="item-detail-selling-price">{formatCurrency(selectedItem.rate)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">Sales Account</p>
                          <p className="font-medium" data-testid="item-detail-sales-account">{selectedItem.salesAccount || '-'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  );
}
