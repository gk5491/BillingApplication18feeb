import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  ChevronDown, 
  Receipt, 
  CreditCard, 
  FileCheck, 
  Package, 
  Truck, 
  Wallet, 
  BadgeIndianRupee,
  X,
  Copy,
  UserMinus,
  UserCheck,
  Trash2,
  Clock,
  Bold,
  Italic,
  Underline,
  Loader2,
  MessageSquare,
  Mail,
  Printer,
  Download,
  Calendar
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, startOfMonth, subMonths, parseISO } from "date-fns";

export default function CustomerProfilePage() {
    const { user, token } = useAuthStore();
    const { toast } = useToast();
    const [, setLocation] = useLocation();
    const [isFetchLoading, setIsFetchLoading] = useState(true);
    const [customer, setCustomer] = useState<any>(null);
    const [activeTab, setActiveTab] = useState("overview");

    const [comments, setComments] = useState<any[]>([]);
    const [transactions, setTransactions] = useState<any>({
        invoices: [],
        customerPayments: [],
        quotes: [],
        salesOrders: [],
        deliveryChallans: [],
        expenses: [],
        creditNotes: []
    });
    const [mails, setMails] = useState<any[]>([]);
    const [activities, setActivities] = useState<any[]>([]);
    const [isAddingComment, setIsAddingComment] = useState(false);
    const [newComment, setNewComment] = useState("");
    const commentRef = useRef<HTMLTextAreaElement>(null);

    const [incomePeriod, setIncomePeriod] = useState("last-6-months");
    const [incomeMethod, setIncomeMethod] = useState("accrual");
    const [statementPeriod, setStatementPeriod] = useState("this-month");
    const [statementFilter, setStatementFilter] = useState("all");

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch("/api/flow/profile", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.data) {
                        setCustomer(data.data);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch profile", error);
            } finally {
                setIsFetchLoading(false);
            }
        };

        if (token) fetchProfile();
        else setIsFetchLoading(false);
    }, [token]);

    const fetchCustomerData = async () => {
        if (!customer?.id) return;
        try {
            const [commentsRes, transactionsRes, mailsRes, activitiesRes, invoicesRes] = await Promise.all([
                fetch(`/api/customers/${customer.id}/comments`),
                fetch(`/api/customers/${customer.id}/transactions`),
                fetch(`/api/customers/${customer.id}/mails`),
                fetch(`/api/customers/${customer.id}/activities`),
                fetch(`/api/invoices`)
            ]);

            if (commentsRes.ok) {
                const data = await commentsRes.json();
                setComments(data.data || []);
            }
            
            if (transactionsRes.ok) {
                const data = await transactionsRes.json();
                setTransactions(prev => ({ ...prev, ...data.data }));
            }
            
            if (invoicesRes.ok) {
                const invoicesData = await invoicesRes.json();
                const filteredInvoices = (invoicesData.data || []).filter((inv: any) => String(inv.customerId) === String(customer.id));
                setTransactions(prev => ({ ...prev, invoices: filteredInvoices }));
            }

            if (mailsRes.ok) {
                const data = await mailsRes.json();
                setMails(data.data || []);
            }
            if (activitiesRes.ok) {
                const data = await activitiesRes.json();
                setActivities(data.data || []);
            }
        } catch (error) {
            console.error('Error fetching customer data:', error);
        }
    };

    useEffect(() => {
        if (customer?.id) {
            fetchCustomerData();
        }
    }, [customer?.id]);

    const formatAddress = (address: any) => {
        if (!address) return ['-'];
        const parts = [address.street, address.city, address.state, address.country, address.pincode].filter(Boolean);
        return parts.length > 0 ? parts : ['-'];
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2
        }).format(amount);
    };

    const getIncomeData = () => {
        const now = new Date();
        const monthsToInclude = incomePeriod === 'last-6-months' ? 6 : 12;
        const months: { label: string; date: Date; income: number }[] = [];
        for (let i = 0; i < monthsToInclude; i++) {
            const d = startOfMonth(subMonths(now, monthsToInclude - 1 - i));
            months.push({
                label: d.toLocaleDateString('en-IN', { month: 'short' }),
                date: d,
                income: 0
            });
        }

        const txList = (transactions.invoices || []).filter((inv:any) => inv.status !== 'Void');

        txList.forEach((tx:any) => {
            const txDate = parseISO(tx.date);
            const mStart = startOfMonth(txDate);
            const monthIdx = months.findIndex(m => m.date.getTime() === mStart.getTime());
            if (monthIdx !== -1) {
                months[monthIdx].income += tx.amount || 0;
            }
        });

        const totalIncome = months.reduce((sum, m) => sum + m.income, 0);
        return { months, totalIncome };
    };

    const handleAddComment = async () => {
        if (!newComment.trim() || isAddingComment) return;
        setIsAddingComment(true);
        try {
            const response = await fetch(`/api/customers/${customer.id}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: newComment })
            });
            if (response.ok) {
                const data = await response.json();
                setComments([data.data, ...comments]);
                setNewComment("");
                toast({ title: "Comment added successfully" });
            }
        } catch (error) {
            toast({ title: "Failed to add comment", variant: "destructive" });
        } finally {
            setIsAddingComment(false);
        }
    };

    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        return {
            date: date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
            time: date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
        };
    };

    if (isFetchLoading) {
        return <div className="container mx-auto py-10 text-center">Loading profile...</div>;
    }

    if (!customer) {
        return <div className="container mx-auto py-10 text-center">Profile not found.</div>;
    }

    const incomeData = getIncomeData();
    const statementTransactions = transactions.invoices || [];

    return (
        <div className="h-full flex flex-col bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-sidebar-accent/5">
                <div className="flex items-center gap-3">
                    <h2 className="text-xl font-semibold text-sidebar font-display truncate" data-testid="text-customer-name">{customer.name}</h2>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setLocation("/customer/settings/profile")} data-testid="button-edit-customer">
                        Edit
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button className="bg-sidebar hover:bg-sidebar/90 text-white gap-1.5 h-9 font-display shadow-sm" size="sm" data-testid="button-new-transaction">
                                New Transaction
                                <ChevronDown className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel className="text-xs text-slate-500">SALES</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => setLocation("/customer/request")}>
                                <Receipt className="mr-2 h-4 w-4" /> Request Item
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <div className="flex items-center px-6 border-b border-slate-200 bg-white flex-shrink-0">
                    <TabsList className="h-auto p-0 bg-transparent gap-8">
                        {["overview", "comments", "transactions", "mails", "statement"].map((tab) => (
                            <TabsTrigger
                                key={tab}
                                value={tab}
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-sidebar data-[state=active]:text-sidebar data-[state=active]:bg-transparent data-[state=active]:shadow-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-2 py-3 bg-transparent hover:bg-transparent transition-none font-medium font-display capitalize"
                                data-testid={`tab-${tab}`}
                            >
                                {tab}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>

                <div className="flex-1 overflow-y-auto scrollbar-hide">
                    <TabsContent value="overview" className="flex-1 p-0 mt-0">
                        <div className="flex h-full">
                            <div className="w-72 border-r border-slate-200 dark:border-slate-700 p-6 overflow-auto scrollbar-hide">
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white" data-testid="text-customer-display-name">{customer.name}</h3>
                                        {customer.email && (
                                            <p className="text-sm text-sidebar font-medium mt-2 font-display" data-testid="text-customer-email-only">{customer.email}</p>
                                        )}
                                    </div>

                                    <Collapsible defaultOpen>
                                        <CollapsibleTrigger className="flex items-center justify-between w-full text-[11px] font-bold text-sidebar/60 uppercase tracking-widest font-display">
                                            ADDRESS
                                            <ChevronDown className="h-3.5 w-3.5" />
                                        </CollapsibleTrigger>
                                        <CollapsibleContent className="mt-3 space-y-4">
                                            <div className="mt-4">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-display">Billing Address</p>
                                                <div className="text-sm">
                                                    {formatAddress(customer.billingAddress).map((line:any, i:any) => <p key={i}>{line}</p>)}
                                                </div>
                                            </div>
                                            <div className="mt-4">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-display">Shipping Address</p>
                                                <div className="text-sm">
                                                    {formatAddress(customer.shippingAddress).map((line:any, i:any) => <p key={i}>{line}</p>)}
                                                </div>
                                            </div>
                                        </CollapsibleContent>
                                    </Collapsible>

                                    <Collapsible defaultOpen>
                                        <CollapsibleTrigger className="flex items-center justify-between w-full text-[11px] font-bold text-sidebar/60 uppercase tracking-widest font-display">
                                            OTHER DETAILS
                                            <ChevronDown className="h-3.5 w-3.5" />
                                        </CollapsibleTrigger>
                                        <CollapsibleContent className="mt-4 space-y-4 text-sm">
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-display">Customer Type</p>
                                                <p className="font-semibold text-slate-700 font-display">Business</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-display">Default Currency</p>
                                                <p className="font-semibold text-slate-700 font-display">{customer.currency || 'INR'}</p>
                                            </div>
                                            {customer.gstin && (
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-display">GSTIN</p>
                                                    <p className="font-semibold text-slate-700 font-display">{customer.gstin}</p>
                                                </div>
                                            )}
                                        </CollapsibleContent>
                                    </Collapsible>
                                </div>
                            </div>

                            <div className="flex-1 overflow-auto scrollbar-hide">
                                <div className="w-full">
                                    <div className="bg-sidebar/5 border border-sidebar/20 rounded-lg p-4 mb-6 mx-6 mt-6">
                                        <p className="text-sm text-sidebar font-display">
                                            You can request your contact to directly update the GSTIN by sending an email.{' '}
                                            <button className="text-sidebar font-bold hover:underline ml-1">Send email</button>
                                        </p>
                                    </div>

                                    <div className="mb-6 mx-6">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-display">Payment due period</p>
                                        <p className="text-sm font-semibold text-slate-700 font-display">{customer.paymentTerms || 'Due on Receipt'}</p>
                                    </div>

                                    <div className="mb-6 mx-6">
                                        <h4 className="text-lg font-semibold mb-4 text-sidebar font-display">Receivables</h4>
                                        <div className="border border-slate-200 rounded-lg overflow-hidden">
                                            <table className="w-full text-sm">
                                                <thead className="bg-sidebar-accent/5">
                                                    <tr className="text-left text-sidebar/60 border-b border-slate-200">
                                                        <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider font-display">CURRENCY</th>
                                                        <th className="px-4 py-2.5 text-right text-[11px] font-bold uppercase tracking-wider font-display">OUTSTANDING RECEIVABLES</th>
                                                        <th className="px-4 py-2.5 text-right text-[11px] font-bold uppercase tracking-wider font-display">UNUSED CREDITS</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr className="group hover:bg-slate-50 transition-colors">
                                                        <td className="px-4 py-3 font-medium text-slate-700 font-display">INR- Indian Rupee</td>
                                                        <td className="px-4 py-3 text-right font-semibold text-sidebar font-display">{formatCurrency(customer.outstandingReceivables || 0)}</td>
                                                        <td className="px-4 py-3 text-right font-semibold text-green-600 font-display">{formatCurrency(customer.unusedCredits || 0)}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    <div className="mb-6 mx-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-lg font-semibold text-sidebar font-display">Income</h4>
                                            <div className="flex items-center gap-2">
                                                <Select value={incomePeriod} onValueChange={setIncomePeriod}>
                                                    <SelectTrigger className="w-36 h-8 text-sm border-slate-200"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="last-6-months">Last 6 Months</SelectItem>
                                                        <SelectItem value="last-12-months">Last 12 Months</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <div className="h-40 bg-slate-50 rounded-lg flex items-end justify-around px-4 pb-2 border border-slate-100 mb-2">
                                            {incomeData.months.map((m, i) => {
                                                const maxIncome = Math.max(...incomeData.months.map(m => m.income), 1);
                                                const height = (m.income / maxIncome) * 100;
                                                return (
                                                    <div key={i} className="flex flex-col items-center flex-1 group relative">
                                                        <div className="w-8 bg-sidebar/20 rounded-t-sm group-hover:bg-sidebar/40 transition-all duration-300 relative" style={{ height: `${Math.max(2, height * 0.8)}%` }}>
                                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 shadow-lg font-mono">
                                                                {formatCurrency(m.income)}
                                                            </div>
                                                        </div>
                                                        <span className="text-[10px] font-bold text-slate-400 mt-2 uppercase font-display">{m.label}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="mx-6 pb-6">
                                        <h4 className="text-lg font-semibold mb-4">Activity Timeline</h4>
                                        <div className="space-y-4">
                                            {activities.length === 0 ? (
                                                <div className="text-center py-8 text-slate-500">
                                                    <Clock className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                                                    <p className="text-sm">No activities yet</p>
                                                </div>
                                            ) : (
                                                activities.map((activity) => {
                                                    const { date, time } = formatDateTime(activity.date);
                                                    return (
                                                        <div key={activity.id} className="flex gap-4">
                                                            <div className="text-right text-[11px] font-bold text-slate-400 w-24 flex-shrink-0 uppercase font-display">
                                                                <p>{date}</p>
                                                                <p className="text-slate-300">{time}</p>
                                                            </div>
                                                            <div className="relative">
                                                                <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[1px] bg-slate-200"></div>
                                                                <div className="relative z-10 h-3 w-3 bg-white border-2 border-sidebar rounded-full mt-1"></div>
                                                            </div>
                                                            <div className="flex-1 bg-slate-50/50 border border-slate-100 rounded-lg p-3 hover:bg-slate-50 transition-colors">
                                                                <h5 className="font-bold text-sm text-slate-800 font-display">{activity.title}</h5>
                                                                <p className="text-sm text-slate-600 mt-1 font-display leading-relaxed">{activity.description}</p>
                                                                <p className="text-xs text-slate-500 mt-2 font-display">by <span className="text-sidebar font-semibold">{activity.user}</span></p>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="comments" className="flex-1 overflow-y-auto scrollbar-hide p-6 mt-0">
                        <div className="w-full p-6 max-w-4xl mx-auto">
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden mb-8 transition-all focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500">
                                <div className="flex items-center gap-1 p-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-200 dark:hover:bg-slate-700"><Bold className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-200 dark:hover:bg-slate-700"><Italic className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-200 dark:hover:bg-slate-700"><Underline className="h-4 w-4" /></Button>
                                </div>
                                <Textarea
                                    ref={commentRef}
                                    placeholder="Write a comment..."
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    className="border-0 focus-visible:ring-0 min-h-32 resize-none p-4 text-sm bg-transparent"
                                />
                                <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
                                    <Button onClick={handleAddComment} disabled={!newComment.trim() || isAddingComment} size="sm" className="bg-sidebar hover:bg-sidebar/90 text-white font-bold font-display px-6 shadow-sm">
                                        {isAddingComment ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Add Comment"}
                                    </Button>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 mb-8">
                                <div className="h-px flex-1 bg-slate-100" />
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-display">All Comments</h4>
                                <div className="h-px flex-1 bg-slate-100" />
                            </div>

                            {comments.length === 0 ? (
                                <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                                    <MessageSquare className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                                    <p className="text-slate-500 italic font-display">No comments yet</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {comments.map((comment) => (
                                        <div key={comment.id} className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center"><User className="h-4 w-4 text-blue-600" /></div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200 font-display">{comment.author}</p>
                                                        <p className="text-[10px] text-slate-400 font-display">{format(new Date(comment.createdAt), "MMM d, yyyy h:mm a")}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 font-display leading-relaxed whitespace-pre-wrap">{comment.text}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="transactions" className="flex-1 overflow-y-auto scrollbar-hide p-6 mt-0">
                        <div className="mx-auto max-w-6xl space-y-8">
                            {Object.entries(transactions).map(([type, list]: [string, any]) => (
                                <div key={type} className="space-y-4">
                                    <h4 className="font-bold text-sidebar font-display capitalize">{type.replace(/([A-Z])/g, ' ')}</h4>
                                    <Table>
                                        <TableHeader className="bg-slate-50">
                                            <TableRow>
                                                <TableHead className="font-bold text-[11px] uppercase">Date</TableHead>
                                                <TableHead className="font-bold text-[11px] uppercase">Number</TableHead>
                                                <TableHead className="font-bold text-[11px] uppercase text-right">Amount</TableHead>
                                                <TableHead className="font-bold text-[11px] uppercase text-right">Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {!Array.isArray(list) || list.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="text-center py-8 text-slate-400 italic">No {type} found.</TableCell>
                                                </TableRow>
                                            ) : (
                                                list.map((tx: any) => (
                                                    <TableRow key={tx.id}>
                                                        <TableCell className="text-sm">{format(new Date(tx.date), "dd MMM yyyy")}</TableCell>
                                                        <TableCell className="text-sm font-semibold text-sidebar">{tx.invoiceNumber || tx.number || tx.quoteNumber || tx.paymentNumber}</TableCell>
                                                        <TableCell className="text-right text-sm font-medium">{formatCurrency(tx.total || tx.amount)}</TableCell>
                                                        <TableCell className="text-right">
                                                            <Badge variant="outline" className="text-[10px] font-bold uppercase">{tx.status}</Badge>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="mails" className="flex-1 overflow-y-auto scrollbar-hide p-6 mt-0 text-center text-slate-500 italic">
                        {mails.length === 0 ? (
                            <div className="py-20 bg-slate-50 rounded-xl border border-dashed border-slate-200 max-w-4xl mx-auto">
                                <Mail className="h-12 w-12 text-slate-200 mx-auto mb-3" />
                                <p className="font-display">No mail history found.</p>
                            </div>
                        ) : (
                            <div className="max-w-4xl mx-auto space-y-4">
                                {mails.map((mail: any) => (
                                    <div key={mail.id} className="bg-white border border-slate-100 rounded-lg p-4 text-left shadow-sm">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <p className="font-bold text-slate-800 font-display">{mail.subject}</p>
                                                <p className="text-xs text-slate-400">To: {mail.to}</p>
                                            </div>
                                            <p className="text-[10px] text-slate-400 font-display">{format(new Date(mail.sentAt), "dd MMM yyyy h:mm a")}</p>
                                        </div>
                                        <p className="text-sm text-slate-600 mt-2 line-clamp-2 font-display">{mail.description}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="statement" className="flex-1 overflow-y-auto scrollbar-hide p-0 mt-0">
                        <div className="h-full overflow-auto scrollbar-hide p-8 flex flex-col items-center bg-slate-100">
                            <div className="w-full max-w-[210mm] mb-6 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Select value={statementPeriod} onValueChange={setStatementPeriod}>
                                        <SelectTrigger className="h-9 min-w-[140px] bg-white border-slate-200"><Calendar className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="this-month">This Month</SelectItem>
                                            <SelectItem value="last-month">Last Month</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Select value={statementFilter} onValueChange={setStatementFilter}>
                                        <SelectTrigger className="h-9 min-w-[140px] bg-white border-slate-200 text-slate-600">Filter By: <SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Transactions</SelectItem>
                                            <SelectItem value="outstanding">Outstanding</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="icon" className="bg-white h-9 w-9"><Printer className="h-4 w-4" /></Button>
                                    <Button variant="outline" size="icon" className="bg-white h-9 w-9"><Download className="h-4 w-4" /></Button>
                                    <Button className="bg-sidebar hover:bg-sidebar/90 text-white h-9 px-4 text-xs font-bold gap-2">
                                        <Mail className="h-4 w-4" /> Send Email
                                    </Button>
                                </div>
                            </div>

                            <div className="bg-white text-slate-900 shadow-xl px-10 py-10 w-full max-w-[210mm] min-h-[296mm] h-fit" id="customer-statement" style={{ color: '#000000' }}>
                                <div className="flex justify-between items-start mb-12">
                                    <div className="space-y-4">
                                        <h2 className="text-2xl font-bold uppercase">Statement of Accounts</h2>
                                        <p className="text-sm text-slate-600">{format(new Date(), "dd MMM yyyy")}</p>
                                    </div>
                                    <div className="text-right">
                                        <h1 className="text-4xl font-light text-slate-400 uppercase tracking-widest mb-4">Statement</h1>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-12 mb-12">
                                    <div>
                                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">To</h3>
                                        <div className="space-y-1">
                                            <p className="font-bold text-blue-600 text-lg leading-none mb-1">{customer.name}</p>
                                            {formatAddress(customer.billingAddress).map((part:any, i:any) => <p key={i} className="text-sm text-slate-600">{part}</p>)}
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 p-6 rounded-sm border border-slate-100">
                                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Account Summary</h3>
                                        <div className="space-y-3">
                                            <div className="flex justify-between text-sm"><span className="text-slate-500">Opening Balance</span><span className="font-medium">{formatCurrency(0)}</span></div>
                                            <div className="flex justify-between text-sm"><span className="text-slate-500">Invoiced Amount</span><span className="font-medium">{formatCurrency(customer.outstandingReceivables || 0)}</span></div>
                                            <div className="flex justify-between text-sm"><span className="text-slate-500">Amount Received</span><span className="font-medium text-green-600">{formatCurrency(0)}</span></div>
                                            <div className="pt-3 border-t border-slate-200 flex justify-between"><span className="font-bold uppercase text-xs">Balance Due</span><span className="font-bold text-lg">{formatCurrency(customer.outstandingReceivables || 0)}</span></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="border border-slate-200 rounded-xl overflow-hidden mb-12">
                                    <table className="w-full table-fixed">
                                        <thead>
                                            <tr className="bg-slate-900 text-white">
                                                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase w-[15%]">Date</th>
                                                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase w-[40%]">Transactions</th>
                                                <th className="px-4 py-3 text-right text-[10px] font-bold uppercase w-[15%]">Amount</th>
                                                <th className="px-4 py-3 text-right text-[10px] font-bold uppercase w-[15%]">Payments</th>
                                                <th className="px-4 py-3 text-right text-[10px] font-bold uppercase w-[15%]">Balance</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {statementTransactions.length === 0 ? (
                                                <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-400 italic">No transactions in this period</td></tr>
                                            ) : (
                                                statementTransactions.map((tx: any) => (
                                                    <tr key={tx.id}>
                                                        <td className="px-4 py-3 text-xs">{format(new Date(tx.date), "dd/MM/yyyy")}</td>
                                                        <td className="px-4 py-3"><p className="text-xs font-bold text-blue-600">{tx.invoiceNumber}</p><p className="text-[10px] text-slate-400">Invoice</p></td>
                                                        <td className="px-4 py-3 text-right text-xs">{formatCurrency(tx.total)}</td>
                                                        <td className="px-4 py-3 text-right text-xs text-green-600">{formatCurrency(0)}</td>
                                                        <td className="px-4 py-3 text-right text-xs font-bold">{formatCurrency(tx.balanceDue || tx.total)}</td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}
