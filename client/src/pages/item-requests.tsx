import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
    Check,
    X,
    Package,
    AlertCircle,
    FileText,
    Filter
} from "lucide-react";
import { format } from "date-fns";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function ItemRequestsPage() {
    const { token } = useAuthStore();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [statusFilter, setStatusFilter] = useState("all");
    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const [actionDialog, setActionDialog] = useState<"approve" | "reject" | null>(null);
    const [rejectionReason, setRejectionReason] = useState("");

    const { data: requests, isLoading, error } = useQuery<any>({
        queryKey: ["/api/flow/item-requests", { status: statusFilter }],
        queryFn: async () => {
            const url = statusFilter === "all"
                ? "/api/flow/item-requests"
                : `/api/flow/item-requests?status=${statusFilter}`;
            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || "Failed to fetch requests");
            }
            return res.json();
        },
    });

    useEffect(() => {
        if (error) {
            toast({
                title: "Error",
                description: (error as Error).message,
                variant: "destructive"
            });
        }
    }, [error, toast]);

    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status, rejectionReason }: { id: string, status: string, rejectionReason?: string }) => {
            const res = await fetch(`/api/flow/item-requests/${id}/status`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ status, rejectionReason })
            });
            if (!res.ok) throw new Error("Failed to update status");
            return res.json();
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["/api/flow/item-requests"] });
            toast({
                title: "Success",
                description: `Item request ${variables.status.toLowerCase()} successfully`
            });
            setActionDialog(null);
            setSelectedRequest(null);
            setRejectionReason("");
        },
        onError: () => {
            toast({
                title: "Error",
                description: "Failed to update request status",
                variant: "destructive"
            });
        }
    });

    const handleApprove = (request: any) => {
        setSelectedRequest(request);
        setActionDialog("approve");
    };

    const handleReject = (request: any) => {
        setSelectedRequest(request);
        setActionDialog("reject");
    };

    const confirmAction = () => {
        if (!selectedRequest) return;

        if (actionDialog === "approve") {
            updateStatusMutation.mutate({ id: selectedRequest.id, status: "Approved" });
        } else if (actionDialog === "reject") {
            if (!rejectionReason.trim()) {
                toast({ title: "Error", description: "Please provide a rejection reason", variant: "destructive" });
                return;
            }
            updateStatusMutation.mutate({
                id: selectedRequest.id,
                status: "Rejected",
                rejectionReason
            });
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "Pending":
                return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200">Pending</Badge>;
            case "Approved":
                return <Badge className="bg-green-100 text-green-700 hover:bg-green-200">Approved</Badge>;
            case "Rejected":
                return <Badge className="bg-red-100 text-red-700 hover:bg-red-200">Rejected</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const filteredRequests = requests?.data || [];

    return (
        <div className="container mx-auto py-10 max-w-7xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Item Requests</h1>
                    <p className="text-slate-500">Manage customer item requests</p>
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-slate-500" />
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Requests</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead className="font-bold">CUSTOMER</TableHead>
                                <TableHead className="font-bold">ITEM NAME</TableHead>
                                <TableHead className="font-bold">CONTACT</TableHead>
                                <TableHead className="font-bold">DESCRIPTION</TableHead>
                                <TableHead className="font-bold">QTY</TableHead>
                                <TableHead className="font-bold">DATE</TableHead>
                                <TableHead className="font-bold">STATUS</TableHead>
                                <TableHead className="font-bold text-right">ACTIONS</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {/* ... existing rows ... */}
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                                        Loading requests...
                                    </TableCell>
                                </TableRow>
                            ) : filteredRequests.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-12 text-slate-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <Package className="h-12 w-12 text-slate-300" />
                                            <p>No item requests found</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredRequests.map((request: any) => (
                                    <TableRow key={request.id} className="hover:bg-slate-50/50 transition-colors">
                                        <TableCell>
                                            <div>
                                                <p className="font-medium text-slate-900">{request.customerName}</p>
                                                <p className="text-sm text-slate-500">{request.customerEmail}</p>
                                                {request.companyName && (
                                                    <p className="text-sm text-slate-500 font-medium">@{request.companyName}</p>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium">{request.itemName}</TableCell>
                                        <TableCell className="text-slate-600">{request.contactNumber || '-'}</TableCell>
                                        <TableCell className="max-w-xs truncate text-slate-600">
                                            {request.description || '-'}
                                        </TableCell>
                                        <TableCell>{request.quantity}</TableCell>
                                        <TableCell className="text-slate-600">
                                            {format(new Date(request.createdAt), "MMM d, yyyy")}
                                        </TableCell>
                                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {request.status === "Pending" && (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            variant="default"
                                                            className="bg-green-600 hover:bg-green-700 h-8"
                                                            onClick={() => handleApprove(request)}
                                                        >
                                                            <Check className="h-4 w-4 mr-1" />
                                                            Approve
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            className="h-8"
                                                            onClick={() => handleReject(request)}
                                                        >
                                                            <X className="h-4 w-4 mr-1" />
                                                            Reject
                                                        </Button>
                                                    </>
                                                )}
                                                {request.status === "Rejected" && request.rejectionReason && (
                                                    <p className="text-xs text-slate-500 italic">
                                                        {request.rejectionReason}
                                                    </p>
                                                )}
                                                {request.status === "Approved" && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-blue-600 border-blue-200 hover:bg-blue-50 h-8"
                                                        onClick={() => window.location.href = `/quotes/new?customerId=${request.customerId}`}
                                                    >
                                                        <FileText className="h-4 w-4 mr-1" />
                                                        Create Quote
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Approve Dialog */}
            <Dialog open={actionDialog === "approve"} onOpenChange={() => setActionDialog(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Approve Item Request</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to approve this request? The item will be added to your inventory.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedRequest && (
                        <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                            <p><strong>Item:</strong> {selectedRequest.itemName}</p>
                            <p><strong>Description:</strong> {selectedRequest.description}</p>
                            <p><strong>Quantity:</strong> {selectedRequest.quantity}</p>
                            <p><strong>Customer:</strong> {selectedRequest.customerName}</p>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setActionDialog(null)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={confirmAction}
                            disabled={updateStatusMutation.isPending}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {updateStatusMutation.isPending ? "Approving..." : "Confirm Approval"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reject Dialog */}
            <Dialog open={actionDialog === "reject"} onOpenChange={() => {
                setActionDialog(null);
                setRejectionReason("");
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Item Request</DialogTitle>
                        <DialogDescription>
                            Please provide a reason for rejecting this request.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedRequest && (
                        <div className="bg-slate-50 p-4 rounded-lg space-y-2 mb-4">
                            <p><strong>Item:</strong> {selectedRequest.itemName}</p>
                            <p><strong>Customer:</strong> {selectedRequest.customerName}</p>
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="reason">Rejection Reason *</Label>
                        <Textarea
                            id="reason"
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Please explain why this request is being rejected..."
                            rows={4}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => {
                            setActionDialog(null);
                            setRejectionReason("");
                        }}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={confirmAction}
                            disabled={updateStatusMutation.isPending}
                        >
                            {updateStatusMutation.isPending ? "Rejecting..." : "Confirm Rejection"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
