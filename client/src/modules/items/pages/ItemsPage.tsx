import { useState, useEffect, type MouseEvent } from "react";
import { useLocation } from "wouter";
import { Plus, MoreHorizontal, ChevronDown, ArrowUpDown, Import, Download, Settings, RefreshCw, RotateCcw, FileText, CheckSquare, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import ItemDetailPanel from "../components/ItemDetailPanel";

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
}

import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

export default function ItemsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [items, setItems] = useState<Item[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null);
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [activeFilter, setActiveFilter] = useState<string>("All");

  useEffect(() => {
    fetchItems();
  }, []);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  // Filter items based on active filter
  const getFilteredItems = () => {
    switch (activeFilter) {
      case "Active":
        return items.filter(item => item.isActive !== false);
      case "Inactive":
        return items.filter(item => item.isActive === false);
      case "Sales":
        return items.filter(item => item.type === "sales" || item.salesAccount);
      case "Purchases":
        return items.filter(item => item.type === "purchases" || item.purchaseAccount);
      case "Services":
        return items.filter(item => item.type === "service" || item.type === "services");
      case "Zoho CRM":
        return items.filter(item => item.createdSource === "zoho_crm");
      case "All":
      default:
        return items;
    }
  };

  const filteredAndSortedItems = [...getFilteredItems()].sort((a, b) => {
    const fieldA = (a as any)[sortBy] || "";
    const fieldB = (b as any)[sortBy] || "";

    if (fieldA < fieldB) return sortOrder === "asc" ? -1 : 1;
    if (fieldA > fieldB) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const handleExport = (type: string) => {
    toast({
      title: "Export Started",
      description: `Your items are being exported as ${type}.`,
    });
  };

  const handleImport = () => {
    toast({
      title: "Import Items",
      description: "Redirecting to import flow...",
    });
  };

  const handlePreferences = () => {
    toast({
      title: "Preferences",
      description: "Opening items preferences...",
    });
  };

  const handleResetColumnWidth = () => {
    toast({
      title: "Columns Reset",
      description: "Table column widths have been reset to default.",
    });
  };

  const handleUpdateGSTRates = () => {
    toast({
      title: "Update GST Rates",
      description: "Checking for new GST rate updates...",
    });
  };

  const handleValidateHSN = () => {
    toast({
      title: "Validation Started",
      description: "Validating HSN/SAC codes for all items.",
    });
  };

  const handleHSNHistory = () => {
    toast({
      title: "HSN Update History",
      description: "Fetching HSN/SAC update history...",
    });
  };

  const fetchItems = async () => {
    try {
      const response = await fetch('/api/items');
      if (response.ok) {
        const data = await response.json();
        setItems(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch items:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedItems.length === items.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(items.map(item => item.id));
    }
  };

  const toggleSelectItem = (id: string, e: MouseEvent) => {
    e.stopPropagation();
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(i => i !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  const handleItemClick = (item: Item) => {
    setSelectedItem(item);
  };

  const handleClosePanel = () => {
    setSelectedItem(null);
  };

  const handleEditItem = () => {
    if (selectedItem) {
      setLocation(`/items/${selectedItem.id}/edit`);
    }
  };

  const handleCloneItem = async (item: Item) => {
    try {
      const response = await fetch(`/api/items/${item.id}/clone`, {
        method: 'POST',
      });
      if (response.ok) {
        toast({
          title: "Item Cloned",
          description: `"${item.name}" has been cloned successfully.`,
        });
        setSelectedItem(null);
        fetchItems();
      } else {
        throw new Error("Failed to clone item");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clone item. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (item: Item) => {
    try {
      const newStatus = item.isActive === false ? true : false;
      const response = await fetch(`/api/items/${item.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newStatus }),
      });
      if (response.ok) {
        const updatedItem = await response.json();
        toast({
          title: newStatus ? "Item Activated" : "Item Deactivated",
          description: `"${item.name}" has been marked as ${newStatus ? "active" : "inactive"}.`,
        });
        setSelectedItem(updatedItem);
        fetchItems();
      } else {
        throw new Error("Failed to update item status");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update item status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteItem = (item: Item) => {
    setItemToDelete(item);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      const response = await fetch(`/api/items/${itemToDelete.id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        toast({
          title: "Item Deleted",
          description: `"${itemToDelete.name}" has been deleted.`,
        });
        setSelectedItem(null);
        setShowDeleteDialog(false);
        setItemToDelete(null);
        fetchItems();
      } else {
        throw new Error("Failed to delete item");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete item. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex h-screen animate-in fade-in duration-300 w-full overflow-hidden">
      <ResizablePanelGroup
        key={selectedItem ? "split" : "single"}
        direction="horizontal"
        className="flex-1 w-full"
      >
        <ResizablePanel
          defaultSize={selectedItem ? 33 : 100}
          minSize={selectedItem ? 25 : 100}
          maxSize={selectedItem ? 75 : 100}
          className="min-w-[25%]"
        >
          <div className="flex flex-col h-full overflow-hidden w-full">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white sticky top-0 z-10 min-h-[73px] h-auto px-6">
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 text-lg font-bold text-sidebar hover:text-primary transition-colors text-left whitespace-normal font-display group">
                      <span className="line-clamp-2">{activeFilter} Items</span>
                      <ChevronDown className="h-4 w-4 text-sidebar/40 group-hover:text-primary shrink-0 transition-colors" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    <DropdownMenuItem onClick={() => setActiveFilter("All")}>
                      All
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setActiveFilter("Active")}>
                      Active
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setActiveFilter("Inactive")}>
                      Inactive
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setActiveFilter("Sales")}>
                      Sales
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setActiveFilter("Purchases")}>
                      Purchases
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setActiveFilter("Services")}>
                      Services
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setActiveFilter("Zoho CRM")}>
                      Zoho CRM
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setLocation("/items/create")}
                  className="bg-sidebar hover:bg-sidebar/90 text-white gap-1 sm:gap-1.5 h-9 font-display font-semibold transition-all shadow-sm"
                >
                  <Plus className="h-4 w-4" /> <span className="hidden sm:inline">New</span>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="h-9 w-9">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <ArrowUpDown className="mr-2 h-4 w-4" />
                        Sort by
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="bg-white">
                        <DropdownMenuItem onClick={() => handleSort("name")}>Name</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSort("purchaseRate")}>Purchase Rate</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSort("rate")}>Rate</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSort("hsnSac")}>HSN/SAC</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSort("updatedAt")}>Last Modified Time</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSort("createdAt")}>Created Time</DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuItem onClick={handleImport}>
                      <Import className="mr-2 h-4 w-4" />
                      Import Items
                    </DropdownMenuItem>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <Download className="mr-2 h-4 w-4" />
                        Export
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="bg-white">
                        <DropdownMenuItem onClick={() => handleExport("CSV")}>Export as CSV</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExport("Excel")}>Export as Excel</DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handlePreferences}>
                      <Settings className="mr-2 h-4 w-4" />
                      Preferences
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={fetchItems}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Refresh List
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleResetColumnWidth}>
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Reset Column Width
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleUpdateGSTRates}>
                      <FileText className="mr-2 h-4 w-4" />
                      Update New GST Rates
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleValidateHSN}>
                      <CheckSquare className="mr-2 h-4 w-4" />
                      Validate HSN/SAC
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleHSNHistory}>
                      <History className="mr-2 h-4 w-4" />
                      HSN/SAC Update History
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="flex-1 overflow-auto scrollbar-hide">
              {loading ? (
                <div className="p-8 text-center text-slate-500">Loading items...</div>
              ) : items.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  <p>No items found.</p>
                  <Button
                    onClick={() => setLocation("/items/create")}
                    className="mt-4 bg-sidebar hover:bg-sidebar/90 font-display font-semibold transition-all shadow-sm"
                  >
                    <Plus className="h-4 w-4 mr-2" /> Create your first item
                  </Button>
                </div>
              ) : (
                <table className="w-full text-sm table-fixed border-separate border-spacing-0">
                  <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                    <tr>
                      <th className="w-10 px-2 md:px-4 py-3 border-b text-center">
                        <Checkbox
                          checked={selectedItems.length === items.length && items.length > 0}
                          onCheckedChange={toggleSelectAll}
                          className="data-[state=checked]:bg-sidebar data-[state=checked]:border-sidebar border-slate-300"
                        />
                      </th>
                      <th className="px-2 md:px-4 py-3 border-b text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider w-24 md:w-auto font-display">
                        NAME
                      </th>
                      {!selectedItem && (
                        <>
                          <th className="hidden lg:table-cell px-2 md:px-4 py-3 border-b text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider font-display">
                            PURCHASE DESCRIPTION
                          </th>
                          <th className="hidden md:table-cell px-2 md:px-4 py-3 border-b text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right font-display">
                            PURCHASE RATE
                          </th>
                          <th className="hidden xl:table-cell px-2 md:px-4 py-3 border-b text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider font-display">
                            DESCRIPTION
                          </th>
                        </>
                      )}
                      <th className="px-2 md:px-4 py-3 border-b text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider font-display">
                        RATE
                      </th>
                      {!selectedItem && (
                        <>
                          <th className="hidden md:table-cell px-2 md:px-4 py-3 border-b text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider font-display">
                            HSN/SAC
                          </th>
                          <th className="hidden lg:table-cell px-2 md:px-4 py-3 border-b text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider font-display">
                            USAGE UNIT
                          </th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                    {filteredAndSortedItems.map((item) => (
                      <tr
                        key={item.id}
                        className={`hover:bg-slate-50 cursor-pointer transition-colors group ${selectedItem?.id === item.id ? 'bg-primary/5' : ''
                          }`}
                        onClick={() => handleItemClick(item)}
                      >
                        <td className="px-2 md:px-4 py-3 border-b border-slate-100 text-center">
                          <Checkbox
                            checked={selectedItems.includes(item.id)}
                            onCheckedChange={() => { }}
                            onClick={(e) => toggleSelectItem(item.id, e as MouseEvent)}
                            className="data-[state=checked]:bg-sidebar data-[state=checked]:border-sidebar border-slate-300"
                          />
                        </td>
                        <td className="px-2 md:px-4 py-3 border-b border-slate-100">
                          <div className="text-sm font-medium text-sidebar group-hover:text-primary transition-colors truncate max-w-[80px] md:max-w-none font-display">
                            {item.name}
                          </div>
                        </td>
                        {!selectedItem && (
                          <>
                            <td className="hidden lg:table-cell px-2 md:px-4 py-3 border-b border-slate-100">
                              <div className="text-sm text-slate-600 truncate max-w-[150px]">
                                {item.purchaseDescription || '-'}
                              </div>
                            </td>
                            <td className="hidden md:table-cell px-2 md:px-4 py-3 text-right border-b border-slate-100">
                              <div className="text-sm text-slate-900">
                                {item.purchaseRate ? `₹${item.purchaseRate}` : '-'}
                              </div>
                            </td>
                            <td className="hidden xl:table-cell px-2 md:px-4 py-3 border-b border-slate-100">
                              <div className="text-sm text-slate-600 truncate max-w-[150px]">
                                {item.description || '-'}
                              </div>
                            </td>
                          </>
                        )}
                        <td className="px-2 md:px-4 py-3 text-right border-b border-slate-100">
                          <div className="text-sm text-sidebar font-semibold font-display">
                            {item.rate ? `₹${item.rate}` : '₹0.00'}
                          </div>
                        </td>
                        {!selectedItem && (
                          <>
                            <td className="hidden md:table-cell px-2 md:px-4 py-3 border-b border-slate-100">
                              <div className="text-sm text-slate-900 font-display">
                                {item.hsnSac || '-'}
                              </div>
                            </td>
                            <td className="hidden lg:table-cell px-2 md:px-4 py-3 border-b border-slate-100">
                              <div className="text-sm text-slate-500">
                                {item.usageUnit || '-'}
                              </div>
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
        </ResizablePanel>

        {selectedItem && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={65} minSize={30}>
              <div className="h-full overflow-hidden">
                <ItemDetailPanel
                  item={selectedItem}
                  onClose={handleClosePanel}
                  onEdit={handleEditItem}
                  onClone={handleCloneItem}
                  onToggleActive={handleToggleActive}
                  onDelete={handleDeleteItem}
                />
              </div>
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{itemToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setItemToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
