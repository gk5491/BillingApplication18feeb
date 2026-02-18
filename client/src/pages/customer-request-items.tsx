import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, Package, Plus, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Item {
    id: string;
    name: string;
    description?: string;
    sellingPrice: number;
    unit?: string;
}

interface NewItemRequest {
    itemName: string;
    description: string;
    quantity: number;
}

export default function RequestItemsPage() {
    const { token } = useAuthStore();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [cart, setCart] = useState<Record<string, number>>({});
    const [activeTab, setActiveTab] = useState("browse");

    // Fetch items
    const { data: itemsResponse, isLoading: itemsLoading } = useQuery<any>({
        queryKey: ["/api/items"],
    });

    const items = itemsResponse?.data?.map((item: any) => ({
        ...item,
        sellingPrice: parseFloat(item.rate || "0") || item.sellingPrice || 0,
        unit: item.usageUnit || item.unit || "pcs"
    }));

    // New item request form
    const { register, handleSubmit, reset, formState: { errors } } = useForm<NewItemRequest>();

    // Submit cart as quote request
    const requestMutation = useMutation({
        mutationFn: async (cartData: any[]) => {
            const res = await fetch("/api/flow/request", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ items: cartData })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to submit request");
            return data;
        },
        onSuccess: () => {
            toast({ title: "Success", description: "Quote request submitted successfully" });
            setCart({});
        },
        onError: (error: any) => {
            toast({ title: "Error", description: error.message || "Failed to submit request", variant: "destructive" });
        }
    });

    // Submit new item request
    const newItemMutation = useMutation({
        mutationFn: async (data: NewItemRequest) => {
            const res = await fetch("/api/flow/item-requests", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.message || "Failed to submit request");
            return result;
        },
        onSuccess: () => {
            toast({ title: "Success", description: "Item request submitted for admin approval" });
            reset();
        },
        onError: (error: any) => {
            toast({ title: "Error", description: error.message || "Failed to submit item request", variant: "destructive" });
        }
    });

    const addToCart = (itemId: string) => {
        setCart(prev => ({ ...prev, [itemId]: (prev[itemId] || 0) + 1 }));
    };

    const removeFromCart = (itemId: string) => {
        setCart(prev => {
            const newCart = { ...prev };
            if (newCart[itemId] > 1) {
                newCart[itemId]--;
            } else {
                delete newCart[itemId];
            }
            return newCart;
        });
    };

    const submitCart = () => {
        const itemsList = items?.filter((item: Item) => cart[item.id])
            .map((item: Item) => ({
                id: item.id,
                name: item.name,
                quantity: cart[item.id],
                rate: item.sellingPrice || 0,
                unit: item.unit || "pcs",
                description: item.description || ""
            })) || [];

        if (itemsList.length === 0) {
            toast({ title: "Cart Empty", description: "Please add items to your cart first", variant: "destructive" });
            return;
        }

        requestMutation.mutate(itemsList);
    };

    const onNewItemSubmit = (data: NewItemRequest) => {
        newItemMutation.mutate(data);
    };

    const cartItemCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0);

    // Fetch my requests
    const { data: myRequestsResponse, isLoading: requestsLoading } = useQuery<any>({
        queryKey: ["/api/flow/my-item-requests"],
        enabled: activeTab === "history"
    });

    const myRequests = myRequestsResponse?.data || [];

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "Approved":
                return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Approved</Badge>;
            case "Rejected":
                return <Badge variant="destructive">Rejected</Badge>;
            default:
                return <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100">Pending</Badge>;
        }
    };

    return (
        <div className="container mx-auto py-10 max-w-6xl">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold font-display tracking-tight">Request Items</h1>
                    <p className="text-slate-500">Browse our catalog or request new items</p>
                </div>
                {cartItemCount > 0 && activeTab === "browse" && (
                    <Button onClick={submitCart} size="lg" className="gap-2 shadow-lg hover:shadow-xl transition-all">
                        <ShoppingCart className="h-5 w-5" />
                        Submit Request ({cartItemCount} items)
                    </Button>
                )}
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 h-12 p-1 bg-slate-100/50 border">
                    <TabsTrigger value="browse" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <Package className="mr-2 h-4 w-4 text-blue-600" />
                        Browse Items
                    </TabsTrigger>
                    <TabsTrigger value="request" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <Plus className="mr-2 h-4 w-4 text-green-600" />
                        Request New Item
                    </TabsTrigger>
                    <TabsTrigger value="history" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <ShoppingCart className="mr-2 h-4 w-4 text-amber-600" />
                        My Requests
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="browse" className="space-y-4 mt-8">
                    {/* ... existing browse content ... */}
                    {itemsLoading ? (
                        <Card className="border-dashed">
                            <CardContent className="py-20 text-center text-slate-500">
                                <Plus className="h-8 w-8 mx-auto mb-4 animate-spin text-blue-200" />
                                Loading items...
                            </CardContent>
                        </Card>
                    ) : items && items.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {items.map((item: Item) => (
                                <Card key={item.id} className="hover:shadow-xl transition-all duration-300 border-slate-200/60 overflow-hidden group">
                                    <CardHeader className="pb-3 bg-slate-50/50 border-b border-slate-100">
                                        <CardTitle className="text-lg font-display tracking-tight group-hover:text-blue-600 transition-colors">{item.name}</CardTitle>
                                        {item.description && (
                                            <CardDescription className="line-clamp-2 text-slate-500">{item.description}</CardDescription>
                                        )}
                                    </CardHeader>
                                    <CardContent className="pt-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-2xl font-bold text-slate-900">
                                                    ₹{item.sellingPrice?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                </p>
                                                {item.unit && (
                                                    <p className="text-sm text-slate-500 font-medium">per {item.unit}</p>
                                                )}
                                            </div>
                                            {cart[item.id] ? (
                                                <div className="flex items-center gap-2 bg-slate-100 rounded-full p-1 border">
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full hover:bg-white hover:text-red-500 shadow-none" onClick={() => removeFromCart(item.id)}>
                                                        <Minus className="h-4 w-4" />
                                                    </Button>
                                                    <Badge variant="secondary" className="min-w-[32px] justify-center bg-white shadow-sm border-none">
                                                        {cart[item.id]}
                                                    </Badge>
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full hover:bg-white hover:text-green-500 shadow-none" onClick={() => addToCart(item.id)}>
                                                        <Plus className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Button size="sm" variant="outline" className="rounded-full px-4 hover:bg-blue-600 hover:text-white transition-all border-blue-200 text-blue-600" onClick={() => addToCart(item.id)}>
                                                    Add to Request
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card className="border-dashed bg-slate-50/50">
                            <CardContent className="py-20 text-center">
                                <Package className="h-16 w-16 mx-auto text-slate-200 mb-4" />
                                <h3 className="text-lg font-semibold text-slate-900">No items available</h3>
                                <p className="text-slate-500 max-w-xs mx-auto mt-2">Our catalog is currently being updated. Try requesting a new item instead.</p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="request" className="mt-8">
                    <Card className="border-slate-200/60 shadow-sm">
                        <CardHeader className="border-b bg-slate-50/50 p-6">
                            <CardTitle className="text-2xl font-display">Request New Item</CardTitle>
                            <CardDescription className="text-base text-slate-500 mt-1">
                                Can't find what you need? Request a specialty item and our team will review it.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-8">
                            <form onSubmit={handleSubmit(onNewItemSubmit)} className="space-y-6 max-w-2xl">
                                <div className="space-y-2">
                                    <Label htmlFor="itemName" className="text-sm font-bold uppercase tracking-wider text-slate-500">Item Name *</Label>
                                    <Input
                                        id="itemName"
                                        {...register("itemName", { required: "Item name is required" })}
                                        placeholder="e.g. Specialized Industrial Drill, Ergonomic Office Station"
                                        className="h-12 border-slate-200 focus:ring-blue-500/20"
                                    />
                                    {errors.itemName && (
                                        <p className="text-sm text-red-500 font-medium">{errors.itemName.message}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description" className="text-sm font-bold uppercase tracking-wider text-slate-500">Item Specifications *</Label>
                                    <Textarea
                                        id="description"
                                        {...register("description", { required: "Description is required" })}
                                        placeholder="Please provide brand, model number, technical specs, or target price point if known."
                                        rows={5}
                                        className="border-slate-200 focus:ring-blue-500/20"
                                    />
                                    {errors.description && (
                                        <p className="text-sm text-red-500 font-medium">{errors.description.message}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="quantity" className="text-sm font-bold uppercase tracking-wider text-slate-500">Estimated Quantity *</Label>
                                        <Input
                                            id="quantity"
                                            type="number"
                                            {...register("quantity", { required: "Quantity is required", min: 1 })}
                                            defaultValue={1}
                                            min={1}
                                            className="h-12 border-slate-200 focus:ring-blue-500/20"
                                        />
                                        {errors.quantity && (
                                            <p className="text-sm text-red-500 font-medium">{errors.quantity.message}</p>
                                        )}
                                    </div>
                                </div>

                                <Button type="submit" disabled={newItemMutation.isPending} size="lg" className="w-full md:w-auto px-12 h-12 shadow-lg hover:shadow-xl transition-all">
                                    {newItemMutation.isPending ? "Submitting..." : "Submit New Item Request"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="history" className="mt-8">
                    <Card className="border-slate-200/60 shadow-sm overflow-hidden">
                        <CardHeader className="border-b bg-slate-50/50 p-6">
                            <CardTitle className="text-2xl font-display">My Submission History</CardTitle>
                            <CardDescription className="text-base text-slate-500 mt-1">
                                Track the status of your item requests and review feedback from our admin team.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            {requestsLoading ? (
                                <div className="py-20 text-center text-slate-500">
                                    <Plus className="h-8 w-8 mx-auto mb-4 animate-spin text-blue-200" />
                                    Fetching your history...
                                </div>
                            ) : myRequests.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-50/80 border-b text-slate-500 uppercase text-[11px] font-bold tracking-widest">
                                            <tr>
                                                <th className="px-6 py-4">Item Name</th>
                                                <th className="px-6 py-4">Qty</th>
                                                <th className="px-6 py-4">Date Submitted</th>
                                                <th className="px-6 py-4">Status</th>
                                                <th className="px-6 py-4">Admin Feedback</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {myRequests.map((req: any) => (
                                                <tr key={req.id} className="hover:bg-slate-50/40 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="font-semibold text-slate-900">{req.itemName}</div>
                                                        <div className="text-xs text-slate-500 mt-0.5 line-clamp-1 max-w-xs">{req.description}</div>
                                                    </td>
                                                    <td className="px-6 py-4 font-medium">{req.quantity}</td>
                                                    <td className="px-6 py-4 text-slate-500">
                                                        {new Date(req.createdAt).toLocaleDateString('en-IN', {
                                                            day: '2-digit',
                                                            month: 'short',
                                                            year: 'numeric'
                                                        })}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {getStatusBadge(req.status)}
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-600">
                                                        {req.rejectionReason ? (
                                                            <div className="text-xs italic bg-red-50 text-red-600 p-2 rounded-md border border-red-100">
                                                                {req.rejectionReason}
                                                            </div>
                                                        ) : req.status === "Approved" ? (
                                                            <div className="text-xs text-green-600 font-medium">Added to catalog</div>
                                                        ) : (
                                                            <span className="text-xs italic text-slate-400">Under review</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="py-20 text-center">
                                    <ShoppingCart className="h-16 w-16 mx-auto text-slate-200 mb-4" />
                                    <h3 className="text-lg font-semibold text-slate-900">No requests found</h3>
                                    <p className="text-slate-500 max-w-xs mx-auto mt-2">You haven't submitted any custom item requests yet.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
