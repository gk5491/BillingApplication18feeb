import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Info, CreditCard, FileText } from "lucide-react";

// Utility functions
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2
    }).format(amount);
};

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

interface CreditSource {
    id: string;
    type: 'payment' | 'credit_note';
    transactionNumber: string;
    transactionDate: string;
    creditAmount: number;
    creditsAvailable: number;
    amountToApply: number;
}

interface ApplyCreditsDialogProps {
    open: boolean;
    onClose: () => void;
    invoice: any;
    onSuccess: () => void;
}

export default function ApplyCreditsDialog({ open, onClose, invoice, onSuccess }: ApplyCreditsDialogProps) {
    const { toast } = useToast();
    const [credits, setCredits] = useState<CreditSource[]>([]);
    const [loading, setLoading] = useState(false);
    const [applying, setApplying] = useState(false);
    const [autoApplied, setAutoApplied] = useState(false);

    useEffect(() => {
        if (open && invoice?.customerId) {
            fetchAvailableCredits();
        }
    }, [open, invoice]);

    const fetchAvailableCredits = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/customers/${invoice.customerId}/available-credits`);
            const data = await response.json();

            if (data.success) {
                // Initialize with amountToApply = 0
                const sourcesWithInput = data.data.sources.map((s: any) => ({
                    ...s,
                    amountToApply: 0
                }));
                setCredits(sourcesWithInput);

                // Auto-suggest amounts (FIFO - credit notes first, then payments)
                autoSuggestAmounts(sourcesWithInput);
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to fetch available credits",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const autoSuggestAmounts = (sources: CreditSource[]) => {
        let remainingBalance = invoice.balanceDue;
        const updatedCredits = sources.map(credit => {
            if (remainingBalance <= 0) {
                return { ...credit, amountToApply: 0 };
            }

            const amountToApply = Math.min(credit.creditsAvailable, remainingBalance);
            remainingBalance -= amountToApply;

            return { ...credit, amountToApply };
        });

        setCredits(updatedCredits);
        setAutoApplied(true);
    };

    const handleAmountChange = (index: number, value: string) => {
        const amount = parseFloat(value) || 0;
        const newCredits = [...credits];

        // Validate amount
        if (amount < 0) {
            newCredits[index].amountToApply = 0;
        } else if (amount > newCredits[index].creditsAvailable) {
            newCredits[index].amountToApply = newCredits[index].creditsAvailable;
        } else {
            newCredits[index].amountToApply = amount;
        }

        setCredits(newCredits);
        setAutoApplied(false); // User manually changed, disable auto flag
    };

    const totalAmountToCredit = credits.reduce((sum, c) => sum + c.amountToApply, 0);
    const newBalance = invoice.balanceDue - totalAmountToCredit;

    const handleApplyCredits = async () => {
        // Filter only credits with amount to apply
        const creditsToApply = credits
            .filter(c => c.amountToApply > 0)
            .map(c => ({
                sourceId: c.id,
                sourceType: c.type,
                amountToApply: c.amountToApply
            }));

        if (creditsToApply.length === 0) {
            toast({
                title: "No Credits Selected",
                description: "Please enter amounts to apply",
                variant: "destructive"
            });
            return;
        }

        if (totalAmountToCredit > invoice.balanceDue) {
            toast({
                title: "Amount Exceeds Balance",
                description: `Total credit ${formatCurrency(totalAmountToCredit)} exceeds invoice balance ${formatCurrency(invoice.balanceDue)}`,
                variant: "destructive"
            });
            return;
        }

        setApplying(true);
        try {
            const response = await fetch(`/api/invoices/${invoice.id}/apply-credits`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ credits: creditsToApply })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to apply credits');
            }

            toast({
                title: "Credits Applied Successfully",
                description: `${formatCurrency(data.data.creditsApplied)} applied to invoice`
            });

            onSuccess();
            onClose();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to apply credits",
                variant: "destructive"
            });
        } finally {
            setApplying(false);
        }
    };

    const handleResetToAuto = () => {
        if (credits.length > 0) {
            autoSuggestAmounts(credits);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Apply Credits to {invoice?.invoiceNumber}</DialogTitle>
                    <DialogDescription>
                        Select the credits you want to apply to this invoice. Credits are auto-suggested in FIFO order (Credit Notes first, then Payments).
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="py-8 text-center text-slate-500">Loading available credits...</div>
                ) : credits.length === 0 ? (
                    <div className="py-8 text-center text-slate-500">
                        <Info className="h-12 w-12 mx-auto mb-3 text-slate-400" />
                        <p>No credits available for this customer</p>
                    </div>
                ) : (
                    <>
                        <div className="border rounded-lg overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-slate-50 border-b">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Type</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Transaction #</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Date</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Credit Amount</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Available</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase w-40">Amount to Apply</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {credits.map((credit, index) => (
                                        <tr key={credit.id} className="hover:bg-slate-50">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    {credit.type === 'credit_note' ? (
                                                        <FileText className="h-4 w-4 text-blue-600" />
                                                    ) : (
                                                        <CreditCard className="h-4 w-4 text-green-600" />
                                                    )}
                                                    <span className="text-sm font-medium">
                                                        {credit.type === 'credit_note' ? 'Credit Note' : 'Excess Payment'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm">{credit.transactionNumber}</td>
                                            <td className="px-4 py-3 text-sm text-slate-600">{formatDate(credit.transactionDate)}</td>
                                            <td className="px-4 py-3 text-sm text-right text-slate-600">{formatCurrency(credit.creditAmount)}</td>
                                            <td className="px-4 py-3 text-sm text-right font-medium">{formatCurrency(credit.creditsAvailable)}</td>
                                            <td className="px-4 py-3">
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    max={credit.creditsAvailable}
                                                    step="0.01"
                                                    value={credit.amountToApply || ''}
                                                    onChange={(e) => handleAmountChange(index, e.target.value)}
                                                    className="text-right"
                                                    placeholder="0.00"
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {!autoApplied && credits.some(c => c.amountToApply > 0) && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-3">
                                <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                    <p className="text-sm text-blue-900">
                                        You've manually adjusted the amounts.
                                        <Button
                                            variant="link"
                                            className="p-0 h-auto text-blue-700 hover:text-blue-900 ml-1"
                                            onClick={handleResetToAuto}
                                        >
                                            Click here to reset to auto-suggested (FIFO)
                                        </Button>
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="bg-slate-50 border rounded-lg p-4 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-600">Invoice Balance:</span>
                                <span className="font-semibold">{formatCurrency(invoice.balanceDue)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-600">Amount to Credit:</span>
                                <span className="font-semibold text-green-600">{formatCurrency(totalAmountToCredit)}</span>
                            </div>
                            <div className="border-t pt-2 flex justify-between">
                                <span className="font-semibold">New Balance Due:</span>
                                <span className={`font-bold text-lg ${newBalance === 0 ? 'text-green-600' : 'text-slate-900'}`}>
                                    {formatCurrency(newBalance)}
                                </span>
                            </div>
                        </div>
                    </>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={applying}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleApplyCredits}
                        disabled={applying || loading || credits.length === 0 || totalAmountToCredit === 0}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        {applying ? "Applying..." : "Apply Credits"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
