import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuthStore } from "@/store/authStore";
import {
    FileText,
    Search,
    Filter,
    Eye,
    CreditCard,
    CheckCircle,
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import InvoiceDetailPanel from "@/modules/sales/components/InvoiceDetailPanel";

export default function CustomerInvoicesPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
    const [invoiceToPay, setInvoiceToPay] = useState<any>(null);
    const [paymentAmount, setPaymentAmount] = useState("");
    const [activeTab, setActiveTab] = useState("all");

    const { user } = useAuthStore();
    const { data: invoicesData, isLoading } = useQuery({
        queryKey: ["/api/invoices"],
    });

    const { data: brandingData } = useQuery({
        queryKey: ["/api/branding"],
    });

    const allInvoices = (invoicesData as any)?.data || [];
    const branding = (brandingData as any)?.data;

    const invoices = allInvoices;

    const payMutation = useMutation({
        mutationFn: async ({ id, amount }: { id: string, amount: number }) => {
            const res = await fetch(`/api/flow/invoices/${id}/pay`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount }),
            });
            if (!res.ok) throw new Error("Payment failed");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
            toast({ title: "Payment Successful", description: "Your payment has been processed." });
            setPaymentDialogOpen(false);
            setInvoiceToPay(null);
        },
        onError: () => {
            toast({ title: "Payment Failed", description: "Please try again.", variant: "destructive" });
        }
    });

    const handlePayClick = (e: React.MouseEvent, invoice: any) => {
        e.stopPropagation();
        setInvoiceToPay(invoice);
        setPaymentAmount(String(invoice.balanceDue || invoice.total));
        setPaymentDialogOpen(true);
    };

    const handlePaymentSubmit = () => {
        if (!invoiceToPay) return;
        payMutation.mutate({ id: invoiceToPay.id, amount: Number(paymentAmount) });
    };

    const filteredInvoices = invoices.filter((inv: any) => {
        const invoiceNumber = inv.invoiceNumber || "";
        const matchesSearch = invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
        const status = inv.status || "";

        // Customers should see Sent, Paid, Overdue, and Partially Paid invoices
        // Only Draft invoices are hidden
        if (status.toUpperCase() === 'DRAFT') return false;

        const matchesTab = activeTab === "all" ||
            (activeTab === "paid" && (status === "Paid" || status === "PAID")) ||
            (activeTab === "unpaid" && (status === "Sent" || status === "Overdue" || status === "Partially Paid" || status === "PARTIALLY_PAID"));
        return matchesSearch && matchesTab;
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "Paid": return <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200 font-bold font-display uppercase text-[10px]">Paid</Badge>;
            case "Sent": return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200 font-bold font-display uppercase text-[10px]">Sent</Badge>;
            case "Overdue": return <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-red-200 font-bold font-display uppercase text-[10px]">Overdue</Badge>;
            case "Partially Paid": return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-yellow-200 font-bold font-display uppercase text-[10px]">Partially Paid</Badge>;
            default: return <Badge variant="outline" className="font-bold font-display uppercase text-[10px]">{status}</Badge>;
        }
    };

    return (
        <div className="container mx-auto py-10 flex gap-6 relative">
            <div className={`flex-1 transition-all duration-300 ${selectedInvoice ? 'mr-[400px] lg:mr-[600px]' : ''}`}>
                <div className="space-y-6">
                    <div>
                        <h1 className="text-3xl font-bold font-display text-slate-900 tracking-tight">My Invoices</h1>
                        <p className="text-slate-500 font-display">View and pay your invoices</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="border-slate-200 shadow-sm">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider font-display">Total Due</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold font-display text-slate-900">
                                    ₹{invoices.reduce((acc: number, inv: any) => acc + (inv.status !== 'Paid' ? (inv.balanceDue || inv.total) : 0), 0).toLocaleString('en-IN') || '0.00'}
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-slate-200 shadow-sm">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider font-display">Paid Last 30 Days</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold font-display text-green-600">
                                    ₹{invoices.filter((inv: any) => inv.status === 'Paid').reduce((acc: number, inv: any) => acc + inv.total, 0).toLocaleString('en-IN') || '0.00'}
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-slate-200 shadow-sm">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider font-display">Open Invoices</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold font-display text-blue-600">
                                    {invoices.filter((inv: any) => inv.status !== 'Paid' && inv.status !== 'Draft').length || 0}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="flex items-center gap-2 border-b border-slate-200">
                        {['all', 'unpaid', 'paid'].map((tab) => (
                            <Button
                                key={tab}
                                variant="ghost"
                                className={`rounded-none border-b-2 px-6 py-4 h-auto font-bold font-display text-xs uppercase tracking-wider transition-all ${activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}
                                onClick={() => setActiveTab(tab)}
                            >
                                {tab === 'all' ? 'All Invoices' : tab}
                            </Button>
                        ))}
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50">
                            <div className="relative w-full sm:w-96">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Search by invoice number..."
                                    className="pl-10 h-9 bg-white border-slate-200 focus:border-blue-400"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Button variant="outline" size="sm" className="gap-2 font-bold font-display border-slate-200">
                                <Filter className="h-4 w-4" />
                                Filter
                            </Button>
                        </div>

                        <Table>
                            <TableHeader className="bg-slate-100/50">
                                <TableRow>
                                    <TableHead className="font-bold text-[11px] text-slate-500 uppercase tracking-wider">Invoice #</TableHead>
                                    <TableHead className="font-bold text-[11px] text-slate-500 uppercase tracking-wider">Date</TableHead>
                                    <TableHead className="font-bold text-[11px] text-slate-500 uppercase tracking-wider">Due Date</TableHead>
                                    <TableHead className="font-bold text-[11px] text-slate-500 uppercase tracking-wider">Status</TableHead>
                                    <TableHead className="font-bold text-[11px] text-slate-500 uppercase tracking-wider text-right">Amount</TableHead>
                                    <TableHead className="font-bold text-[11px] text-slate-500 uppercase tracking-wider text-right">Balance</TableHead>
                                    <TableHead className="font-bold text-[11px] text-slate-500 uppercase tracking-wider text-right pr-6">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-20 text-slate-400 font-display">Loading invoices...</TableCell>
                                    </TableRow>
                                ) : filteredInvoices.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-24 text-slate-400 font-display">
                                            <div className="flex flex-col items-center gap-3">
                                                <FileText className="h-12 w-12 text-slate-200" />
                                                <p>No invoices found</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredInvoices.map((invoice: any) => (
                                        <TableRow
                                            key={invoice.id}
                                            className={`hover:bg-slate-50 cursor-pointer transition-colors group ${selectedInvoice?.id === invoice.id ? 'bg-blue-50/50' : ''}`}
                                            onClick={() => setSelectedInvoice(invoice)}
                                        >
                                            <TableCell className="font-bold text-slate-900 font-display">{invoice.invoiceNumber}</TableCell>
                                            <TableCell className="text-slate-500 font-display">{format(new Date(invoice.date), "MMM d, yyyy")}</TableCell>
                                            <TableCell className="text-slate-500 font-display">{format(new Date(invoice.dueDate), "MMM d, yyyy")}</TableCell>
                                            <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                                            <TableCell className="text-right font-bold text-slate-900 font-display">₹{invoice.total?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
                                            <TableCell className="text-right font-bold text-slate-600 font-display">₹{(invoice.balanceDue ?? invoice.total)?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
                                            <TableCell className="text-right pr-6" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center justify-end gap-2">
                                                    {invoice.status !== 'Paid' && (
                                                        <Button size="sm" className="h-8 px-4 font-bold font-display bg-green-600 hover:bg-green-700 text-white shadow-sm" onClick={(e) => handlePayClick(e, invoice)}>
                                                            <CheckCircle className="h-3.5 w-3.5 mr-1.5" /> Record Payment
                                                        </Button>
                                                    )}
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-slate-100 text-slate-400 group-hover:text-blue-600" onClick={() => setSelectedInvoice(invoice)}>
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>

            {selectedInvoice && (
                <div className="fixed inset-y-0 right-0 w-full max-w-[400px] lg:max-w-[600px] z-50 border-l border-slate-200 shadow-2xl animate-in slide-in-from-right duration-300">
                    <InvoiceDetailPanel
                        invoice={selectedInvoice}
                        onClose={() => setSelectedInvoice(null)}
                        isAdmin={false}
                        branding={branding}
                        onRefresh={() => queryClient.invalidateQueries({ queryKey: ["/api/invoices"] })}
                    />
                </div>
            )}

            <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Make Payment</DialogTitle>
                        <DialogDescription>
                            Enter the amount you would like to pay for {invoiceToPay?.invoiceNumber}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="amount">Amount</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-slate-500">₹</span>
                                <Input
                                    id="amount"
                                    type="number"
                                    className="pl-7"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handlePaymentSubmit} disabled={payMutation.isPending}>
                            {payMutation.isPending ? "Processing..." : "Pay Now"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
