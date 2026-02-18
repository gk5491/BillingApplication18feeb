import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { ArrowLeft, Edit, Trash2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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

interface Item {
  id: string;
  name: string;
  purchaseDescription: string;
  purchaseRate: string;
  description: string;
  rate: string;
  hsnSac: string;
  usageUnit: string;
  type: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function ItemDetailPage() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/items/:id");
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    if (params?.id) {
      fetchItem(params.id);
    }
  }, [params?.id]);

  const fetchItem = async (id: string) => {
    try {
      const response = await fetch(`/api/items/${id}`);
      if (response.ok) {
        const data = await response.json();
        setItem(data);
      } else {
        setLocation("/items");
      }
    } catch (error) {
      console.error("Failed to fetch item:", error);
      setLocation("/items");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!item) return;
    try {
      const response = await fetch(`/api/items/${item.id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setLocation("/items");
      }
    } catch (error) {
      console.error("Failed to delete item:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-slate-500">Loading item details...</div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-slate-500">Item not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/items")}
            className="hover:bg-slate-100"
          >
            <ArrowLeft className="h-5 w-5 text-slate-500" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-sidebar font-display">{item.name}</h1>
            <p className="text-xs text-slate-500 capitalize font-medium">{item.type || "Item"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            className="bg-sidebar hover:bg-sidebar/90 text-white font-display font-semibold transition-all h-9 px-4 shadow-sm"
            onClick={() => setLocation(`/items/${item.id}/edit`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Clone Item</DropdownMenuItem>
              <DropdownMenuItem>Mark as Inactive</DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-t-4 border-t-primary/80 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold text-sidebar font-display">Sales Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Selling Price</span>
              <span className="font-bold text-sidebar font-display">₹{item.rate || "₹0.00"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Description</span>
              <span className="font-medium text-right max-w-[200px]">
                {item.description || "-"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-sidebar/80 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold text-sidebar font-display">Purchase Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Purchase Price</span>
              <span className="font-bold text-sidebar font-display">₹{item.purchaseRate || "₹0.00"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Description</span>
              <span className="font-medium text-right max-w-[200px]">
                {item.purchaseDescription || "-"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-primary/60 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold text-sidebar font-display">Tax & Compliance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">HSN/SAC Code</span>
              <span className="font-bold text-sidebar font-display">{item.hsnSac || "-"}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-sidebar/60 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold text-sidebar font-display">Other Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-slate-500">Usage Unit</span>
              <span className="font-medium">{item.usageUnit || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Status</span>
              <span className={`font-medium ${item.isActive ? "text-green-600" : "text-slate-500"}`}>
                {item.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Created</span>
              <span className="font-medium">
                {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "-"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{item.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
