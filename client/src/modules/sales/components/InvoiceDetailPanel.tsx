import React, { useState, useEffect } from "react";
import { X, Pencil, Mail, Share2, FileText, Download, Printer, CreditCard, Info, MoreHorizontal, CheckCircle, Repeat, FileCheck, Truck, Copy, Ban, ChevronDown, HelpCircle, MessageSquare, Send, Trash2 } from "lucide-react";
import { robustIframePrint } from "@/lib/robust-print";
import { generatePDFFromElement } from "@/lib/pdf-utils";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useOrganization } from "@/context/OrganizationContext";
import { InvoicePDFView } from "@/components/InvoicePDFView";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuPortal, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger } from "@/components/ui/dropdown-menu";

interface Invoice {
    id: string;
    invoiceNumber: string;
    customerName: string;
    date: string;
    dueDate: string;
    amount: number;
    balanceDue: number;
    status: string;
    items?: any[];
    payments?: any[];
    refunds?: any[];
    subTotal?: number;
    cgst?: number;
    sgst?: number;
    igst?: number;
    total?: number;
}

interface InvoiceDetailPanelProps {
    invoice: Invoice;
    onClose: () => void;
    onRefresh?: () => void;
    isAdmin?: boolean;
    branding?: any;
}

const getStatusStyles = (status: string) => {
    switch (status?.toLowerCase()) {
        case 'paid': return { bgColor: 'bg-green-50', color: 'text-green-700', label: 'Paid' };
        case 'partially paid': return { bgColor: 'bg-blue-50', color: 'text-blue-700', label: 'Partially Paid' };
        case 'overdue': return { bgColor: 'bg-red-50', color: 'text-red-700', label: 'Overdue' };
        case 'void': return { bgColor: 'bg-slate-100', color: 'text-slate-500', label: 'Void' };
        default: return { bgColor: 'bg-slate-50', color: 'text-slate-600', label: status || 'Unpaid' };
    }
};

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount || 0);
};

const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatDateTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-IN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true
    });
};

export default function InvoiceDetailPanel({ invoice, onClose, onRefresh, isAdmin = true, branding }: InvoiceDetailPanelProps) {
    const { toast } = useToast();
    const { currentOrganization } = useOrganization();
    const [activeTab, setActiveTab] = useState("whats-next");
    const [showPdfPreview, setShowPdfPreview] = useState(true);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const statusStyles = getStatusStyles(invoice.status);

    useEffect(() => {
        // Force PDF view for customers and disable toggle
        if (!isAdmin) {
            setShowPdfPreview(true);
        }
    }, [isAdmin]);

    const handleRecordPayment = async () => {
        try {
            // Determine which API to use based on isAdmin prop
            // Record payment from customer invoice should use the /pay endpoint
            const apiEndpoint = isAdmin 
                ? `/api/invoices/${invoice.id}/record-payment`
                : `/api/flow/invoices/${invoice.id}/pay`;
            
            const response = await fetch(apiEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: invoice.balanceDue || invoice.total,
                    paymentMode: 'Bank Transfer',
                    date: new Date().toISOString()
                })
            });
            
            if (response.ok) {
                toast({ title: "Payment Recorded", description: "Invoice status updated successfully." });
                if (onRefresh) onRefresh();
            } else {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || "Failed to record payment");
            }
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to record payment.", variant: "destructive" });
        }
    };

    const handleSendInvoice = async () => {
        try {
            const response = await fetch(`/api/invoices/${invoice.id}/send`, { 
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user: isAdmin ? 'Admin User' : 'Customer' })
            });
            if (response.ok) {
                toast({ title: "Invoice Sent", description: "Invoice status updated to Sent." });
                if (onRefresh) onRefresh();
            } else {
                throw new Error("Failed to send");
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to mark invoice as sent.", variant: "destructive" });
        }
    };

    const handleDownloadPDF = async () => {
        toast({ title: "Preparing download...", description: "Please wait while we generate your PDF." });
        try {
            await generatePDFFromElement("invoice-pdf-content", `Invoice-${invoice.invoiceNumber}.pdf`);
            toast({ title: "Success", description: "Invoice downloaded successfully." });
        } catch (error) {
            console.error("PDF generation error:", error);
            toast({ title: "Error", description: "Failed to generate PDF.", variant: "destructive" });
        }
    };

    const handlePrintPDF = async () => {
        try {
            await robustIframePrint("invoice-pdf-content");
        } catch (error) {
            console.error("Print error:", error);
            toast({ title: "Error", description: "Failed to open print dialog.", variant: "destructive" });
        }
    };

    return (
        <div className="flex flex-col h-full overflow-hidden bg-white border-l border-slate-200 shadow-2xl animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50/50">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 hover:bg-white shadow-sm rounded-full">
                        <X className="h-4 w-4" />
                    </Button>
                    <div className="flex flex-col">
                        <h2 className="text-base font-bold text-slate-900 font-display tracking-tight">{invoice.invoiceNumber}</h2>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 border-0 uppercase font-bold font-display tracking-wider ${statusStyles.bgColor} ${statusStyles.color}`}>
                                {statusStyles.label}
                            </Badge>
                            <span className="text-[10px] text-slate-400 font-display uppercase tracking-wider">Created on {formatDate(invoice.date)}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-display">PDF View</span>
                        <Switch checked={showPdfPreview} onCheckedChange={isAdmin ? setShowPdfPreview : undefined} className="scale-75" disabled={!isAdmin} />
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-sidebar/10 text-sidebar/70" onClick={handleDownloadPDF} data-testid="button-download-pdf">
                            <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-sidebar/10 text-sidebar/70" onClick={handlePrintPDF} data-testid="button-print-pdf">
                            <Printer className="h-4 w-4" />
                        </Button>
                        {isAdmin && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-50 text-red-500" onClick={() => setDeleteDialogOpen(true)} data-testid="button-delete-invoice">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Actions Bar */}
            <div className="flex items-center gap-2 px-6 py-2 border-b border-slate-200 bg-white overflow-x-auto scrollbar-hide">
                {isAdmin ? (
                    <>
                        <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-blue-600 font-bold font-display hover:bg-blue-50" onClick={handleSendInvoice} data-testid="button-send-invoice">
                            <Send className="h-3.5 w-3.5" /> Send to Customer
                        </Button>
                        {invoice.status?.toLowerCase() !== 'paid' && invoice.status?.toLowerCase() !== 'draft' && (
                            <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-green-600 font-bold font-display hover:bg-green-50" onClick={handleRecordPayment} data-testid="button-record-payment">
                                <CheckCircle className="h-3.5 w-3.5" /> Record Payment
                            </Button>
                        )}
                        <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-slate-600 font-bold font-display" data-testid="button-edit-invoice">
                            <Pencil className="h-3.5 w-3.5" /> Edit
                        </Button>
                    </>
                ) : (
                    <>
                        {invoice.status?.toLowerCase() !== 'paid' && (
                            <Button className="h-8 gap-1.5 bg-green-600 hover:bg-green-700 text-white font-bold font-display shadow-sm" onClick={handleRecordPayment} data-testid="button-customer-record-payment">
                                <CheckCircle className="h-3.5 w-3.5" /> Record Payment
                            </Button>
                        )}
                    </>
                )}

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-slate-600 font-bold font-display">
                            <FileText className="h-3.5 w-3.5" /> PDF/Print <ChevronDown className="h-3 w-3" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="font-display">
                        <DropdownMenuItem className="font-medium" onClick={handlePrintPDF}><Printer className="mr-2 h-4 w-4" /> Print</DropdownMenuItem>
                        <DropdownMenuItem className="font-medium" onClick={handleDownloadPDF}><Download className="mr-2 h-4 w-4" /> Download PDF</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {isAdmin && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 border-slate-200">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 font-display">
                            <DropdownMenuItem className="font-medium" onClick={handleSendInvoice}><CheckCircle className="mr-2 h-4 w-4 text-blue-600" /> Mark As Sent</DropdownMenuItem>
                            <DropdownMenuItem className="font-medium"><Repeat className="mr-2 h-4 w-4" /> Make Recurring</DropdownMenuItem>
                            <DropdownMenuItem className="font-medium"><Ban className="mr-2 h-4 w-4" /> Void</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>

            {/* Tabs & Content */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                <div className="px-6 bg-white border-b border-slate-200">
                    <TabsList className="h-auto p-0 bg-transparent gap-6">
                        <TabsTrigger value="whats-next" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent px-2 py-3 font-bold font-display text-xs uppercase tracking-wider transition-none">
                            <HelpCircle className="h-3.5 w-3.5 mr-1.5" /> Details
                        </TabsTrigger>
                        <TabsTrigger value="comments" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent px-2 py-3 font-bold font-display text-xs uppercase tracking-wider transition-none">
                            <MessageSquare className="h-3.5 w-3.5 mr-1.5" /> History
                        </TabsTrigger>
                    </TabsList>
                </div>

                <ScrollArea className="flex-1">
                    <TabsContent value="whats-next" className="m-0 p-6 space-y-6">
                        {!isAdmin && invoice.status?.toLowerCase() !== 'paid' && (
                            <div className="bg-blue-50 rounded-lg border border-blue-100 p-4 flex items-start gap-4 shadow-sm">
                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                    <Send className="h-5 w-5 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-slate-900 font-display text-sm uppercase tracking-tight">Payment Pending</h4>
                                    <p className="text-xs text-slate-600 mt-1 font-display">
                                        This invoice is currently {invoice.status?.toLowerCase()}. Please process the payment to settle your account.
                                    </p>
                                    <Button size="sm" className="mt-3 bg-blue-600 hover:bg-blue-700 font-bold font-display uppercase tracking-wider text-[10px]" onClick={handleRecordPayment}>
                                        Make Payment
                                    </Button>
                                </div>
                            </div>
                        )}

                        <div className="bg-white rounded-xl border border-slate-200 p-1 shadow-sm overflow-hidden">
                            <InvoicePDFView
                                invoice={invoice}
                                branding={branding}
                                organization={currentOrganization}
                            />
                        </div>
                    </TabsContent>

                    <TabsContent value="comments" className="m-0 p-6 space-y-6">
                        {(invoice.payments || []).length > 0 ? (
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-display">Payment History</h3>
                                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                    <table className="w-full font-display">
                                        <thead className="bg-slate-50 border-b border-slate-200">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                                                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Mode</th>
                                                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Date & Time</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {invoice.payments?.map((payment: any, idx: number) => (
                                                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-4 py-3 text-sm font-bold text-slate-900">{formatCurrency(payment.amount)}</td>
                                                    <td className="px-4 py-3 text-sm text-slate-600 uppercase tracking-tight">{payment.paymentMode || 'N/A'}</td>
                                                    <td className="px-4 py-3 text-[11px] text-slate-500">{formatDateTime(payment.date || payment.timestamp)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-20 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                <MessageSquare className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                                <p className="text-slate-500 font-display font-medium">No payment history available.</p>
                            </div>
                        )}
                    </TabsContent>
                </ScrollArea>
            </Tabs>
        </div>
    );
}
