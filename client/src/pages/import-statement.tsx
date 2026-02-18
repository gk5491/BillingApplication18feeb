import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    Upload,
    ChevronRight,
    HelpCircle,
    ChevronDown,
    ArrowLeft,
    FileUp
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function ImportStatement() {
    const { toast } = useToast();
    const [, setLocation] = useLocation();
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const steps = [
        { id: 1, label: "Configure", active: true },
    ];

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            validateAndSetFile(file);
        }
    };

    const validateAndSetFile = (file: File) => {
        const validTypes = ['.csv', '.tsv', '.xls', '.xlsx', '.ofx', '.qif', '.pdf'];
        const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

        if (!validTypes.includes(extension)) {
            toast({
                title: "Invalid file type",
                description: "Please upload a supported bank statement file.",
                variant: "destructive"
            });
            return;
        }

        setSelectedFile(file);
        toast({
            title: "File selected",
            description: `${file.name} is ready for import.`,
        });
    };

    const parseCSV = (text: string) => {
        // Handle both Windows (\r\n) and Unix (\n) line endings
        const lines = text.split(/\r?\n/).filter(line => line.trim());
        if (lines.length < 2) return [];

        // Detect separator (comma or semicolon)
        const firstLine = lines[0];
        const separator = firstLine.includes(';') ? ';' : ',';
        const headers = firstLine.split(separator).map(h => h.trim().toLowerCase());

        const transactions = [];
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(separator).map(v => v.trim());

            // Skip empty rows
            if (values.every(v => !v)) continue;

            const transaction: any = {
                id: `imported_${Date.now()}_${i}`,
                status: 'uncategorized'
            };

            headers.forEach((header, index) => {
                const value = values[index] || '';

                if (header.includes('date')) {
                    transaction.date = value;
                } else if (header.includes('withdrawal') || header.includes('debit')) {
                    // Remove currency symbols and commas before parsing
                    transaction.withdrawal = value.replace(/[₹$,]/g, '') || '0.00';
                } else if (header.includes('deposit') || header.includes('credit')) {
                    transaction.deposit = value.replace(/[₹$,]/g, '') || '0.00';
                } else if (header.includes('payee') || header.includes('name')) {
                    transaction.payee = value;
                } else if (header.includes('description') || header.includes('details') || header.includes('narration')) {
                    transaction.details = value;
                } else if (header.includes('reference') || header.includes('ref')) {
                    transaction.referenceNumber = value;
                }
            });

            // Skip rows that don't have a valid date
            const hasValidDate = transaction.date && transaction.date.trim() !== '';
            
            // Flexible amount check: row is valid if it has a date and either a withdrawal or deposit
            // We also handle cases where the amount might be 0 but the row is still a valid transaction
            if (!hasValidDate) {
                continue;
            }

            // Ensure required fields exist
            if (!transaction.withdrawal) transaction.withdrawal = '0.00';
            if (!transaction.deposit) transaction.deposit = '0.00';
            if (!transaction.details) transaction.details = transaction.payee || 'Imported Transaction';

            transactions.push(transaction);
        }

        return transactions;
    };

    const handleImport = async () => {
        if (!selectedFile) return;

        try {
            const text = await selectedFile.text();
            const transactions = parseCSV(text);

            // POST to server to save transactions permanently
            const response = await fetch('/api/transactions/import', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    transactions: transactions.map(t => ({
                        date: t.date,
                        withdrawals: t.withdrawal,
                        deposits: t.deposit,
                        payee: t.payee,
                        description: t.details,
                        referenceNumber: t.referenceNumber,
                        status: "Uncategorized"
                    }))
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to save transactions');
            }

            // Invalidate the transactions cache so the new data appears immediately
            await queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });

            toast({
                title: "Import Successful",
                description: `${transactions.length} transactions imported and saved to server.`,
            });

            // Navigate back to banking page after a short delay
            setTimeout(() => {
                setLocation('/banking');
            }, 1500);

        } catch (error) {
            console.error('Import error:', error);
            toast({
                title: "Import Failed",
                description: "Failed to import transactions. Please try again.",
                variant: "destructive"
            });
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            validateAndSetFile(file);
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50">
            <header className="flex items-center justify-between px-6 py-4 bg-white border-b">
                <div className="flex items-center gap-4">
                    <Link href="/banking">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <h1 className="text-xl font-semibold">Import Statements for HDFC</h1>
                </div>
            </header>

            <main className="flex-1 p-8 overflow-auto">
                <div className="max-w-4xl mx-auto space-y-8">
                    {/* Stepper */}
                    <div className="flex items-center justify-center gap-4">
                        {steps.map((step, index) => (
                            <div key={step.id} className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${step.active ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-500"
                                        }`}>
                                        {step.id}
                                    </div>
                                    <span className={`text-sm font-medium ${step.active ? "text-slate-900" : "text-slate-500"
                                        }`}>
                                        {step.label}
                                    </span>
                                </div>
                                {index < steps.length - 1 && (
                                    <div className="w-12 h-[1px] bg-slate-200" />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Upload Section */}
                    <input
                        type="file"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".csv,.tsv,.xls,.xlsx,.ofx,.qif,.pdf"
                    />

                    <Card
                        className={`p-12 border-dashed border-2 transition-colors flex flex-col items-center justify-center text-center space-y-6 ${isDragging ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-white"
                            } ${selectedFile ? "border-green-500 bg-green-50" : ""}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        <div className={`h-16 w-16 rounded-full flex items-center justify-center ${selectedFile ? "bg-green-100" : "bg-slate-50"
                            }`}>
                            {selectedFile ? (
                                <FileUp className="h-8 w-8 text-green-600" />
                            ) : (
                                <Upload className="h-8 w-8 text-slate-400" />
                            )}
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-lg font-semibold text-slate-900">
                                {selectedFile ? selectedFile.name : "Drag and drop file to import"}
                            </h2>
                            <div className="flex items-center justify-center gap-2">
                                <Button
                                    className="bg-blue-600 hover:bg-blue-700"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Upload className="h-4 w-4 mr-2" />
                                    {selectedFile ? "Change File" : "Choose File"}
                                    <ChevronDown className="h-4 w-4 ml-2" />
                                </Button>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                                <HelpCircle className="h-4 w-4" />
                                <span>Bank statement imported till 28/01/2024</span>
                            </div>
                            <p className="text-[11px] text-slate-400">
                                Maximum File Size: 1 MB for CSV, TSV, XLS, OFX, QIF, CAMT.053 and CAMT.054 • 5 MB for PDF files.
                            </p>
                        </div>
                    </Card>

                    {/* Format Info */}
                    <div className="space-y-4">
                    </div>

                    {/* Next Button Section */}
                    <div className="flex justify-end pt-4 border-t">
                        <Button
                            className="bg-blue-600 hover:bg-blue-700 px-8"
                            disabled={!selectedFile}
                            onClick={handleImport}
                        >
                            Import
                        </Button>
                    </div>
                </div>
            </main>
        </div>
    );
}

