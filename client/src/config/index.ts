export const config = {
  apiBaseUrl: import.meta.env.VITE_API_URL || '/api/v1',
  appName: 'Billing Accounting',
  version: '1.0.0',
  defaultPageSize: 10,
  maxPageSize: 100,
  dateFormat: 'dd/MM/yyyy',
  currency: {
    code: 'INR',
    symbol: '₹',
    locale: 'en-IN',
  },
  fiscalYear: {
    startMonth: 4,
    endMonth: 3,
  },
} as const;

export const endpoints = {
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    register: '/auth/register',
    refresh: '/auth/refresh',
    me: '/auth/me',
  },
  items: {
    base: '/items',
    byId: (id: string) => `/items/${id}`,
  },
  sales: {
    invoices: '/sales/invoices',
    estimates: '/sales/estimates',
    payments: '/sales/payments',
  },
  purchases: {
    orders: '/purchases/orders',
    bills: '/purchases/bills',
    vendorCredits: '/purchases/vendor-credits',
  },
  customers: {
    base: '/customers',
    byId: (id: string) => `/customers/${id}`,
  },
  vendors: {
    base: '/vendors',
    byId: (id: string) => `/vendors/${id}`,
  },
  expenses: {
    base: '/expenses',
    byId: (id: string) => `/expenses/${id}`,
  },
  banking: {
    accounts: '/banking/accounts',
    transactions: '/banking/transactions',
  },
  reports: {
    base: '/reports',
    profitLoss: '/reports/profit-loss',
    balanceSheet: '/reports/balance-sheet',
    cashFlow: '/reports/cash-flow',
  },
} as const;
