import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/lib/store";
import NotFound from "@/pages/not-found";
import AppShell from "@/components/layout/AppShell";
import Dashboard from "@/pages/dashboard";
import Invoices from "@/pages/invoices";
import InvoiceCreate from "@/pages/invoice-create";
import InvoiceImport from "@/pages/invoice-import";
import Customers from "@/pages/customers";
import CustomerCreate from "@/pages/customer-create";
import CustomerEdit from "@/pages/customer-edit";
import Products from "@/pages/products";
import ProductCreate from "@/pages/products-create";
import ProductEdit from "@/pages/products-edit";
import ItemsPage from "@/modules/items/pages/ItemsPage";
import ItemCreatePage from "@/modules/items/pages/ItemCreatePage";
import ItemDetailPage from "@/modules/items/pages/ItemDetailPage";
import ItemRequestsPage from "@/pages/item-requests";
import QuotesPage from "@/modules/sales/pages/QuotesPage";
import QuoteCreatePage from "@/modules/sales/pages/QuoteCreatePage";
import QuoteEditPage from "@/modules/sales/pages/QuoteEditPage";
import SalesOrdersPage from "@/pages/sales-orders";
import SalesOrderCreatePage from "@/pages/sales-order-create";
import SalesOrderEditPage from "@/pages/sales-order-edit";
import InvoiceEdit from "@/pages/invoice-edit";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";
import Support from "@/pages/support";
import Vendors from "@/pages/vendors";
import VendorCreate from "@/pages/vendor-create";
import VendorEdit from "@/pages/vendor-edit";
import Expenses from "@/pages/expenses";
import PurchaseOrders from "@/pages/purchase-orders";
import PurchaseOrderCreate from "@/pages/purchase-order-create";
import PurchaseOrderEdit from "@/pages/purchase-order-edit";
import Bills from "@/pages/bills";
import BillCreate from "@/pages/bill-create";
import BillEdit from "@/pages/bill-edit";
import PaymentsMade from "@/pages/payments-made";
import PaymentsMadeCreate from "@/pages/payments-made-create";
import PaymentsMadeEdit from "@/pages/payments-made-edit";
import VendorCredits from "@/pages/vendor-credits";
import VendorCreditCreate from "@/pages/vendor-credit-create";
import VendorCreditEdit from "@/pages/vendor-credit-edit";
import TimeTracking from "@/pages/time-tracking";
import Banking from "@/pages/banking";
import BankDetail from "@/pages/bank-detail";
import ImportStatement from "@/pages/import-statement";
import FilingCompliance from "@/pages/filing-compliance";
import Accountant from "@/pages/accountant";
import Documents from "@/pages/documents";
import DeliveryChallans from "@/pages/delivery-challans";
import DeliveryChallanCreate from "@/pages/delivery-challan-create";
import DeliveryChallanEdit from "@/pages/delivery-challan-edit";
import CreditNotes from "@/pages/credit-notes";
import CreditNoteCreate from "@/pages/credit-note-create";
import CreditNoteEdit from "@/pages/credit-note-edit";
import PaymentsReceived from "@/pages/payments-received";
import PaymentsReceivedCreate from "@/pages/payments-received-create";
import PaymentsReceivedEdit from "@/pages/payments-received-edit";
import EWayBills from "@/pages/e-way-bills";
import EWayBillCreate from "@/pages/e-way-bill-create";
import EWayBillEdit from "@/pages/e-way-bill-edit";

import { OrganizationProvider } from "@/context/OrganizationContext";
import SettingsOrganizations from "@/pages/settings-organizations";
import LoginPage from "@/pages/login";
import ProtectedRoute from "@/routes/ProtectedRoute";
import CustomerDashboard from "@/pages/customer-dashboard";
import CustomerProfilePage from "@/pages/customer-profile";
import CustomerSettingsProfilePage from "@/pages/customer-settings-profile";
import RequestItemsPage from "@/pages/customer-request-items";
import CustomerQuotesPage from "@/pages/customer-quotes";
import CustomerInvoicesPage from "@/pages/customer-invoices";
import CustomerReceiptsPage from "@/pages/customer-receipts";


// ... existing imports

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route>
        <ProtectedRoute>
          <AppShell>
            <Switch>
              {/* Customer Routes */}
              <Route path="/customer-dashboard" component={CustomerDashboard} />
              <Route path="/customer/profile" component={CustomerProfilePage} />
              <Route path="/customer/settings/profile" component={CustomerSettingsProfilePage} />
              <Route path="/customer/request" component={RequestItemsPage} />
              <Route path="/customer/quotes" component={CustomerQuotesPage} />
              <Route path="/customer/invoices" component={CustomerInvoicesPage} />
              <Route path="/customer/receipts" component={CustomerReceiptsPage} />

              <Route path="/settings/organizations" component={SettingsOrganizations} />
              <Route path="/" component={Dashboard} />
              <Route path="/invoices" component={Invoices} />

              <Route path="/invoices/new" component={InvoiceCreate} />
              <Route path="/invoices/create" component={InvoiceCreate} />
              <Route path="/invoices/import" component={InvoiceImport} />
              <Route path="/invoices/:id/edit" component={InvoiceEdit} />
              <Route path="/estimates" component={QuotesPage} />
              <Route path="/estimates/new" component={QuoteCreatePage} />
              <Route path="/estimates/create" component={QuoteCreatePage} />
              <Route path="/quotes" component={QuotesPage} />
              <Route path="/quotes/new" component={QuoteCreatePage} />
              <Route path="/quotes/create" component={QuoteCreatePage} />
              <Route path="/estimates/:id/edit" component={QuoteEditPage} />
              <Route path="/quotes/:id/edit" component={QuoteEditPage} />
              <Route path="/sales-orders" component={SalesOrdersPage} />
              <Route path="/sales-orders/create" component={SalesOrderCreatePage} />
              <Route path="/sales-orders/:id/edit" component={SalesOrderEditPage} />
              <Route path="/delivery-challans" component={DeliveryChallans} />
              <Route path="/delivery-challans/new" component={DeliveryChallanCreate} />
              <Route path="/delivery-challans/create" component={DeliveryChallanCreate} />
              <Route path="/delivery-challans/:id/edit" component={DeliveryChallanEdit} />
              <Route path="/credit-notes" component={CreditNotes} />
              <Route path="/credit-notes/create" component={CreditNoteCreate} />
              <Route path="/credit-notes/:id/edit" component={CreditNoteEdit} />
              <Route path="/payments-received" component={PaymentsReceived} />
              <Route path="/payments-received/create" component={PaymentsReceivedCreate} />
              <Route path="/payments-received/:id/edit" component={PaymentsReceivedEdit} />
              <Route path="/eway-bills" component={EWayBills} />
              <Route path="/e-way-bills" component={EWayBills} />
              <Route path="/e-way-bills/create" component={EWayBillCreate} />
              <Route path="/e-way-bills/:id/edit" component={EWayBillEdit} />
              <Route path="/customers" component={Customers} />
              <Route path="/customers/new" component={CustomerCreate} />
              <Route path="/customers/:id/edit" component={CustomerEdit} />
              <Route path="/products" component={Products} />
              <Route path="/products/new" component={ProductCreate} />
              <Route path="/items" component={ItemsPage} />
              <Route path="/items/create" component={ItemCreatePage} />
              <Route path="/items/:id/edit" component={ProductEdit} />
              <Route path="/items/:id" component={ItemDetailPage} />
              <Route path="/item-requests" component={ItemRequestsPage} />
              <Route path="/reports" component={Reports} />
              <Route path="/settings" component={Settings} />
              <Route path="/support" component={Support} />
              <Route path="/vendors" component={Vendors} />
              <Route path="/vendors/new" component={VendorCreate} />
              <Route path="/vendors/:id/edit" component={VendorEdit} />
              <Route path="/expenses" component={Expenses} />
              <Route path="/purchase-orders" component={PurchaseOrders} />
              <Route path="/purchase-orders/new" component={PurchaseOrderCreate} />
              <Route path="/purchase-orders/:id/edit" component={PurchaseOrderEdit} />
              <Route path="/bills" component={Bills} />
              <Route path="/bills/new" component={BillCreate} />
              <Route path="/bills/:id/edit" component={BillEdit} />
              <Route path="/payments-made" component={PaymentsMade} />
              <Route path="/payments-made/new" component={PaymentsMadeCreate} />
              <Route path="/payments-made/edit/:id" component={PaymentsMadeEdit} />
              <Route path="/vendor-credits" component={VendorCredits} />
              <Route path="/vendor-credits/new" component={VendorCreditCreate} />
              <Route path="/vendor-credits/create" component={VendorCreditCreate} />
              <Route path="/vendor-credits/:id/edit" component={VendorCreditEdit} />
              <Route path="/time-tracking" component={TimeTracking} />
              <Route path="/banking" component={Banking} />
              <Route path="/banking/:id" component={BankDetail} />
              <Route path="/import-statement" component={ImportStatement} />
              <Route path="/filing-compliance" component={FilingCompliance} />
              <Route path="/accountant" component={Accountant} />
              <Route path="/documents" component={Documents} />
              <Route component={NotFound} />
            </Switch>
          </AppShell>
        </ProtectedRoute>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <OrganizationProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </OrganizationProvider>
      </AppProvider>
    </QueryClientProvider>
  );
}

export default App;
