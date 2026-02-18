
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
    FileCheck,
    Search,
    Filter,
    Download,
    Eye,
    Printer,
    CheckCircle2
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
import { Sheet, SheetContent } from "@/components/ui/sheet";

import { useAuthStore } from "@/store/authStore";

export default function CustomerReceiptsPage() {
    const { user } = useAuthStore();
    const [searchTerm, setSearchTerm] = useState("");
    const [, setLocation] = useLocation();
    const [selectedReceipt, setSelectedReceipt] = useState<any>(null);

    const { data: receipts, isLoading } = useQuery<any>({
        queryKey: ["/api/customer/receipts", { customerId: user?.id }],
        enabled: !!user?.id,
    });

    const filteredReceipts = receipts?.data?.filter((rec: any) => {
        return rec.paymentNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            rec.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    }) || [];

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-display text-slate-900">My Receipts</h1>
                    <p className="text-slate-500">View payment receipts</p>
                </div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
                <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full sm:w-96">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search by receipt or invoice number..."
                            className="pl-9 bg-slate-50 border-slate-200"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" size="sm" className="gap-2">
                        <Filter className="h-4 w-4" />
                        Filter
                    </Button>
                </div>

                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead className="font-bold text-slate-500">RECEIPT #</TableHead>
                            <TableHead className="font-bold text-slate-500">DATE</TableHead>
                            <TableHead className="font-bold text-slate-500">INVOICE #</TableHead>
                            <TableHead className="font-bold text-slate-500">MODE</TableHead>
                            <TableHead className="font-bold text-slate-500 text-right">AMOUNT</TableHead>
                            <TableHead className="font-bold text-slate-500 text-right">ACTIONS</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                                    Loading receipts...
                                </TableCell>
                            </TableRow>
                        ) : filteredReceipts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                                    <div className="flex flex-col items-center gap-2">
                                        <FileCheck className="h-12 w-12 text-slate-300" />
                                        <p>No receipts found</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredReceipts.map((receipt: any) => (
                                <TableRow key={receipt.id} className="hover:bg-slate-50/50">
                                    <TableCell className="font-medium text-slate-900">
                                        {receipt.paymentNumber}
                                    </TableCell>
                                    <TableCell className="text-slate-600">
                                        {format(new Date(receipt.date), "MMM d, yyyy")}
                                    </TableCell>
                                    <TableCell className="text-slate-600">
                                        {receipt.invoiceNumber || '-'}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{receipt.mode || 'Online'}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                        ₹{receipt.amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-slate-100 text-slate-500" onClick={() => setSelectedReceipt(receipt)}>
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-slate-100 text-slate-500">
                                                <Download className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Sheet open={!!selectedReceipt} onOpenChange={() => setSelectedReceipt(null)}>
                <SheetContent className="sm:max-w-md p-0 w-full">
                    <div className="p-6 h-full overflow-auto flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                            <CheckCircle2 className="h-8 w-8 text-green-600" />
                        </div>

                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Payment Receipt</h2>
                        <p className="text-slate-500 mb-8">Payment of ₹{selectedReceipt?.amount?.toLocaleString('en-IN')} received</p>

                        <div className="w-full bg-slate-50 rounded-lg p-4 space-y-4 mb-8 text-left">
                            <div className="flex justify-between border-b border-slate-200 pb-2">
                                <span className="text-slate-500">Receipt No</span>
                                <span className="font-medium">{selectedReceipt?.paymentNumber}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-200 pb-2">
                                <span className="text-slate-500">Date</span>
                                <span className="font-medium">{selectedReceipt && format(new Date(selectedReceipt.date), "PPP")}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-200 pb-2">
                                <span className="text-slate-500">Payment Mode</span>
                                <span className="font-medium">{selectedReceipt?.mode || 'Online'}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-200 pb-2">
                                <span className="text-slate-500">Transaction ID</span>
                                <span className="font-medium">{selectedReceipt?.reference || '-'}</span>
                            </div>
                            <div className="flex justify-between pt-2">
                                <span className="font-bold text-slate-900">Amount Paid</span>
                                <span className="font-bold text-slate-900">₹{selectedReceipt?.amount?.toLocaleString('en-IN')}</span>
                            </div>
                        </div>

                        <div className="w-full space-y-3">
                            <Button className="w-full gap-2" variant="outline">
                                <Download className="h-4 w-4" /> Download Receipt
                            </Button>
                            <Button className="w-full gap-2" variant="outline" onClick={() => window.print()}>
                                <Printer className="h-4 w-4" /> Print
                            </Button>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
