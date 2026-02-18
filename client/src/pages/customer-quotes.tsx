
import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

import QuoteDetailPanel from "@/modules/sales/components/QuoteDetailPanel";

export default function CustomerQuotesPage() {
    const { token } = useAuthStore();
    const { toast } = useToast();
    const [quotes, setQuotes] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedQuote, setSelectedQuote] = useState<any | null>(null);

    const fetchQuotes = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/flow/quotes", {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                const fetchedQuotes = data.data || [];
                setQuotes(fetchedQuotes);

                // Keep selected quote updated if it exists
                if (selectedQuote) {
                    const updated = fetchedQuotes.find((q: any) => q.id === selectedQuote.id);
                    if (updated) setSelectedQuote(updated);
                }
            }
        } catch (error) {
            console.error("Failed to fetch quotes", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchQuotes();
    }, [token]);

    const handleAction = async (id: string, action: 'approve' | 'reject') => {
        try {
            const res = await fetch(`/api/flow/quotes/${id}/${action}`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` }
            });
            const result = await res.json();
            if (res.ok) {
                toast({ title: "Success", description: result.message });
                fetchQuotes(); // Refresh list
            } else {
                throw new Error(result.message);
            }
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error.message });
        }
    };

    const handleRowClick = (quote: any) => {
        setSelectedQuote(quote);
    };

    return (
        <div className="container mx-auto py-10 flex gap-6 relative">
            <div className={`flex-1 transition-all duration-300 ${selectedQuote ? 'mr-[400px] lg:mr-[600px]' : ''}`}>
                <Card className="border-slate-200 shadow-sm overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b">
                        <CardTitle className="text-2xl font-bold font-display tracking-tight">My Quotes (Estimates)</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {isLoading ? (
                            <div className="p-20 text-center font-display text-slate-500">Loading quotes...</div>
                        ) : (
                            <Table>
                                <TableHeader className="bg-slate-100/50">
                                    <TableRow>
                                        <TableHead className="font-bold uppercase text-[11px] tracking-wider text-slate-500">Quote #</TableHead>
                                        <TableHead className="font-bold uppercase text-[11px] tracking-wider text-slate-500">Date</TableHead>
                                        <TableHead className="font-bold uppercase text-[11px] tracking-wider text-slate-500">Total</TableHead>
                                        <TableHead className="font-bold uppercase text-[11px] tracking-wider text-slate-500">Status</TableHead>
                                        <TableHead className="font-bold uppercase text-[11px] tracking-wider text-slate-500 text-right pr-6">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {quotes.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-20 text-slate-400 font-display">No quotes found.</TableCell>
                                        </TableRow>
                                    )}
                                    {quotes.map((quote) => (
                                        <TableRow
                                            key={quote.id}
                                            className={`cursor-pointer hover:bg-slate-50 transition-colors group ${selectedQuote?.id === quote.id ? 'bg-blue-50/50' : ''}`}
                                            onClick={() => handleRowClick(quote)}
                                        >
                                            <TableCell className="font-bold text-slate-900 font-display">{quote.quoteNumber}</TableCell>
                                            <TableCell className="text-slate-500 font-display">{new Date(quote.date).toLocaleDateString()}</TableCell>
                                            <TableCell className="font-bold text-slate-900 font-display">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(quote.total || 0)}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={`font-bold font-display text-[10px] uppercase tracking-wider ${quote.status === "Approved" ? "bg-green-50 text-green-700 border-green-200" :
                                                        (quote.status === "Sent" || quote.status === "Requested") ? "bg-amber-50 text-amber-700 border-amber-200" :
                                                            quote.status === "Scrapped" ? "bg-red-50 text-red-700 border-red-200" :
                                                                "bg-slate-50 text-slate-500 border-slate-200"
                                                        }`}
                                                >
                                                    {quote.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right pr-6" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex justify-end gap-2">
                                                    {(quote.status === "Sent" || quote.status === "Draft") && (
                                                        <>
                                                            <Button size="sm" className="h-8 px-3 font-bold font-display" onClick={() => handleAction(quote.id, 'approve')}>Approve</Button>
                                                            <Button size="sm" variant="outline" className="h-8 px-3 font-bold font-display text-red-600 hover:text-red-700 hover:bg-red-50 border-slate-200" onClick={() => handleAction(quote.id, 'reject')}>Reject</Button>
                                                        </>
                                                    )}
                                                    {quote.status === "Approved" && (
                                                        <div className="flex flex-col items-end gap-1">
                                                            <span className="text-green-600 font-bold font-display text-xs uppercase tracking-wider">Approved</span>
                                                            <span className="text-slate-400 font-display text-[10px]">Converted to Invoice</span>
                                                        </div>
                                                    )}
                                                    {quote.status === "Scrapped" && <span className="text-red-600 font-bold font-display text-xs uppercase tracking-wider">Scrapped</span>}
                                                    {(quote.status === "Requested" || quote.status === "Draft") && <span className="text-slate-400 font-display text-xs">Waiting for Admin</span>}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>

            {selectedQuote && (
                <div className="fixed inset-y-0 right-0 w-full max-w-[400px] lg:max-w-[600px] z-50 border-l border-slate-200 shadow-2xl animate-in slide-in-from-right duration-300">
                    <QuoteDetailPanel
                        quote={selectedQuote}
                        onClose={() => setSelectedQuote(null)}
                        isAdmin={false}
                        onRefresh={fetchQuotes}
                    />
                </div>
            )}
        </div>
    );
}
