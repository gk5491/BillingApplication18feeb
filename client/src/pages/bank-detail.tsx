import { useState } from "react";
import { useLocation, useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { BankAccount } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    ArrowLeft,
    Search,
    Filter,
    Settings,
    MoreHorizontal,
    Plus,
    Upload,
    ChevronDown,
    LayoutDashboard,
    FileText,
    List,
    CheckCircle2,
    XCircle,
    History,
    HelpCircle,
    MessageSquare
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface Transaction {
    id: string;
    date: string;
    description: string;
    deposit: string;
    withdrawals: string;
    status: string;
    payee?: string;
    referenceNumber?: string;
}

export default function BankDetail() {
    const { id } = useParams();
    const [, setLocation] = useLocation();
    const [activeTab, setActiveTab] = useState("Uncategorized");

    const { data: accountsData } = useQuery<{ success: boolean; data: BankAccount[] }>({
        queryKey: ["/api/bank-accounts"],
    });

    const { data: transactionsData } = useQuery<Transaction[]>({
        queryKey: ["/api/transactions"],
    });

    const account = accountsData?.data?.find(a => a.id === id);

    // All transactions now come from the server API
    const transactions: Transaction[] = transactionsData || [];

    const uncategorizedCount = transactions.filter(t => t.status === 'Uncategorized').length;
    const recognizedCount = transactions.filter(t => t.status === 'Recognized').length;
    const totalCount = transactions.length;

    const filteredTransactions = activeTab === 'all'
        ? transactions
        : transactions.filter(t => t.status === activeTab);

    if (!account) return <div>Loading...</div>;

    return (
        <div className="flex flex-col h-full bg-background animate-in fade-in duration-500">
            {/* Top Header */}
            <header className="flex items-center justify-between px-4 py-2 border-b">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => setLocation("/banking")}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl font-bold uppercase">{account.accountName}</h1>
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="text-blue-600 gap-1">
                        <History className="h-4 w-4" /> Bank Statements
                    </Button>
                    <div className="flex items-center">
                        <Button className="bg-blue-600 hover:bg-blue-700 rounded-r-none h-9">
                            Add Transaction
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button className="bg-blue-600 hover:bg-blue-700 rounded-l-none border-l border-blue-500 h-9 px-2">
                                    <ChevronDown className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem>Option 1</DropdownMenuItem>
                                <DropdownMenuItem>Option 2</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    <Link href="/import-statement">
                        <Button variant="outline" size="sm" className="h-9">
                            Import Statement
                        </Button>
                    </Link>
                    <Button variant="ghost" size="icon" className="h-9 w-9">
                        <Settings className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9">
                        <MessageSquare className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive">
                        <XCircle className="h-4 w-4" />
                    </Button>
                </div>
            </header>

            {/* Account Info Bar */}
            <div className="flex items-center gap-4 px-6 py-4 border-b">
                <div className="h-10 w-10 bg-muted rounded flex items-center justify-center">
                    <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                    <p className="text-xs text-muted-foreground font-medium">Amount in Zoho Books</p>
                    <p className="text-lg font-bold">₹0.00</p>
                </div>
            </div>

            {/* Tabs / Filter Bar */}
            <div className="flex flex-col border-b">
                <div className="flex items-center px-6 py-4 gap-8">
                    <div className="cursor-pointer">
                        <p className="text-sm font-semibold text-muted-foreground">Dashboard</p>
                        <p className="text-xs text-muted-foreground">Account Summary</p>
                    </div>
                    <div className="bg-blue-50 border border-blue-100 rounded-md px-4 py-2 cursor-pointer">
                        <p className="text-sm font-bold text-blue-900">{uncategorizedCount} Uncategorized Transactions</p>
                        <p className="text-xs text-blue-700">From Bank Statements</p>
                    </div>
                    <div className="flex items-center gap-1 cursor-pointer">
                        <div>
                            <p className="text-sm font-semibold">All Transactions</p>
                            <p className="text-xs text-muted-foreground">In Zoho Books</p>
                        </div>
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                        <Label htmlFor="multi-select" className="text-xs font-medium italic text-muted-foreground">Multi-Select & Match</Label>
                        <Switch id="multi-select" />
                    </div>
                </div>

                <div className="flex items-center justify-between px-6 pb-2">
                    <div className="flex gap-2">
                        <Button
                            variant={activeTab === "Uncategorized" ? "default" : "ghost"}
                            size="sm"
                            className={`rounded-full px-4 h-7 text-xs ${activeTab === "Uncategorized" ? "bg-blue-600" : ""}`}
                            onClick={() => setActiveTab("Uncategorized")}
                        >
                            Uncategorized ({uncategorizedCount})
                        </Button>
                        <Button
                            variant={activeTab === "Recognized" ? "default" : "ghost"}
                            size="sm"
                            className={`rounded-full px-4 h-7 text-xs ${activeTab === "Recognized" ? "bg-blue-600" : ""}`}
                            onClick={() => setActiveTab("Recognized")}
                        >
                            Recognized ({recognizedCount})
                        </Button>
                        <Button
                            variant={activeTab === "all" ? "default" : "ghost"}
                            size="sm"
                            className={`rounded-full px-4 h-7 text-xs ${activeTab === "all" ? "bg-blue-600" : ""}`}
                            onClick={() => setActiveTab("all")}
                        >
                            All ({totalCount})
                        </Button>
                    </div>
                    <Button variant="ghost" size="sm" className="text-blue-600 text-xs font-medium" onClick={() => setActiveTab("Excluded")}>
                        Excluded
                    </Button>
                </div>
            </div>

            {/* Table Section */}
            <div className="flex-1 overflow-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="w-10">
                                <Input type="checkbox" className="h-4 w-4" />
                            </TableHead>
                            <TableHead className="text-xs font-bold uppercase">Date <ChevronDown className="inline h-3 w-3" /></TableHead>
                            <TableHead className="text-xs font-bold uppercase">Withdrawals</TableHead>
                            <TableHead className="text-xs font-bold uppercase">Deposits</TableHead>
                            <TableHead className="text-xs font-bold uppercase">Payee</TableHead>
                            <TableHead className="text-xs font-bold uppercase">Description</TableHead>
                            <TableHead className="text-xs font-bold uppercase">Reference Number</TableHead>
                            <TableHead className="w-10">
                                <Search className="h-4 w-4 text-muted-foreground" />
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredTransactions.map((tx) => (
                            <TableRow key={tx.id} className="group hover:bg-slate-50">
                                <TableCell>
                                    <Input type="checkbox" className="h-4 w-4" />
                                </TableCell>
                                <TableCell className="text-sm">{tx.date}</TableCell>
                                <TableCell className="text-sm font-medium">₹{tx.withdrawals}</TableCell>
                                <TableCell className="text-sm font-medium">₹{tx.deposit}</TableCell>
                                <TableCell className="text-sm">{tx.payee || "-"}</TableCell>
                                <TableCell className="text-sm text-slate-500 max-w-md truncate">
                                    {tx.description}
                                </TableCell>
                                <TableCell className="text-sm">{tx.referenceNumber || "-"}</TableCell>
                                <TableCell>
                                    <MoreHorizontal className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 cursor-pointer" />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                    </Table>
            </div>
        </div>
    );
}
