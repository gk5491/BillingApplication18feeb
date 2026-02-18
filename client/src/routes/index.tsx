import { lazy, Suspense } from 'react';
import { Route, Switch } from 'wouter';
import { Spinner } from '@/components/ui/spinner';

const Dashboard = lazy(() => import('@/modules/dashboard/pages/DashboardPage'));
const Items = lazy(() => import('@/modules/items/pages/ItemsPage'));
const ItemCreate = lazy(() => import('@/modules/items/pages/ItemCreatePage'));
const Invoices = lazy(() => import('@/modules/sales/pages/InvoicesPage'));
const InvoiceCreate = lazy(() => import('@/modules/sales/pages/InvoiceCreatePage'));
const InvoiceEdit = lazy(() => import('@/pages/invoice-edit'));
const Estimates = lazy(() => import('@/modules/sales/pages/EstimatesPage'));
const Quotes = lazy(() => import('@/modules/sales/pages/QuotesPage'));
const QuoteCreate = lazy(() => import('@/modules/sales/pages/QuoteCreatePage'));
const Customers = lazy(() => import('@/modules/customers/pages/CustomersPage'));
const CustomerCreate = lazy(() => import('@/modules/customers/pages/CustomerCreatePage'));
const CustomerEdit = lazy(() => import('@/pages/customer-edit'));
const Vendors = lazy(() => import('@/modules/vendors/pages/VendorsPage'));
const VendorEdit = lazy(() => import('@/pages/vendor-edit'));
const PurchaseOrders = lazy(() => import('@/modules/purchases/pages/PurchaseOrdersPage'));
const PurchaseOrderEdit = lazy(() => import('@/pages/purchase-order-edit'));
const Bills = lazy(() => import('@/modules/purchases/pages/BillsPage'));
const BillCreate = lazy(() => import('@/pages/bill-create'));
const BillEdit = lazy(() => import('@/pages/bill-edit'));
const PaymentsMade = lazy(() => import('@/modules/purchases/pages/PaymentsMadePage'));
const PaymentsMadeCreate = lazy(() => import('@/pages/payments-made-create'));
const PaymentsMadeEdit = lazy(() => import('@/pages/payments-made-create'));
const VendorCredits = lazy(() => import('@/modules/purchases/pages/VendorCreditsPage'));
const VendorCreditEdit = lazy(() => import('@/pages/vendor-credit-edit'));
const Expenses = lazy(() => import('@/modules/expenses/pages/ExpensesPage'));
const Banking = lazy(() => import('@/modules/banking/pages/BankingPage'));
const Reports = lazy(() => import('@/modules/reports/pages/ReportsPage'));
const Documents = lazy(() => import('@/modules/documents/pages/DocumentsPage'));
const TimeTracking = lazy(() => import('@/modules/accounting/pages/TimeTrackingPage'));
const FilingCompliance = lazy(() => import('@/modules/accounting/pages/FilingCompliancePage'));
const Accountant = lazy(() => import('@/modules/accounting/pages/AccountantPage'));
const Settings = lazy(() => import('@/modules/settings/pages/SettingsPage'));
const Support = lazy(() => import('@/modules/settings/pages/SupportPage'));
const NotFound = lazy(() => import('@/pages/not-found'));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Spinner className="w-8 h-8" />
  </div>
);

export const AppRoutes = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/dashboard" component={Dashboard} />

        {/* Items Module */}
        <Route path="/items" component={Items} />
        <Route path="/items/create" component={ItemCreate} />

        {/* Sales Module */}
        <Route path="/invoices" component={Invoices} />
        <Route path="/invoices/create" component={InvoiceCreate} />
        <Route path="/invoices/edit/:id" component={InvoiceEdit} />
        <Route path="/estimates" component={Quotes} />
        <Route path="/quotes" component={Quotes} />
        <Route path="/quotes/create" component={QuoteCreate} />

        {/* Customers Module */}
        <Route path="/customers" component={Customers} />
        <Route path="/customers/create" component={CustomerCreate} />
        <Route path="/customers/edit/:id" component={CustomerEdit} />

        {/* Vendors Module */}
        <Route path="/vendors" component={Vendors} />
        <Route path="/vendors/edit/:id" component={VendorEdit} />

        {/* Purchases Module */}
        <Route path="/purchase-orders" component={PurchaseOrders} />
        <Route path="/purchase-orders/edit/:id" component={PurchaseOrderEdit} />
        <Route path="/bills" component={Bills} />
        <Route path="/bills/create" component={BillCreate} />
        <Route path="/bills/edit/:id" component={BillEdit} />
        <Route path="/payments-made" component={PaymentsMade} />
        <Route path="/payments-made/new" component={PaymentsMadeCreate} />
        <Route path="/payments-made/edit/:id" component={PaymentsMadeEdit} />
        <Route path="/vendor-credits" component={VendorCredits} />
        <Route path="/vendor-credits/edit/:id" component={VendorCreditEdit} />

        {/* Expenses Module */}
        <Route path="/expenses" component={Expenses} />

        {/* Banking Module */}
        <Route path="/banking" component={Banking} />

        {/* Reports Module */}
        <Route path="/reports" component={Reports} />

        {/* Documents Module */}
        <Route path="/documents" component={Documents} />

        {/* Accounting Module */}
        <Route path="/time-tracking" component={TimeTracking} />
        <Route path="/filing-compliance" component={FilingCompliance} />
        <Route path="/accountant" component={Accountant} />

        {/* Settings Module */}
        <Route path="/settings" component={Settings} />
        <Route path="/support" component={Support} />

        {/* 404 */}
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
};

export default AppRoutes;
