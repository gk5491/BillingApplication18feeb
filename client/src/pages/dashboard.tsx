import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Plus,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Folder,
  Smartphone,
  ExternalLink,
  Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";

interface DashboardData {
  summary: {
    totalReceivables: { totalUnpaid: number; current: number; overdue: number };
    totalPayables: { totalUnpaid: number; current: number; overdue: number };
    cashOnHand: number;
    bankBalance: number;
    totalIncome: number;
    totalExpenses: number;
    netProfitMargin: number;
  };
  cashFlow: Array<{ month: string; value: number; incoming: number; outgoing: number }>;
  incomeExpense: Array<{ month: string; income: number; expense: number }>;
  topExpenses: Array<{ category: string; amount: number; percentage: number }>;
  projects: Array<{ id: string; name: string; client: string; progress: number; budget: number; spent: number }>;
  bankAccounts: Array<{ id: string; name: string; balance: number; type: string }>;
  accountWatchlist: Array<{ id: string; name: string; balance: number; change: number }>;
}

const EXPENSE_COLORS = ['#0596de', '#082f44', '#0d9488', '#f59e0b', '#ef4444', '#6366f1', '#8b5cf6', '#64748b'];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [incomeExpenseMode, setIncomeExpenseMode] = useState<"accrual" | "cash">("accrual");
  const [fiscalYear] = useState("This Fiscal Year");

  const { data: dashboardResponse, isLoading } = useQuery<{ success: boolean; data: DashboardData }>({
    queryKey: ['/api/dashboard'],
  });

  const dashboard = dashboardResponse?.data;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const totalIncoming = dashboard?.cashFlow?.reduce((sum, item) => sum + (item.incoming || 0), 0) || 0;
  const totalOutgoing = dashboard?.cashFlow?.reduce((sum, item) => sum + (item.outgoing || 0), 0) || 0;
  const totalIncome = dashboard?.incomeExpense?.reduce((sum, item) => sum + (item.income || 0), 0) || 0;
  const totalExpenseAmount = dashboard?.incomeExpense?.reduce((sum, item) => sum + (item.expense || 0), 0) || 0;

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-1000">
      {/* Refined Professional Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight" data-testid="text-greeting">
            Dashboard
          </h1>
          <p className="text-slate-500 font-medium mt-1 flex items-center gap-2">
            Welcome back, Admin <span className="h-1.5 w-1.5 rounded-full bg-slate-300"></span> {fiscalYear}
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/invoices/new">
            <Button className="bg-[#082f44] hover:bg-[#062435] text-white shadow-sm border-none font-semibold px-5 h-10 transition-all hover:translate-y-[-1px] active:translate-y-[0px]">
              <Plus className="h-4 w-4 mr-1.5" /> Create Invoice
            </Button>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-10 px-4 border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold transition-all">
                Quick Actions <ChevronDown className="ml-2 h-4 w-4 text-slate-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild><Link href="/customers/new">Add Customer</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link href="/items/new">Add Item</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link href="/expenses/new">Record Expense</Link></DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-transparent border-b border-slate-200 w-full justify-start rounded-none h-auto p-0 gap-8 mb-8">
          <TabsTrigger
            value="dashboard"
            className="rounded-none border-b-2 border-transparent px-1 py-3 data-[state=active]:border-[#082f44] data-[state=active]:text-[#082f44] data-[state=active]:bg-transparent data-[state=active]:shadow-none shadow-none focus-visible:ring-0 bg-transparent hover:bg-transparent transition-all font-bold text-slate-500 text-sm uppercase tracking-wider"
          >
            Insights Overview
          </TabsTrigger>
          <TabsTrigger
            value="getting-started"
            className="rounded-none border-b-2 border-transparent px-1 py-3 data-[state=active]:border-[#082f44] data-[state=active]:text-[#082f44] data-[state=active]:bg-transparent data-[state=active]:shadow-none shadow-none focus-visible:ring-0 bg-transparent hover:bg-transparent transition-all font-bold text-slate-500 text-sm uppercase tracking-wider"
          >
            Business Setup
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-0 space-y-8">
          {/* Professional Metric Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border border-slate-200 bg-white shadow-none group transition-all">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100/50">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <Badge variant="outline" className="text-[10px] font-bold text-emerald-600 bg-emerald-50/50 border-emerald-100 px-2 py-0">INFLOW</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-tight">Total Receivables</p>
                  <h2 className="text-2xl font-extrabold text-slate-900">{formatCurrency(dashboard?.summary?.totalReceivables?.totalUnpaid || 0)}</h2>
                </div>
                <div className="mt-6 flex justify-between items-center bg-slate-50 rounded-md px-3 py-2 text-[11px] border border-slate-100">
                  <span className="text-slate-500 font-medium">Overdue amount</span>
                  <span className="text-rose-600 font-bold">{formatCurrency(dashboard?.summary?.totalReceivables?.overdue || 0)}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-slate-200 bg-white shadow-none group transition-all">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="h-10 w-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100/50">
                    <TrendingDown className="h-5 w-5" />
                  </div>
                  <Badge variant="outline" className="text-[10px] font-bold text-rose-600 bg-rose-50/50 border-rose-100 px-2 py-0">OUTFLOW</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-tight">Total Payables</p>
                  <h2 className="text-2xl font-extrabold text-slate-900">{formatCurrency(dashboard?.summary?.totalPayables?.totalUnpaid || 0)}</h2>
                </div>
                <div className="mt-6 flex justify-between items-center bg-slate-50 rounded-md px-3 py-2 text-[11px] border border-slate-100">
                  <span className="text-slate-500 font-medium">Overdue amount</span>
                  <span className="text-rose-600 font-bold">{formatCurrency(dashboard?.summary?.totalPayables?.overdue || 0)}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-slate-200 bg-white shadow-none group transition-all">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="h-10 w-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100/50">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <Badge variant="outline" className="text-[10px] font-bold text-indigo-600 bg-indigo-50/50 border-indigo-100 px-2 py-0">LIQUIDITY</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-tight">Cash On Hand</p>
                  <h2 className="text-2xl font-extrabold text-slate-900">{formatCurrency(dashboard?.summary?.cashOnHand || 0)}</h2>
                </div>
                <div className="mt-6 flex justify-between items-center bg-indigo-50/30 rounded-md px-3 py-2 text-[11px] border border-indigo-100/30">
                  <span className="text-slate-500 font-medium">Business Status</span>
                  <span className="text-indigo-600 font-bold">STABLE</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-slate-200 bg-white shadow-none group transition-all">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="h-10 w-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center border border-slate-200">
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                  </div>
                  <Badge variant="outline" className="text-[10px] font-bold text-slate-600 bg-slate-50 border-slate-200 px-2 py-0">GROWTH</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-tight">Net Profit Margin</p>
                  <h2 className="text-2xl font-extrabold text-slate-900">{(dashboard?.summary?.netProfitMargin || 0).toFixed(1)}%</h2>
                </div>
                <div className="mt-6">
                  <div className="flex justify-between text-[10px] mb-1 font-bold text-slate-400">
                    <span>PROGRESS</span>
                    <span>TARGET: 20%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#082f44] rounded-full" style={{ width: '77%' }}></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Professional Cash Flow Chart */}
            <Card className="lg:col-span-2 border border-slate-200 shadow-none overflow-hidden">
              <CardHeader className="bg-white px-8 py-6 border-b border-slate-100 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-500">Cash Flow Projection</CardTitle>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-[11px] font-bold text-slate-500 uppercase">Cash In</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-rose-400" />
                    <span className="text-[11px] font-bold text-slate-500 uppercase">Cash Out</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-6 pb-6 pt-8 h-[360px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dashboard?.cashFlow || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCashIn" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.08} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorCashOut" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.08} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                      tickFormatter={(val) => `₹${val / 1000}k`}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', padding: '12px' }}
                      itemStyle={{ fontSize: '12px', fontWeight: 600 }}
                      formatter={(val: number) => [formatCurrency(val), undefined]}
                    />
                    <Area type="monotone" dataKey="incoming" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCashIn)" activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }} />
                    <Area type="monotone" dataKey="outgoing" stroke="#f43f5e" strokeWidth={2.5} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorCashOut)" activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Expenses Distribution */}
            <Card className="border border-slate-200 shadow-none overflow-hidden flex flex-col">
              <CardHeader className="bg-white px-8 py-6 border-b border-slate-100">
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-500">Expense Analysis</CardTitle>
              </CardHeader>
              <CardContent className="p-8 flex-1 flex flex-col justify-between">
                <div className="h-[180px] mb-8 relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dashboard?.topExpenses || []}
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="amount"
                      >
                        {(dashboard?.topExpenses || []).map((_, index) => (
                          <Cell key={`cell-${index}`} fill={EXPENSE_COLORS[index % EXPENSE_COLORS.length]} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val: number) => formatCurrency(val)} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-black text-slate-900">{((dashboard?.summary?.totalExpenses || 0) / 1000).toFixed(1)}k</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Spent</span>
                  </div>
                </div>
                <div className="space-y-4 max-h-[220px] overflow-y-auto pr-2 scrollbar-thin">
                  {(dashboard?.topExpenses || []).map((expense, index) => (
                    <div key={expense.category} className="group">
                      <div className="flex justify-between items-center text-xs mb-1.5">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: EXPENSE_COLORS[index % EXPENSE_COLORS.length] }}
                          />
                          <span className="font-bold text-slate-600">{expense.category}</span>
                        </div>
                        <span className="font-extrabold text-[#082f44]">{formatCurrency(expense.amount)}</span>
                      </div>
                      <div className="w-full h-1 bg-slate-50 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${expense.percentage}%`,
                            backgroundColor: EXPENSE_COLORS[index % EXPENSE_COLORS.length]
                          }}
                        />
                      </div>
                    </div>
                  ))}
                  {(!dashboard?.topExpenses || dashboard.topExpenses.length === 0) && (
                    <p className="text-center text-slate-400 text-sm py-8 italic">No expense data available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Projects Table-like view */}
            <Card className="border border-slate-200 shadow-none overflow-hidden">
              <CardHeader className="bg-slate-50/50 px-8 py-5 border-b border-slate-200 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-600">Performance Tracking</CardTitle>
                <Link href="/projects" className="text-xs font-bold text-[#0596de] hover:underline flex items-center gap-1">
                  All Projects <ExternalLink className="h-3 w-3" />
                </Link>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100">
                  {(dashboard?.projects || []).map((project) => (
                    <div key={project.id} className="px-8 py-5 hover:bg-slate-50/30 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded bg-slate-100 flex items-center justify-center text-slate-500">
                            <Folder className="h-4 w-4" />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-800 text-sm">{project.name}</h4>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{project.client}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-extrabold text-slate-900">{project.progress}%</span>
                        </div>
                      </div>
                      <div className="w-full h-1 bg-slate-100 rounded-full">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  {(!dashboard?.projects || dashboard.projects.length === 0) && (
                    <div className="py-12 text-center text-slate-400 text-sm italic">
                      No active projects found
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Asset Management */}
            <Card className="border border-slate-200 shadow-none overflow-hidden">
              <CardHeader className="bg-slate-50/50 px-8 py-5 border-b border-slate-200 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-600">Financial Assets</CardTitle>
                <div className="flex items-center gap-1 text-xs font-bold text-emerald-600">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Now
                </div>
              </CardHeader>
              <CardContent className="px-8 py-6">
                <div className="space-y-4">
                  {(dashboard?.bankAccounts || []).map((account) => (
                    <div key={account.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-[#0596de]/30 transition-all bg-white">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                          <CreditCard className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-slate-800">{account.name}</p>
                          <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">{account.type}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-black text-slate-900">{formatCurrency(account.balance)}</p>
                      </div>
                    </div>
                  ))}
                  <Button variant="ghost" className="w-full mt-4 border border-dashed border-slate-200 text-slate-500 hover:text-[#082f44] hover:bg-slate-50 hover:border-[#082f44]/30 h-10 rounded-lg text-xs font-bold transition-all">
                    Connect Additional Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>


        <TabsContent value="getting-started" className="mt-8">
          <Card className="border border-slate-200 shadow-none bg-white">
            <CardContent className="p-16 text-center max-w-3xl mx-auto">
              <div className="h-16 w-16 rounded-2xl bg-slate-50 text-[#082f44] flex items-center justify-center mx-auto mb-6 border border-slate-100 shadow-sm">
                <Settings className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Setup Your Business</h2>
              <p className="text-slate-500 mb-10 leading-relaxed font-medium">
                Follow these essential steps to fully configure your accounting suite and start managing your finances with precision.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                <Link href="/customers">
                  <div className="p-6 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-[#082f44]/30 hover:shadow-xl transition-all cursor-pointer group">
                    <div className="font-black text-[10px] text-[#082f44] mb-3 uppercase tracking-widest">Step 01</div>
                    <h4 className="font-bold text-slate-900 mb-1 group-hover:text-[#082f44]">Add Customers</h4>
                    <p className="text-xs text-slate-400 font-medium">Build your database and manage relations.</p>
                  </div>
                </Link>
                <Link href="/invoices/new">
                  <div className="p-6 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-[#082f44]/30 hover:shadow-xl transition-all cursor-pointer group">
                    <div className="font-black text-[10px] text-[#082f44] mb-3 uppercase tracking-widest">Step 02</div>
                    <h4 className="font-bold text-slate-900 mb-1 group-hover:text-[#082f44]">First Invoice</h4>
                    <p className="text-xs text-slate-400 font-medium">Record sales and start generating revenue.</p>
                  </div>
                </Link>
                <Link href="/expenses">
                  <div className="p-6 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-[#082f44]/30 hover:shadow-xl transition-all cursor-pointer group">
                    <div className="font-black text-[10px] text-[#082f44] mb-3 uppercase tracking-widest">Step 03</div>
                    <h4 className="font-bold text-slate-900 mb-1 group-hover:text-[#082f44]">Track Expenses</h4>
                    <p className="text-xs text-slate-400 font-medium">Monitor outflows and keep your books balanced.</p>
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
