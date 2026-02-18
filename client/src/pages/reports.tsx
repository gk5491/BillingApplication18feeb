import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  PieChart as PieChartIcon,
  ArrowUpRight,
  Download,
  TrendingUp,
  TrendingDown,
  FileText,
  Users,
  DollarSign,
  Receipt,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  AreaChart,
  Area
} from "recharts";

interface ReportsData {
  profitAndLoss: {
    totalIncome: number;
    totalExpenses: number;
    grossProfit: number;
    netProfit: number;
    monthlyData: Array<{ month: string; income: number; expense: number; profit: number }>;
  };
  salesByCustomer: Array<{ customer: string; totalSales: number; invoiceCount: number; percentage: number }>;
  salesByProduct: Array<{ product: string; totalSales: number; quantity: number; percentage: number }>;
  expenseBreakdown: Array<{ category: string; amount: number; percentage: number; color: string }>;
  taxSummary: {
    gstCollected: number;
    gstPaid: number;
    netGstPayable: number;
    tdsDeducted: number;
    monthlyGst: Array<{ month: string; collected: number; paid: number }>;
  };
  receivablesAging: Array<{ range: string; amount: number; count: number }>;
  payablesAging: Array<{ range: string; amount: number; count: number }>;
  invoiceSummary: {
    totalInvoiced: number;
    totalPaid: number;
    totalOutstanding: number;
    overdueAmount: number;
    invoiceCount: number;
    paidCount: number;
    outstandingCount: number;
    overdueCount: number;
  };
  billSummary: {
    totalBilled: number;
    totalPaid: number;
    totalOutstanding: number;
    overdueAmount: number;
    billCount: number;
    paidCount: number;
    outstandingCount: number;
    overdueCount: number;
  };
}

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#6B7280'];

export default function Reports() {
  const [activeTab, setActiveTab] = useState("overview");
  const [dateRange] = useState("This Fiscal Year");

  const { data: reportsResponse, isLoading } = useQuery<{ success: boolean; data: ReportsData }>({
    queryKey: ['/api/reports'],
  });

  const reports = reportsResponse?.data;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-reports-title">Reports</h1>
          <p className="text-muted-foreground mt-1">Insights into your business performance.</p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                {dateRange} <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>This Fiscal Year</DropdownMenuItem>
              <DropdownMenuItem>Last Fiscal Year</DropdownMenuItem>
              <DropdownMenuItem>This Quarter</DropdownMenuItem>
              <DropdownMenuItem>Last Quarter</DropdownMenuItem>
              <DropdownMenuItem>This Month</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" className="gap-2" data-testid="button-export-all">
            <Download className="h-4 w-4" /> Export All
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-transparent border-b w-full justify-start rounded-none h-auto p-0 gap-6 flex-wrap">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 rounded-none px-2 py-3 font-medium text-muted-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent hover:bg-transparent transition-none"
            data-testid="tab-overview"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="sales"
            className="data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 rounded-none px-2 py-3 font-medium text-muted-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent hover:bg-transparent transition-none"
            data-testid="tab-sales"
          >
            Sales
          </TabsTrigger>
          <TabsTrigger
            value="expenses"
            className="data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 rounded-none px-2 py-3 font-medium text-muted-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent hover:bg-transparent transition-none"
            data-testid="tab-expenses"
          >
            Expenses
          </TabsTrigger>
          <TabsTrigger
            value="receivables"
            className="data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 rounded-none px-2 py-3 font-medium text-muted-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent hover:bg-transparent transition-none"
            data-testid="tab-receivables"
          >
            Receivables
          </TabsTrigger>
          <TabsTrigger
            value="payables"
            className="data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 rounded-none px-2 py-3 font-medium text-muted-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent hover:bg-transparent transition-none"
            data-testid="tab-payables"
          >
            Payables
          </TabsTrigger>
          <TabsTrigger
            value="taxes"
            className="data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 rounded-none px-2 py-3 font-medium text-muted-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent hover:bg-transparent transition-none"
            data-testid="tab-taxes"
          >
            Taxes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Income</p>
                    <p className="text-2xl font-bold text-green-600" data-testid="value-total-income">
                      {formatCurrency(reports?.profitAndLoss?.totalIncome || 0)}
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Expenses</p>
                    <p className="text-2xl font-bold text-red-500" data-testid="value-total-expenses">
                      {formatCurrency(reports?.profitAndLoss?.totalExpenses || 0)}
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                    <TrendingDown className="h-5 w-5 text-red-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Net Profit</p>
                    <p className="text-2xl font-bold text-indigo-600" data-testid="value-net-profit">
                      {formatCurrency(reports?.profitAndLoss?.netProfit || 0)}
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-indigo-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">GST Payable</p>
                    <p className="text-2xl font-bold text-amber-600" data-testid="value-gst-payable">
                      {formatCurrency(reports?.taxSummary?.netGstPayable || 0)}
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                    <Receipt className="h-5 w-5 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowUpRight className="h-5 w-5 text-green-500" />
                Profit & Loss Trend
              </CardTitle>
              <CardDescription>Monthly income, expense, and profit overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={reports?.profitAndLoss?.monthlyData || []}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(value) => value.split(' ')[0]}
                      className="fill-muted-foreground"
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                      className="fill-muted-foreground"
                    />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)' }}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="income" name="Income" stroke="#22c55e" fill="#dcfce7" stackId="1" />
                    <Area type="monotone" dataKey="expense" name="Expense" stroke="#ef4444" fill="#fee2e2" stackId="2" />
                    <Line type="monotone" dataKey="profit" name="Profit" stroke="#6366f1" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-500" />
                  Top Customers by Sales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reports?.salesByCustomer?.slice(0, 5).map((customer, index) => (
                    <div key={customer.customer} className="flex items-center gap-4">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium truncate">{customer.customer}</span>
                          <span className="text-sm font-medium">{formatCurrency(customer.totalSales)}</span>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${customer.percentage}%`,
                              backgroundColor: COLORS[index % COLORS.length]
                            }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {customer.invoiceCount} invoices ({customer.percentage.toFixed(1)}%)
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5 text-purple-500" />
                  Expense Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <div className="w-44 h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={reports?.expenseBreakdown || []}
                          dataKey="percentage"
                          nameKey="category"
                          cx="50%"
                          cy="50%"
                          innerRadius={35}
                          outerRadius={70}
                        >
                          {reports?.expenseBreakdown?.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-2 max-h-44 overflow-y-auto scrollbar-hide">
                    {reports?.expenseBreakdown?.slice(0, 6).map((expense, index) => (
                      <div key={expense.category} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: expense.color || COLORS[index % COLORS.length] }}
                          />
                          <span className="truncate max-w-28">{expense.category}</span>
                        </div>
                        <span className="font-medium">{expense.percentage.toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sales" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Total Invoiced</p>
                <p className="text-2xl font-bold">{formatCurrency(reports?.invoiceSummary?.totalInvoiced || 0)}</p>
                <p className="text-xs text-muted-foreground mt-1">{reports?.invoiceSummary?.invoiceCount || 0} invoices</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Total Paid</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(reports?.invoiceSummary?.totalPaid || 0)}</p>
                <p className="text-xs text-muted-foreground mt-1">{reports?.invoiceSummary?.paidCount || 0} paid</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Outstanding</p>
                <p className="text-2xl font-bold text-amber-600">{formatCurrency(reports?.invoiceSummary?.totalOutstanding || 0)}</p>
                <p className="text-xs text-muted-foreground mt-1">{reports?.invoiceSummary?.outstandingCount || 0} pending</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Sales by Product/Service</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reports?.salesByProduct || []} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`} />
                    <YAxis type="category" dataKey="product" width={120} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="totalSales" fill="#6366f1" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Expense Breakdown by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reports?.expenseBreakdown || []}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="category"
                      tick={{ fontSize: 10 }}
                      interval={0}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]}>
                      {reports?.expenseBreakdown?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reports?.expenseBreakdown?.map((expense, index) => (
              <Card key={expense.category}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: expense.color || COLORS[index % COLORS.length] }}
                      />
                      <div>
                        <p className="font-medium">{expense.category}</p>
                        <p className="text-sm text-muted-foreground">{expense.percentage.toFixed(1)}% of total</p>
                      </div>
                    </div>
                    <p className="text-xl font-bold">{formatCurrency(expense.amount)}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="receivables" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Receivables Aging Summary</CardTitle>
              <CardDescription>Outstanding invoices by age</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reports?.receivablesAging || []}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="range" />
                    <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="amount" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {reports?.receivablesAging?.map((aging) => (
              <Card key={aging.range}>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">{aging.range}</p>
                  <p className="text-xl font-bold">{formatCurrency(aging.amount)}</p>
                  <p className="text-xs text-muted-foreground">{aging.count} invoices</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="payables" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Total Billed</p>
                <p className="text-2xl font-bold">{formatCurrency(reports?.billSummary?.totalBilled || 0)}</p>
                <p className="text-xs text-muted-foreground mt-1">{reports?.billSummary?.billCount || 0} bills</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Total Paid</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(reports?.billSummary?.totalPaid || 0)}</p>
                <p className="text-xs text-muted-foreground mt-1">{reports?.billSummary?.paidCount || 0} paid</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Outstanding</p>
                <p className="text-2xl font-bold text-amber-600">{formatCurrency(reports?.billSummary?.totalOutstanding || 0)}</p>
                <p className="text-xs text-muted-foreground mt-1">{reports?.billSummary?.outstandingCount || 0} pending</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Payables Aging Summary</CardTitle>
              <CardDescription>Outstanding bills by age</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reports?.payablesAging || []}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="range" />
                    <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="amount" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="taxes" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">GST Collected</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(reports?.taxSummary?.gstCollected || 0)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">GST Paid (Input)</p>
                <p className="text-2xl font-bold text-red-500">{formatCurrency(reports?.taxSummary?.gstPaid || 0)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Net GST Payable</p>
                <p className="text-2xl font-bold text-amber-600">{formatCurrency(reports?.taxSummary?.netGstPayable || 0)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">TDS Deducted</p>
                <p className="text-2xl font-bold">{formatCurrency(reports?.taxSummary?.tdsDeducted || 0)}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Monthly GST Summary</CardTitle>
              <CardDescription>GST collected vs paid by month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reports?.taxSummary?.monthlyGst || []}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 10 }}
                      tickFormatter={(value) => value.split(' ')[0]}
                    />
                    <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="collected" name="Collected" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="paid" name="Paid" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
